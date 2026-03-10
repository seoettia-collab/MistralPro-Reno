/**
 * SEO Dashboard - Decision Engine
 * Moteur central de décision IA
 * Agrège les signaux de tous les modules et génère des actions priorisées
 */

const { dbAll, dbGet } = require('./db');

// Types d'actions
const ACTION_TYPES = {
  CREATE_CONTENT: 'create_content',
  OPTIMIZE_PAGE: 'optimize_page',
  PUBLISH_CONTENT: 'publish_content',
  FIX_TECHNICAL: 'fix_technical',
  IMPROVE_CTR: 'improve_ctr',
  IMPROVE_POSITION: 'improve_position',
  ADD_CONVERSION: 'add_conversion',
  BUILD_LINKS: 'build_links'
};

// Labels des actions
const ACTION_LABELS = {
  create_content: '📝 Créer contenu',
  optimize_page: '🔧 Optimiser page',
  publish_content: '🚀 Publier contenu',
  fix_technical: '⚠️ Corriger technique',
  improve_ctr: '📈 Améliorer CTR',
  improve_position: '📊 Améliorer position',
  add_conversion: '🎯 Ajouter CTA',
  build_links: '🔗 Maillage interne'
};

/**
 * Collecter tous les signaux des différents modules
 * @returns {Promise<Object>}
 */
async function collectSignals() {
  const signals = {
    gsc: await collectGSCSignals(),
    opportunities: await collectOpportunitySignals(),
    pages: await collectPageSignals(),
    audit: await collectAuditSignals(),
    impact: await collectImpactSignals(),
    conversions: await collectConversionSignals()
  };

  return signals;
}

/**
 * Signaux GSC (Search Console)
 */
async function collectGSCSignals() {
  const queries = await dbAll(`
    SELECT query, impressions, clicks, position, ctr
    FROM queries
    WHERE impressions > 0
    ORDER BY impressions DESC
    LIMIT 50
  `);

  // Calculer la position moyenne
  const avgPosition = queries.length > 0 
    ? queries.reduce((sum, q) => sum + (q.position || 0), 0) / queries.length 
    : 0;

  return {
    total_queries: queries.length,
    avg_position: avgPosition,
    high_impression_low_ctr: queries.filter(q => q.impressions > 50 && q.ctr < 0.02).length,
    near_top10: queries.filter(q => q.position >= 8 && q.position <= 15).length,
    top_queries: queries.slice(0, 10)
  };
}

/**
 * Signaux Opportunités
 */
async function collectOpportunitySignals() {
  const opportunities = await dbAll(`
    SELECT * FROM opportunities
    WHERE status = 'pending'
    ORDER BY 
      CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
      potential_gain DESC
  `);

  return {
    total_pending: opportunities.length,
    high_priority: opportunities.filter(o => o.priority === 'high').length,
    quick_wins: opportunities.filter(o => o.opportunity_type === 'quick_win').length,
    opportunities: opportunities.slice(0, 10)
  };
}

/**
 * Signaux Pages SEO
 */
async function collectPageSignals() {
  try {
    // Utiliser gsc_pages qui contient les données SEO
    const pages = await dbAll(`
      SELECT page_url as url, clicks, impressions, ctr, position
      FROM gsc_pages
      ORDER BY impressions DESC
      LIMIT 50
    `);

    return {
      total_pages: pages.length,
      missing_meta: 0, // Pas de données meta dans la DB actuelle
      missing_h1: 0,
      thin_content: 0,
      images_no_alt: 0,
      pages: pages
    };
  } catch (err) {
    console.error('collectPageSignals error:', err.message);
    return {
      total_pages: 0,
      missing_meta: 0,
      missing_h1: 0,
      thin_content: 0,
      images_no_alt: 0,
      pages: []
    };
  }
}

/**
 * Signaux Audit Technique
 */
async function collectAuditSignals() {
  try {
    const audits = await dbAll(`
      SELECT * FROM audits
      ORDER BY id DESC
      LIMIT 1
    `);

    if (audits.length === 0) {
      return { has_audit: false, issues: [] };
    }

    const audit = audits[0];
    let issues = [];
    
    try {
      issues = JSON.parse(audit.issues || '[]');
    } catch (e) {
      issues = [];
    }

    return {
      has_audit: true,
      last_audit: audit.date || audit.id,
      critical_issues: issues.filter(i => i.severity === 'critical').length,
      warning_issues: issues.filter(i => i.severity === 'warning').length,
      issues: issues.slice(0, 10)
    };
  } catch (err) {
    console.error('collectAuditSignals error:', err.message);
    return { has_audit: false, issues: [] };
  }
}

/**
 * Signaux Impact SEO
 */
async function collectImpactSignals() {
  // Contenus publiés avec leurs performances
  const publishedContents = await dbAll(`
    SELECT c.id, c.title, c.keyword, c.status, c.meta_suggested,
           q.impressions, q.clicks, q.position, q.ctr
    FROM contents c
    LEFT JOIN queries q ON LOWER(q.query) LIKE '%' || LOWER(c.keyword) || '%'
    WHERE c.status IN ('published', 'live') AND c.keyword IS NOT NULL
    ORDER BY q.impressions DESC
  `);

  // Contenus prêts à publier (status = ready)
  const readyContents = await dbAll(`
    SELECT id, title, keyword, status, meta_suggested, slug_suggested
    FROM contents
    WHERE status = 'ready'
    ORDER BY id DESC
  `);

  return {
    published_count: publishedContents.length,
    with_traffic: publishedContents.filter(c => c.impressions > 0).length,
    low_performers: publishedContents.filter(c => c.impressions > 50 && c.ctr < 0.02),
    high_performers: publishedContents.filter(c => c.position && c.position < 10),
    ready_contents: readyContents,
    ready_count: readyContents.length
  };
}

/**
 * Signaux Conversions
 */
async function collectConversionSignals() {
  try {
    // Table conversions peut ne pas avoir les colonnes attendues
    const conversions = await dbAll(`
      SELECT * FROM conversions
      ORDER BY id DESC
      LIMIT 30
    `);

    return {
      recent_conversions: conversions.length,
      pages_without_cta: 0, // Pas de données CTA dans la DB actuelle
      conversion_rate: 0
    };
  } catch (err) {
    console.error('collectConversionSignals error:', err.message);
    return {
      recent_conversions: 0,
      pages_without_cta: 0,
      conversion_rate: 0
    };
  }
}

/**
 * Évaluer la priorité d'une action
 * @param {Object} action - Action à évaluer
 * @returns {Object} - Score et priorité
 */
function evaluatePriority(action) {
  let score = 0;

  // Impact potentiel (max 40 points)
  if (action.impact_estimated >= 500) score += 40;
  else if (action.impact_estimated >= 200) score += 30;
  else if (action.impact_estimated >= 100) score += 20;
  else if (action.impact_estimated >= 50) score += 10;

  // Effort requis inversé (max 30 points) - moins d'effort = plus de points
  if (action.effort === 'low') score += 30;
  else if (action.effort === 'medium') score += 20;
  else if (action.effort === 'high') score += 10;

  // Urgence (max 30 points)
  if (action.urgency === 'critical') score += 30;
  else if (action.urgency === 'high') score += 20;
  else if (action.urgency === 'medium') score += 10;

  // Déterminer la priorité
  let priority;
  if (score >= 70) priority = 'HIGH';
  else if (score >= 40) priority = 'MEDIUM';
  else priority = 'LOW';

  return { score, priority };
}

/**
 * Générer les actions recommandées à partir des signaux
 * @param {Object} signals - Signaux collectés
 * @returns {Array}
 */
function generateActions(signals) {
  const actions = [];

  // 1. Actions PUBLISH_CONTENT - Contenus prêts à publier (status = ready)
  if (signals.impact.ready_contents && signals.impact.ready_contents.length > 0) {
    for (const content of signals.impact.ready_contents.slice(0, 3)) {
      actions.push({
        action_type: ACTION_TYPES.PUBLISH_CONTENT,
        label: ACTION_LABELS.publish_content,
        target: content.keyword || content.title,
        description: `Publier "${content.title}"`,
        impact_estimated: 30,
        impact_label: 'Publication immédiate',
        effort: 'low',
        urgency: 'high',
        source: 'contents',
        source_id: content.id,
        data: {
          content_id: content.id,
          title: content.title,
          keyword: content.keyword,
          status: content.status
        }
      });
    }
  }

  // 2. Actions OPTIMIZE_PAGE - Contenus prêts mais non optimisés
  if (signals.impact.ready_contents && signals.impact.ready_contents.length > 0) {
    for (const content of signals.impact.ready_contents.slice(0, 2)) {
      if (!content.meta_suggested) {
        actions.push({
          action_type: ACTION_TYPES.OPTIMIZE_PAGE,
          label: ACTION_LABELS.optimize_page,
          target: content.keyword || content.title,
          description: `Optimiser meta de "${content.title}"`,
          impact_estimated: 20,
          impact_label: '+CTR potentiel',
          effort: 'low',
          urgency: 'medium',
          source: 'contents',
          source_id: content.id,
          data: {
            content_id: content.id,
            title: content.title,
            keyword: content.keyword
          }
        });
      }
    }
  }

  // 3. Actions CREATE_CONTENT depuis les opportunités (Quick Wins)
  if (signals.opportunities.opportunities) {
    for (const opp of signals.opportunities.opportunities.slice(0, 3)) {
      const keyword = opp.keyword || opp.target;
      if (!keyword) continue;

      const impactEstimate = Math.round((opp.impressions || 100) * 0.05 * 3);
      
      actions.push({
        action_type: ACTION_TYPES.CREATE_CONTENT,
        label: ACTION_LABELS.create_content,
        target: keyword,
        description: `Créer article ciblant "${keyword}"`,
        impact_estimated: impactEstimate,
        impact_label: `+${impactEstimate} clics/mois`,
        effort: 'medium',
        urgency: opp.priority === 'high' ? 'high' : 'medium',
        source: 'opportunities',
        source_id: opp.id,
        data: {
          keyword,
          current_position: opp.position,
          impressions: opp.impressions,
          opportunity_type: opp.opportunity_type
        }
      });
    }
  }

  // 4. Actions IMPROVE_CTR - CTR faible avec impressions
  if (signals.gsc.top_queries) {
    const lowCTRQueries = signals.gsc.top_queries.filter(q => 
      q.impressions > 50 && q.ctr < 0.02
    );

    for (const query of lowCTRQueries.slice(0, 2)) {
      const impactEstimate = Math.round(query.impressions * 0.03);
      
      actions.push({
        action_type: ACTION_TYPES.IMPROVE_CTR,
        label: ACTION_LABELS.improve_ctr,
        target: query.query,
        description: `Optimiser title/meta pour "${query.query}"`,
        impact_estimated: impactEstimate,
        impact_label: `+${impactEstimate} clics/mois`,
        effort: 'low',
        urgency: query.impressions > 100 ? 'high' : 'medium',
        source: 'gsc',
        data: {
          query: query.query,
          current_ctr: (query.ctr * 100).toFixed(2) + '%',
          impressions: query.impressions,
          position: query.position
        }
      });
    }
  }

  // 5. Actions IMPROVE_POSITION - Position moyenne > 40
  if (signals.gsc.avg_position && signals.gsc.avg_position > 40) {
    const poorPositionQueries = signals.gsc.top_queries?.filter(q => 
      q.position > 40 && q.impressions > 20
    ) || [];

    for (const query of poorPositionQueries.slice(0, 2)) {
      actions.push({
        action_type: ACTION_TYPES.IMPROVE_POSITION,
        label: ACTION_LABELS.improve_position,
        target: query.query,
        description: `Renforcer contenu pour "${query.query}" (pos. ${query.position?.toFixed(0)})`,
        impact_estimated: 15,
        impact_label: 'Visibilité +',
        effort: 'medium',
        urgency: 'medium',
        source: 'gsc',
        data: {
          query: query.query,
          current_position: query.position,
          impressions: query.impressions
        }
      });
    }
  }

  // 6. Actions FIX_TECHNICAL depuis Audit (erreurs critiques)
  if (signals.audit.has_audit && signals.audit.critical_issues > 0) {
    const criticalIssues = signals.audit.issues.filter(i => i.severity === 'critical');
    
    for (const issue of criticalIssues.slice(0, 2)) {
      actions.push({
        action_type: ACTION_TYPES.FIX_TECHNICAL,
        label: ACTION_LABELS.fix_technical,
        target: issue.url || 'Site global',
        description: issue.message || 'Corriger erreur technique',
        impact_estimated: 50,
        impact_label: 'Critique',
        effort: issue.fix_effort || 'medium',
        urgency: 'critical',
        source: 'audit',
        data: {
          issue_type: issue.type,
          severity: issue.severity
        }
      });
    }
  }

  // 7. Actions depuis Impact (contenus sous-performants live)
  if (signals.impact.low_performers && signals.impact.low_performers.length > 0) {
    for (const content of signals.impact.low_performers.slice(0, 2)) {
      const impactEstimate = Math.round((content.impressions || 50) * 0.02);
      
      actions.push({
        action_type: ACTION_TYPES.IMPROVE_CTR,
        label: ACTION_LABELS.improve_ctr,
        target: content.keyword || content.title,
        description: `Améliorer CTR de "${content.title}"`,
        impact_estimated: impactEstimate,
        impact_label: `+${impactEstimate} clics/mois`,
        effort: 'low',
        urgency: 'medium',
        source: 'impact',
        source_id: content.id,
        data: {
          content_id: content.id,
          keyword: content.keyword,
          current_ctr: content.ctr
        }
      });
    }
  }

  // Évaluer et trier les actions par priorité
  const evaluatedActions = actions.map(action => {
    const { score, priority } = evaluatePriority(action);
    return { ...action, score, priority };
  });

  // Trier par score décroissant
  evaluatedActions.sort((a, b) => b.score - a.score);

  return evaluatedActions;
}

/**
 * Point d'entrée principal : générer toutes les actions recommandées
 * @returns {Promise<Object>}
 */
async function getRecommendedActions() {
  // 1. Collecter les signaux
  const signals = await collectSignals();

  // 2. Générer les actions
  const actions = generateActions(signals);

  // 3. Résumé
  const summary = {
    total_actions: actions.length,
    high_priority: actions.filter(a => a.priority === 'HIGH').length,
    medium_priority: actions.filter(a => a.priority === 'MEDIUM').length,
    low_priority: actions.filter(a => a.priority === 'LOW').length,
    total_impact_estimated: actions.reduce((sum, a) => sum + (a.impact_estimated || 0), 0),
    by_type: {
      create_content: actions.filter(a => a.action_type === ACTION_TYPES.CREATE_CONTENT).length,
      optimize_page: actions.filter(a => a.action_type === ACTION_TYPES.OPTIMIZE_PAGE).length,
      fix_technical: actions.filter(a => a.action_type === ACTION_TYPES.FIX_TECHNICAL).length,
      improve_ctr: actions.filter(a => a.action_type === ACTION_TYPES.IMPROVE_CTR).length,
      add_conversion: actions.filter(a => a.action_type === ACTION_TYPES.ADD_CONVERSION).length
    }
  };

  return {
    signals_summary: {
      gsc_queries: signals.gsc.total_queries,
      pending_opportunities: signals.opportunities.total_pending,
      pages_analyzed: signals.pages.total_pages,
      audit_issues: signals.audit.has_audit ? 
        signals.audit.critical_issues + signals.audit.warning_issues : 0,
      published_contents: signals.impact.published_count
    },
    summary,
    actions
  };
}

/**
 * Obtenir les top actions pour le Cockpit
 * @param {number} limit - Nombre max d'actions
 * @returns {Promise<Array>}
 */
async function getTopActions(limit = 5) {
  const result = await getRecommendedActions();
  return result.actions.slice(0, limit);
}

module.exports = {
  collectSignals,
  generateActions,
  evaluatePriority,
  getRecommendedActions,
  getTopActions,
  ACTION_TYPES,
  ACTION_LABELS
};
