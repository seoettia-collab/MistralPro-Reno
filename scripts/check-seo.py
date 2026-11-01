#!/usr/bin/env python3
"""Build the sitemap and check public pages using Python's standard library.

Run `python scripts/check-seo.py --write` before deployment. No HTTP requests,
credentials, package installation, forms or production writes are used.
"""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit, unquote
import argparse
import collections
import json
import re
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://www.mistralpro-reno.fr/'
NS = 'http://www.sitemaps.org/schemas/sitemap/0.9'
XHTML = 'http://www.w3.org/1999/xhtml'


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.meta = {}
        self.canonicals = []
        self.links = []
        self.assets = []
        self.alternates = []
        self.ids = set()
        self.h1s = []
        self.title = ''
        self.schemas = []
        self.json_errors = []
        self.images_without_alt = 0
        self.read = None
        self.buf = ''
        self.feed((ROOT / path).read_text(encoding='utf-8'))

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'):
            self.ids.add(a['id'])
        if tag in ('title', 'h1') or (tag == 'script' and a.get('type') == 'application/ld+json'):
            self.read = tag
            self.buf = ''
        if tag == 'meta':
            self.meta[a.get('name', a.get('property', ''))] = a.get('content', '')
        if tag == 'link':
            if a.get('rel') == 'canonical':
                self.canonicals.append(a.get('href', ''))
            elif a.get('hreflang'):
                self.alternates.append((a['hreflang'], a.get('href', '')))
            elif a.get('href') and a.get('rel') in ('stylesheet', 'preload', 'icon', 'apple-touch-icon', 'manifest'):
                self.assets.append(a['href'])
        if tag == 'a' and a.get('href'):
            self.links.append(a['href'])
        if tag in ('img', 'script') and a.get('src'):
            self.assets.append(a['src'])
        if tag == 'img' and 'alt' not in a:
            self.images_without_alt += 1

    def handle_data(self, text):
        if self.read:
            self.buf += text

    def handle_endtag(self, tag):
        if tag != self.read:
            return
        text = self.buf.strip()
        if tag == 'title':
            self.title = text
        elif tag == 'h1':
            self.h1s.append(text)
        elif tag == 'script':
            try:
                self.schemas.append(json.loads(text))
            except (ValueError, TypeError) as exc:
                self.json_errors.append(str(exc))
        self.read = None


def local_path(url):
    return unquote(urlsplit(url).path).lstrip('/') or 'index.html'


def document_path(url):
    path = local_path(url)
    return path + 'index.html' if path.endswith('/') else path


def page_url(path):
    if path == 'index.html':
        return BASE
    if path.endswith('/index.html'):
        return BASE + path[:-len('index.html')]
    return BASE + path


def public_paths():
    candidates = list(ROOT.glob('*.html'))
    for directory in ('blog', 'services', 'zh', 'devis-travaux'):
        candidates.extend((ROOT / directory).rglob('*.html'))
    return sorted(str(p.relative_to(ROOT)) for p in candidates
                  if p.name != 'TEMPLATE.html' and not p.name.startswith('google'))


def redirect_map():
    return dict(re.findall(r'^Redirect\s+301\s+(\S+)\s+(\S+)', (ROOT / '.htaccess').read_text(), re.M))


def indexable(page, redirects):
    return 'noindex' not in page.meta.get('robots', '').lower() and '/' + page.path not in redirects


def sitemap_text(pages):
    ET.register_namespace('', NS)
    ET.register_namespace('xhtml', XHTML)
    root = ET.Element('{' + NS + '}urlset')
    for p in pages:
        node = ET.SubElement(root, '{' + NS + '}url')
        ET.SubElement(node, '{' + NS + '}loc').text = p.canonicals[0]
        for language, href in p.alternates:
            ET.SubElement(node, '{' + XHTML + '}link', {'rel': 'alternate', 'hreflang': language, 'href': href})
    ET.indent(root, space='  ')
    # Omit lastmod rather than advertising guessed or mechanically bumped dates.
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(root, encoding='unicode') + '\n'


def check(write=False, inventory=None):
    redirects = redirect_map()
    pages = {path: Page(path) for path in public_paths()}
    active = [p for p in pages.values() if indexable(p, redirects)]
    errors = []
    paths = set(json.loads(Path(inventory).read_text())) if inventory else {
        str(p.relative_to(ROOT)) for p in ROOT.rglob('*') if p.is_file()
    }
    incoming = collections.Counter()
    titles = collections.defaultdict(list)
    for p in pages.values():
        errors.extend(f'{p.path}: invalid JSON-LD: {e}' for e in p.json_errors)
        if p not in active:
            continue
        if len(p.h1s) != 1:
            errors.append(f'{p.path}: expected one H1, found {len(p.h1s)}')
        if not p.title or not p.meta.get('description'):
            errors.append(f'{p.path}: missing title or description')
        titles[p.title].append(p.path)
        if p.canonicals != [page_url(p.path)]:
            errors.append(f'{p.path}: canonical does not match its public URL')
        if p.images_without_alt:
            errors.append(f'{p.path}: image without alt attribute')
        for href in p.links:
            u = urlsplit(urljoin(page_url(p.path), href))
            if u.netloc != 'www.mistralpro-reno.fr':
                continue
            dest = document_path(u.geturl())
            if dest not in paths:
                errors.append(f'{p.path}: missing internal destination {href}')
            elif u.path in redirects or u.path == '/index.html':
                errors.append(f'{p.path}: non-canonical internal destination {href}')
            elif dest in pages:
                incoming[dest] += 1
        for src in p.assets:
            u = urlsplit(urljoin(page_url(p.path), src))
            if u.netloc == 'www.mistralpro-reno.fr' and local_path(u.geturl()) not in paths:
                errors.append(f'{p.path}: missing asset {src}')
        for lang, href in p.alternates:
            other = pages.get(document_path(href))
            if other is None or not indexable(other, redirects) or other.canonicals != [href]:
                errors.append(f'{p.path}: invalid hreflang destination {lang}: {href}')
            elif not any(own == page_url(p.path) for _, own in other.alternates):
                errors.append(f'{p.path}: hreflang missing reciprocal link from {href}')
    for title, names in titles.items():
        if len(names) > 1:
            errors.append('Duplicate title: ' + ', '.join(names))
    for p in active:
        if p.path != 'index.html' and not incoming[p.path]:
            errors.append(f'{p.path}: indexable page has no internal inbound link')
    if not re.search(r'<Files\s+"TEMPLATE\.html">\s*Header always set X-Robots-Tag "noindex, nofollow"', (ROOT / '.htaccess').read_text()):
        errors.append('Publishing template lacks its own HTTP noindex rule')
    if errors:
        for error in sorted(set(errors)):
            print('ERROR:', error)
        return 1
    expected = sitemap_text(active)
    if write:
        (ROOT / 'sitemap.xml').write_text(expected, encoding='utf-8')
    elif (ROOT / 'sitemap.xml').read_text(encoding='utf-8') != expected:
        print('ERROR: sitemap is stale; run python scripts/check-seo.py --write')
        return 1
    print(f'PASS: {len(pages)} public HTML pages checked; {len(active)} canonical indexable URLs; '
          f'{sum(p.path.startswith("blog/") for p in active)} blog articles; valid JSON-LD, '
          'internal links, assets, metadata, hreflang and sitemap.')
    return 0


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true', help='Regenerate sitemap.xml after successful checks')
    parser.add_argument('--inventory', help='Optional repository path inventory for a partial audit checkout')
    args = parser.parse_args()
    sys.exit(check(args.write, args.inventory))
