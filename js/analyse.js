/* ========== ANALYSE - Vue Décision et Vue Lecture ========== */

function renderAnalyseData() {
    const wf1 = cachedWf1?.entities || cachedWf1?.data?.entities;
    if (wf1) {
        document.getElementById('wf1Campaign').textContent = (cachedWf1.campaign_name || cachedWf1?.data?.campaign_name || '-').replace(' - Search', '');
        document.getElementById('wf1Keywords').textContent = wf1.keywords?.length || '-';
        document.getElementById('wf1AdGroups').textContent = wf1.ad_groups?.length || '-';
        document.getElementById('wf1SearchTerms').textContent = wf1.search_terms?.length || '-';

        const keywords = wf1.keywords || [];
        let totalImpressions = 0, totalClicks = 0, totalCost = 0;
        keywords.forEach(kw => {
            const m = kw.metrics || {};
            totalImpressions += m.impressions || 0;
            totalClicks += m.clicks || 0;
            totalCost += m.cost_euros || 0;
        });

        document.getElementById('wf1Impressions').textContent = totalImpressions.toLocaleString();
        document.getElementById('wf1Clicks').textContent = totalClicks || '-';
        document.getElementById('wf1Cost').textContent = totalCost.toFixed(2) + '€';
        document.getElementById('wf1CTR').textContent = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) + '%' : '-';

        const ts = cachedWf1.created_at || cachedWf1?.data?.created_at;
        if (ts) {
            const d = new Date(ts);
            document.getElementById('wf1Timestamp').textContent = d.toLocaleDateString('fr-FR', {day:'2-digit',month:'2-digit'}) + ' ' + d.toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'});
        }
    }
    
    if (cachedWf2?.report_id) {
        let data = cachedWf2.data || cachedWf2;
        if (typeof data === 'string') try { data = JSON.parse(data); } catch(e) {}
        
        const summary = data.summary || {};
        const budgetDiag = summary.budget_diagnostic || {};
        const recos = data.recommendations || [];
        const qualityScore = summary.quality_score || {};
        const priorityActions = summary.priority_actions || [];

        document.getElementById('executiveSummaryText').textContent = summary.executive_summary || 'Analyse en cours...';
        document.getElementById('efficiencyScore').textContent = budgetDiag.efficiency_score ?? '-';
        document.getElementById('wasteEuros').textContent = (budgetDiag.waste_euros ?? 0).toFixed(0) + '€';
        document.getElementById('wastePercent').textContent = (budgetDiag.waste_percent ?? 0).toFixed(1) + '%';
        document.getElementById('statRecos').textContent = recos.length;
        document.getElementById('consensusScore').textContent = summary.consensus_score || '-';
        
        if (budgetDiag.main_issue) {
            document.getElementById('mainIssueCard').style.display = 'block';
            document.getElementById('mainIssueText').textContent = budgetDiag.main_issue;
        } else {
            document.getElementById('mainIssueCard').style.display = 'none';
        }
        
        if (priorityActions.length > 0) {
            document.getElementById('priorityActionsBox').style.display = 'block';
            document.getElementById('priorityActionsList').innerHTML = priorityActions.map(action => '<div class="priority-action-item">' + action + '</div>').join('');
        } else {
            document.getElementById('priorityActionsBox').style.display = 'none';
        }
        
        if (qualityScore.analysis_depth) {
            document.getElementById('qualityDepth').textContent = qualityScore.analysis_depth + '/100';
            document.getElementById('qualityClarity').textContent = qualityScore.decision_clarity + '/100';
            document.getElementById('qualityJustification').textContent = qualityScore.justification_quality + '/100';
            document.getElementById('qualityOverall').textContent = qualityScore.overall + '/100';
        }
        
        displayRecommendationsV2(recos);
        updateLectureView(data);
    }
    
    if (cachedWf3?.success && cachedWf3?.execution) {
        let data = cachedWf3.execution.data || cachedWf3.execution;
        if (typeof data === 'string') try { data = JSON.parse(data); } catch(e) {}
        const q = data.quotas?.after || {};
        document.getElementById('quotaPauseAnalyse').textContent = (q.keywords_paused?.used || 0) + '/' + (q.keywords_paused?.max || 10);
        document.getElementById('quotaBidAnalyse').textContent = (q.bids_adjusted?.used || 0) + '/' + (q.bids_adjusted?.max || 15);
        document.getElementById('quotaNegAnalyse').textContent = (q.negatives_added?.used || 0) + '/' + (q.negatives_added?.max || 20);
    }
}

function displayRecommendationsV2(recos) {
    const container = document.getElementById('recoListV2');
    if (!recos || recos.length === 0) {
        container.innerHTML = '<p class="empty-state" style="color:var(--success);">✅ Aucune action suggérée — Campagne optimisée</p>';
        return;
    }
    
    const riskOrder = { 'HIGH': 0, 'MEDIUM': 1, 'LOW': 2 };
    recos.sort((a, b) => {
        const riskA = riskOrder[a.risk_level] ?? 1;
        const riskB = riskOrder[b.risk_level] ?? 1;
        if (riskA !== riskB) return riskA - riskB;
        return (b.metrics?.cost_euros || 0) - (a.metrics?.cost_euros || 0);
    });
    
    container.innerHTML = recos.map(r => {
        const m = r.metrics || {};
        const risk = (r.risk_level || 'MEDIUM').toLowerCase();
        const kwText = r.keyword_text || r.keyword || 'Mot-clé #' + (r.criterion_id || '?');
        const cost = m.cost_euros || 0;
        const conversions = m.conversions || 0;
        
        let decisionClass = 'monitor', decisionLabel = 'SURVEILLER';
        const isHighRisk = (r.risk_level || '').toUpperCase() === 'HIGH';
        
        if (r.action === 'PAUSE_KEYWORD' || r.decision === 'PAUSE' || (isHighRisk && conversions === 0 && cost > 30)) {
            decisionClass = 'pause'; decisionLabel = 'PAUSE';
        } else if (r.action === 'LOWER_BID' || r.decision === 'ENCHÈRE_BAISSE' || r.decision === 'ENCHERE_BAISSE') {
            decisionClass = 'bid'; decisionLabel = 'ENCHÈRE ↓';
        } else if (r.action === 'PERFORMANT' || r.decision === 'PERFORMANT') {
            decisionClass = 'performant'; decisionLabel = 'OK';
        }
        
        let html = '<div class="reco-card-v2 risk-' + risk + '"><div class="reco-header-v2"><span class="reco-keyword-v2">' + kwText + '</span><div class="reco-badges"><span class="risk-badge ' + risk + '">' + (r.risk_level || 'MEDIUM') + '</span><span class="decision-badge ' + decisionClass + '">' + decisionLabel + '</span></div></div>';
        
        if (r.diagnosis) html += '<div class="reco-section"><div class="reco-section-label">Diagnostic</div><div class="reco-section-content diagnosis">' + r.diagnosis + '</div></div>';
        if (r.interpretation) html += '<div class="reco-section"><div class="reco-section-label">Interprétation métier</div><div class="reco-section-content">' + r.interpretation + '</div></div>';
        if (r.decision_rationale) html += '<div class="reco-section"><div class="reco-section-label">Justification</div><div class="reco-section-content">' + r.decision_rationale + '</div></div>';
        if (r.alternative) html += '<div class="reco-alternative">' + r.alternative + '</div>';
        if (r.savings_if_paused && r.savings_if_paused > 0) html += '<div class="reco-savings">Économie potentielle : ' + r.savings_if_paused.toFixed(2) + '€</div>';
        
        return html + '</div>';
    }).join('');
}

function downloadCSV() {
    if (!cachedWf2) return;
    let data = cachedWf2.data || cachedWf2;
    if (typeof data === 'string') try { data = JSON.parse(data); } catch(e) {}
    const recos = data.recommendations || [];
    let csv = 'Action,Mot-clé,Impressions,Clics,Coût,Décision\n';
    recos.forEach(r => { const m = r.metrics || {}; csv += r.action + ',' + r.keyword_text + ',' + (m.impressions||0) + ',' + (m.clicks||0) + ',' + (m.cost_euros||0).toFixed(2) + ',' + (r.final_decision||'') + '\n'; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'recommandations_' + new Date().toISOString().split('T')[0] + '.csv';
    a.click();
}

function renderLectureView() { if (cachedWf2?.data) updateLectureView(cachedWf2.data); }

function updateLectureView(data) {
    if (typeof data === 'string') try { data = JSON.parse(data); } catch(e) {}
    const summary = data.summary || {};
    const recos = data.recommendations || [];
    
    document.getElementById('lectureCampaign').textContent = cachedWf1?.campaign_name || 'MistralRenov';
    document.getElementById('lectureDate').textContent = new Date().toLocaleString('fr-FR');
    document.getElementById('lectureConsensus').textContent = summary.consensus_score || '-';
    document.getElementById('lectureSummary').textContent = summary.executive_summary || 'Analyse en attente...';
    
    const container = document.getElementById('lectureRecoContainer');
    if (!recos.length) {
        container.innerHTML = '<div class="empty-state-lecture">✅ Aucune action requise. Votre campagne est optimisée.</div>';
        return;
    }
    
    container.innerHTML = recos.slice(0, 5).map(r => {
        let decisionLabel = r.action || r.decision || 'SURVEILLER';
        return '<div class="lecture-card"><div class="lecture-card-header"><span class="lecture-keyword">' + (r.keyword_text || 'Mot-clé') + '</span><span class="lecture-decision">' + decisionLabel + '</span></div>' + (r.interpretation ? '<div class="lecture-section-inner"><div class="lecture-section-title">Interprétation</div><div class="lecture-section-content">' + r.interpretation + '</div></div>' : '') + (r.decision_rationale ? '<div class="lecture-section-inner"><div class="lecture-section-title">Justification</div><div class="ai-quote">' + r.decision_rationale + '</div></div>' : '') + '</div>';
    }).join('');
}
