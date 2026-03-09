/**
 * SEO Dashboard - Content Ideas Service
 * Génération automatique d'idées de contenu à partir des données GSC
 */

const { dbAll, dbRun, dbGet } = require('./db');

/**
 * Types de contenu suggérés
 */
const CONTENT_TYPES = {
  ARTICLE: 'article',
  SERVICE_PAGE: 'service',
  FAQ: 'faq',
  GUIDE: 'guide'
};

/**
 * Intentions de recherche
 */
const SEARCH_INTENTS = {
  INFORMATIONAL: 'informationnel',    // Comment, pourquoi, guide
  TRANSACTIONAL: 'transactionnel',    // Prix, devis, acheter
  NAVIGATIONAL: 'navigationnel',      // Marque, nom entreprise
  LOCAL: 'local'                      // Ville, région, près de moi
};

/**
 * Analyser les requêtes et générer des idées de contenu
 * @param {number} siteId - ID du site
 * @returns {Promise<Object>}
 */
async function generateContentIdeas(siteId) {
  // Récupérer toutes les requêtes GSC
  const queries = await dbAll(`
    SELECT q.*, 
           (SELECT COUNT(*) FROM page_queries pq WHERE pq.query = q.query AND pq.site_id = q.site_id) as page_count
    FROM queries q
    WHERE q.site_id = ?
    ORDER BY q.impressions DESC
  `, [siteId]);

  // Récupérer les contenus existants pour éviter les doublons
  const existingContents = await dbAll(`SELECT keyword FROM contents WHERE keyword IS NOT NULL`);
  const existingKeywords = new Set(existingContents.map(c => c.keyword?.toLowerCase()));

  const ideas = {
    contentGaps: [],      // Requêtes sans page associée
    lowPerformers: [],    // Pages mal positionnées à améliorer
    highPotential: []     // Requêtes avec fort potentiel
  };

  for (const query of queries) {
    // Ignorer les requêtes déjà ciblées
    if (existingKeywords.has(query.query.toLowerCase())) {
      continue;
    }

    // Analyser l'intention de recherche
    const intent = detectSearchIntent(query.query);
    
    // Suggérer le type de contenu
    const contentType = suggestContentType(query.query, intent);
    
    // Générer un titre suggéré
    const titleSuggestion = generateTitleSuggestion(query.query, contentType, intent);

    // Calculer la priorité
    const priority = calculatePriority(query);

    const idea = {
      query: query.query,
      impressions: query.impressions,
      clicks: query.clicks,
      position: Math.round(query.position * 10) / 10,
      ctr: Math.round((query.ctr || 0) * 10000) / 100,
      contentType,
      titleSuggestion,
      intent,
      priority,
      hasExistingPage: query.page_count > 0
    };

    // Content Gap : impressions > 10, position > 10 (car peu de données)
    if (query.impressions > 10 && query.position > 10) {
      ideas.contentGaps.push({
        ...idea,
        reason: 'Requête avec impressions mais mal positionnée',
        action: 'Créer un nouveau contenu ciblant cette requête'
      });
    }

    // High Potential : beaucoup d'impressions mais peu de clics
    if (query.impressions > 15 && query.ctr < 0.03) {
      ideas.highPotential.push({
        ...idea,
        reason: 'Fort volume de recherche, CTR à améliorer',
        action: 'Créer ou optimiser le contenu avec un meilleur title/meta'
      });
    }

    // Low Performers : position entre 10-50, potentiel d'amélioration
    if (query.position >= 10 && query.position <= 50 && query.impressions > 5) {
      ideas.lowPerformers.push({
        ...idea,
        reason: 'Position améliorable avec du contenu de qualité',
        action: 'Enrichir le contenu existant ou créer une page dédiée'
      });
    }
  }

  // Trier par priorité
  const sortByPriority = (a, b) => {
    const order = { high: 1, medium: 2, low: 3 };
    if (order[a.priority] !== order[b.priority]) {
      return order[a.priority] - order[b.priority];
    }
    return b.impressions - a.impressions;
  };

  ideas.contentGaps.sort(sortByPriority);
  ideas.lowPerformers.sort(sortByPriority);
  ideas.highPotential.sort(sortByPriority);

  // Dédupliquer entre catégories (garder dans la catégorie la plus pertinente)
  const seenQueries = new Set();
  const dedup = (arr) => {
    return arr.filter(item => {
      if (seenQueries.has(item.query)) return false;
      seenQueries.add(item.query);
      return true;
    });
  };

  ideas.contentGaps = dedup(ideas.contentGaps);
  ideas.highPotential = dedup(ideas.highPotential);
  ideas.lowPerformers = dedup(ideas.lowPerformers);

  return {
    summary: {
      total: ideas.contentGaps.length + ideas.lowPerformers.length + ideas.highPotential.length,
      contentGaps: ideas.contentGaps.length,
      lowPerformers: ideas.lowPerformers.length,
      highPotential: ideas.highPotential.length
    },
    ideas
  };
}

/**
 * Détecter l'intention de recherche
 * @param {string} query
 * @returns {string}
 */
function detectSearchIntent(query) {
  const q = query.toLowerCase();

  // Transactionnel : prix, devis, coût, tarif
  if (/prix|devis|coût|cout|tarif|combien|budget/.test(q)) {
    return SEARCH_INTENTS.TRANSACTIONAL;
  }

  // Local : paris, ile de france, idf, ville
  if (/paris|ile de france|île-de-france|idf|92|93|94|95|78|77|91/.test(q)) {
    return SEARCH_INTENTS.LOCAL;
  }

  // Informationnel : comment, pourquoi, guide, conseils, étapes
  if (/comment|pourquoi|guide|conseil|étape|astuce|tutoriel|quoi|quel/.test(q)) {
    return SEARCH_INTENTS.INFORMATIONAL;
  }

  // Navigationnel : nom de marque
  if (/mistral|pro|reno/.test(q)) {
    return SEARCH_INTENTS.NAVIGATIONAL;
  }

  // Par défaut : informationnel
  return SEARCH_INTENTS.INFORMATIONAL;
}

/**
 * Suggérer le type de contenu
 * @param {string} query
 * @param {string} intent
 * @returns {string}
 */
function suggestContentType(query, intent) {
  const q = query.toLowerCase();

  // FAQ pour les questions
  if (/comment|pourquoi|quoi|quel|est-ce que/.test(q)) {
    return CONTENT_TYPES.FAQ;
  }

  // Guide pour les tutoriels
  if (/guide|étape|tutoriel|conseil/.test(q)) {
    return CONTENT_TYPES.GUIDE;
  }

  // Page service pour les requêtes transactionnelles
  if (intent === SEARCH_INTENTS.TRANSACTIONAL || intent === SEARCH_INTENTS.LOCAL) {
    return CONTENT_TYPES.SERVICE_PAGE;
  }

  // Article par défaut
  return CONTENT_TYPES.ARTICLE;
}

/**
 * Générer un titre suggéré
 * @param {string} query
 * @param {string} contentType
 * @param {string} intent
 * @returns {string}
 */
function generateTitleSuggestion(query, contentType, intent) {
  const q = query.toLowerCase();
  const capitalizedQuery = query.charAt(0).toUpperCase() + query.slice(1);

  switch (contentType) {
    case CONTENT_TYPES.GUIDE:
      return `Guide complet : ${capitalizedQuery}`;
    
    case CONTENT_TYPES.FAQ:
      if (q.startsWith('comment')) {
        return `${capitalizedQuery} : Conseils d'experts`;
      }
      return `${capitalizedQuery} - Tout savoir`;
    
    case CONTENT_TYPES.SERVICE_PAGE:
      if (intent === SEARCH_INTENTS.LOCAL) {
        return `${capitalizedQuery} | Mistral Pro Reno`;
      }
      return `${capitalizedQuery} - Devis gratuit`;
    
    default:
      return `${capitalizedQuery} : Guide et conseils`;
  }
}

/**
 * Calculer la priorité
 * @param {Object} query
 * @returns {string}
 */
function calculatePriority(query) {
  // High : beaucoup d'impressions et position améliorable
  if (query.impressions > 20 && query.position < 40) {
    return 'high';
  }
  
  // Medium : impressions moyennes ou position améliorable
  if (query.impressions > 10 || query.position < 50) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Sauvegarder une idée comme contenu
 * @param {Object} idea
 * @returns {Promise<{id: number}>}
 */
async function saveIdeaAsContent(idea) {
  const result = await dbRun(`
    INSERT INTO contents (type, title, keyword, status, title_suggested, slug_suggested)
    VALUES (?, ?, ?, 'idea', ?, ?)
  `, [
    idea.contentType === 'article' ? 'blog' : idea.contentType,
    idea.titleSuggestion,
    idea.query,
    idea.titleSuggestion,
    generateSlug(idea.titleSuggestion)
  ]);

  return { id: result.lastID };
}

/**
 * Générer un slug à partir d'un titre
 * @param {string} title
 * @returns {string}
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer accents
    .replace(/[^a-z0-9]+/g, '-')     // Remplacer caractères spéciaux
    .replace(/^-|-$/g, '')           // Supprimer tirets début/fin
    .substring(0, 60);               // Limiter la longueur
}

module.exports = {
  generateContentIdeas,
  saveIdeaAsContent,
  detectSearchIntent,
  suggestContentType,
  CONTENT_TYPES,
  SEARCH_INTENTS
};
