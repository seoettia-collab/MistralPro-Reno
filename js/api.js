/* ========== API - FONCTIONS FETCH ========== */

async function refreshAll() {
    const refreshBtn = document.querySelector('button[onclick="refreshAll()"]');
    const originalHTML = refreshBtn ? refreshBtn.innerHTML : '';
    
    try {
        if (refreshBtn) { refreshBtn.innerHTML = '⏳ Chargement...'; refreshBtn.disabled = true; }
        
        const [wf1Res, wf2Res, wf3Res] = await Promise.all([
            fetch(BACKEND_URL + '/api/wf1/latest').then(r => r.ok ? r.json() : null).catch(() => null),
            fetch(BACKEND_URL + '/api/wf2/latest').then(r => r.ok ? r.json() : null).catch(() => null),
            fetch(BACKEND_URL + '/api/wf3/last-execution').then(r => r.ok ? r.json() : null).catch(() => null)
        ]);
        
        cachedWf1 = wf1Res;
        cachedWf2 = wf2Res;
        cachedWf3 = wf3Res;
        
        renderAnalyseData();
        loadCockpitData();
        
        if (cachedWf1?.entities?.search_terms) {
            processSearchTerms(cachedWf1.entities.search_terms);
        }
        
        document.getElementById('lastUpdate').textContent = new Date().toLocaleString('fr-FR');
        showToast('✅ Données actualisées', 'success');
        return true;
    } catch (e) {
        showToast('❌ Erreur de chargement', 'error');
        return false;
    } finally {
        if (refreshBtn) { refreshBtn.innerHTML = originalHTML || '🔄 Rafraîchir'; refreshBtn.disabled = false; }
    }
}

async function launchAnalysis() {
    const btn = document.getElementById('btnAnalyse');
    const progress = document.getElementById('progressContainer');
    const step = document.getElementById('progressStep');
    const percent = document.getElementById('progressPercent');
    const fill = document.getElementById('progressFill');
    
    btn.disabled = true;
    btn.textContent = '⏳ En cours...';
    progress.classList.add('active');
    
    try {
        step.textContent = 'Étape 1/2 : Collecte données Google Ads...';
        fill.style.width = '0%';
        await fetch(WF1_WEBHOOK, { method: 'POST', mode: 'no-cors' });
        for (let i = 1; i <= 40; i++) { await new Promise(r => setTimeout(r, 1000)); fill.style.width = (i * 1.25) + '%'; percent.textContent = Math.round(i * 1.25) + '%'; }

        step.textContent = 'Étape 2/2 : Analyse IA + Validation (automatique)...';
        for (let i = 1; i <= 40; i++) { await new Promise(r => setTimeout(r, 1000)); fill.style.width = (50 + i * 1.25) + '%'; percent.textContent = Math.round(50 + i * 1.25) + '%'; }

        step.textContent = '✅ Analyse terminée !';
        fill.style.width = '100%';
        await refreshAll();
        setTimeout(() => progress.classList.remove('active'), 2000);
    } catch (e) {
        step.textContent = '⚠️ Erreur - Vérifiez n8n';
    }
    btn.disabled = false;
    btn.textContent = '🤖 Lancer analyse';
}

async function syncGoogleAds() {
    const btn = document.getElementById('syncGoogleAdsBtn');
    const textEl = btn.querySelector('.sync-text');
    
    btn.classList.add('syncing');
    textEl.textContent = 'Synchronisation...';
    showToast('🔄 Synchronisation Google Ads en cours...', 'loading');
    
    try {
        await fetch(WF1_WEBHOOK, { method: 'POST', mode: 'no-cors' });
        for (let i = 25; i > 0; i--) { textEl.textContent = 'Sync... ' + i + 's'; await new Promise(r => setTimeout(r, 1000)); }
        textEl.textContent = 'Chargement...';
        await refreshAll();
        loadCockpitData();
        btn.classList.remove('syncing');
        btn.classList.add('sync-success');
        textEl.textContent = '✓ Synchronisé';
        showToast('✅ Synchronisation terminée', 'success');
        setTimeout(() => { btn.classList.remove('sync-success'); textEl.textContent = 'Sync Google Ads'; }, 3000);
    } catch (error) {
        btn.classList.remove('syncing');
        btn.classList.add('sync-error');
        textEl.textContent = '✗ Erreur';
        showToast('❌ Erreur de synchronisation', 'error');
        setTimeout(() => { btn.classList.remove('sync-error'); textEl.textContent = 'Sync Google Ads'; }, 5000);
    }
}

async function loadHistoryFromBackend() {
    try {
        const response = await fetch(BACKEND_URL + '/api/wf3/history?limit=50');
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.executions) {
                historyData = data.executions.map(exec => {
                    let d = exec.data || exec;
                    if (typeof d === 'string') try { d = JSON.parse(d); } catch(e) {}
                    return {
                        timestamp: exec.timestamp || exec.created_at,
                        keyword: d.keyword_text || d.keyword || 'N/A',
                        campaign: d.campaign_name || 'Campagne',
                        action: d.action_type || d.action || 'ACTION',
                        detail: d.detail || '',
                        status: d.api_mode === 'TEST' ? 'SIMULATED' : (d.status || 'SUCCESS'),
                        rollbackAvailable: d.rollback_available || false
                    };
                });
            }
        }
    } catch (e) { console.log('History load error:', e); }
}
