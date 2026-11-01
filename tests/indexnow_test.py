import importlib.util
from pathlib import Path
import io
import json
import unittest

spec = importlib.util.spec_from_file_location('indexnow', Path(__file__).parents[1] / 'scripts/notify-indexnow.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class Response(io.BytesIO):
    def __init__(self, status, data=b''):
        super().__init__(data)
        self.status = status


class IndexNowTests(unittest.TestCase):
    def test_bootstrap_only_contains_canonical_public_pages(self):
        urls = module.sitemap_urls()
        self.assertIn(module.BASE, urls)
        self.assertEqual(module.select_urls([module.KEY_FILE], urls), urls)
        self.assertNotIn(module.BASE + 'merci.html', urls)
        self.assertFalse(any('/devis-travaux/' in u or 'TEMPLATE' in u for u in urls))

    def test_documentation_only_does_not_send_requests(self):
        urls = module.select_urls(['docs/SEO.md', 'tests/example.py'], module.sitemap_urls())
        def fail(*args, **kwargs):
            raise AssertionError('No network request should be made')
        self.assertEqual(module.notify(urls, fail)['status'], 'skipped')

    def test_modified_and_removed_pages_are_selected(self):
        self.assertEqual(module.select_urls(['index.html', 'zh/index.html', 'blog/removed.html',
                                            'devis-travaux/index.html', 'blog/TEMPLATE.html'], []),
                         [module.BASE, module.BASE + 'blog/removed.html', module.BASE + 'zh/'])

    def test_positive_http_reception_is_not_called_indexed(self):
        for status in (200, 202):
            with self.subTest(status=status):
                calls = []
                key = (module.ROOT / module.KEY_FILE).read_bytes()
                def fake(target, **kwargs):
                    calls.append(target)
                    return Response(200, key) if len(calls) == 1 else Response(status)
                result = module.notify([module.BASE], fake)
                self.assertEqual(result['submitted'], 1)
                self.assertNotIn('indexed', result)
                self.assertEqual(result['status'], 'received' if status == 200 else 'key_validation_pending')
                request = calls[1]
                self.assertEqual(request.full_url, module.ENDPOINT)
                payload = json.loads(request.data)
                self.assertEqual(payload['urlList'], [module.BASE])
                self.assertEqual(payload['keyLocation'], module.BASE + module.KEY_FILE)

    def test_wrong_production_verification_prevents_submission(self):
        calls = []
        def fake(target, **kwargs):
            calls.append(target)
            return Response(200, b'<html>404</html>')
        with self.assertRaises(ValueError):
            module.notify([module.BASE], fake)
        self.assertEqual(len(calls), 1)

    def test_foreign_host_is_rejected_before_any_request(self):
        def fake(*args, **kwargs):
            self.fail('Unexpected network request')
        with self.assertRaises(ValueError):
            module.notify(['https://unrelated.example/'], fake)


if __name__ == '__main__':
    unittest.main()
