'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const { FB, IG, transform, GENERATORS, SKIP } = require('../scripts/social-links.js');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
function pages(dir = '') {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(e => {
    const rel = dir ? dir + '/' + e.name : e.name;
    if (e.isDirectory()) return /^(node_modules|\.git|seo-api|images|fonts|css|js)$/.test(e.name) ? [] : pages(rel);
    return e.name.endsWith('.html') ? [rel] : [];
  });
}
const links = s => [...s.matchAll(/<a [^>]*href="(https:\/\/www\.(?:facebook|instagram)\.com[^"]*)"[^>]*>/g)];
test('header and footer of every public page link to Facebook and Instagram', () => {
  for (const f of pages().filter(f => !SKIP.test(f))) {
    const s = read(f);
    for (const zone of ['header', 'footer']) {
      const i = s.indexOf('data-social="' + zone + '"');
      assert.ok(i > 0, f + ' ' + zone);
      const part = s.slice(i, i + 2500);
      assert.ok(part.includes(FB) && part.includes(IG), f + ' ' + zone);
    }
  }
});
test('social links open safely in a new tab with an accessible name', () => {
  for (const f of pages()) for (const [a] of links(read(f))) {
    if (!a.includes('data-social') && !/target="_blank"/.test(a)) continue;
    assert.match(a, /target="_blank"/, f);
    assert.match(a, /rel="noopener/, f);
    assert.match(a, /aria-label="[^"]+"/, f);
  }
});
test('homepage and travaux carry the light "Suivez nos chantiers" block', () => {
  for (const f of ['index.html', 'travaux.html']) {
    const s = read(f);
    assert.match(s, /data-social="block"[\s\S]*Suivez nos chantiers/, f);
  }
});
test('no third-party social widget or SDK (performance)', () => {
  for (const f of pages()) assert.doesNotMatch(read(f), /connect\.facebook\.net|instagram\.com\/embed|platform\.instagram|<iframe[^>]+(facebook|instagram)/, f);
});
test('every sameAs lists Facebook and Instagram', () => {
  for (const f of pages()) {
    const s = read(f);
    for (const m of s.matchAll(/"sameAs"\s*:\s*\[([^\]]*)\]/g)) {
      assert.ok(m[1].includes(FB) && m[1].includes(IG), f);
    }
  }
});
test('seo-api page generators emit the social icons', () => {
  for (const f of GENERATORS) {
    const s = read(f);
    assert.ok(s.includes('data-social="header"') && s.includes('data-social="footer"'), f);
  }
});
test('scripts/social-links.js is idempotent on the repository', () => {
  for (const f of pages().concat(GENERATORS)) assert.equal(transform(f, read(f)), read(f), f);
});
