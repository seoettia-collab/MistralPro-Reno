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
 * @returns {Promise<Array>}
 */
async function generatePriorityAlerts() {
  const alerts = [];

  // 1. Vérifier le score SEO
  const { calculateSeoScore } = require('./seoScore');
  try {
    const scoreResult = await calculateSeoScore();
    if (scoreResult.global < 40) {
      alerts.push({
        type: PRIORITY_ALERT_TYPES.SEO_SCORE_LOW,
        message: `Score SEO critique : ${scoreResult.global}/100. Action immédiate requise.`,
        priority: 'high',
        icon: '🚨',
        value: scoreResult.global
      });
    } else if (scoreResult.global < 60) {
      alerts.push({
        type: PRIORITY_ALERT_TYPES.SEO_SCORE_LOW,
        message: `Score SEO faible : ${scoreResult.global}/100. Améliorations recommandées.`,
        priority: 'medium',
        icon: '⚠️',
        value: scoreResult.global
      });
    }
  } catch (e) {
    // Score non disponible
  }

  // 2. Vérifier les opportunités haute priorité
  const highOpps = await dbGet(`
    SELECT COUNT(*) as count FROM opportunities 
    WHERE priority = 'high' AND status = 'pending'
  `);
  
  if (highOpps && highOpps.count >= 3) {
    alerts.push({
      type: PRIORITY_ALERT_TYPES.HIGH_OPPORTUNITIES,
      message: `${highOpps.count} opportunités haute priorité non traitées.`,
      priority: 'high',
      icon: '🎯',
      value: highOpps.count
    });
  } else if (highOpps && highOpps.count >= 1) {
    alerts.push({
      type: PRIORITY_ALERT_TYPES.HIGH_OPPORTUNITIES,
      message: `${highOpps.count} opportunité(s) haute priorité à traiter.`,
      priority: 'medium',
      icon: '🎯',
      value: highOpps.count
    });
  }

  // 3. Vérifier les contenus publiés
  const publishedContent = await dbGet(`
    SELECT COUNT(*) as count FROM contents WHERE status = 'published'
  `);
  
  if (!publishedContent || publishedContent.count === 0) {
    // Vérifier s'il y a des contenus en attente
    const totalContents = await dbGet(`SELECT COUNT(*) as count FROM contents`);
    
    if (totalContents && totalContents.count > 0) {
      alerts.push({
        type: PRIORITY_ALERT_TYPES.NO_PUBLISHED_CONTENT,
        message: `Aucun contenu publié. ${totalContents.count} contenu(s) en attente.`,
        priority: 'medium',
        icon: '📝',
        value: 0
      });
    } else {
      alerts.push({
        type: PRIORITY_ALERT_TYPES.NO_PUBLISHED_CONTENT,
        message: `Aucun contenu créé. Commencez par générer le plan éditorial.`,
        priority: 'medium',
        icon: '📝',
        value: 0
      });
    }
  }

  // 4. Vérifier les données Search Console
  const gscData = await dbGet(`SELECT COUNT(*) as count FROM queries`);
  
  if (!gscData || gscData.count === 0) {
    alerts.push({
      type: PRIORITY_ALERT_TYPES.NO_GSC_DATA,
      message: `Aucune donnée Search Console. Importez les données GSC.`,
      priority: 'high',
      icon: '📊',
      value: 0
    });
  }

  // Trier par priorité
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
