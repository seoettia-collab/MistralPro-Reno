'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

function loadMain(pathname = '/merci.html') {
  const handlers = {}, phoneHandlers = {};
  const phone = {
    addEventListener(name, handler) { phoneHandlers[name] = handler; },
    getAttribute(name) { return name === 'data-location' ? 'test-header' : null; },
  };
  const window = { location: { pathname, href: 'https://example.invalid' + pathname } };
  const context = {
    window,
    document: {
      addEventListener(name, handler) { handlers[name] = handler; },
      querySelector() { return null; },
      querySelectorAll(selector) { return selector === 'a[href^="tel:"]' ? [phone] : []; },
      getElementById() { return null; },
    },
    IntersectionObserver: class { observe() {} },
    navigator: { userAgent: 'local-test' },
    fetch: async () => { throw Error('No request is allowed on page load'); },
    console,
  };
  vm.createContext(context);
  vm.runInContext(read('js/main.js'), context);
  handlers.DOMContentLoaded();
  return { context, events: window.dataLayer, phoneHandlers, phone };
}

test('direct visits and reloads of merci never report a conversion', () => {
  for (let visit = 0; visit < 2; visit++) {
    const page = loadMain();
    assert.equal(page.events.length, 0);
    assert.equal(page.context.window.location.pathname, '/merci.html');
  }
});

test('merci has no executable script or tracking iframe and offers a real next step', () => {
  const html = read('merci.html');
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  assert.ok(scripts.every(match => /type="application\/ld\+json"/.test(match[1])));
  assert.doesNotMatch(html, /googletagmanager|<iframe\b|\b24\s*h\b/i);
  assert.match(html, /href="\/devis-travaux\/"/);
  assert.match(html, /href="\/cost_calculator.html"/);
  assert.match(html, /ne confirme pas l’enregistrement d’une demande/);
  assert.match(html, /Après réception de votre demande[^<]*48 h/);
  assert.doesNotMatch(html, /Merci pour votre demande|a bien été généré/);
});

test('other pages keep their existing phone-click event', () => {
  const page = loadMain('/services.html');
  page.phoneHandlers.click.call(page.phone);
  assert.equal(page.events.length, 1);
  assert.equal(page.events[0].event, 'click_to_call');
  assert.equal(page.events[0].click_location, 'test-header');
});

test('existing successful form flow still reports its own event before redirecting', async () => {
  const page = loadMain('/services.html');
  let calls = 0;
  page.context.fetch = async () => { calls++; return { ok: true }; };
  const button = { textContent: 'Envoyer', disabled: false };
  const form = { querySelector(selector) { return selector === 'button[type="submit"]' ? button : null; } };
  await page.context.submitFormToN8n({ form_name: 'fixture' }, form);
  assert.equal(calls, 1);
  assert.equal(page.events.length, 1);
  assert.equal(page.events[0].event, 'conversion');
  assert.equal(page.events[0].conversion_type, 'lead_form');
  assert.equal(page.context.window.location.href, '/merci.html');
});
