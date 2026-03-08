/**
 * SEO Dashboard - Pages Analysis Service
 * Analyse des performances SEO par page
 */

const { dbAll, dbRun, dbGet } = require('./db');

/**
 * Analyser les pages SEO
 * @param {number} siteId - ID du site
 * @returns {Promise<Object>}
 */
async function analyzePagesPerformance(siteId) {
  // Récupérer toutes les pages GSC
  const pages = await dbAll(`
    SELECT * FROM gsc_pages 
    WHERE site_id = ?
    ORDER BY impressions DESC
  `, [siteId]);

  const analysis = {
    summary: {
      totalPages: pages.length,
      totalClicks: 0,
      totalImpressions: 0,
      avgPosition: 0,
      avgCtr: 0
    },
    pagesToOptimize: {
      lowCtr: [],      // CTR < 3% avec impressions > 20
      quickWins: []    // Position 6-20
    },
    topPages: [],
    allPages: []
  };

  if (pages.length === 0) {
    return analysis;
  }

  // Calcul des totaux
  let totalPosition = 0;
  let totalCtr = 0;

  for (const page of pages) {
    analysis.summary.totalClicks += page.clicks || 0;
    analysis.summary.totalImpressions += page.impressions || 0;
    totalPosition += page.position || 0;
    totalCtr += page.ctr || 0;

    // Extraire le chemin de l'URL pour un affichage plus lisible
    const pagePath = extractPath(page.page_url);
    
    const pageData = {
      url: page.page_url,
      path: pagePath,
      clicks: page.clicks,
      impressions: page.impressions,
      ctr: Math.round((page.ctr || 0) * 10000) / 100, // En pourcentage
      position: Math.round((page.position || 0) * 10) / 10,
      status: getPageStatus(page)
    };

    analysis.allPages.push(pageData);

    // Classification CTR faible
    if (page.impressions > 20 && page.ctr < 0.03) {
      let priority = 'low';
      if (page.impressions > 100) priority = 'high';
      else if (page.impressions > 50) priority = 'medium';

      analysis.pagesToOptimize.lowCtr.push({
        ...pageData,
        priority,
        issue: 'CTR faible',
        action: 'Améliorer le title et la meta description pour augmenter le taux de clic.'
      });
    }

    // Classification Quick Wins (position 6-20)
    if (page.position >= 6 && page.position <= 20 && page.impressions > 10) {
      let priority = 'low';
      if (page.position <= 10) priority = 'high';
      else if (page.position <= 15) priority = 'medium';

      analysis.pagesToOptimize.quickWins.push({
        ...pageData,
        priority,
        issue: 'Position améliorable',
        action: 'Optimiser le contenu et les balises pour gagner des positions.',
        potentialGain: calculatePotentialGain(page)
      });
    }
  }

  // Moyennes
  analysis.summary.avgPosition = Math.round((totalPosition / pages.length) * 10) / 10;
  analysis.summary.avgCtr = Math.round((totalCtr / pages.length) * 10000) / 100;

  // Top pages (triées par clics)
  analysis.topPages = analysis.allPages
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  // Trier les pages à optimiser par priorité
  const sortByPriority = (a, b) => {
    const order = { high: 1, medium: 2, low: 3 };
    return (order[a.priority] || 4) - (order[b.priority] || 4);
  };

  analysis.pagesToOptimize.lowCtr.sort(sortByPriority);
  analysis.pagesToOptimize.quickWins.sort(sortByPriority);

  return analysis;
}

/**
 * Récupérer les requêtes associées à une page
 * @param {number} siteId - ID du site
 * @param {string} pageUrl - URL de la page
 * @returns {Promise<Array>}
 */
async function getPageQueries(siteId, pageUrl) {
  const queries = await dbAll(`
    SELECT * FROM page_queries 
    WHERE site_id = ? AND page_url = ?
    ORDER BY impressions DESC
  `, [siteId, pageUrl]);

  return queries.map(q => ({
    query: q.query,
    clicks: q.clicks,
    impressions: q.impressions,
    ctr: Math.round((q.ctr || 0) * 10000) / 100,
    position: Math.round((q.position || 0) * 10) / 10
  }));
}

/**
 * Extraire le chemin d'une URL
 * @param {string} url
 * @returns {string}
 */
function extractPath(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname || '/';
  } catch {
    return url;
  }
}

/**
 * Déterminer le statut d'une page
 * @param {Object} page
 * @returns {string}
 */
function getPageStatus(page) {
  if (page.position <= 3) return 'excellent';
  if (page.position <= 10) return 'good';
  if (page.position <= 20) return 'improve';
  return 'poor';
}

/**
 * Calculer le gain potentiel de clics
 * @param {Object} page
 * @returns {number}
 */
function calculatePotentialGain(page) {
  // CTR estimé si on gagne 5 positions
  const targetPosition = Math.max(1, page.position - 5);
  const targetCtr = getEstimatedCtr(targetPosition);
  const currentClicks = page.clicks || 0;
  const potentialClicks = Math.round(page.impressions * targetCtr);
  return Math.max(0, potentialClicks - currentClicks);
}

/**
 * CTR estimé selon la position
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

module.exports = {
  analyzePagesPerformance,
  getPageQueries
};
