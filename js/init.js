/* ========== INITIALISATION ========== */

import { updateTime } from './navigation.js';

// Fonction d'initialisation principale
async function init() {
    const globalStatus = document.getElementById('globalStatus');
    const globalStatusText = document.getElementById('globalStatusText');

    if (globalStatusText) globalStatusText.textContent = 'Chargement...';
    window.updatePeriodLabels();

    const success = await window.refreshAll();
    await window.loadHistoryFromBackend();

    if (success) {
        if (globalStatus) globalStatus.className = 'status-indicator status-good';
        if (globalStatusText) globalStatusText.textContent = 'Système opérationnel';
    } else {
        if (globalStatus) globalStatus.className = 'status-indicator status-warning';
        if (globalStatusText) globalStatusText.textContent = 'Vérifiez le backend';
    }

    window.renderHistoryTable();
    window.renderSearchTermsTable();
}

// Lancement - SEUL point d'appel pour updateTime
document.addEventListener('DOMContentLoaded', () => {
    updateTime();
    setInterval(updateTime, 1000);
    init();
});
