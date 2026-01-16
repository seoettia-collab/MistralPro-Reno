/* ========== MODALS ========== */

function openPauseModal(idx) {
    const kw = cockpitKeywords[idx];
    if (!kw) return;
    pendingAction = { type: 'PAUSE', idx, kw };
    document.getElementById('pauseKwText').textContent = kw.keyword_text;
    document.getElementById('pauseMatchType').textContent = kw.match_type || '-';
    document.getElementById('pauseCampaign').textContent = (kw.campaign_name || '-').replace(' - Search', '');
    document.getElementById('pauseAdGroup').textContent = kw.ad_group_name || '-';
    document.getElementById('pauseModal').classList.add('show');
}

function openEnableModal(idx) {
    const kw = cockpitKeywords[idx];
    if (!kw) return;
    pendingAction = { type: 'ENABLE', idx, kw };
    document.getElementById('enableKwText').textContent = kw.keyword_text;
    document.getElementById('enableCampaign').textContent = (kw.campaign_name || '-').replace(' - Search', '');
    document.getElementById('enableBid').textContent = kw.cpc_max_euros ? kw.cpc_max_euros.toFixed(2) + '€' : '-';
    document.getElementById('enableModal').classList.add('show');
}

function selectBid(idx, percent) {
    const kw = cockpitKeywords[idx];
    if (!kw) return;
    if (openBidMenu) { openBidMenu.classList.remove('show'); openBidMenu = null; }
    pendingAction = { type: 'BID', idx, kw, percent };
    
    const header = document.getElementById('bidModalHeader');
    const icon = document.getElementById('bidModalIcon');
    const title = document.getElementById('bidModalTitle');
    const intro = document.getElementById('bidModalIntro');
    const warning = document.getElementById('bidModalWarning');
    
    if (percent < 0) {
        header.className = 'modal-header warning';
        icon.textContent = '📉';
        title.textContent = 'Confirmer la baisse d\'enchère';
        intro.textContent = 'Vous allez BAISSER l\'enchère de ' + Math.abs(percent) + '%.';
        warning.innerHTML = '<strong>Effet :</strong> Ce mot-clé sera moins compétitif.<br>Il recevra probablement moins d\'impressions et de clics.';
    } else {
        header.className = 'modal-header';
        header.style.background = 'linear-gradient(135deg, rgba(39, 174, 96, 0.15) 0%, rgba(46, 204, 113, 0.15) 100%)';
        icon.textContent = '📈';
        title.textContent = 'Confirmer la hausse d\'enchère';
        intro.textContent = 'Vous allez AUGMENTER l\'enchère de ' + percent + '%.';
        warning.innerHTML = '<strong>Effet :</strong> Ce mot-clé sera plus compétitif.<br>Il recevra probablement plus d\'impressions et de clics.';
    }
    
    document.getElementById('bidKwText').textContent = kw.keyword_text;
    document.getElementById('bidMatchType').textContent = kw.match_type || '-';
    document.getElementById('bidCampaign').textContent = (kw.campaign_name || '-').replace(' - Search', '');
    document.getElementById('bidAdGroup').textContent = kw.ad_group_name || '-';
    document.getElementById('bidAction').textContent = (percent > 0 ? '+' : '') + percent + '%';
    document.getElementById('bidAction').style.color = percent < 0 ? 'var(--danger)' : 'var(--success)';
    
    document.getElementById('bidModal').classList.add('show');
}

function openRollbackModal(keyword) {
    pendingAction = { type: 'ROLLBACK', keyword };
    document.getElementById('rollbackKwText').textContent = keyword;
    document.getElementById('rollbackOriginalAction').textContent = 'PAUSE';
    document.getElementById('rollbackDate').textContent = new Date().toLocaleDateString('fr-FR');
    document.getElementById('rollbackModal').classList.add('show');
}

function closeModal(id) { document.getElementById(id).classList.remove('show'); pendingAction = null; }

// Fonctions de confirmation - Exécution directe sans PIN
function confirmPause() {
    closeModal('pauseModal');
    executeAction();
}

function confirmBid() {
    closeModal('bidModal');
    executeAction();
}

function confirmEnable() {
    closeModal('enableModal');
    executeAction();
}

function confirmRollback() {
    closeModal('rollbackModal');
    executeAction();
}

// Exécution de l'action
async function executeAction() {
    if (!pendingAction) return;
    
    const { type, kw, percent, keyword } = pendingAction;
    showToast('⏳ Exécution en cours...', 'loading');
    
    const payload = {
        source: 'DASHBOARD_V11',
        timestamp: new Date().toISOString(),
        user: 'ricardo',
        customer_id: cachedWf1?.customer_id || '7929430550',
        campaign_id: cachedWf1?.campaign_id || '23356386237',
        action: {
            type: type,
            keyword_text: kw?.keyword_text || keyword,
            criterion_id: kw?.criterion_id,
            ad_group_id: kw?.ad_group_id,
            campaign_name: kw?.campaign_name,
            match_type: kw?.match_type,
            percent: percent
        }
    };
    
    try {
        const response = await fetch(WF3_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (kw?.criterion_id) markRecoAsConsumed(kw.criterion_id, type);
        
        let actionLabel = type;
        if (type === 'PAUSE') actionLabel = 'Mis en pause';
        else if (type === 'ENABLE') actionLabel = 'Réactivé';
        else if (type === 'BID') actionLabel = 'Enchère ajustée ' + (percent > 0 ? '+' : '') + percent + '%';
        else if (type === 'ROLLBACK') actionLabel = 'Rollback effectué';
        
        showToast('✅ ' + actionLabel, 'success', 'Action LIVE exécutée sur Google Ads');
        
        setTimeout(() => { refreshAll(); loadHistoryFromBackend().then(renderHistoryTable); }, 2000);
    } catch (error) {
        showToast('❌ Erreur d\'exécution', 'error', error.message);
    }
    
    pendingAction = null;
}
