/**
 * SEO Dashboard - Opportunities Service
 * Moteur d'opportunités SEO intelligent
 */

const { dbAll, dbRun, dbGet } = require('./db');

/**
 * Classification des opportunités SEO
 */
const OPPORTUNITY_TYPES = {
  QUICK_WIN: 'quick-win',      // Position 8-20, impressions > 20
  LOW_CTR: 'low-ctr',          // Impressions > 50, CTR < 2%
  CONTENT_GAP: 'content-gap'   // Requête sans page associée
};

/**
 * Actions recommandées par type
 */
const RECOMMENDED_ACTIONS = {
  'quick-win': 'Optimiser le contenu existant pour gagner des positions. Enrichir les balises title/H1 avec le mot-clé.',
  'low-ctr': 'Améliorer le title et la meta description pour augmenter le taux de clic. Ajouter des données structurées.',
  'content-gap': 'Créer une nouvelle page de contenu ciblant cette requête.'
};

/**
 * Analyser les requêtes et classifier les opportunités
 * @param {number} siteId - ID du site
 * @returns {Promise<Object>}
 */
async function analyzeOpportunities(siteId) {
  const queries = await dbAll(`
    SELECT * FROM queries WHERE site_id = ?
  `, [siteId]);

  const opportunities = {
    quickWins: [],
    lowCtr: [],
    contentGaps: []
  };

  for (const q of queries) {
    // Quick Wins : position 8-20, impressions > 20
    if (q.position >= 8 && q.position <= 20 && q.impressions > 20) {
      let priority = 'low';
      if (q.position <= 10) priority = 'high';
      else if (q.position <= 15) priority = 'medium';

      opportunities.quickWins.push({
        type: OPPORTUNITY_TYPES.QUICK_WIN,
        query: q.query,
        impressions: q.impressions,
        clicks: q.clicks,
        position: Math.round(q.position * 10) / 10,
        ctr: Math.round(q.ctr * 10000) / 100,
        priority,
        action: RECOMMENDED_ACTIONS['quick-win'],
        potential: calculatePotential(q, 'quick-win')
      });
    }

    // CTR faible : impressions > 50, CTR < 2%
    if (q.impressions > 50 && q.ctr < 0.02) {
      let priority = 'medium';
      if (q.impressions > 200) priority = 'high';
      else if (q.impressions < 100) priority = 'low';

      opportunities.lowCtr.push({
        type: OPPORTUNITY_TYPES.LOW_CTR,
        query: q.query,
        impressions: q.impressions,
        clicks: q.clicks,
        position: Math.round(q.position * 10) / 10,
        ctr: Math.round(q.ctr * 10000) / 100,
        priority,
        action: RECOMMENDED_ACTIONS['low-ctr'],
        potential: calculatePotential(q, 'low-ctr')
      });
    }

    // Content Gap : requêtes avec beaucoup d'impressions mais position > 20
    // (indique qu'il n'y a pas de page bien positionnée)
    if (q.position > 20 && q.impressions > 30) {
      let priority = 'low';
      if (q.impressions > 100) priority = 'high';
      else if (q.impressions > 50) priority = 'medium';

      opportunities.contentGaps.push({
        type: OPPORTUNITY_TYPES.CONTENT_GAP,
        query: q.query,
        impressions: q.impressions,
        clicks: q.clicks,
        position: Math.round(q.position * 10) / 10,
        ctr: Math.round(q.ctr * 10000) / 100,
        priority,
        action: RECOMMENDED_ACTIONS['content-gap'],
        potential: calculatePotential(q, 'content-gap')
      });
    }
  }

  // Trier par priorité puis par impressions
  const sortByPriority = (a, b) => {
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.impressions - a.impressions;
  };

  opportunities.quickWins.sort(sortByPriority);
  opportunities.lowCtr.sort(sortByPriority);
  opportunities.contentGaps.sort(sortByPriority);

  return {
    summary: {
      total: opportunities.quickWins.length + opportunities.lowCtr.length + opportunities.contentGaps.length,
      quickWins: opportunities.quickWins.length,
      lowCtr: opportunities.lowCtr.length,
      contentGaps: opportunities.contentGaps.length,
      highPriority: [...opportunities.quickWins, ...opportunities.lowCtr, ...opportunities.contentGaps]
        .filter(o => o.priority === 'high').length
    },
    opportunities
  };
}

/**
 * Calculer le potentiel de gain
 * @param {Object} query - Données de la requête
 * @param {string} type - Type d'opportunité
 * @returns {Object}
 */
function calculatePotential(query, type) {
  let targetCtr, targetPosition;
  
  switch (type) {
    case 'quick-win':
      // Si on gagne 5 positions
      targetPosition = Math.max(1, query.position - 5);
      // CTR estimé selon position
      targetCtr = getEstimatedCtr(targetPosition);
      break;
    case 'low-ctr':
      // Si on améliore le CTR à la moyenne de la position
      targetPosition = query.position;
      targetCtr = Math.max(query.ctr * 2, getEstimatedCtr(query.position));
      break;
    case 'content-gap':
      // Si on crée une page en position 10
      targetPosition = 10;
      targetCtr = getEstimatedCtr(10);
      break;
    default:
      targetCtr = 0.03;
      targetPosition = query.position;
  }

  const currentClicks = query.clicks || 0;
  const potentialClicks = Math.round(query.impressions * targetCtr);
  const clickGain = Math.max(0, potentialClicks - currentClicks);

  return {
    currentClicks,
    potentialClicks,
    clickGain,
    targetPosition: Math.round(targetPosition * 10) / 10,
    targetCtr: Math.round(targetCtr * 10000) / 100
  };
}

/**
 * CTR estimé selon la position (basé sur études CTR Google)
 * @param {number} position
 * @returns {number}
 */
function getEstimatedCtr(position) {
  const ctrByPosition = {
    1: 0.28, 2: 0.15, 3: 0.11, 4: 0.08, 5: 0.07,
    6: 0.05, 7: 0.04, 8: 0.03, 9: 0.03, 10: 0.02
  };
  if (position <= 10) {
    return ctrByPosition[Math.ceil(position)] || 0.02;
  }
  return 0.01;
}

/**
 * Générer et sauvegarder les opportunités dans la base
 * @param {number} siteId - ID du site
 * @returns {Promise<{generated: number, updated: number}>}
 */
async function generateAndSaveOpportunities(siteId) {
  const analysis = await analyzeOpportunities(siteId);
  const allOpportunities = [
    ...analysis.opportunities.quickWins,
    ...analysis.opportunities.lowCtr,
    ...analysis.opportunities.contentGaps
  ];

  let generated = 0;
  let updated = 0;

  for (const opp of allOpportunities) {
    // Vérifier si opportunité existe déjà
    const existing = await dbGet(
      "SELECT * FROM opportunities WHERE target = ? AND type = ?",
      [opp.query, opp.type]
    );

    if (existing) {
      // Mettre à jour si la priorité a changé
      if (existing.priority !== opp.priority) {
        await dbRun(
          "UPDATE opportunities SET priority = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          [opp.priority, existing.id]
        );
        updated++;
      }
    } else {
      // Insérer nouvelle opportunité
      await dbRun(`
        INSERT INTO opportunities (type, target, priority, status, action_recommended)
        VALUES (?, ?, ?, 'pending', ?)
      `, [opp.type, opp.query, opp.priority, opp.action]);
      generated++;
    }
  }

  return { generated, updated, total: allOpportunities.length };
}

/**
 * Récupérer les pages à optimiser (ancien format pour compatibilité)
 * @returns {Promise<Array>}
 */
async function getPagesToOptimize() {
  const queries = await dbAll(`
    SELECT * FROM queries 
    WHERE position >= 5 
      AND position <= 20 
      AND impressions > 20 
      AND ctr < 0.03
    ORDER BY 
      CASE 
        WHEN position <= 10 THEN 1 
        WHEN position <= 15 THEN 2 
        ELSE 3 
      END,
      impressions DESC
  `);

  const pages = queries.map(q => {
    let priority;
    if (q.position <= 10) priority = 'high';
    else if (q.position <= 15) priority = 'medium';
    else priority = 'low';

    const potentialCtr = 0.05;
    const potentialClicks = Math.round(q.impressions * potentialCtr);
    const currentClicks = q.clicks || 0;
    const potentialGain = potentialClicks - currentClicks;

    return {
      keyword: q.query,
      position: Math.round(q.position * 10) / 10,
      impressions: q.impressions,
      clicks: currentClicks,
      ctr: Math.round(q.ctr * 10000) / 100,
      priority,
      potential_gain: potentialGain > 0 ? potentialGain : 0
    };
  });

  return pages;
}

/**
 * Ancien generateOpportunities pour compatibilité avec /api/gsc/fetch
 * @param {number} siteId
 * @returns {Promise<{generated: number, skipped: number}>}
 */
async function generateOpportunities(siteId) {
  const result = await generateAndSaveOpportunities(siteId);
  return { generated: result.generated, skipped: result.updated };
}

module.exports = {
  analyzeOpportunities,
  generateOpportunities,
  generateAndSaveOpportunities,
  getPagesToOptimize,
  OPPORTUNITY_TYPES,
  RECOMMENDED_ACTIONS
};
