/* ========== STORAGE - RECOMMANDATIONS CONSOMMÉES ========== */

function loadConsumedRecos() {
    try { const stored = localStorage.getItem(CONSUMED_RECOS_KEY); return stored ? JSON.parse(stored) : {}; }
    catch (e) { return {}; }
}

function saveConsumedRecos(consumed) {
    try { localStorage.setItem(CONSUMED_RECOS_KEY, JSON.stringify(consumed)); } catch (e) {}
}

function markRecoAsConsumed(kwId, actionType) {
    const consumed = loadConsumedRecos();
    consumed[String(kwId)] = { action_type: actionType, executed_at: new Date().toISOString() };
    saveConsumedRecos(consumed);
}

function isRecoConsumed(kwId) {
    const consumed = loadConsumedRecos();
    const entry = consumed[String(kwId)];
    if (!entry) return false;
    const diffDays = (new Date() - new Date(entry.executed_at)) / (1000 * 60 * 60 * 24);
    return diffDays < CONSUMED_RECOS_EXPIRATION_DAYS;
}

function purgeExpiredRecos() {
    const consumed = loadConsumedRecos();
    const now = new Date();
    for (const kwId in consumed) {
        const diffDays = (now - new Date(consumed[kwId].executed_at)) / (1000 * 60 * 60 * 24);
        if (diffDays >= CONSUMED_RECOS_EXPIRATION_DAYS) delete consumed[kwId];
    }
    saveConsumedRecos(consumed);
}

function clearConsumedRecos() {
    localStorage.removeItem(CONSUMED_RECOS_KEY);
}
