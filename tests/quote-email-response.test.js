const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../js/cost_calculator.js'), 'utf8');
const start = source.indexOf('async function sendWebhook(');
const end = source.indexOf('const deliveryStatus=', start);
assert.ok(start > 0 && end > start, 'Test the webhook used by PDF generation');
const webhook = source.slice(start, end);
const quoteNum = 'LOCAL-QUOTE-42';
const validConfirmation = { success: true, numero_devis: quoteNum, messageId: '<local-test@example.invalid>' };

async function deliver(response) {
  const calls = [];
  const sandbox = {
    window: { location: { href: 'https://example.invalid/cost_calculator.html' } },
    console: { log() {}, warn() {}, error() {} },
    fetch: async (url, options) => {
      calls.push({ url, options });
      return response();
    },
  };
  vm.runInNewContext(webhook, sandbox);
  const sent = await sandbox.sendWebhook(
    { nom: 'Local test', tel: '0000000000', email: 'local@example.invalid', quoteNum },
    [{ categorie: 'Peinture', description: 'Préparation des murs', quantite: 2, unite: 'm²', prix_unitaire: 45, total: 90 }],
    { subtotal: 90, vat: 18, totalTTC: 108 },
  );
  assert.equal(calls.length, 1, 'A single attempt is made, including failures');
  assert.equal(calls[0].options.method, 'POST');
  const payload = JSON.parse(calls[0].options.body);
  assert.equal(payload.numero_devis, quoteNum, 'The acknowledged ID must belong to the sent estimate');
  assert.equal(payload.total_ttc, 108);
  assert.match(payload.prestations_texte, /Préparation des murs/);
  return sent;
}

test('Exact backend email confirmation allows transmission feedback', async () => {
  assert.equal(await deliver(() => ({ ok: true, status: 200, json: async () => validConfirmation })), true);
});

const unconfirmedBodies = [
  ['success false', { ...validConfirmation, success: false }],
  ['truthy success is not true', { ...validConfirmation, success: 1 }],
  ['another estimate ID', { ...validConfirmation, numero_devis: 'ANOTHER-QUOTE' }],
  ['missing estimate ID', { success: true, messageId: validConfirmation.messageId }],
  ['missing email message ID', { success: true, numero_devis: quoteNum }],
  ['empty email message ID', { ...validConfirmation, messageId: '' }],
  ['blank email message ID', { ...validConfirmation, messageId: '  \n ' }],
  ['non-string email message ID', { ...validConfirmation, messageId: 42 }],
  ['null JSON', null],
];

for (const [name, body] of unconfirmedBodies) {
  test(`HTTP 200 remains unconfirmed: ${name}`, async () => {
    assert.equal(await deliver(() => ({ ok: true, status: 200, json: async () => body })), false);
  });
}

test('HTTP 200 HTML or invalid JSON remains unconfirmed without retry', async () => {
  assert.equal(await deliver(() => ({
    ok: true, status: 200,
    json: async () => JSON.parse('<html>Unavailable</html>'),
  })), false);
});

test('Non-2xx response cannot confirm transmission, even with a valid JSON body', async () => {
  let parsed = false;
  assert.equal(await deliver(() => ({
    ok: false, status: 500,
    json: async () => { parsed = true; return validConfirmation; },
  })), false);
  assert.equal(parsed, false);
});

test('Network failure remains unconfirmed without retry', async () => {
  assert.equal(await deliver(() => { throw new Error('Local simulated network failure'); }), false);
});
