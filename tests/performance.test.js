'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
function pages(dir = '') {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(e => {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) return ['blog', 'services', 'zh', 'devis-travaux'].includes(rel) ? pages(rel) : [];
    return e.name.endsWith('.html') && !e.name.startsWith('google') ? [rel] : [];
  });
}
test('no Google Tag Manager container, no Google Ads tag, no Google Fonts', () => {
  for (const f of pages()) {
    const html = read(f);
    assert.doesNotMatch(html, /GTM-5MZSVPL|AW-10831433904|fonts\.googleapis\.com/, f);
  }
});
test('GA4 is loaded late, never from a script tag in the head', () => {
  for (const f of pages()) {
    const html = read(f);
    if (!html.includes('G-S4F06V2C5C')) continue;
    const head = html.slice(0, html.indexOf('</head>'));
    assert.doesNotMatch(head, /G-S4F06V2C5C/, f);
    assert.match(html, /addEventListener\('load',function\(\)\{setTimeout\(g,4000\)\}\)/, f);
  }
});
test('inlined refonte CSS matches css/refonte.css', () => {
  const css = read('css/refonte.css').trim();
  for (const f of pages()) {
    const m = read(f).match(/<style id="refonte-css"[^>]*>([\s\S]*?)<\/style>/);
    if (m) assert.ok(m[1].includes(css), f + ' is stale: run python scripts/inline-css.py');
    assert.doesNotMatch(read(f), /href="[^"]*css\/refonte\.css/, f);
  }
});
test('HTML is cacheable (no no-store)', () => {
  const ht = read('.htaccess');
  assert.doesNotMatch(ht, /no-store/);
  assert.ok(ht.includes('Header set Cache-Control "public, max-age=600, must-revalidate"'));
});
