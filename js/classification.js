/* ========== CLASSIFICATION - RÈGLES MÉTIER BTP ========== */

const EXCLUDE_WORDS = {
    info: ['info', 'prix', 'tarif', 'tuto', 'pdf', 'définition', 'comment', 'pourquoi', 'guide', 'modèle', 'exemple', 'gratuit', 'avis', 'forum', 'blog', 'youtube', 'video'],
    marques: ['ikea', 'darty', 'leroy merlin', 'castorama', 'brico dépôt', 'lapeyre', 'brico depot', 'mr bricolage', 'bricorama'],
    formation: ['formation', 'emploi', 'job', 'salaire', 'recrutement', 'école', 'ecole', 'diplôme', 'diplome', 'cap', 'bts'],
    normes: ['nfc 15-100', 'nfc', 'norme', 'réglementation', 'reglementation', 'loi', 'obligation', 'dtu'],
    hors_metier: ['diy', 'faire soi-même', 'faire soi meme', 'bricolage', 'achat', 'acheter', 'magasin', 'boutique']
};

const PERTINENT_WORDS = {
    intention: ['devis', 'entreprise', 'artisan', 'société', 'societe', 'professionnel', 'pro', 'installation', 'rénovation', 'renovation', 'travaux', 'dépannage', 'depannage', 'intervention', 'prestation'],
    metier: ['plomberie', 'plombier', 'électricité', 'electricite', 'électricien', 'electricien', 'peinture', 'peintre', 'isolation', 'chauffage', 'chauffagiste', 'carrelage', 'carreleur', 'maçonnerie', 'maconnerie', 'menuiserie', 'menuisier', 'salle de bain', 'cuisine', 'toiture', 'couvreur', 'façade', 'facade'],
    localisation: ['paris', 'idf', 'ile de france', 'île de france', '75', '77', '78', '91', '92', '93', '94', '95', 'seine', 'hauts de seine', 'val de marne', 'essonne', 'yvelines']
};

function checkExcludeWords(searchTerm) {
    const termLower = searchTerm.toLowerCase();
    for (const [category, words] of Object.entries(EXCLUDE_WORDS)) {
        for (const word of words) {
            if (termLower.includes(word)) return { category, word };
        }
    }
    return null;
}

function checkPertinentWords(searchTerm) {
    const termLower = searchTerm.toLowerCase();
    for (const [category, words] of Object.entries(PERTINENT_WORDS)) {
        for (const word of words) {
            if (termLower.includes(word)) return { category, word };
        }
    }
    return null;
}

function classifySearchTerm(st) {
    const impressions = st.metrics?.impressions || 0;
    const clicks = st.metrics?.clicks || 0;
    const cost = st.metrics?.cost_euros || 0;
    const conversions = st.metrics?.conversions || 0;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    
    // Détection mots à exclure / pertinents
    const excludeMatch = checkExcludeWords(st.search_term);
    const pertinentMatch = checkPertinentWords(st.search_term);
    
    let decision = 'NONE', reason = '', action = null;
    
    // Logique de décision
    if (excludeMatch) {
        decision = 'EXCLUDE';
        reason = `Catégorie "${excludeMatch.category}" détectée (${excludeMatch.word})`;
        action = 'ADD_NEGATIVE';
    } else if (pertinentMatch) {
        decision = 'PERTINENT';
        reason = `Intention "${pertinentMatch.category}" détectée (${pertinentMatch.word})`;
        action = conversions === 0 && clicks > 5 ? 'ADD_KEYWORD' : null;
    } else if (cost > 5 && conversions === 0 && clicks > 3) {
        decision = 'EXCLUDE';
        reason = `Budget gaspillé sans conversion (${cost.toFixed(2)}€)`;
        action = 'ADD_NEGATIVE';
    }
    
    return {
        ...st,
        impressions, clicks, cost, conversions, ctr,
        decision, reason, action,
        excludeMatch, pertinentMatch
    };
}
