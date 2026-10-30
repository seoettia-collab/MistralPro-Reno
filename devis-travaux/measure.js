'use strict';
(function (w, d) {
    const choice = d.getElementById('openai-measurement-consent');
    if (!choice) return;
    const SDK = 'https://bzrcdn.openai.com/sdk/oaiq.min.js';
    const PIXEL = '5g4S52UGifyewxRA8h2gW6';
    const seen = new Set(), pending = new Map();
    let granted = false, epoch = 0, state = 'idle', timer;
    choice.checked = false;
    function command(...args) {
        try {
            if (typeof w.oaiq !== 'function') return false;
            w.oaiq.apply(w, args); return true;
        } catch (_) { return false; }
    }
    function fail() {
        state = 'failed'; pending.clear(); clearTimeout(timer);
        command('consent', false);
    }
    function send(receipt, generation) {
        if (!granted || generation !== epoch || state !== 'ready') return;
        // Only a durable receipt is supplied. No form values or user object are passed.
        if (!command('measure', 'lead_created', { type: 'customer_action' },
            { event_id: receipt, opt_out: true })) fail();
    }
    function load() {
        if (state !== 'idle') return;
        state = 'loading';
        try {
            if (typeof w.oaiq !== 'function') {
                const q = function () { q.q.push(arguments); };
                q.q = []; w.oaiq = q;
            }
            if (!command('consent', false) || !command('init', { pixelId: PIXEL })) { fail(); return; }
            const script = d.createElement('script');
            script.async = true; script.src = SDK; script.referrerPolicy = 'strict-origin';
            script.onload = () => {
                if (state !== 'loading') { command('consent', false); return; }
                clearTimeout(timer); state = 'ready';
                if (!command('consent', granted)) { fail(); return; }
                const waiting = Array.from(pending); pending.clear();
                for (const [receipt, generation] of waiting) send(receipt, generation);
            };
            script.onerror = fail;
            timer = setTimeout(fail, 8000);
            d.head.appendChild(script);
        } catch (_) { fail(); }
    }
    function setConsent(next) {
        if (granted === next) return;
        granted = next; epoch++;
        if (!granted) { pending.clear(); command('consent', false); return; }
        if (state === 'ready') { if (!command('consent', true)) fail(); }
        else load();
    }
    choice.addEventListener('change', () => setConsent(choice.checked === true));
    const newRequest = d.getElementById('new-request');
    if (newRequest) newRequest.addEventListener('click', () => {
        choice.checked = false; setConsent(false);
    });
    w.MprAdsMeasurement = Object.freeze({
        recordStoredLead(receipt) {
            if (typeof receipt !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(receipt) || seen.has(receipt)) return;
            // A denied or failed event is never replayed after a later opt-in.
            seen.add(receipt);
            if (!granted || state === 'failed') return;
            if (state === 'ready') send(receipt, epoch);
            else { pending.set(receipt, epoch); load(); }
        }
    });
})(window, document);

