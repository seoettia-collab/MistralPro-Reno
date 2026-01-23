/* ========== SEARCH TERMS - Vue Requêtes ========== */
/* VERSION: 2.5.1 - Sécurisation JSON response */

// ═══════════════════════════════════════════════════════════════
// LOCALSTORAGE — Persistance des Search Terms validés
// ═══════════════════════════════════════════════════════════════
const VALIDATED_SEARCH_TERMS_KEY = 'googleads_validated_search_terms';

function getValidatedSearchTerms() {
    try {
        const data = localStorage.getItem(VALIDATED_SEARCH_TERMS_KEY);
        return data ? JSON.parse(data) : {};
    } catch (e) {
        console.error('Erreur lecture localStorage:', e);
        return {};
    }
}

function saveValidatedSearchTerms(data) {
    try {
        localStorage.setItem(VALIDATED_SEARCH_TERMS_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('Erreur écriture localStorage:', e);
    }
}

function markSearchTermValidated(searchTerm, decision, details = {}) {
    const validated = getValidatedSearchTerms();
    validated[searchTerm.toLowerCase().trim()] = {
        decision: decision,
        validated_at: new Date().toISOString(),
        details: details
    };
    saveValidatedSearchTerms(validated);
    console.log('✓ Search Term marqué comme validé:', searchTerm, decision);
}

function isSearchTermValidated(searchTerm) {
    const validated = getValidatedSearchTerms();
    return validated[searchTerm.toLowerCase().trim()] || null;
}

function rollbackSearchTermValidation(searchTerm) {
    const validated = getValidatedSearchTerms();
    delete validated[searchTerm.toLowerCase().trim()];
    saveValidatedSearchTerms(validated);
    console.log('↩ Rollback validation:', searchTerm);
}

function resetAllValidatedSearchTerms() {
    localStorage.removeItem(VALIDATED_SEARCH_TERMS_KEY);
    console.log('Reset all validated search terms');
    renderSearchTermsTable();
}

// ═══════════════════════════════════════════════════════════════
// PROCESSING
// ═══════════════════════════════════════════════════════════════
function processSearchTerms(rawSearchTerms) {
    classifiedSearchTerms = [];
    suggestedNegatives = [];
    
    for (const st of rawSearchTerms) {
        const classified = classifySearchTerm(st);
        if (classified) {
            classifiedSearchTerms.push(classified);
            if (classified.decision === 'EXCLUDE' && classified.action) {
                suggestedNegatives.push({
                    term: classified.search_term,
                    match_type: classified.action.match_type,
                    reason: classified.reason,
                    cost: classified.cost
                });
            }
        }
    }
    
    classifiedSearchTerms.sort((a, b) => b.cost - a.cost);
    suggestedNegatives.sort((a, b) => b.cost - a.cost);
}

// ═══════════════════════════════════════════════════════════════
// RENDER TABLE
// ═══════════════════════════════════════════════════════════════
function renderSearchTermsTable() {
    const tbody = document.getElementById('searchTermsBody');
    
    if (!classifiedSearchTerms || classifiedSearchTerms.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--text-muted);padding:40px;">Aucune requête analysée.<br><small>Les données seront chargées depuis WF1.</small></td></tr>';
        return;
    }
    
    const filterDecision = document.getElementById('filterSearchTermDecision')?.value || 'ALL';
    const filterCost = parseFloat(document.getElementById('filterSearchTermCost')?.value || '0');
    const hideValidated = document.getElementById('filterHideValidated')?.checked ?? true;
    
    // ═══════════════════════════════════════════════════════════════
    // FILTRAGE PRINCIPAL — Exclut les termes validés (localStorage)
    // ═══════════════════════════════════════════════════════════════
    let filtered = classifiedSearchTerms.filter(st => {
        // PRIORITÉ 1: Si validé localement → TOUJOURS masquer (si hideValidated coché)
        const validatedInfo = isSearchTermValidated(st.search_term);
        if (hideValidated && validatedInfo) {
            return false;  // ← DISPARITION IMMÉDIATE
        }
        
        // Filtres standards
        if (filterDecision !== 'ALL' && st.decision !== filterDecision) return false;
        if (st.cost < filterCost) return false;
        return true;
    });
    
    // Stats (exclut les validés du comptage)
    const validatedTerms = getValidatedSearchTerms();
    const validatedCount = Object.keys(validatedTerms).length;
    
    const totalCount = classifiedSearchTerms.length;
    const excludeCount = classifiedSearchTerms.filter(st => 
        st.decision === 'EXCLUDE' && !isSearchTermValidated(st.search_term)
    ).length;
    const pertinentCount = classifiedSearchTerms.filter(st => 
        st.decision === 'PERTINENT' && !isSearchTermValidated(st.search_term)
    ).length;
    const noneCount = classifiedSearchTerms.filter(st => 
        st.decision === 'NONE' && !isSearchTermValidated(st.search_term)
    ).length;
    const wastedBudget = classifiedSearchTerms.filter(st => 
        st.decision === 'EXCLUDE' && !isSearchTermValidated(st.search_term)
    ).reduce((sum, st) => sum + st.cost, 0);
    
    // Mise à jour UI stats
    const statTotal = document.getElementById('statSearchTermsTotal');
    const statExclude = document.getElementById('statSearchTermsExclude');
    const statPertinent = document.getElementById('statSearchTermsPertinent');
    const statNone = document.getElementById('statSearchTermsNone');
    const statWaste = document.getElementById('statSearchTermsWaste');
    const statValidated = document.getElementById('statSearchTermsValidated');
    const searchCount = document.getElementById('searchTermsCount');
    
    if (statTotal) statTotal.textContent = totalCount;
    if (statExclude) statExclude.textContent = excludeCount;
    if (statPertinent) statPertinent.textContent = pertinentCount;
    if (statNone) statNone.textContent = noneCount;
    if (statWaste) statWaste.textContent = wastedBudget.toFixed(2) + ' €';
    if (statValidated) statValidated.textContent = validatedCount;
    if (searchCount) searchCount.textContent = filtered.length + ' requêtes';
    
    // Render rows
    tbody.innerHTML = filtered.map((st, index) => {
        const validated = isSearchTermValidated(st.search_term);
        const rowId = 'st_row_' + index;
        const selectId = 'st_select_' + index;
        
        let rowClass = validated ? 'row-validated' : 
                       (st.decision === 'EXCLUDE' ? 'row-exclude' : 
                       (st.decision === 'PERTINENT' ? 'row-pertinent' : ''));
        
        // RECO-IA BADGE — EXCLURE masqué (affiche "—")
        let recoIABadge = st.decision === 'EXCLUDE' ? '<span class="reco-ia-badge none">—</span>' :
                          st.decision === 'PERTINENT' ? '<span class="reco-ia-badge pertinent">PERTINENT</span>' :
                          '<span class="reco-ia-badge none">—</span>';
        
        let decisionSelect = validated ?
            '<span class="validated-badge">' + (validated.decision === 'ADD_KEYWORD' ? '✓ Ajouté' : '✓ Exclu') + '</span>' :
            '<select class="decision-select" id="' + selectId + '" onchange="updateDecisionStyle(\'' + selectId + '\')"><option value="" selected disabled>-- choisir --</option><option value="ADD_KEYWORD">Ajouter</option><option value="ADD_NEGATIVE">Exclure</option></select>';
        
        let validateBtn = validated ?
            '<span style="font-size:10px;color:var(--text-muted)">✓ ' + new Date(validated.validated_at).toLocaleDateString('fr-FR') + '</span>' :
            '<button class="btn-validate-st" onclick="validateSearchTermDecision(' + index + ', \'' + selectId + '\')">Valider</button>';
        
        return '<tr class="' + rowClass + '" id="' + rowId + '">' +
            '<td><div class="kw-text">' + st.search_term + '</div></td>' +
            '<td style="text-align:right">' + st.impressions.toLocaleString() + '</td>' +
            '<td style="text-align:right">' + st.clicks + '</td>' +
            '<td style="text-align:right">' + st.ctr.toFixed(1) + '%</td>' +
            '<td style="text-align:right;font-weight:600">' + st.cost.toFixed(2) + '€</td>' +
            '<td style="text-align:center" class="' + (st.conversions > 0 ? 'conv-positive' : 'conv-zero') + '">' + st.conversions + '</td>' +
            '<td>' + recoIABadge + '</td>' +
            '<td>' + decisionSelect + '</td>' +
            '<td>' + validateBtn + '</td>' +
            '</tr>';
    }).join('');
    
    filtered.forEach((st, index) => updateDecisionStyle('st_select_' + index));
    
    const negSection = document.getElementById('negativesSection');
    if (negSection) negSection.style.display = 'none';
}

function updateDecisionStyle(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.classList.remove('selected-add-keyword', 'selected-add-negative');
    if (select.value === 'ADD_KEYWORD') select.classList.add('selected-add-keyword');
    else if (select.value === 'ADD_NEGATIVE') select.classList.add('selected-add-negative');
}

// ═══════════════════════════════════════════════════════════════
// VALIDATION — Disparition IMMÉDIATE + Appel WF3
// ═══════════════════════════════════════════════════════════════
async function validateSearchTermDecision(index, selectId) {
    const st = classifiedSearchTerms[index];
    if (!st) {
        showToast('❌ Erreur', 'error', 'Requête non trouvée');
        return;
    }
    
    const select = document.getElementById(selectId);
    if (!select || !select.value) {
        showToast('⚠️ Choisissez une décision', 'warning', 'Sélectionnez une action avant de valider');
        return;
    }
    
    const decision = select.value;
    const searchTerm = st.search_term;
    
    console.log('========== VALIDATION SEARCH TERM ==========');
    console.log('Requête:', searchTerm);
    console.log('Décision:', decision);
    
    // ═══════════════════════════════════════════════════════════════
    // OPTIMISTIC UPDATE — Disparition IMMÉDIATE
    // Le terme disparaît AVANT l'appel API
    // ═══════════════════════════════════════════════════════════════
    const details = decision === 'ADD_KEYWORD' 
        ? { conversions: st.conversions, clicks: st.clicks }
        : { cost: st.cost, clicks: st.clicks, reason: st.reason };
    
    markSearchTermValidated(searchTerm, decision, details);
    renderSearchTermsTable();  // ← Le terme DISPARAÎT IMMÉDIATEMENT
    
    showToast('⏳ Envoi à Google Ads...', 'loading', 'Traitement en cours...');
    
    // Payload WF3
    const payload = {
        source: 'DASHBOARD_SEARCH_TERMS',
        timestamp: new Date().toISOString(),
        user: 'ricardo',
        customer_id: cachedWf1?.customer_id || '7929430550',
        campaign_id: cachedWf1?.campaign_id || '23356386237',
        action: {
            type: decision,
            text: searchTerm,
            search_term: searchTerm,
            match_type: 'PHRASE',
            ad_group_id: st.ad_group_id || '',
            campaign_id: st.campaign_id || ''
        }
    };
    
    console.log('Payload WF3:', JSON.stringify(payload, null, 2));
    
    try {
        const response = await fetch(WF3_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Erreur WF3: ' + response.status);
        }
        
        // ═══════════════════════════════════════════════════════════════
        // SÉCURISATION v2.5.1 — Lecture JSON avec fallback
        // ═══════════════════════════════════════════════════════════════
        let result = {};
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            try {
                result = await response.json();
            } catch (parseError) {
                console.warn('Réponse non-JSON reçue, traitement comme succès');
            }
        }
        console.log('WF3 Response:', result);
        
        // Succès — le terme est déjà masqué
        const actionLabel = decision === 'ADD_KEYWORD' ? 'Ajouté' : 'Exclu';
        showToast('✓ ' + actionLabel, 'success', '"' + searchTerm + '" ' + actionLabel.toLowerCase() + ' définitivement.');
        
    } catch (error) {
        console.error('Erreur WF3:', error);
        
        // ═══════════════════════════════════════════════════════════════
        // ROLLBACK — En cas d'erreur, réafficher le terme
        // ═══════════════════════════════════════════════════════════════
        rollbackSearchTermValidation(searchTerm);
        renderSearchTermsTable();
        
        showToast('❌ Erreur', 'error', error.message || 'Action annulée - réessayez');
    }
}

// ═══════════════════════════════════════════════════════════════
// NEGATIVES SUGGESTIONS
// ═══════════════════════════════════════════════════════════════
function renderNegativesSuggestions() {
    const section = document.getElementById('negativesSection');
    const list = document.getElementById('negativesList');
    const countSpan = document.getElementById('negativesCount');
    
    if (!suggestedNegatives || suggestedNegatives.length === 0) { 
        if (section) section.style.display = 'none'; 
        return; 
    }
    
    if (section) section.style.display = 'block';
    if (countSpan) countSpan.textContent = suggestedNegatives.length;
    
    if (list) {
        list.innerHTML = suggestedNegatives.slice(0, 20).map(neg =>
            '<div class="negative-item">' +
            '<div><div class="term">"' + neg.term + '"</div>' +
            '<div class="reason">' + neg.reason + ' • ' + neg.cost.toFixed(2) + '€</div></div>' +
            '<button class="btn-validate accept" onclick="validateNegative(\'' + encodeURIComponent(neg.term) + '\', true)">✓</button>' +
            '<button class="btn-validate ignore" onclick="validateNegative(\'' + encodeURIComponent(neg.term) + '\', false)">✗</button>' +
            '</div>'
        ).join('');
    }
}

function validateNegative(encodedTerm, accept) {
    const term = decodeURIComponent(encodedTerm);
    suggestedNegatives = suggestedNegatives.filter(n => n.term !== term);
    renderNegativesSuggestions();
    showToast(
        accept ? '✅ Négatif validé' : 'ℹ️ Négatif ignoré', 
        accept ? 'success' : 'info', 
        '"' + term + '" ' + (accept ? 'sera ajouté aux mots-clés négatifs.' : 'ne sera pas exclu.')
    );
}