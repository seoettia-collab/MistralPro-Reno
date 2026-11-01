#!/usr/bin/env python3
"""Notify IndexNow after deployment. Dry runs and tests never make requests."""
from pathlib import Path
import argparse
import json
import re
import subprocess
import sys
import urllib.request
import urllib.error
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
HOST = 'www.mistralpro-reno.fr'
BASE = 'https://' + HOST + '/'
ENDPOINT = 'https://api.indexnow.org/indexnow'
KEY_FILE = 'ce84f92b3fdc972e0cd59c7f0bf8c0f4.txt'
NS = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}


def sitemap_urls():
    urls = [n.text for n in ET.parse(ROOT / 'sitemap.xml').findall('s:url/s:loc', NS)]
    for u in urls:
        p = urlsplit(u)
        if p.scheme != 'https' or p.netloc != HOST or p.query or p.fragment:
            raise ValueError('Unexpected sitemap host or URL format')
    return sorted(set(urls))


def eligible_page(path):
    return (path.endswith('.html') and not path.startswith(('seo-', 'docs/', 'tests/', 'devis-travaux/'))
            and Path(path).name not in ('TEMPLATE.html', 'merci.html', '404.html', 'contact.html', 'landing.html')
            and not Path(path).name.startswith('google'))


def page_url(path):
    if path == 'index.html':
        return BASE
    return BASE + (path[:-10] if path.endswith('/index.html') else path)


def select_urls(changed, all_urls, bootstrap=False):
    if bootstrap or KEY_FILE in changed or any(x in changed for x in ('.htaccess', 'robots.txt')):
        return all_urls
    # Changed, new, removed and no-longer-indexable pages must be re-crawled.
    return sorted({page_url(p) for p in changed if eligible_page(p)})


def changed_files():
    result = subprocess.run(['git', 'diff', '--name-only', 'HEAD^', 'HEAD'], cwd=ROOT,
                            text=True, capture_output=True, check=True)
    return result.stdout.splitlines()


def notify(urls, opener=urllib.request.urlopen):
    if not urls:
        return {'status': 'skipped', 'submitted': 0, 'reason': 'No public page changed'}
    if len(urls) > 10000:
        raise ValueError('IndexNow batch exceeds 10000 URLs')
    key = (ROOT / KEY_FILE).read_text().strip()
    if not re.fullmatch('[a-f0-9]{32}', key) or KEY_FILE != key + '.txt':
        raise ValueError('Invalid public IndexNow verification file')
    for url in urls:
        if urlsplit(url).netloc != HOST or urlsplit(url).scheme != 'https':
            raise ValueError('Refusing a URL outside the owned host')
    # Refuse submission until the exact ownership file is served by production.
    with opener(BASE + KEY_FILE, timeout=20) as response:
        if response.status != 200 or response.read(256).decode('utf-8').strip() != key:
            raise ValueError('Production verification file does not match')
    body = json.dumps({'host': HOST, 'key': key, 'keyLocation': BASE + KEY_FILE,
                       'urlList': urls}).encode('utf-8')
    request = urllib.request.Request(ENDPOINT, data=body, method='POST',
                                     headers={'Content-Type': 'application/json; charset=utf-8'})
    with opener(request, timeout=30) as response:
        if response.status not in (200, 202):
            raise ValueError('Unexpected IndexNow HTTP status: ' + str(response.status))
        # Reception is not an indexing or ranking guarantee.
        return {'status': 'received' if response.status == 200 else 'key_validation_pending',
                'http_status': response.status, 'submitted': len(urls)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--all', action='store_true', help='Bootstrap canonical sitemap URLs once')
    parser.add_argument('--dry-run', action='store_true', help='Show only selected URLs without network calls')
    args = parser.parse_args()
    urls = select_urls([] if args.all else changed_files(), sitemap_urls(), args.all)
    result = {'status': 'dry_run', 'url_count': len(urls), 'urls': urls} if args.dry_run else notify(urls)
    print(json.dumps(result, ensure_ascii=False))
    summary = __import__('os').environ.get('GITHUB_STEP_SUMMARY')
    if summary and not args.dry_run:
        with open(summary, 'a') as report:
            report.write('\nIndexNow: ' + json.dumps(result) + '\n\nReception does not prove indexing.\n')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, subprocess.CalledProcessError) as exc:
        # Do not log credentials, requests, response payloads or public key contents.
        print('IndexNow notification failed: ' + type(exc).__name__, file=sys.stderr)
        sys.exit(1)
