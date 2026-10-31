'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), crypto = require('node:crypto');
const root = path.join(__dirname, '..');
const assets = path.join(root, "devis-travaux");
const measurementSource = fs.readFileSync(path.join(assets, 'measure.js'), 'utf8');
const formSource = fs.readFileSync(path.join(assets, 'form.js'), 'utf8');
const six = ['Cuisine', 'Salle de bain', 'Peinture', 'Rénovation', 'Extension', 'Maison'];
const firstId = '11111111-1111-4111-8111-111111111111', secondId = '22222222-2222-4222-8222-222222222222';
function fixture({ withForm = false, transport, deniedStorage = false, restoredChoice = false, storage = new Map() } = {}) {
    const elements = {}, scripts = [], calls = [], timers = new Map(); let timerId = 0;
    class Element {
        constructor(id) { this.id=id;this.listeners={};this.children=[];this.checked=false;this.hidden=false;this.disabled=false;this.textContent='';this.elements={nom:{focus(){}}}; }
        addEventListener(name, callback) { (this.listeners[name] ||= []).push(callback); }
        append(...items) { this.children.push(...items); }
        appendChild(item) { this.children.push(item); return item; }
        focus() {}
        reportValidity() { return true; }
        reset() {}
        async dispatch(name) { for(const callback of this.listeners[name] || []) await callback({preventDefault(){}}); }
    }
    const doc={ getElementById(id) {return elements[id] ||= new Element(id);},createElement(tag){return new Element(tag);},createTextNode(text){return text;},
        head:{appendChild(script){scripts.push(script);}} };
    doc.getElementById('public-context').textContent=JSON.stringify({services:six});
    doc.getElementById('confirmation').hidden=true;
    doc.getElementById('openai-measurement-consent').checked=restoredChoice;
    const values={nom:'PRIVATE_FIRST_NAME',telephone:'0123456789',code_postal:'75001',message:'PRIVATE_PROJECT',travaux:six,website:''};
    const w={};
    const sandbox={window:w,document:doc,URLSearchParams,TextEncoder,crypto:crypto.webcrypto,AbortController,Date,
        location:{search:'?utm_source=chatgpt&utm_medium=paid&utm_campaign=fixture&oppref=fixture-click'},
        setTimeout(fn,delay){const id=++timerId;timers.set(id,{fn,delay});return id;},clearTimeout(id){timers.delete(id);},
        sessionStorage:{getItem(key){if(deniedStorage)throw Error('blocked');return storage.get(key)||null;},setItem(key,value){if(deniedStorage)throw Error('blocked');storage.set(key,value);},removeItem(key){if(deniedStorage)throw Error('blocked');storage.delete(key);}},
        FormData:class{get(key){return values[key]||'';}getAll(key){return values[key]||[];}},
        fetch:transport || (async(_,options)=>{const body=JSON.parse(options.body);return{ok:true,status:200,json:async()=>({success:true,stored:true,receipt:body.submission_id})};})
    };
    vm.createContext(sandbox);vm.runInContext(measurementSource,sandbox);
    if(withForm)vm.runInContext(formSource,sandbox);
    return {w,doc,elements,scripts,calls,timers,values,
        async consent(value){elements['openai-measurement-consent'].checked=value;await elements['openai-measurement-consent'].dispatch('change');},
        stored(id){w.MprAdsMeasurement.recordStoredLead(id);},
        load({throwOnMeasure=false}={}){const queue=w.oaiq?.q || [];for(const args of queue)calls.push(Array.from(args));
            w.oaiq=(...args)=>{calls.push(args);if(throwOnMeasure&&args[0]==='measure')throw Error('cookies_or_transport_blocked');};scripts[0].onload();},
        async submit(){await elements['project-form'].dispatch('submit');},
        async newRequest(){await elements['new-request'].dispatch('click');},
        timeout(){const entry=Array.from(timers.values()).find(item=>item.delay===8000);assert.ok(entry);entry.fn();},
        events(){return calls.filter(item=>item[0]==='measure');}
    };
}
test('sans opt-in : aucun script tiers, stub, cookie manuel ou événement, même après reçu',async()=>{
    const f=fixture({restoredChoice:true});assert.equal(f.elements['openai-measurement-consent'].checked,false);
    f.stored(firstId);assert.equal(f.scripts.length,0);assert.equal(f.w.oaiq,undefined);assert.equal(f.calls.length,0);
    assert.ok(!measurementSource.includes('document.cookie'));assert.ok(!measurementSource.includes('preconnect'));
});
test('opt-in : consentfalse avant init, consenttrue après SDK et payloadlead minimal dédupliqué',async()=>{
    const f=fixture();await f.consent(true);
    assert.equal(f.scripts.length,1);assert.equal(f.scripts[0].src,'https://bzrcdn.openai.com/sdk/oaiq.min.js');
    const queued=f.w.oaiq.q.map(args=>Array.from(args));assert.equal(queued.length,2);
    assert.deepEqual(queued[0],['consent',false]);assert.equal(queued[1][0],'init');assert.equal(queued[1][1].pixelId,'5g4S52UGifyewxRA8h2gW6');
    f.stored(firstId);assert.equal(f.w.oaiq.q.length,2);f.load();f.stored(firstId);
    assert.equal(f.events().length,1);
    assert.equal(JSON.stringify(f.events()[0]),JSON.stringify(['measure','lead_created',{type:'customer_action'},{event_id:firstId,opt_out:true}]));
    assert.ok(f.calls.some(args=>args[0]==='consent'&&args[1]===true));
    for(const secret of ['PRIVATE_FIRST_NAME','PRIVATE_PROJECT','0123456789','user','email'])assert.ok(!JSON.stringify(f.calls).includes(secret));
});
test('retrait pendantchargement : pas de mesure enattente, même aprèsnouvelopt-in',async()=>{
    const f=fixture();await f.consent(true);f.stored(firstId);await f.consent(false);f.load();
    assert.equal(f.events().length,0);await f.consent(true);f.stored(firstId);assert.equal(f.events().length,0);
    f.stored(secondId);assert.equal(f.events().length,1);assert.equal(f.events()[0][3].event_id,secondId);
});
test('opt-in aprèsunreçu refusé : aucune rétromesure de ce reçu',async()=>{
    const f=fixture();f.stored(firstId);await f.consent(true);f.load();f.stored(firstId);
    assert.equal(f.events().length,0);
});
test('timeoutSDK puis onloadtardif etretoggle : aucun ancienévénement',async()=>{
    const f=fixture();await f.consent(true);f.stored(firstId);f.timeout();await f.consent(false);await f.consent(true);f.load();f.stored(secondId);
    assert.equal(f.events().length,0);assert.equal(f.scripts.length,1);
    assert.equal(f.calls.at(-1)[0],'consent');assert.equal(f.calls.at(-1)[1],false);
});
test('nouvelledemande retireexplicitementleconsentement horsform',async()=>{
    const f=fixture({withForm:true});await f.consent(true);f.load();await f.submit();assert.equal(f.events().length,1);
    assert.equal(f.elements['project-form'].hidden,true);assert.equal(f.elements['openai-measurement-consent'].checked,true);
    await f.newRequest();assert.equal(f.elements['openai-measurement-consent'].checked,false);
    assert.equal(f.calls.at(-1)[0],'consent');assert.equal(f.calls.at(-1)[1],false);
    await f.submit();assert.equal(f.events().length,1);
});
test('reçuHTTP incomplet, storedfalse oudiscordant : aucun événement',async()=>{
    for(const mode of ['no_stored','wrong_receipt','http_failure']){
        const f=fixture({withForm:true,transport:async(_,options)=>{const body=JSON.parse(options.body);return{ok:mode!=='http_failure',status:mode==='http_failure'?503:200,json:async()=>({success:true,stored:mode!=='no_stored',receipt:mode==='wrong_receipt'?secondId:body.submission_id})};}});
        await f.consent(true);f.load();await f.submit();assert.equal(f.events().length,0);assert.equal(f.elements['project-form'].hidden,false);
    }
});
test('timeoutdemande puis reçu duplicate : UUIDstable et mesure seulementaprèsconfirmation',async()=>{
    const attempts=[];const f=fixture({withForm:true,deniedStorage:true,transport:async(_,options)=>{const body=JSON.parse(options.body);attempts.push(body);
        if(attempts.length===1)throw Error('timeout_after_commit');return{ok:true,status:200,json:async()=>({success:true,stored:true,receipt:body.submission_id,duplicate:true})};}});
    await f.consent(true);f.load();await f.submit();assert.equal(f.events().length,0);await f.submit();assert.equal(f.events().length,1);
    assert.equal(attempts[0].submission_id,attempts[1].submission_id);assert.equal(f.events()[0][3].event_id,attempts[0].submission_id);
    assert.equal(f.elements.confirmation.hidden,false);
});
test('échecSDK, cookiesrefusés ouhookdéfaillant ne bloquentjamaisla confirmationdevis',async()=>{
    for(const mode of ['script_error','measure_throws','hook_throws']){
        const f=fixture({withForm:true,deniedStorage:true});await f.consent(true);
        if(mode==='script_error')f.scripts[0].onerror();
        else f.load({throwOnMeasure:mode==='measure_throws'});
        if(mode==='hook_throws')f.w.MprAdsMeasurement={recordStoredLead(){throw Error('measurement_failed');}};
        await f.submit();assert.equal(f.elements['project-form'].hidden,true);assert.equal(f.elements.confirmation.hidden,false);assert.equal(f.elements.feedback.textContent,'');
    }
});
test('valeursnonUUID refusées et aucunpageview automatiquen’estémis',async()=>{
    const f=fixture();await f.consent(true);f.load();for(const value of [null,{},'PRIVATE_FIRST_NAME','',123])f.stored(value);
    assert.equal(f.events().length,0);assert.ok(!measurementSource.includes("'page_viewed'"));
});
test('HTML consentfacultatifet accessibleaprèsconfirmation ; CSPminimale',()=>{
    const html=fs.readFileSync(path.join(assets,'index.html'),'utf8');
    const consent=html.match(/<input[^>]*id="openai-measurement-consent"[^>]*>/)[0];
    assert.ok(!/required|checked|name=/.test(consent));
    const formMarkup=html.match(/<form id="project-form">[\s\S]*?<\/form>/)[0];
    assert.ok(!formMarkup.includes('id="openai-measurement-consent"'));
    assert.ok(html.indexOf('id="openai-measurement-consent"')>html.indexOf('</form>'));
    const submitTag=html.match(/<button[^>]*id="submit"[^>]*>/)[0];
    assert.ok(submitTag.includes('type="submit"'));assert.ok(submitTag.includes('form="project-form"'));
    assert.ok(html.indexOf('id="openai-measurement-consent"')<html.indexOf('id="submit"'));
    const css=fs.readFileSync(path.join(assets,'form.css'),'utf8');
    assert.match(css,/#project-form\[hidden\]\s*~\s*\.form-actions\s*\{\s*display:\s*none/);
    assert.ok(html.includes('coordonnées hachées'));assert.ok(html.includes('Laissez la case vide pour refuser'));
    assert.ok(html.indexOf('src="/devis-travaux/measure.js"')<html.indexOf('src="/devis-travaux/form.js"'));
    assert.ok(!/<link[^>]+(?:preconnect|dns-prefetch)/.test(html));assert.ok(!/https:\/\/(?:bzr|bzrcdn)\.openai\.com/.test(html));
    const policy=fs.readFileSync(path.join(assets,'.htaccess'),'utf8');
    for(const allowed of ["script-src 'self' https://bzrcdn.openai.com","https://bzr.openai.com https://bzrcdn.openai.com","img-src 'self' https://bzr.openai.com"])assert.ok(policy.includes(allowed));
    assert.ok(!policy.includes('unsafe-inline'));assert.ok(!policy.includes('unsafe-eval'));
});


test('rechargement : ancien reçu confirmé non rejoué, timeout confirmé ensuite éligible', async()=>{
    const storage=new Map();const first=fixture({withForm:true,storage});await first.submit();
    const replay=fixture({withForm:true,storage});await replay.consent(true);replay.load();await replay.submit();assert.equal(replay.events().length,0);
    await replay.newRequest();await replay.consent(true);await replay.submit();assert.equal(replay.events().length,1);
    const ambiguous=new Map();await fixture({withForm:true,storage:ambiguous,transport:async()=>{throw Error('timeout');}}).submit();
    const retry=fixture({withForm:true,storage:ambiguous});await retry.consent(true);retry.load();await retry.submit();assert.equal(retry.events().length,1);
});

