/**
 * SEO Dashboard - Editorial Plan Service
 */

const { dbAll, dbRun, dbGet } = require('./db');

/**
 * Générer un slug SEO propre
 * @param {string} text - Texte à transformer
 * @returns {string} - Slug SEO
 */
function generateSeoSlug(text) {
  if (!text) return '';
  
  // Table de conversion des accents
  const accentsMap = {
    'à': 'a', 'â': 'a', 'ä': 'a', 'á': 'a', 'ã': 'a',
    'è': 'e', 'ê': 'e', 'ë': 'e', 'é': 'e',
    'ì': 'i', 'î': 'i', 'ï': 'i', 'í': 'i',
    'ò': 'o', 'ô': 'o', 'ö': 'o', 'ó': 'o', 'õ': 'o',
    'ù': 'u', 'û': 'u', 'ü': 'u', 'ú': 'u',
    'ç': 'c', 'ñ': 'n',
    'œ': 'oe', 'æ': 'ae'
  };
  
  return text
    .toLowerCase()
    // Remplacer les accents
    .split('')
    .map(char => accentsMap[char] || char)
    .join('')
    // Remplacer les espaces et underscores par des tirets
    .replace(/[\s_]+/g, '-')
    // Supprimer les caractères spéciaux
    .replace(/[^a-z0-9-]/g, '')
    // Supprimer les tirets multiples
    .replace(/-+/g, '-')
    // Supprimer les tirets en début et fin
    .replace(/^-|-$/g, '');
}

/**
 * Générer une meta description SEO
 * @param {string} keyword - Mot-clé
 * @param {string} type - Type de contenu (blog ou service)
 * @returns {string} - Meta description (140-160 caractères)
 */
function generateMetaDescription(keyword, type) {
  if (!keyword) return '';
  
  const capitalizedKeyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);
  const q = keyword.toLowerCase();
  
  if (type === 'blog') {
    // Descriptions informationnelles
    if (q.includes('comment')) {
      return `${capitalizedKeyword} ? Découvrez nos conseils pratiques et méthodes éprouvées pour réussir votre projet étape par étape.`;
    } else if (q.includes('pourquoi') || q.includes('avantage')) {
      return `${capitalizedKeyword} : tous les avantages expliqués clairement. Guide complet pour faire le bon choix.`;
    } else if (q.includes('guide') || q.includes('conseil')) {
      return `${capitalizedKeyword} : conseils d'experts et bonnes pratiques pour réussir votre projet de A à Z.`;
    } else {
      return `Découvrez nos conseils pour ${keyword}. Guide clair, méthodes utiles et bonnes pratiques pour réussir votre projet.`;
    }
  } else {
    // Descriptions orientées conversion
    if (q.includes('prix') || q.includes('tarif') || q.includes('coût')) {
      return `${capitalizedKeyword} ? Mistral Pro Reno vous propose des tarifs clairs et compétitifs. Devis gratuit sous 24h.`;
    } else if (q.includes('entreprise') || q.includes('artisan')) {
      return `${capitalizedKeyword} de confiance. Mistral Pro Reno : qualité, réactivité et transparence. Demandez votre devis gratuit.`;
    } else {
      return `Besoin de ${keyword} ? Mistral Pro Reno vous accompagne avec une solution claire, rapide et professionnelle. Devis gratuit.`;
    }
  }
}

/**
 * Générer une structure H1/H2 pour le contenu
 * @param {string} keyword - Mot-clé
 * @param {string} type - Type de contenu (blog ou service)
 * @returns {Object} - Structure {h1, h2: []}
 */
function generateContentStructure(keyword, type) {
  if (!keyword) return { h1: '', h2: [] };
  
  const capitalizedKeyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);
  const q = keyword.toLowerCase();
  
  if (type === 'blog') {
    // Structure pour articles informationnels
    let h2List;
    
    if (q.includes('comment')) {
      h2List = [
        `Pourquoi ${keyword.replace('comment ', '')}`,
        'Les étapes à suivre',
        'Conseils de professionnels',
        'Erreurs à éviter',
        'Quel budget prévoir'
      ];
    } else if (q.includes('pourquoi')) {
      h2List = [
        'Les avantages principaux',
        'Ce que vous devez savoir',
        'Comment procéder',
        'Conseils pratiques',
        'Conclusion'
      ];
    } else if (q.includes('guide')) {
      h2List = [
        'Introduction',
        'Les fondamentaux',
        'Étapes détaillées',
        'Conseils d\'experts',
        'Points de vigilance'
      ];
    } else {
      h2List = [
        `Pourquoi ${keyword}`,
        `Comment réaliser ${keyword}`,
        'Conseils professionnels',
        'Budget et planning',
        'Conclusion'
      ];
    }
    
    return {
      h1: capitalizedKeyword,
      h2: h2List
    };
    
  } else {
    // Structure pour pages service
    return {
      h1: capitalizedKeyword,
      h2: [
        'Présentation du service',
        `Pourquoi choisir Mistral Pro Reno pour ${keyword}`,
        'Les étapes de votre projet',
        'Nos garanties',
        'Prix et devis gratuit'
      ]
    };
  }
}

/**
 * Générer des suggestions de maillage interne
 * @param {string} keyword - Mot-clé
 * @param {string} type - Type de contenu (blog ou service)
 * @returns {Array} - Liste de liens suggérés [{anchor, target}]
 */
function generateInternalLinkSuggestions(keyword, type) {
  if (!keyword) return [];
  
  const q = keyword.toLowerCase();
  const suggestions = [];
  
  // Pages principales du site Mistral Pro Reno
  const sitePages = {
    services: '/services.html',
    projets: '/projets.html',
    contact: '/cost_calculator.html',
    devis: '/cost_calculator.html',
    accueil: '/index.html',
    urgence: '/degat-des-eaux.html',
    blog: '/blog.html'
  };
  
  // 1. Lien vers page service liée
  if (q.includes('salle de bain') || q.includes('plomberie')) {
    suggestions.push({ anchor: 'nos services de rénovation', target: sitePages.services });
  } else if (q.includes('cuisine')) {
    suggestions.push({ anchor: 'rénovation de cuisine', target: sitePages.services });
  } else if (q.includes('peinture') || q.includes('décoration')) {
    suggestions.push({ anchor: 'travaux de peinture', target: sitePages.services });
  } else if (q.includes('électr')) {
    suggestions.push({ anchor: 'travaux d\'électricité', target: sitePages.services });
  } else if (q.includes('dégât') || q.includes('urgence') || q.includes('fuite')) {
    suggestions.push({ anchor: 'intervention urgente', target: sitePages.urgence });
  } else {
    suggestions.push({ anchor: 'nos services de rénovation', target: sitePages.services });
  }
  
  // 2. Lien vers page informative (projets/réalisations)
  if (type === 'blog') {
    suggestions.push({ anchor: 'voir nos réalisations', target: sitePages.projets });
  } else {
    suggestions.push({ anchor: 'découvrir nos projets', target: sitePages.projets });
  }
  
  // 3. Lien vers page conversion (devis)
  suggestions.push({ anchor: 'demander un devis gratuit', target: sitePages.devis });
  
  return suggestions;
}

/**
 * Déterminer le type de contenu basé sur la requête
 * @param {string} query - Requête SEO
 * @returns {string} - Type de contenu (blog ou service)
 */
function determineContentType(query) {
  const q = query.toLowerCase();
  
  // Requêtes service/métier locale
  const serviceKeywords = [
    'prix', 'tarif', 'coût', 'devis',
    'entreprise', 'société', 'artisan',
    'paris', 'ile-de-france', 'idf',
    'rénovation', 'travaux', 'installation',
    'plombier', 'électricien', 'peintre', 'carreleur'
  ];
  
  // Requêtes informationnelles
  const blogKeywords = [
    'comment', 'pourquoi', 'quand', 'quel',
    'guide', 'conseil', 'astuce', 'idée',
    'tendance', 'inspiration', 'exemple',
    'avantage', 'inconvénient', 'comparatif'
  ];
  
  // Vérifier si c'est une requête informationnelle
  for (const kw of blogKeywords) {
    if (q.includes(kw)) {
      return 'blog';
    }
  }
  
  // Vérifier si c'est une requête service
  for (const kw of serviceKeywords) {
    if (q.includes(kw)) {
      return 'service';
    }
  }
  
  // Par défaut : blog
  return 'blog';
}

/**
 * Générer un titre simple à partir de la requête
 * @param {string} query - Requête SEO
 * @param {string} type - Type de contenu
 * @returns {string}
 */
function generateTitle(query, type) {
  // Capitaliser la première lettre
  const capitalizedQuery = query.charAt(0).toUpperCase() + query.slice(1);
  
  if (type === 'blog') {
    // Titres informationnels
    if (query.toLowerCase().includes('comment')) {
      return capitalizedQuery;
    }
    return `Guide : ${capitalizedQuery}`;
  } else {
    // Titres service
    return capitalizedQuery;
  }
}

/**
 * Générer un titre SEO optimisé
 * @param {string} query - Requête SEO
 * @param {string} type - Type de contenu
 * @returns {string}
 */
function generateSeoTitle(query, type) {
  const q = query.toLowerCase();
  const capitalizedQuery = query.charAt(0).toUpperCase() + query.slice(1);
  
  if (type === 'blog') {
    // Titres SEO pour articles blog
    if (q.includes('comment')) {
      // Déjà une question
      return `${capitalizedQuery} ? Guide complet 2025`;
    } else if (q.includes('pourquoi') || q.includes('quand') || q.includes('quel')) {
      return `${capitalizedQuery} ? Réponses d'experts`;
    } else if (q.includes('guide') || q.includes('conseil')) {
      return `${capitalizedQuery} : nos conseils d'experts`;
    } else {
      return `Guide complet : ${capitalizedQuery} en 2025`;
    }
  } else {
    // Titres SEO pour pages service
    if (q.includes('prix') || q.includes('tarif') || q.includes('coût')) {
      return `${capitalizedQuery} | Devis gratuit — Mistral Pro Reno`;
    } else if (q.includes('entreprise') || q.includes('artisan')) {
      return `${capitalizedQuery} — Devis rapide | Mistral Pro Reno`;
    } else {
      return `${capitalizedQuery} | Mistral Pro Reno Paris`;
    }
  }
}

/**
 * Générer le plan éditorial à partir des opportunités
 * @returns {Promise<{generated: number}>}
 */
async function generateEditorialPlan() {
  // Récupérer les opportunités high et medium
  const opportunities = await dbAll(`
    SELECT * FROM opportunities 
    WHERE priority IN ('high', 'medium') 
    AND status = 'pending'
    ORDER BY 
      CASE priority WHEN 'high' THEN 1 ELSE 2 END
  `);

  let generated = 0;

  for (const opp of opportunities) {
    // Vérifier si un contenu existe déjà pour ce mot-clé
    const existing = await dbGet(
      'SELECT * FROM contents WHERE keyword = ?',
      [opp.target]
    );

    if (existing) {
      continue; // Éviter les doublons
    }

    // Déterminer le type de contenu
    const type = determineContentType(opp.target);
    
    // Générer le titre simple
    const title = generateTitle(opp.target, type);
    
    // Générer le titre SEO optimisé
    const titleSuggested = generateSeoTitle(opp.target, type);
    
    // Générer le slug SEO
    const slugSuggested = generateSeoSlug(opp.target);
    
    // Générer la meta description
    const metaSuggested = generateMetaDescription(opp.target, type);
    
    // Générer la structure H1/H2
    const structureSuggested = generateContentStructure(opp.target, type);
    
    // Générer les suggestions de maillage interne
    const internalLinksSuggested = generateInternalLinkSuggestions(opp.target, type);

    // Créer le contenu avec titre, slug, meta, structure et maillage SEO
    await dbRun(`
      INSERT INTO contents (type, title, keyword, title_suggested, slug_suggested, meta_suggested, structure_suggested, internal_links_suggested, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'idea')
    `, [type, title, opp.target, titleSuggested, slugSuggested, metaSuggested, JSON.stringify(structureSuggested), JSON.stringify(internalLinksSuggested)]);

    generated++;
  }

  return { generated };
}

/**
 * Récupérer le plan éditorial (contenus proposés)
 * @returns {Promise<Array>}
 */
async function getEditorialPlan() {
  return await dbAll(`
    SELECT 
      c.*,
      o.priority as opportunity_priority
    FROM contents c
    LEFT JOIN opportunities o ON o.target = c.keyword
    WHERE c.status = 'idea'
    ORDER BY 
      CASE o.priority 
        WHEN 'high' THEN 1 
        WHEN 'medium' THEN 2 
        ELSE 3 
      END,
      c.created_at DESC
  `);
}

/**
 * Générer le plan éditorial mensuel
 * @returns {Promise<Array>} - Liste des 8 actions mensuelles
 */
async function generateMonthlyPlan() {
  const plan = [];
  
  // 1. Récupérer les contenus à créer (status = idea, priorité haute/moyenne)
  const contentsToCreate = await dbAll(`
    SELECT 
      c.*,
      o.priority as opportunity_priority
    FROM contents c
    LEFT JOIN opportunities o ON o.target = c.keyword
    WHERE c.status = 'idea'
    ORDER BY 
      CASE o.priority 
        WHEN 'high' THEN 1 
        WHEN 'medium' THEN 2 
        ELSE 3 
      END,
      c.created_at DESC
    LIMIT 4
  `);
  
  // Ajouter les contenus à créer
  for (const content of contentsToCreate) {
    plan.push({
      type: 'create_content',
      action_label: '📝 Créer contenu',
      title: content.title_suggested || content.title,
      keyword: content.keyword,
      priority: content.opportunity_priority || 'medium',
      content_type: content.type,
      content_id: content.id
    });
  }
  
  // 2. Récupérer les opportunités d'optimisation (pages existantes)
  // Exclure les opportunités déjà liées à un contenu en création
  const existingKeywords = contentsToCreate.map(c => c.keyword);
  
  const optimizations = await dbAll(`
    SELECT * FROM opportunities 
    WHERE status = 'pending'
    AND priority IN ('high', 'medium')
    ${existingKeywords.length > 0 ? `AND target NOT IN (${existingKeywords.map(() => '?').join(',')})` : ''}
    ORDER BY 
      CASE priority WHEN 'high' THEN 1 ELSE 2 END,
      id DESC
    LIMIT 4
  `, existingKeywords);
  
  // Ajouter les optimisations
  for (const opp of optimizations) {
    plan.push({
      type: 'optimize_page',
      action_label: '⚡ Optimiser page',
      title: `Optimisation : ${opp.target}`,
      keyword: opp.target,
      priority: opp.priority,
      opportunity_id: opp.id
    });
  }
  
  // Compléter si moins de 8 actions
  // Récupérer des opportunités low priority si nécessaire
  if (plan.length < 8) {
    const remaining = 8 - plan.length;
    const usedKeywords = plan.map(p => p.keyword);
    
    const additionalOpps = await dbAll(`
      SELECT * FROM opportunities 
      WHERE status = 'pending'
      AND priority = 'low'
      ${usedKeywords.length > 0 ? `AND target NOT IN (${usedKeywords.map(() => '?').join(',')})` : ''}
      ORDER BY id DESC
      LIMIT ?
    `, [...usedKeywords, remaining]);
    
    for (const opp of additionalOpps) {
      plan.push({
        type: 'optimize_page',
        action_label: '⚡ Optimiser page',
        title: `Optimisation : ${opp.target}`,
        keyword: opp.target,
        priority: opp.priority,
        opportunity_id: opp.id
      });
    }
  }
  
  // Trier par priorité
  const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
  plan.sort((a, b) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3));
  
  return plan;
}

module.exports = {
  generateEditorialPlan,
  getEditorialPlan,
  generateMonthlyPlan,
  determineContentType,
  generateSeoTitle,
  generateSeoSlug,
  generateMetaDescription,
  generateContentStructure,
  generateInternalLinkSuggestions
};
