/* ========== COCKPIT - Vue Exécution ========== */
/* VERSION: 2.4.0 - CPC MAX ÉDITABLE + PERSISTANCE LOCALSTORAGE */

// Variable pour stocker les modifications en attente
let pendingCpcChanges = {};

// ═══════════════════════════════════════════════════════════════
// PERSISTANCE CPC - LocalStorage
// ═══════════════════════════════════════════════════════════════

const CPC_STORAGE_KEY = 'googleAdsAuto_cpcModifications';
const CPC_EXPIRY_HOURS = 24; // Expiration après 24h

function saveCpcModification(criterionId, newCpcMicros) {
    const saved = JSON.parse(localStorage.getItem(CPC_STORAGE_KEY) || '{}');
    saved[String(criterionId)] = {
        cpc_micros: newCpcMicros,
        timestamp: Date.now()
    };
    localStorage.setItem(CPC_STORAGE_KEY, JSON.stringify(saved));
    console.log('[CPC-PERSIST] Sauvegardé:', criterionId, '→', (newCpcMicros/1000000).toFixed(2) + '€');
}

function getSavedCpcModifications() {
    const saved = JSON.parse(localStorage.getItem(CPC_STORAGE_KEY) || '{}');
    const now = Date.now();
    const expiryMs = CPC_EXPIRY_HOURS * 60 * 60 * 1000;
    
    // Nettoyer les entrées expirées
    let hasExpired = false;
    for (const [criterionId, data] of Object.entries(saved)) {
        if (now - data.timestamp > expiryMs) {
            delete saved[criterionId];
            hasExpired = true;
            console.log('[CPC-PERSIST] Expiré:', criterionId);
        }
    }
    
    if (hasExpired) {
        localStorage.setItem(CPC_STORAGE_KEY, JSON.stringify(saved));
    }
    
    return saved;
}

function clearCpcModification(criterionId) {
    const saved = JSON.parse(localStorage.getItem(CPC_STORAGE_KEY) || '{}');
    delete saved[String(criterionId)];
    localStorage.setItem(CPC_STORAGE_KEY, JSON.stringify(saved));
}

function applySavedCpcToKeywords(keywords) {
    const saved = getSavedCpcModifications();
    let appliedCount = 0;
    
    keywords.forEach(kw => {
        const criterionId = String(kw.criterion_id);
        if (saved[criterionId]) {
            const savedCpc = saved[criterionId].cpc_micros;
            const wf1Cpc = parseInt(kw.cpc_bid_micros) || 0;
            
            // Si WF1 a été mis à jour avec la même valeur, supprimer la sauvegarde
            if (Math.abs(wf1Cpc - savedCpc) < 1000) { // Tolérance de 0.001€
                clearCpcModification(criterionId);
                console.log('[CPC-PERSIST] WF1 synchronisé, suppression:', criterionId);
            } else {
                // Appliquer la modification sauvegardée
                kw.cpc_bid_micros = savedCpc;
                kw._cpc_modified = true; // Marqueur pour l'UI
                appliedCount++;
                console.log('[CPC-PERSIST] Appliqué:', kw.keyword_text, '→', (savedCpc/1000000).toFixed(2) + '€');
            }
        }
    });
    
    if (appliedCount > 0) {
        console.log('[CPC-PERSIST] Total appliqué:', appliedCount, 'modifications');
    }
    
    return keywords;
}

function loadCockpitData() {
    // ═══════════════════════════════════════════════════════════════
    // MAPPING DONNÉES WF1 - Chemin correct: entities.keywords[]
    // ═══════════════════════════════════════════════════════════════
    
    // Gérer les deux formats possibles de cachedWf1
    let keywords = null;
    
    if (cachedWf1?.entities?.keywords) {
        // Format direct: cachedWf1.entities.keywords
        keywords = cachedWf1.entities.keywords;
        console.log('[COCKPIT] Format détecté: cachedWf1.entities.keywords');
    } else if (cachedWf1?.data?.entities?.keywords) {
        // Format avec wrapper data: cachedWf1.data.entities.keywords
        keywords = cachedWf1.data.entities.keywords;
        console.log('[COCKPIT] Format détecté: cachedWf1.data.entities.keywords');
    }
    
    if (!keywords || !keywords.length) {
        console.warn('[COCKPIT] Aucun keyword trouvé dans WF1');
        return;
    }
    
    console.log('[COCKPIT] Keywords chargés:', keywords.length);
    console.log('[COCKPIT] Premier keyword:', keywords[0]);
    console.log('[COCKPIT] criterion_id du premier:', keywords[0]?.criterion_id);
    
    // ═══════════════════════════════════════════════════════════════
    // APPLIQUER LES MODIFICATIONS CPC SAUVEGARDÉES
    // ═══════════════════════════════════════════════════════════════
    keywords = applySavedCpcToKeywords(keywords);
    
    cockpitKeywords = keywords.map(kw => {
        let recoIA = null, riskLevel = 'LOW';
        
        // ═══════════════════════════════════════════════════════════════
        // JOINTURE RECO IA - Robuste
        // ═══════════════════════════════════════════════════════════════
        if (cachedWf2) {
            let recos = null;
            if (cachedWf2.data?.recommendations) {
                recos = cachedWf2.data.recommendations;
            } else if (cachedWf2.recommendations) {
                recos = cachedWf2.recommendations;
            }
            
            if (recos) {
                if (typeof recos === 'string') {
                    try { recos = JSON.parse(recos); } catch(e) { recos = []; }
                }
                
                // Jointure par criterion_id OU keyword_text
                const match = recos.find(r => 
                    String(r.criterion_id) === String(kw.criterion_id) || 
                    (r.keyword_text && kw.keyword_text && r.keyword_text.toLowerCase() === kw.keyword_text.toLowerCase())
                );
                
                if (match) { 
                    recoIA = match.action || match.decision; 
                    riskLevel = match.risk_level || 'MEDIUM'; 
                }
            }
        }
        
        return { ...kw, reco_ia: recoIA, risk_level: riskLevel };
    });
    
    pendingCpcChanges = {};
    renderCockpitTable();
}

function renderCockpitTable() {
    const tbody = document.getElementById('keywordsBody');
    if (!cockpitKeywords.length) {
        tbody.innerHTML = '<tr><td colspan="12" class="empty-state">Aucune donnée. Lancez une synchronisation.</td></tr>';
        return;
    }
    
    const activeKw = cockpitKeywords.filter(kw => kw.status === 'ENABLED' || kw.status === 'PAUSED');
    document.getElementById('statKeywordsCockpit').textContent = activeKw.length;
    document.getElementById('statActionsCockpit').textContent = cockpitKeywords.filter(kw => kw.reco_ia && !isRecoConsumed(kw.criterion_id)).length;
    document.getElementById('tableCount').textContent = activeKw.length + ' mots-clés';
    
    tbody.innerHTML = activeKw.map((kw, idx) => {
        // ═══════════════════════════════════════════════════════════════
        // MÉTRIQUES - Gérer les deux formats possibles
        // ═══════════════════════════════════════════════════════════════
        let m = {};
        if (kw.metrics) {
            if (kw.metrics.cost_euros !== undefined || kw.metrics.clicks !== undefined) {
                m = kw.metrics;
            } else if (kw.metrics.last_30_days) {
                m = kw.metrics.last_30_days;
            }
        }
        
        const isPaused = kw.status === 'PAUSED';
        const isUnknown = !kw.status || kw.status === 'UNKNOWN' || kw.status === 'Unknown';
        const consumed = isRecoConsumed(kw.criterion_id);
        const hasReco = kw.reco_ia && !consumed;
        
        let rowClass = isPaused ? 'row-paused' : (isUnknown ? 'row-unknown' : '');
        if (hasReco) rowClass += ' row-has-reco-ia';
        
        let statusBadge = isPaused ? '<span class="status-badge status-paused">PAUSED</span>' : (isUnknown ? '<span class="status-badge status-unknown">NON DÉFINI</span>' : '<span class="status-badge status-enabled">ENABLED</span>');
        
        // ═══════════════════════════════════════════════════════════════
        // RECO IA - Affichage avec badge coloré
        // ═══════════════════════════════════════════════════════════════
        let recoCell = '-';
        if (consumed) {
            recoCell = '<span style="color:var(--success);font-size:10px;">✓ Traité</span>';
        } else if (kw.reco_ia) {
            let recoClass = 'reco-monitor';
            if (kw.reco_ia.includes('PAUSE')) {
                recoClass = 'reco-pause';
            } else if (kw.reco_ia.includes('BID') || kw.reco_ia.includes('LOWER') || kw.reco_ia.includes('ENCHÈRE') || kw.reco_ia.includes('ENCHERE')) {
                recoClass = 'reco-bid-down';
            } else if (kw.reco_ia.includes('SURVEILLER') || kw.reco_ia.includes('MONITOR')) {
                recoClass = 'reco-monitor';
            } else if (kw.reco_ia.includes('PERFORMANT') || kw.reco_ia.includes('OK')) {
                recoClass = 'reco-performant';
            }
            recoCell = '<span class="reco-badge-table ' + recoClass + '">' + kw.reco_ia + '</span>';
        }
        
        const riskClass = 'risk-' + (kw.risk_level || 'low').toLowerCase();
        const cost = m.cost_euros || 0;
        const conv = m.conversions || 0;
        const cpa = conv > 0 ? (cost / conv).toFixed(2) + '€' : '-';
        
        // ═══════════════════════════════════════════════════════════════
        // CPC MAX EDITABLE - Input + Bouton Valider
        // ═══════════════════════════════════════════════════════════════
        const currentCpcMicros = parseInt(kw.cpc_bid_micros) || 0;
        const currentCpcEuros = currentCpcMicros > 0 ? (currentCpcMicros / 1000000).toFixed(2) : '';
        
        // Vérifier si criterion_id est présent pour activer l'édition
        const hasCriterionId = kw.criterion_id && kw.criterion_id !== '';
        const isEditable = hasCriterionId && !isPaused && !isUnknown;
        
        // Indicateur visuel si CPC a été modifié localement
        const cpcModifiedClass = kw._cpc_modified ? ' cpc-locally-modified' : '';
        
        const cpcMaxCell = '<div class="cpc-edit-container">' +
            '<input type="number" step="0.01" min="0.01" max="50" ' +
                'class="cpc-input' + (isEditable ? '' : ' cpc-disabled') + cpcModifiedClass + '" ' +
                'id="cpcInput' + idx + '" ' +
                'data-idx="' + idx + '" ' +
                'data-original="' + currentCpcEuros + '" ' +
                'data-criterion-id="' + (kw.criterion_id || '') + '" ' +
                'value="' + currentCpcEuros + '" ' +
                'onblur="onCpcBlur(' + idx + ')" ' +
                'onkeypress="onCpcKeypress(event, ' + idx + ')" ' +
                (isEditable ? '' : 'disabled') +
            '/>' +
            '<span class="cpc-currency">€</span>' +
            (kw._cpc_modified ? '<span class="cpc-modified-indicator" title="Modifié localement, en attente de sync WF1">●</span>' : '') +
            '<button class="cpc-validate-btn" id="cpcBtn' + idx + '" onclick="validateCpcChange(' + idx + ')" style="display:none;" title="Valider">✓</button>' +
        '</div>';
        
        let actions = '';
        if (isPaused) {
            actions = '<button class="action-btn btn-enable" onclick="openEnableModal(' + idx + ')">▶️</button>';
        } else if (!isUnknown) {
            actions = '<button class="action-btn btn-pause" onclick="openPauseModal(' + idx + ')">⏸️</button>' +
                '<div class="bid-dropdown">' +
                    '<button class="action-btn btn-bid" onclick="toggleBidMenu(' + idx + ')">💰 ▼</button>' +
                    '<div class="bid-menu" id="bidMenu' + idx + '">' +
                        '<div class="bid-option negative" onclick="selectBid(' + idx + ', -20)">-20%</div>' +
                        '<div class="bid-option negative" onclick="selectBid(' + idx + ', -10)">-10%</div>' +
                        '<div class="bid-option negative" onclick="selectBid(' + idx + ', -5)">-5%</div>' +
                        '<div class="bid-divider"></div>' +
                        '<div class="bid-option positive" onclick="selectBid(' + idx + ', 5)">+5%</div>' +
                        '<div class="bid-option positive" onclick="selectBid(' + idx + ', 10)">+10%</div>' +
                        '<div class="bid-option positive" onclick="selectBid(' + idx + ', 15)">+15%</div>' +
                    '</div>' +
                '</div>';
        }
        
        return '<tr class="' + rowClass + '">' +
            '<td><span class="kw-text">' + kw.keyword_text + (hasReco ? '<span class="reco-ia-indicator ' + (kw.reco_ia.includes('PAUSE') ? 'pause' : 'bid-down') + '">💡 IA</span>' : '') + '</span></td>' +
            '<td>' + statusBadge + '</td>' +
            '<td class="cell-muted">' + (kw.campaign_name || '-').replace(' - Search', '') + '</td>' +
            '<td class="cell-muted">' + (kw.ad_group_name || '-') + '</td>' +
            '<td><span class="match-type">' + (kw.match_type || '-') + '</span></td>' +
            '<td class="cell-cpc-max">' + cpcMaxCell + '</td>' +
            '<td class="cell-cost">' + cost.toFixed(2) + '€</td>' +
            '<td class="cell-conversions ' + (conv > 0 ? 'conv-positive' : 'conv-zero') + '">' + conv + '</td>' +
            '<td class="cell-cpa">' + cpa + '</td>' +
            '<td>' + recoCell + '</td>' +
            '<td><span class="reco-badge-table ' + riskClass + '">' + (kw.risk_level || 'LOW') + '</span></td>' +
            '<td class="actions-cell">' + actions + '</td>' +
        '</tr>';
    }).join('');
}

// ═══════════════════════════════════════════════════════════════
// CPC MAX - Fonctions d'édition
// ═══════════════════════════════════════════════════════════════

function onCpcBlur(idx) {
    const input = document.getElementById('cpcInput' + idx);
    const btn = document.getElementById('cpcBtn' + idx);
    const original = parseFloat(input.dataset.original) || 0;
    const current = parseFloat(input.value) || 0;
    const kw = cockpitKeywords[idx];
    
    // Vérifier que criterion_id existe
    if (!kw.criterion_id) {
        console.error('[CPC] criterion_id manquant pour idx:', idx);
        showToast('⚠️ Impossible de modifier : ID manquant', 'error');
        input.value = input.dataset.original;
        return;
    }
    
    // Afficher le bouton si la valeur a changé
    if (Math.abs(current - original) > 0.001 && current > 0) {
        btn.style.display = 'inline-flex';
        input.classList.add('cpc-modified');
        pendingCpcChanges[idx] = {
            criterion_id: kw.criterion_id,
            keyword_text: kw.keyword_text,
            ad_group_id: kw.ad_group_id,
            campaign_id: kw.campaign_id,
            old_cpc_euros: original,
            new_cpc_euros: current,
            old_cpc_micros: Math.round(original * 1000000),
            new_cpc_micros: Math.round(current * 1000000)
        };
        console.log('[CPC] Modification en attente:', pendingCpcChanges[idx]);
    } else {
        btn.style.display = 'none';
        input.classList.remove('cpc-modified');
        delete pendingCpcChanges[idx];
    }
}

function onCpcKeypress(event, idx) {
    if (event.key === 'Enter') {
        event.preventDefault();
        document.getElementById('cpcInput' + idx).blur();
        if (pendingCpcChanges[idx]) { 
            validateCpcChange(idx); 
        }
    }
}

async function validateCpcChange(idx) {
    const change = pendingCpcChanges[idx];
    if (!change) return;
    
    // Vérification de sécurité
    if (!change.criterion_id) {
        showToast('⚠️ criterion_id manquant - modification impossible', 'error');
        console.error('[CPC] Tentative de modification sans criterion_id:', change);
        return;
    }
    
    const input = document.getElementById('cpcInput' + idx);
    const btn = document.getElementById('cpcBtn' + idx);
    
    // Feedback visuel
    btn.textContent = '⏳';
    btn.disabled = true;
    input.disabled = true;
    
    console.log('[CPC] Envoi modification:', {
        criterion_id: change.criterion_id,
        keyword_text: change.keyword_text,
        new_cpc_micros: change.new_cpc_micros
    });
    
    try {
        const response = await fetch(BACKEND_URL + '/api/wf3/update-bid', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                criterion_id: change.criterion_id,
                keyword_text: change.keyword_text,
                ad_group_id: change.ad_group_id,
                campaign_id: change.campaign_id,
                old_cpc_micros: change.old_cpc_micros,
                new_cpc_micros: change.new_cpc_micros,
                action_type: 'SET_BID',
                source: 'DASHBOARD_MANUAL'
            })
        });
        
        const result = await response.json().catch(() => ({}));
        
        if (response.ok) {
            // Succès - SAUVEGARDER EN LOCALSTORAGE
            saveCpcModification(change.criterion_id, change.new_cpc_micros);
            
            btn.textContent = '✓';
            btn.classList.add('cpc-success');
            input.classList.remove('cpc-modified');
            input.classList.add('cpc-saved');
            input.dataset.original = change.new_cpc_euros.toFixed(2);
            
            // Mettre à jour le cache local
            cockpitKeywords[idx].cpc_bid_micros = change.new_cpc_micros;
            
            showToast('✅ CPC MAX mis à jour : ' + change.keyword_text + ' → ' + change.new_cpc_euros.toFixed(2) + '€', 'success');
            
            // Reset après 2s
            setTimeout(() => {
                btn.style.display = 'none';
                btn.textContent = '✓';
                btn.classList.remove('cpc-success');
                input.classList.remove('cpc-saved');
                input.disabled = false;
                delete pendingCpcChanges[idx];
            }, 2000);
        } else {
            throw new Error(result.error || 'Erreur API ' + response.status);
        }
    } catch (error) {
        console.error('[CPC] Erreur:', error);
        // Erreur
        btn.textContent = '✗';
        btn.classList.add('cpc-error');
        showToast('❌ Erreur mise à jour CPC : ' + (error.message || change.keyword_text), 'error');
        
        // Reset après 3s
        setTimeout(() => {
            btn.textContent = '✓';
            btn.classList.remove('cpc-error');
            btn.disabled = false;
            input.disabled = false;
        }, 3000);
    }
}

function toggleBidMenu(idx) {
    const menu = document.getElementById('bidMenu' + idx);
    if (openBidMenu && openBidMenu !== menu) openBidMenu.classList.remove('show');
    menu.classList.toggle('show');
    openBidMenu = menu.classList.contains('show') ? menu : null;
}

// Fermer les menus au clic extérieur
document.addEventListener('click', function(e) {
    if (openBidMenu && !e.target.closest('.bid-dropdown')) {
        openBidMenu.classList.remove('show');
        openBidMenu = null;
    }
});