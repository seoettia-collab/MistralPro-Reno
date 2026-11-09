'use strict';
(function () {
    const context = JSON.parse(document.getElementById('public-context').textContent);
    const form = document.getElementById('project-form');
    const fields = document.getElementById('form-fields');
    const submit = document.getElementById('submit');
    const feedback = document.getElementById('feedback');
    const confirmation = document.getElementById('confirmation');
    const storageKey = 'mpr.project-submission.v1';
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    const attribution = {};
    const query = new URLSearchParams(location.search);
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'campaign_id', 'ad_group_id', 'ad_id']) {
        const value = query.get(key);
        if (value) attribution[key] = value.trim().slice(0, 150);
    }
    for (const name of context.services) {
        const label = document.createElement('label');
        label.className = 'choice';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox'; checkbox.name = 'travaux'; checkbox.value = name;
        label.append(checkbox, document.createTextNode(name));
        document.getElementById('services').append(label);
    }
    let memoryRecord = null, inFlight = false, storageAvailable = true;
    function readRecord() {
        if (memoryRecord) return memoryRecord;
        if (!storageAvailable) return null;
        try {
            const record = JSON.parse(sessionStorage.getItem(storageKey));
            if (record && record.version === 1 && Date.now() - record.createdAt < maxAge &&
                /^[0-9a-f-]{36}$/i.test(record.id)) return (memoryRecord = record);
        } catch (_) { storageAvailable = false; }
        return null;
    }
    function saveRecord(record) {
        memoryRecord = record;
        if (!storageAvailable) return false;
        try { sessionStorage.setItem(storageKey, JSON.stringify(record)); return true; }
        catch (_) { storageAvailable = false; return false; }
    }
    async function fingerprint(payload) {
        const bytes = new TextEncoder().encode(JSON.stringify(payload));
        const digest = await crypto.subtle.digest('SHA-256', bytes);
        return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    }
    function message(text) { feedback.textContent = text; feedback.focus(); }
    function pendingMessage() {
        return storageAvailable
            ? 'La confirmation est indisponible. Réessayez avec les mêmes informations : votre demande ne sera pas enregistrée deux fois.'
            : 'La confirmation est indisponible. Réessayez avec les mêmes informations sans fermer ni recharger cette page.';
    }
    function wMeasurement(receipt) {
        if (typeof window !== 'undefined' && typeof window.MprAdsMeasurement?.recordStoredLead === 'function')
            window.MprAdsMeasurement.recordStoredLead(receipt);
    }
    function showConfirmation(services) {
        form.hidden = true; confirmation.hidden = false;
        document.getElementById('chosen-summary').textContent = 'Travaux : ' + services.join(' · ');
        confirmation.focus();
    }
    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (inFlight || !form.reportValidity()) return;
        const values = new FormData(form);
        const services = values.getAll('travaux');
        if (!services.length) { message('Sélectionnez au moins un type de travaux.'); return; }
        const telephone = String(values.get('telephone') || '').trim();
        const normalized = telephone.replace(/[\s.()\-]/g, '').replace(/^0033/, '+33');
        if (!/^(?:0[1-9]\d{8}|\+33[1-9]\d{8})$/.test(normalized)) {
            message('Vérifiez le numéro de téléphone français.'); return;
        }
        const payload = { nom: String(values.get('nom') || '').trim(), telephone,
            code_postal: String(values.get('code_postal') || '').trim(),
            travaux: services, message: String(values.get('message') || '').trim(),
            website: String(values.get('website') || ''), ...attribution };
        if (!payload.nom || !/^(75|77|78|91|92|93|94|95)\d{3}$/.test(payload.code_postal)) {
            message('Vérifiez votre prénom et le code postal en Île-de-France.'); return;
        }
        if (typeof crypto === 'undefined' || typeof crypto.randomUUID !== 'function' || !crypto.subtle) {
            message('Votre navigateur ne permet pas de sécuriser cette demande. Contactez-nous par téléphone.'); return;
        }
        inFlight = true; fields.disabled = true; submit.disabled = true; feedback.textContent = '';
        let timer;
        try {
            const hash = await fingerprint(payload);
            let record = readRecord();
            if (record && record.fingerprint !== hash && !record.stored) {
                message('Une demande précédente reste à confirmer. Reprenez les mêmes informations pour la vérifier avant une nouvelle demande.');
                return;
            }
            if (!record || record.fingerprint !== hash) {
                record = { version: 1, id: crypto.randomUUID(), fingerprint: hash, createdAt: Date.now(), stored: false };
            }
            // The in-memory record remains authoritative when browser storage is blocked.
            saveRecord(record);
            payload.submission_id = record.id;
            const controller = new AbortController();
            timer = setTimeout(() => controller.abort(), 20000);
            const response = await fetch('https://facebook-ads-backend-s20a.onrender.com/public/lead-requests', { method: 'POST',
                headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: controller.signal });
            const result = await response.json();
            if (response.ok && result.success === true && result.stored === true && result.receipt === record.id) {
                saveRecord({ ...record, stored: true }); showConfirmation(services);
                try { if (!record.stored) wMeasurement(record.id); } catch (_) { /* Measurement never blocks a saved request. */ }
                return;
            }
            if ([400, 403, 413, 415].includes(response.status)) {
                // These responses occur before persistence: editing and resubmitting is safe.
                memoryRecord = null;
                try { sessionStorage.removeItem(storageKey); } catch (_) { storageAvailable = false; }
                message('La demande n’a pas été enregistrée. Vérifiez vos informations ou contactez-nous par téléphone.');
            } else if (response.status === 429) {
                message('Patientez une minute, puis réessayez. Vos informations restent affichées.');
            } else {
                message(pendingMessage());
            }
        } catch (_) {
            message(pendingMessage());
        } finally {
            clearTimeout(timer); inFlight = false; fields.disabled = false; submit.disabled = false;
        }
    });
    document.getElementById('new-request').addEventListener('click', () => {
        const record = readRecord();
        if (record && !record.stored) return;
        memoryRecord = null;
        try { sessionStorage.removeItem(storageKey); } catch (_) { storageAvailable = false; }
        form.reset(); feedback.textContent = ''; form.hidden = false; confirmation.hidden = true;
        form.elements.nom.focus();
    });
})();


