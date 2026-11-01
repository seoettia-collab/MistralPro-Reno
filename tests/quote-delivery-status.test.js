const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/cost_calculator.js'), 'utf8');
const start = source.indexOf('const deliveryStatus=');
const end = source.indexOf('const U=y.output(', start);
assert.ok(start > 0 && end > start, 'Delivery feedback is part of the PDF generation flow');
const feedback = source.slice(start, end);

for (const sent of [true, false]) {
  test(`PDF delivery feedback: backend confirmation=${sent}`, async () => {
    let finish;
    const response = new Promise(resolve => { finish = resolve; });
    const status = { hidden: true, textContent: '', dataset: {} };
    let calls = 0;
    const context = {
      document: { getElementById: id => id === 'quote-delivery-status' ? status : null },
      sendWebhook: () => { calls++; return response; },
      c: 'Test', h: '0000000000', g: 'test@example.invalid', f: '', v: '75017', x: 'Paris',
      P: 'local-test', j: [], E: 0, $: 0, N: 0,
    };
    vm.runInNewContext(feedback, context);
    assert.equal(calls, 1);
    assert.equal(status.hidden, false);
    assert.match(status.textContent, /en cours/);
    assert.doesNotMatch(status.textContent, /a été transmise/);
    finish(sent);
    await response;
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(status.dataset.state, sent ? 'sent' : 'unconfirmed');
    if (sent) assert.match(status.textContent, /a été transmise/);
    else {
      assert.match(status.textContent, /n’est pas confirmé/);
      assert.match(status.textContent, /07 55 18 89 37/);
    }
    assert.equal(calls, 1, 'Feedback never retries the production request');
  });
}

test('A cached HTML page without the new status element still runs', async () => {
  vm.runInNewContext(feedback, {
    document: { getElementById: () => null }, sendWebhook: async () => false,
    c: '', h: '', g: '', f: '', v: '', x: '', P: '', j: [], E: 0, $: 0, N: 0,
  });
  await new Promise(resolve => setImmediate(resolve));
});

test('Public status element and cache version are deployed together', () => {
  const html = fs.readFileSync(path.join(root, 'cost_calculator.html'), 'utf8');
  assert.match(html, /id="quote-delivery-status" role="status" aria-live="polite"/);
  assert.match(html, /js\/cost_calculator\.js\?v=11\.4/);
});

test('Every calculator FAQ in JSON-LD is available in the visible HTML', () => {
  const html = fs.readFileSync(path.join(root, 'cost_calculator.html'), 'utf8');
  const faq = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map(m => JSON.parse(m[1])).find(s => s['@type'] === 'FAQPage');
  const body = html.slice(html.indexOf('<body>'));
  assert.equal(faq.mainEntity.length, 5);
  for (const question of faq.mainEntity) {
    assert.ok(body.includes(question.name));
    assert.ok(body.includes(question.acceptedAnswer.text));
  }
});
