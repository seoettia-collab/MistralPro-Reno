/**
 * SEO Dashboard - Opportunities Service
 */

const { dbAll, dbRun, dbGet } = require('./db');

/**
 * Récupérer les pages à optimiser
 * Conditions: position 5-20, impressions > 20, CTR < 3%
 * @returns {Promise<Array>}
 */
async function getPagesToOptimize() {
  // Récupérer les queries éligibles
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

  // Transformer en pages à optimiser avec priorité
  const pages = queries.map(q => {
    let priority;
    if (q.position <= 10) {
      priority = 'high';
    } else if (q.position <= 15) {
      priority = 'medium';
    } else {
      priority = 'low';
    }

    // Calculer le potentiel de gain
    // Si on passe de CTR actuel à 5%, combien de clics gagnés ?
    const potentialCtr = 0.05;
    const potentialClicks = Math.round(q.impressions * potentialCtr);
    const currentClicks = q.clicks || 0;
    const potentialGain = potentialClicks - currentClicks;

    return {
      keyword: q.query,
      position: Math.round(q.position * 10) / 10,
      impressions: q.impressions,
      clicks: currentClicks,
      ctr: Math.round(q.ctr * 10000) / 100, // En pourcentage
      priority,
      potential_gain: potentialGain > 0 ? potentialGain : 0
    };
  });

  return pages;
}

/**
 * Générer opportunités SEO à partir des données queries
 * @param {number} siteId - ID du site
 * @returns {Promise<{generated: number, skipped: number}>}
 */
async function generateOpportunities(siteId) {
  // Récupérer requêtes éligibles
  const queries = await dbAll(`
    SELECT * FROM queries 
    WHERE site_id = ? 
      AND position >= 5 
      AND position <= 20 
      AND impressions > 10
    ORDER BY impressions DESC
  `, [siteId]);

  let generated = 0;
  let skipped = 0;

  for (const q of queries) {
    // Vérifier si opportunité existe déjà pour cette query
    const existing = await dbGet(
      "SELECT * FROM opportunities WHERE target = ? AND type = 'quick-win'",
      [q.query]
    );

    if (existing) {
      // Mettre à jour la priorité si elle a changé
      let priority;
      if (q.position <= 10) {
        priority = 'high';
      } else if (q.position <= 15) {
        priority = 'medium';
      } else {
        priority = 'low';
      }

      if (existing.priority !== priority) {
        await dbRun(
          "UPDATE opportunities SET priority = ? WHERE id = ?",
          [priority, existing.id]
        );
      }
      skipped++;
      continue;
    }

    // Déterminer priorité
    let priority;
    if (q.position <= 10) {
      priority = 'high';
    } else if (q.position <= 15) {
      priority = 'medium';
    } else {
      priority = 'low';
    }

    // Insérer opportunité
    await dbRun(`
      INSERT INTO opportunities (type, target, priority, status)
      VALUES (?, ?, ?, 'pending')
    `, ['quick-win', q.query, priority]);

    generated++;
  }

  return { generated, skipped };
}

module.exports = {
  generateOpportunities,
  getPagesToOptimize
};
