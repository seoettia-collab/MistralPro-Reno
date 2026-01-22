/* ========== NAVIGATION ========== */

function switchMainTab(tab) {
    document.querySelectorAll('.nav-tab').forEach((t, i) => {
        t.classList.toggle('active', (tab === 'analyse' && i === 0) || (tab === 'cockpit' && i === 1) || (tab === 'searchterms' && i === 2) || (tab === 'history' && i === 3) || (tab === 'dataFlow' && i === 4));
    });
    document.getElementById('viewAnalyse').classList.toggle('active', tab === 'analyse');
    document.getElementById('viewCockpit').classList.toggle('active', tab === 'cockpit');
    document.getElementById('viewSearchTerms').classList.toggle('active', tab === 'searchterms');
    document.getElementById('viewHistory').classList.toggle('active', tab === 'history');
    if (document.getElementById('viewDataFlow')) {
        document.getElementById('viewDataFlow').classList.toggle('active', tab === 'dataFlow');
    }
    if (tab === 'history') renderHistoryTable();
    if (tab === 'searchterms') renderSearchTermsTable();
    if (tab === 'dataFlow') loadDataFlow();
}

function switchView(view) {
    document.querySelectorAll('.nav-tab').forEach((t, i) => {
        t.classList.toggle('active', (view === 'analyse' && i === 0) || (view === 'cockpit' && i === 1) || (view === 'searchterms' && i === 2) || (view === 'history' && i === 3) || (view === 'dataFlow' && i === 4));
    });
    document.getElementById('viewAnalyse').classList.toggle('active', view === 'analyse');
    document.getElementById('viewCockpit').classList.toggle('active', view === 'cockpit');
    document.getElementById('viewSearchTerms').classList.toggle('active', view === 'searchterms');
    document.getElementById('viewHistory').classList.toggle('active', view === 'history');
    const viewDataFlow = document.getElementById('viewDataFlow');
    if (viewDataFlow) {
        viewDataFlow.classList.toggle('active', view === 'dataFlow');
    }
    if (view === 'dataFlow') loadDataFlow();
}

function switchSubTab(sub) {
    document.querySelectorAll('.sub-tab').forEach((t, i) => t.classList.toggle('active', (sub === 'decision' && i === 0) || (sub === 'lecture' && i === 1)));
    document.getElementById('subDecision').style.display = sub === 'decision' ? 'block' : 'none';
    document.getElementById('subLecture').style.display = sub === 'lecture' ? 'block' : 'none';
    if (sub === 'lecture') renderLectureView();
}

// Expose to global scope for onclick handlers
window.switchMainTab = switchMainTab;
window.switchView = switchView;
window.switchSubTab = switchSubTab;

export function updateTime() {
    const navTime = document.getElementById('navTime');
    if (!navTime) return;

    navTime.textContent = new Date().toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}
