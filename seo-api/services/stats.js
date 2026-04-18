/**
 * SEO Dashboard - Stats Service
 * AUDIT-COUNT-02 : utilise contentCounter canonique pour contents_published
 */

const { dbGet, dbAll } = require('./db');
const { countLive } = require('./contentCounter');

/**
 * Récupérer les statistiques globales
 * @returns {Promise<Object>}
 */
async function getStats() {
  // Stats Search Console
  const queriesStats = await dbGet(`
    SELECT 
      COUNT(*) as total_queries,
      COALESCE(SUM(clicks), 0) as total_clicks,
      COALESCE(SUM(impressions), 0) as total_impressions,
      COALESCE(AVG(position), 0) as avg_position
    FROM queries
  `);

  // Stats Opportunités
  const oppHigh = await dbGet(`SELECT COUNT(*) as count FROM opportunities WHERE priority = 'high'`);
  const oppMedium = await dbGet(`SELECT COUNT(*) as count FROM opportunities WHERE priority = 'medium'`);
  const oppLow = await dbGet(`SELECT COUNT(*) as count FROM opportunities WHERE priority = 'low'`);

  // Stats Contenus — source canonique AUDIT-COUNT-02
  const contentsTotal = await dbGet(`SELECT COUNT(*) as count FROM contents`);
  const contentsPublished = await countLive();
  console.log('[AUDIT_COUNT_STATUS_NORMALIZED] stats.js', {
    contents_total: contentsTotal.count || 0,
    contents_published: contentsPublished
  });

  return {
    // Search Console
    total_queries: queriesStats.total_queries || 0,
    total_clicks: queriesStats.total_clicks || 0,
    total_impressions: queriesStats.total_impressions || 0,
    avg_position: queriesStats.avg_position ? parseFloat(queriesStats.avg_position.toFixed(1)) : 0,

    // Opportunités
    opportunities_high: oppHigh.count || 0,
    opportunities_medium: oppMedium.count || 0,
    opportunities_low: oppLow.count || 0,

    // Contenus
    contents_total: contentsTotal.count || 0,
    contents_published: contentsPublished
  };
}

module.exports = {
  getStats
};
