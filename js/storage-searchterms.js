/* ========== STORAGE - SEARCH TERMS VALIDÉS ========== */

function loadValidatedSearchTerms() {
    try { const stored = localStorage.getItem(VALIDATED_ST_KEY); return stored ? JSON.parse(stored) : {}; }
    catch (e) { return {}; }
}

function saveValidatedSearchTerms(validated) {
    try { localStorage.setItem(VALIDATED_ST_KEY, JSON.stringify(validated)); } catch (e) {}
}

function markSearchTermValidated(searchTerm, decision, details) {
    const validated = loadValidatedSearchTerms();
    const termKey = searchTerm.toLowerCase().trim();
    validated[termKey] = { decision, details, validated_at: new Date().toISOString() };
    saveValidatedSearchTerms(validated);
}

function isSearchTermValidated(searchTerm) {
    const validated = loadValidatedSearchTerms();
    return !!validated[searchTerm.toLowerCase().trim()];
}

function clearValidatedSearchTerms() {
    localStorage.removeItem(VALIDATED_ST_KEY);
}

function rollbackSearchTermValidation(searchTerm) {
    const validated = loadValidatedSearchTerms();
    const termKey = searchTerm.toLowerCase().trim();
    if (validated[termKey]) {
        delete validated[termKey];
        saveValidatedSearchTerms(validated);
        return true;
    }
    return false;
}
