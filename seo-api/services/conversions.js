/**
 * SEO Dashboard - Conversions Service
 */

const { dbAll, dbRun, dbGet } = require('./db');

/**
 * Enregistrer une conversion
 * @param {Object} data - Données de conversion
 * @param {string} data.page - Page de conversion
 * @param {string} data.source - Source du trafic
 * @returns {Promise<{id: number}>}
 */
async function trackConversion(data) {
  const { page, source = 'organic' } = data;

  const result = await dbRun(`
    INSERT INTO history (action, target, created_at)
    VALUES (?, ?, datetime('now'))
  `, [
    'seo_conversion',
    JSON.stringify({ page, source })
  ]);

  return { id: result.lastID };
}

/**
 * Récupérer toutes les conversions
 * @param {number} limit - Nombre max de résultats
 * @returns {Promise<Array>}
 */
async function getConversions(limit = 50) {
  const rows = await dbAll(`
    SELECT * FROM history 
    WHERE action = 'seo_conversion'
    ORDER BY created_at DESC
    LIMIT ?
  `, [limit]);

  // Parser les données JSON
  return rows.map(row => {
    let parsed = {};
    try {
      parsed = JSON.parse(row.target);
    } catch (e) {
      parsed = { page: 'unknown', source: 'unknown' };
    }
    return {
      id: row.id,
      type: row.action,
      page: parsed.page,
      source: parsed.source,
      created_at: row.created_at
    };
  });
}

/**
 * Récupérer les statistiques de conversions
 * @returns {Promise<Object>}
 */
async function getConversionStats() {
  const total = await dbGet(`
    SELECT COUNT(*) as count FROM history 
    WHERE action = 'seo_conversion'
  `);

  const today = await dbGet(`
    SELECT COUNT(*) as count FROM history 
    WHERE action = 'seo_conversion'
    AND date(created_at) = date('now')
  `);

  const thisWeek = await dbGet(`
    SELECT COUNT(*) as count FROM history 
    WHERE action = 'seo_conversion'
    AND created_at >= datetime('now', '-7 days')
  `);

  const thisMonth = await dbGet(`
    SELECT COUNT(*) as count FROM history 
    WHERE action = 'seo_conversion'
    AND created_at >= datetime('now', '-30 days')
  `);

  return {
    total: total.count,
    today: today.count,
    this_week: thisWeek.count,
    this_month: thisMonth.count
  };
}

module.exports = {
  trackConversion,
  getConversions,
  getConversionStats
};
