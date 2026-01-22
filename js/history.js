/* ========== HISTORY - Vue Historique ========== */
/* VERSION: 2.4.0 - FIX action object/string handling */

let historyData = [];

// ═══════════════════════════════════════════════════════════════
// HELPER: Normaliser action en string
// ═══════════════════════════════════════════════════════════════
function getActionString(action) {
    if (!action) return '';
    if (typeof action === 'string') return action;
    if (typeof action === 'object') {
        // Support pour différents formats d'objet action
        return action.type || action.action_type || action.action || JSON.stringify(action);
    }
    return String(action);
}

function renderHistoryTable() {
    const tbody = document.getElementById('historyBody');
    if (!historyData.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Aucun historique disponible</td></tr>';
        return;
    }
    
    const filterPeriod = document.getElementById('filterPeriod')?.value || 'week';
    const filterAction = document.getElementById('filterAction')?.value || 'all';
    const filterStatus = document.getElementById('filterStatus')?.value || 'all';
    
    let filtered = historyData.filter(h => {
        const hDate = new Date(h.timestamp);
        const now = new Date();
        
        // Filtre période
        if (filterPeriod === 'today' && hDate.toDateString() !== now.toDateString()) return false;
        if (filterPeriod === 'week' && (now - hDate) > 7 * 24 * 60 * 60 * 1000) return false;
        if (filterPeriod === 'month' && (now - hDate) > 30 * 24 * 60 * 60 * 1000) return false;
        
        // Filtre action - CORRIGÉ: utiliser getActionString()
        const actionStr = getActionString(h.action);
        if (filterAction !== 'all' && !actionStr.toUpperCase().includes(filterAction.toUpperCase())) return false;
        
        // Filtre status
        if (filterStatus !== 'all' && h.status !== filterStatus) return false;
        
        return true;
    });
    
    document.getElementById('historyCount').textContent = filtered.length + ' actions';
    document.getElementById('statTotalActions').textContent = filtered.length;
    document.getElementById('statSuccessActions').textContent = filtered.filter(h => h.status === 'SUCCESS' || h.status === 'SIMULATED').length;
    document.getElementById('statRolledBack').textContent = filtered.filter(h => h.status === 'ROLLED_BACK').length;
    
    tbody.innerHTML = filtered.map(h => {
        const d = new Date(h.timestamp);
        const dateStr = d.toLocaleDateString('fr-FR');
        const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        
        // CORRIGÉ: utiliser getActionString()
        const actionStr = getActionString(h.action);
        
        let actionClass = 'action-pause';
        if (actionStr.includes('ENABLE')) actionClass = 'action-enable';
        else if (actionStr.includes('BID_DOWN') || actionStr.includes('LOWER') || actionStr.includes('SET_BID')) actionClass = 'action-bid-down';
        else if (actionStr.includes('BID_UP') || actionStr.includes('RAISE')) actionClass = 'action-bid-up';
        else if (actionStr.includes('BID')) actionClass = 'action-bid-down';
        else if (actionStr.includes('NEGATIVE')) actionClass = 'action-negative';
        
        let statusClass = 'status-success';
        if (h.status === 'ROLLED_BACK') statusClass = 'status-rolled-back';
        else if (h.status === 'BLOCKED') statusClass = 'status-blocked';
        else if (h.status === 'ERROR') statusClass = 'status-error';
        
        const rollbackCell = h.rollbackAvailable 
            ? '<button class="rollback-btn" onclick="openRollbackModal(\'' + (h.keyword || '').replace(/'/g, "\\'") + '\')">↩️ Rollback</button>' 
            : '<span class="rollback-done">-</span>';
        
        return '<tr class="' + (h.status === 'ROLLED_BACK' ? 'rolled-back' : '') + '">' +
            '<td><div class="history-timestamp"><span class="date">' + dateStr + '</span><span class="time">' + timeStr + '</span></div></td>' +
            '<td><span class="history-keyword">' + (h.keyword || '-') + '</span></td>' +
            '<td class="cell-muted">' + (h.campaign || '-') + '</td>' +
            '<td><span class="action-badge ' + actionClass + '">' + actionStr + '</span></td>' +
            '<td class="detail-cell">' + (h.detail || '-') + '</td>' +
            '<td><span class="status-badge ' + statusClass + '">' + (h.status || 'UNKNOWN') + '</span></td>' +
            '<td>' + rollbackCell + '</td>' +
        '</tr>';
    }).join('');
}

function filterHistory() { 
    renderHistoryTable(); 
}

function exportHistoryCSV() {
    let csv = 'Date,Mot-clé,Campagne,Action,Détail,Statut\n';
    historyData.forEach(h => { 
        const actionStr = getActionString(h.action);
        csv += new Date(h.timestamp).toLocaleString('fr-FR') + ',' + 
               (h.keyword || '') + ',' + 
               (h.campaign || '') + ',' + 
               actionStr + ',' + 
               (h.detail || '') + ',' + 
               (h.status || '') + '\n'; 
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'historique_actions_' + new Date().toISOString().split('T')[0] + '.csv';
    a.click();
}