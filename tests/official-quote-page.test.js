'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const six = ['Cuisine', 'Salle de bain', 'Peinture', 'Rénovation', 'Extension', 'Maison'];
const endpoint = 'https://facebook-ads-backend-s20a.onrender.com/public/lead-requests';

// Execute the shipped client against failures/reloads, sharing only browser session storage.
function client({ storage = new Map(), transport, values = {}, denyStorage = false, denyRead = false, denyRemove = false, cryptoImpl = crypto.webcrypto } = {}) {
    const handlers = {}, elements = {};
    class Element {
        constructor(id) { this.id = id; this.children = []; this.hidden = false; this.disabled = false; this.textContent = ''; this.elements = { nom: { focus() {} } }; }
        addEventListener(event, callback) { handlers[this.id + ':' + event] = callback; }
        append(...items) { this.children.push(...items); }
        focus() {}
        reportValidity() { return true; }
        reset() {}
    }
    const doc = { getElementById(id) { return elements[id] ||= new Element(id); },
        createElement() { return new Element(); }, createTextNode(value) { return value; } };
    doc.getElementById('public-context').textContent = read('devis-travaux/index.html').match(/id="public-context">([\s\S]*?)<\/script>/)[1];
    const formValues = { nom: 'Fixture', telephone: '0123456789', code_postal: '75001', message: '', travaux: six, ...values };
    const sandbox = {
        document: doc, location: { search: '?utm_source=chatgpt&utm_medium=paid&utm_campaign=fixture' },
URLSearchParams, TextEncoder, crypto: cryptoImpl, AbortController, setTimeout, clearTimeout, Date,
sessionStorage: { getItem(k) { if (denyRead) throw Error('denied'); return storage.get(k) || null; }, setItem(k, v) { if (denyStorage) throw Error('denied'); storage.set(k, v); }, removeItem(k) { if (denyRemove) throw Error('denied'); storage.delete(k); } },
        FormData: class { get(k) { return formValues[k] || ''; } getAll(k) { return formValues[k] || []; } },
        fetch: transport || (async () => { throw Error('offline'); })
    };
    vm.runInNewContext(read('devis-travaux/form.js'), sandbox);
return { elements, storage, values: formValues, submit: () => handlers['project-form:submit']({ preventDefault() {} }), newRequest: () => handlers['new-request:click']() };
}
test('timeout puis rechargement : UUID identique ; succès stocké exigé et provenance conservée', async () => {
    const storage = new Map(), attempts = [];
    let first = client({ storage, transport: async (_, options) => {
        attempts.push(JSON.parse(options.body)); throw Error('timeout_after_accept');
    } });
    await first.submit();
    assert.equal(first.elements['project-form'].hidden, false);
    assert.match(first.elements.feedback.textContent, /mêmes informations/);
    const second = client({ storage, transport: async (_, options) => {
        const body = JSON.parse(options.body); attempts.push(body);
        return { ok: true, status: 200, json: async () => ({ success: true, stored: true, receipt: body.submission_id, duplicate: true }) };
    } });
    await second.submit();
    assert.equal(attempts[0].submission_id, attempts[1].submission_id);
    assert.equal(attempts[1].utm_source, 'chatgpt');
    assert.deepEqual(attempts[1].travaux, six);
    assert.equal(second.elements['project-form'].hidden, true);
    assert.equal(second.elements.confirmation.hidden, false);
    const saved = JSON.parse(storage.values().next().value);
    assert.equal(saved.stored, true);
    assert.ok(!JSON.stringify(saved).includes('Fixture'));
    const third = client({ storage, transport: async (_, options) => {
        const body = JSON.parse(options.body); attempts.push(body);
        return { ok: true, status: 200, json: async () => ({ success: true, stored: true, receipt: body.submission_id }) };
    } });
    await third.submit();
    assert.equal(attempts[2].submission_id, attempts[0].submission_id);
    third.newRequest(); await third.submit();
    assert.notEqual(attempts[3].submission_id, attempts[0].submission_id);
});
test('réponse 200 sans reçu durable ne confirme pas ; un double-clic ne crée pas deux envois', async () => {
    let calls = 0;
    const browser = client({ transport: async () => { calls++; return { ok: true, status: 200, json: async () => ({ success: true }) }; } });
    await Promise.all([browser.submit(), browser.submit()]);
    assert.equal(calls, 1);
    assert.equal(browser.elements['project-form'].hidden, false);
});
test('après résultat ambigu, modification des champs ne produit pas une seconde demande', async () => {
    const storage = new Map(); await client({ storage }).submit();
    let calls = 0;
    const edited = client({ storage, values: { message: 'Autre projet' }, transport: async () => { calls++; } });
    await edited.submit(); assert.equal(calls, 0);
    assert.match(edited.elements.feedback.textContent, /précédente/);
});
test('stockage refusé : la demande est envoyée avec son UUID et confirmée uniquement après reçu', async () => {
    let calls = 0;
    const browser = client({ denyStorage: true, transport: async (_, options) => {
        calls++; const body = JSON.parse(options.body);
        assert.match(body.submission_id, /^[0-9a-f-]{36}$/i);
        assert.equal(body.utm_source, 'chatgpt');
        return { ok: true, status: 200, json: async () => ({ success: true, stored: true, receipt: body.submission_id }) };
    } });
    await Promise.all([browser.submit(), browser.submit()]);
    assert.equal(calls, 1); assert.equal(browser.elements['project-form'].hidden, true);
    assert.equal(browser.elements.confirmation.hidden, false); assert.equal(browser.storage.size, 0);
});
test('mémoire seule : timeout, 429 et reçus incomplets réutilisent le même UUID', async () => {
    const attempts = [];
    const browser = client({ denyRead: true, transport: async (_, options) => {
        const body = JSON.parse(options.body); attempts.push(body);
        if (attempts.length === 1) throw Error('timeout_after_accept');
        if (attempts.length === 2) return { ok: false, status: 429, json: async () => ({ success: false }) };
        if (attempts.length === 3) return { ok: true, status: 200, json: async () => ({ success: true, stored: false, receipt: body.submission_id }) };
        if (attempts.length === 4) return { ok: true, status: 200, json: async () => ({ success: true, stored: true, receipt: 'wrong' }) };
        return { ok: true, status: 200, json: async () => ({ success: true, stored: true, receipt: body.submission_id, duplicate: true }) };
    } });
    await browser.submit();
    assert.match(browser.elements.feedback.textContent, /sans fermer ni recharger/);
    browser.values.message = 'Modification après résultat incertain';
    await browser.submit(); assert.equal(attempts.length, 1);
    assert.match(browser.elements.feedback.textContent, /précédente/);
    browser.values.message = '';
    for (let i = 0; i < 3; i++) { await browser.submit(); assert.equal(browser.elements['project-form'].hidden, false); }
    await browser.submit();
    assert.equal(attempts.length, 5); assert.equal(new Set(attempts.map(body => body.submission_id)).size, 1);
    assert.equal(browser.elements['project-form'].hidden, true); assert.equal(browser.storage.size, 0);
});
test('ancien reçu lisible mais écriture refusée : le reçu courant en mémoire prime et une nouvelle demande change UUID', async () => {
    const storage = new Map(), attempts = [];
    const seeded = client({ storage, transport: async (_, options) => {
        const body = JSON.parse(options.body);
        return { ok: true, status: 200, json: async () => ({ success: true, stored: true, receipt: body.submission_id }) };
    } }); await seeded.submit();
    const oldId = JSON.parse(storage.values().next().value).id;
    const browser = client({ storage, denyStorage: true, denyRemove: true, values: { message: 'Nouveau projet' }, transport: async (_, options) => {
        const body = JSON.parse(options.body); attempts.push(body);
        if (attempts.length === 1) throw Error('timeout');
        return { ok: true, status: 200, json: async () => ({ success: true, stored: true, receipt: body.submission_id }) };
    } });
    await browser.submit(); browser.newRequest(); await browser.submit();
    assert.notEqual(attempts[0].submission_id, oldId);
    assert.equal(attempts[0].submission_id, attempts[1].submission_id);
    browser.newRequest(); await browser.submit();
    assert.notEqual(attempts[2].submission_id, attempts[1].submission_id);
    assert.equal(JSON.parse(storage.values().next().value).id, oldId);
});
test('suppression du stockage refusée : nouveau projet et correction après 400 ne réutilisent pas un ancien reçu', async () => {
    const attempts = [];
    const browser = client({ denyRemove: true, transport: async (_, options) => {
        const body = JSON.parse(options.body); attempts.push(body);
        if (attempts.length === 1) return { ok: false, status: 400, json: async () => ({ success: false }) };
        return { ok: true, status: 200, json: async () => ({ success: true, stored: true, receipt: body.submission_id }) };
    } });
    await browser.submit(); await browser.submit();
    assert.notEqual(attempts[0].submission_id, attempts[1].submission_id);
    browser.newRequest(); await browser.submit();
    assert.notEqual(attempts[1].submission_id, attempts[2].submission_id);
});
test('UUID sécurisé indisponible : aucun envoi ni fausse confirmation', async () => {
    let calls = 0;
    const browser = client({ cryptoImpl: { subtle: crypto.webcrypto.subtle }, transport: async () => { calls++; } });
    await browser.submit(); assert.equal(calls, 0);
    assert.equal(browser.elements['project-form'].hidden, false);
    assert.match(browser.elements.feedback.textContent, /navigateur.*téléphone/);
});


test('official page renders only public context, six services and local assets', () => {
  const html = read('devis-travaux/index.html');
  assert.ok(!/__[_A-Z]+__/.test(html));
  const context = JSON.parse(html.match(/id="public-context">([\s\S]*?)<\/script>/)[1]);
  assert.deepEqual(context.services, six);
  assert.deepEqual(Object.keys(context.business).sort(), ['activity','area','name','phone']);
  assert.equal(context.business.phone, '06 09 10 90 69');
  for (const [,asset] of html.matchAll(/(?:src|href)="(\/devis-travaux\/[^"]+)"/g)) assert.ok(fs.existsSync(path.join(__dirname,'..',asset)));
  assert.ok(!/<iframe|http-equiv="refresh"/i.test(html));
  assert.ok(!html.includes('onrender.com'));
  assert.ok(fs.readFileSync(path.join(__dirname,'..','devis-travaux/fonts/archivo-latin.woff2')).subarray(0,4).equals(Buffer.from('wOF2')));
});
test('copied client differs from backend source only by the exact approved intake URL', () => {
  const hosted = read('devis-travaux/form.js');
  assert.equal(hosted.split(endpoint).length, 2);
  const canonical = hosted.replace(endpoint, '/public/lead-requests');
  const gitHash = crypto.createHash('sha1').update('blob '+Buffer.byteLength(canonical)+'\0').update(canonical).digest('hex');
  assert.equal(gitHash, 'f43c2e3017057326602cf16346eb560a1528d215');
});
test('new page policy scopes CORS destination without broadening the existing website', () => {
  const root=read('.htaccess'), scoped=read('devis-travaux/.htaccess');
  assert.ok(!root.includes('Redirect 301 /devis-travaux '));
  assert.ok(root.includes('Redirect 301 /devis /cost_calculator.html'));
  assert.ok(!root.includes('Content-Security-Policy'));
  assert.ok(scoped.includes("connect-src 'self' https://facebook-ads-backend-s20a.onrender.com;"));
  assert.ok(scoped.includes("script-src 'self'; style-src 'self'"));
  assert.ok(scoped.includes('Cache-Control "no-store"'));assert.ok(scoped.includes('ExpiresActive Off'));
});
test('browser sends one JSON request to the fixed backend and retains paid attribution', async () => {
  const requests=[];
  const browser=client({transport: async (url, options) => {
    requests.push({url,options});const body=JSON.parse(options.body);
    return {ok:true,status:200,json:async()=>({success:true,stored:true,receipt:body.submission_id})};
  }});
  await browser.submit();assert.equal(requests.length,1);
  assert.equal(requests[0].url,endpoint);assert.equal(requests[0].options.method,'POST');
  assert.equal(requests[0].options.headers['Content-Type'],'application/json');
  assert.equal(requests[0].options.credentials,undefined);
  const payload=JSON.parse(requests[0].options.body);
  assert.equal(payload.utm_source,'chatgpt');assert.equal(payload.utm_medium,'paid');assert.deepEqual(payload.travaux,six);
  assert.equal(browser.elements.confirmation.hidden,false);
});

