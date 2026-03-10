/**
 * SEO Dashboard - Alerts Service
 */

const { dbRun, dbAll, dbGet } = require('./db');

// Types d'alertes prioritaires
const PRIORITY_ALERT_TYPES = {
  SEO_SCORE_LOW: 'seo_score_low',
  HIGH_OPPORTUNITIES: 'high_opportunities',
  NO_PUBLISHED_CONTENT: 'no_published_content',
  NO_GSC_DATA: 'no_gsc_data'
};

/**
 * Générer les alertes prioritaires basées sur l'état du site
 * Alertes automatiques sans stockage en base
 * @returns {Promise<Array>}
 */
async function generatePriorityAlerts() {
  const alerts = [];

  // 1. Vérifier le score SEO (< 50 = alerte)
  const { calculateSeoScore } = require('./seoScore');
  try {
    const scoreResult = await calculateSeoScore();
    const score = scoreResult.score;
    if (score < 30) {
      alerts.push({
        type: 'danger',
        message: `Score SEO critique : ${score}/100`,
        priority: 'high',
        icon: '🔴'
      });
    } else if (score < 50) {
      alerts.push({
        type: 'warning',
        message: `Score SEO faible : ${score}/100`,
        priority: 'medium',
        icon: '🟠'
      });
    }
  } catch (e) {
    // Score non disponible
  }

  // 2. Vérifier le CTR (< 1% avec impressions = alerte)
  const gscStats = await dbGet(`
    SELECT 
      SUM(clicks) as total_clicks,
      SUM(impressions) as total_impressions,
      AVG(position) as avg_position
    FROM queries
  `);
  
  if (gscStats && gscStats.total_impressions > 50) {
    const ctr = (gscStats.total_clicks / gscStats.total_impressions) * 100;
    if (ctr < 1) {
      alerts.push({
        type: 'warning',
        message: `CTR trop faible : ${ctr.toFixed(2)}% (objectif > 2%)`,
        priority: 'high',
        icon: '📉'
      });
    }
  }

  // 3. Vérifier la position moyenne (> 50 = alerte)
  if (gscStats && gscStats.avg_position > 50) {
    alerts.push({
      type: 'warning',
      message: `Position moyenne critique : ${gscStats.avg_position.toFixed(1)} (objectif < 30)`,
      priority: 'medium',
      icon: '📍'
    });
  }

  // 4. Vérifier les contenus publiés (0 = alerte)
  const publishedContent = await dbGet(`
    SELECT COUNT(*) as count FROM contents WHERE status IN ('published', 'live')
  `);
  
  const totalContents = await dbGet(`SELECT COUNT(*) as count FROM contents`);
  
  if (!publishedContent || publishedContent.count === 0) {
    if (totalContents && totalContents.count > 0) {
      alerts.push({
        type: 'warning',
        message: `Aucun contenu publié (${totalContents.count} en attente)`,
        priority: 'high',
        icon: '📝'
      });
    }
  }

  // 5. Vérifier les contenus en attente (> 5 = alerte)
  const readyContents = await dbGet(`
    SELECT COUNT(*) as count FROM contents WHERE status = 'ready'
  `);
  
  if (readyContents && readyContents.count > 5) {
    alerts.push({
      type: 'info',
      message: `${readyContents.count} contenus prêts à publier`,
      priority: 'medium',
      icon: '📋'
    });
  }

  // 6. Vérifier les opportunités haute priorité non traitées
  const highOpps = await dbGet(`
    SELECT COUNT(*) as count FROM opportunities 
    WHERE priority = 'high' AND status = 'pending'
  `);
  
  if (highOpps && highOpps.count >= 1) {
    alerts.push({
      type: 'info',
      message: `${highOpps.count} opportunité(s) haute priorité à traiter`,
      priority: 'medium',
      icon: '🎯'
    });
  }

  // 7. Vérifier les données Search Console
  const gscData = await dbGet(`SELECT COUNT(*) as count FROM queries`);
  
  if (!gscData || gscData.count === 0) {
    alerts.push({
      type: 'danger',
      message: `Aucune donnée Search Console importée`,
      priority: 'high',
      icon: '📊'
    });
  }

  // Trier par priorité (high d'abord)
  const priorityOrder = { 'high': 1, 'medium': 2 };
  alerts.sort((a, b) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3));

  return alerts;
}

/**
 * Générer les alertes SEO
 * @returns {Promise<{generated: number}>}
 */
async function generateAlerts() {
  let generated = 0;

  // Supprimer anciennes alertes non résolues
  await dbRun("DELETE FROM alerts WHERE type IN ('opportunity_high', 'audit_title', 'audit_h1')");

  // 1. Alertes pour opportunités haute priorité
  const highOpportunities = await dbAll(`
    SELECT * FROM opportunities WHERE priority = 'high' AND status = 'pending'
  `);

  for (const opp of highOpportunities) {
    await dbRun(`
      INSERT INTO alerts (type, message, created_at)
      VALUES (?, ?, datetime('now'))
    `, [
      'opportunity_high',
      `🎯 Opportunité haute priorité : "${opp.target}" - Position proche du top 10`
    ]);
    generated++;
  }

  // 2. Alertes pour pages sans title
  const pagesNoTitle = await dbAll(`
    SELECT p.url FROM audits a
    JOIN pages p ON p.id = a.page_id
    WHERE a.has_title = 0
  `);

  for (const page of pagesNoTitle) {
    await dbRun(`
      INSERT INTO alerts (type, message, created_at)
      VALUES (?, ?, datetime('now'))
    `, [
      'audit_title',
      `⚠️ Page sans title : ${page.url}`
    ]);
    generated++;
  }

  // 3. Alertes pour pages sans H1
  const pagesNoH1 = await dbAll(`
    SELECT p.url FROM audits a
    JOIN pages p ON p.id = a.page_id
    WHERE a.has_h1 = 0
  `);

  for (const page of pagesNoH1) {
    await dbRun(`
      INSERT INTO alerts (type, message, created_at)
      VALUES (?, ?, datetime('now'))
    `, [
      'audit_h1',
      `⚠️ Page sans H1 : ${page.url}`
    ]);
    generated++;
  }

  return { generated };
}

/**
 * Récupérer toutes les alertes
 * @returns {Promise<Array>}
 */
async function getAllAlerts() {
  return await dbAll(`
    SELECT * FROM alerts 
    ORDER BY created_at DESC
    LIMIT 20
  `);
}

/**
 * Compter les alertes par type
 * @returns {Promise<Object>}
 */
async function countAlerts() {
  const result = await dbGet(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN type = 'opportunity_high' THEN 1 ELSE 0 END) as opportunities,
      SUM(CASE WHEN type LIKE 'audit_%' THEN 1 ELSE 0 END) as audit
    FROM alerts
  `);
  return result;
}

module.exports = {
  generateAlerts,
  generatePriorityAlerts,
  getAllAlerts,
  countAlerts,
  PRIORITY_ALERT_TYPES
};
