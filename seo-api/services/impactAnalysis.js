/**
 * SEO Dashboard - Impact Analysis Service
 * Mesure l'effet réel des contenus publiés sur les métriques SEO
 * AUDIT-COUNT-02 : utilise contentCounter canonique (LIVE_STATUSES)
 */

const { dbAll, dbRun, dbGet } = require('./db');
const { LIVE_STATUSES, isLive } = require('./contentCounter');

/**
 * Calculer l'impact SEO d'un contenu publié
 * Compare les métriques avant et après publication
 * @param {number} contentId - ID du contenu
 * @returns {Promise<Object>}
 */
async function calculateContentImpact(contentId) {
  // Récupérer le contenu
  const content = await dbGet('SELECT * FROM contents WHERE id = ?', [contentId]);
  
  if (!content) {
    return { error: 'Contenu non trouvé' };
  }
  
  if (!isLive(content)) {
    return { error: 'Contenu non publié', status: content.status };
  }

  const keyword = content.keyword;
  if (!keyword) {
    return { error: 'Pas de mot-clé associé' };
  }

  // Récupérer les données GSC pour ce mot-clé
  const queryData = await dbGet(`
    SELECT * FROM queries 
    WHERE query LIKE ? 
    ORDER BY impressions DESC 
    LIMIT 1
  `, [`%${keyword}%`]);

  // Récupérer l'historique des positions si disponible
  const positionHistory = await dbAll(`
    SELECT date, position, impressions, clicks, ctr
    FROM query_daily
    WHERE query LIKE ?
    ORDER BY date DESC
    LIMIT 30
  `, [`%${keyword}%`]);

  // Calculer les métriques d'impact
  const impact = {
    content_id: contentId,
    keyword: keyword,
    title: content.title,
    published_at: content.created_at,
    current_metrics: null,
    trend: null,
    impact_score: 0
  };

  if (queryData) {
    impact.current_metrics = {
      impressions: queryData.impressions || 0,
      clicks: queryData.clicks || 0,
      position: queryData.position ? Math.round(queryData.position * 10) / 10 : null,
      ctr: queryData.ctr ? Math.round(queryData.ctr * 10000) / 100 : 0
    };

    // Calculer le score d'impact basé sur les métriques
    impact.impact_score = calculateImpactScore(impact.current_metrics);
  }

  if (positionHistory.length >= 2) {
    const recent = positionHistory.slice(0, 7);
    const older = positionHistory.slice(7, 14);

    if (recent.length > 0 && older.length > 0) {
      const avgRecentPos = recent.reduce((sum, r) => sum + (r.position || 0), 0) / recent.length;
      const avgOlderPos = older.reduce((sum, r) => sum + (r.position || 0), 0) / older.length;
      
      const avgRecentImp = recent.reduce((sum, r) => sum + (r.impressions || 0), 0) / recent.length;
      const avgOlderImp = older.reduce((sum, r) => sum + (r.impressions || 0), 0) / older.length;

      impact.trend = {
        position_change: Math.round((avgOlderPos - avgRecentPos) * 10) / 10, // Positif = amélioration
        impressions_change: Math.round(avgRecentImp - avgOlderImp),
        direction: avgRecentPos < avgOlderPos ? 'improving' : avgRecentPos > avgOlderPos ? 'declining' : 'stable'
      };
    }
  }

  return impact;
}

/**
 * Calculer un score d'impact (0-100)
 * @param {Object} metrics - Métriques actuelles
 * @returns {number}
 */
function calculateImpactScore(metrics) {
  if (!metrics) return 0;

  let score = 0;

  // Position (max 40 points) - meilleure position = plus de points
  if (metrics.position) {
    if (metrics.position <= 3) score += 40;
    else if (metrics.position <= 10) score += 30;
    else if (metrics.position <= 20) score += 20;
    else if (metrics.position <= 50) score += 10;
  }

  // Impressions (max 30 points)
  if (metrics.impressions >= 1000) score += 30;
  else if (metrics.impressions >= 500) score += 25;
  else if (metrics.impressions >= 100) score += 20;
  else if (metrics.impressions >= 50) score += 15;
  else if (metrics.impressions >= 10) score += 10;
  else if (metrics.impressions >= 1) score += 5;

  // CTR (max 30 points)
  if (metrics.ctr >= 10) score += 30;
  else if (metrics.ctr >= 5) score += 25;
  else if (metrics.ctr >= 3) score += 20;
  else if (metrics.ctr >= 2) score += 15;
  else if (metrics.ctr >= 1) score += 10;
  else if (metrics.ctr > 0) score += 5;

  return score;
}

/**
 * Analyser l'impact de tous les contenus publiés
 * @returns {Promise<Object>}
 */
async function analyzeAllPublishedContent() {
  // Récupérer tous les contenus publiés (canonique LIVE_STATUSES)
  const placeholders = LIVE_STATUSES.map(() => '?').join(',');
  const publishedContents = await dbAll(`
    SELECT id, title, keyword, type, created_at 
    FROM contents 
    WHERE status IN (${placeholders}) AND keyword IS NOT NULL
    ORDER BY created_at DESC
  `, LIVE_STATUSES);

  const results = {
    total_published: publishedContents.length,
    analyzed: 0,
    with_data: 0,
    average_score: 0,
    contents: []
  };

  let totalScore = 0;

  for (const content of publishedContents) {
    const impact = await calculateContentImpact(content.id);
    
    if (!impact.error) {
      results.analyzed++;
      
      if (impact.current_metrics) {
        results.with_data++;
        totalScore += impact.impact_score;
      }
      
      results.contents.push({
        id: content.id,
        title: content.title,
        keyword: content.keyword,
        type: content.type,
        published_at: content.created_at,
        impact_score: impact.impact_score,
        metrics: impact.current_metrics,
        trend: impact.trend
      });
    }
  }

  // Trier par score d'impact décroissant
  results.contents.sort((a, b) => b.impact_score - a.impact_score);

  // Calculer la moyenne
  if (results.with_data > 0) {
    results.average_score = Math.round(totalScore / results.with_data);
  }

  // Catégoriser les performances
  results.performance_summary = {
    excellent: results.contents.filter(c => c.impact_score >= 70).length,
    good: results.contents.filter(c => c.impact_score >= 40 && c.impact_score < 70).length,
    needs_improvement: results.contents.filter(c => c.impact_score > 0 && c.impact_score < 40).length,
    no_data: results.contents.filter(c => c.impact_score === 0).length
  };

  return results;
}

/**
 * Obtenir un résumé global de l'impact SEO
 * @returns {Promise<Object>}
 */
async function getImpactSummary() {
  // Métriques globales GSC
  const globalMetrics = await dbGet(`
    SELECT 
      SUM(impressions) as total_impressions,
      SUM(clicks) as total_clicks,
      AVG(position) as avg_position,
      COUNT(*) as total_queries
    FROM queries
  `);

  // Évolution récente
  const recentTrend = await dbAll(`
    SELECT date, SUM(impressions) as impressions, SUM(clicks) as clicks, AVG(position) as position
    FROM query_daily
    GROUP BY date
    ORDER BY date DESC
    LIMIT 14
  `);

  // Contenus publiés récemment (canonique LIVE_STATUSES)
  const placeholders2 = LIVE_STATUSES.map(() => '?').join(',');
  const recentPublished = await dbAll(`
    SELECT COUNT(*) as count
    FROM contents
    WHERE status IN (${placeholders2}) AND created_at >= date('now', '-30 days')
  `, LIVE_STATUSES);

  return {
    global: {
      total_impressions: globalMetrics?.total_impressions || 0,
      total_clicks: globalMetrics?.total_clicks || 0,
      avg_position: globalMetrics?.avg_position ? Math.round(globalMetrics.avg_position * 10) / 10 : null,
      total_queries: globalMetrics?.total_queries || 0
    },
    recent_trend: recentTrend,
    recent_publications: recentPublished[0]?.count || 0
  };
}

/**
 * Générer des recommandations basées sur l'analyse d'impact
 * @param {Array} contents - Liste des contenus analysés
 * @returns {Array}
 */
function generateRecommendations(contents) {
  const recommendations = [];

  // Contenus à fort potentiel mais faible CTR
  const lowCTR = contents.filter(c => 
    c.metrics && 
    c.metrics.impressions > 50 && 
    c.metrics.ctr < 2
  );
  
  if (lowCTR.length > 0) {
    recommendations.push({
      type: 'optimize_ctr',
      priority: 'high',
      message: `${lowCTR.length} contenu(s) avec impressions élevées mais CTR faible`,
      action: 'Optimiser les titles et meta descriptions',
      contents: lowCTR.map(c => c.id)
    });
  }

  // Contenus en position 8-20 (Quick Wins)
  const quickWins = contents.filter(c => 
    c.metrics && 
    c.metrics.position >= 8 && 
    c.metrics.position <= 20
  );
  
  if (quickWins.length > 0) {
    recommendations.push({
      type: 'quick_win',
      priority: 'high',
      message: `${quickWins.length} contenu(s) proches du top 10`,
      action: 'Enrichir le contenu pour gagner des positions',
      contents: quickWins.map(c => c.id)
    });
  }

  // Contenus sans données GSC
  const noData = contents.filter(c => !c.metrics || c.impact_score === 0);
  
  if (noData.length > 0) {
    recommendations.push({
      type: 'waiting_indexation',
      priority: 'medium',
      message: `${noData.length} contenu(s) sans données GSC`,
      action: 'Vérifier l\'indexation et attendre les données',
      contents: noData.map(c => c.id)
    });
  }

  return recommendations;
}

module.exports = {
  calculateContentImpact,
  analyzeAllPublishedContent,
  getImpactSummary,
  generateRecommendations,
  calculateImpactScore
};
