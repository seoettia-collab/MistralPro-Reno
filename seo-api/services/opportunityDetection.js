/**
 * SEO Dashboard - Opportunities Detection Service
 * Analyse des données GSC pour détecter les opportunités SEO
 */

const { dbAll, dbRun, dbGet } = require('./db');
const { logEvent } = require('./history');

// Configuration des seuils de détection
const DETECTION_CONFIG = {
  // Position pour "quick wins" (mots-clés proches du top 10)
  positionMin: 8,
  positionMax: 20,
  
  // CTR considéré comme faible (en dessous de la moyenne)
  lowCtrThreshold: 0.02, // 2%
  
  // Impressions minimum pour considérer une opportunité
  minImpressions: 50,
  
  // Seuils de priorité
  priority: {
    high: { positionMax: 12, minImpressions: 100 },
    medium: { positionMax: 16, minImpressions: 50 },
    low: { positionMax: 20, minImpressions: 20 }
  }
};

// Types d'opportunités
const OPPORTUNITY_TYPES = {
  QUICK_WIN: 'quick_win',           // Position 8-12, fort potentiel
  LOW_CTR: 'low_ctr',               // CTR faible malgré bonnes impressions
  POSITION_IMPROVEMENT: 'position', // Position 12-20, amélioration possible
  NEW_CONTENT: 'new_content',       // Mot-clé sans page dédiée
  CANNIBALIZATION: 'cannibalization' // Plusieurs pages sur même mot-clé
};

/**
 * Calculer la priorité d'une opportunité
 */
function calculatePriority(position, impressions, ctr) {
  if (position <= 12 && impressions >= 100) return 'high';
  if (position <= 16 && impressions >= 50) return 'medium';
  return 'low';
}

/**
 * Calculer le gain potentiel (estimation clics supplémentaires)
 */
function calculatePotentialGain(position, impressions, currentCtr) {
  // CTR cible basé sur la position visée
  const targetCtrByPosition = {
    1: 0.30,  // 30% CTR position 1
    2: 0.15,  // 15% CTR position 2
    3: 0.10,  // 10% CTR position 3
    5: 0.06,  // 6% CTR position 5
    10: 0.03  // 3% CTR position 10
  };
  
  // Estimer le CTR cible (top 5)
  const targetCtr = 0.06; // 6% si on atteint top 5
  const currentClicks = Math.round(impressions * currentCtr);
  const potentialClicks = Math.round(impressions * targetCtr);
  
  return Math.max(0, potentialClicks - currentClicks);
}

/**
 * Générer une action recommandée
 */
function generateActionRecommended(opportunityType, keyword, position) {
  const actions = {
    [OPPORTUNITY_TYPES.QUICK_WIN]: `Optimiser title/meta pour "${keyword}". Position actuelle ${Math.round(position)}, objectif top 5.`,
    [OPPORTUNITY_TYPES.LOW_CTR]: `Améliorer title et meta description pour "${keyword}" - CTR trop faible.`,
    [OPPORTUNITY_TYPES.POSITION_IMPROVEMENT]: `Enrichir contenu et maillage interne pour "${keyword}".`,
    [OPPORTUNITY_TYPES.NEW_CONTENT]: `Créer une page dédiée pour "${keyword}".`,
    [OPPORTUNITY_TYPES.CANNIBALIZATION]: `Consolider les pages ciblant "${keyword}" pour éviter la cannibalisation.`
  };
  
  return actions[opportunityType] || `Analyser et optimiser pour "${keyword}"`;
}

/**
 * Détecter les opportunités "Quick Win" (position 8-12)
 */
async function detectQuickWins(siteId) {
  const queries = await dbAll(`
    SELECT query, clicks, impressions, ctr, position
    FROM queries 
    WHERE site_id = ? 
      AND position >= 8 
      AND position <= 12
      AND impressions >= ?
    ORDER BY impressions DESC
  `, [siteId, DETECTION_CONFIG.minImpressions]);
  
  return queries.map(q => ({
    keyword: q.query,
    position: q.position,
    impressions: q.impressions,
    clicks: q.clicks,
    ctr: q.ctr,
    opportunity_type: OPPORTUNITY_TYPES.QUICK_WIN,
    priority: 'high',
    potential_gain: calculatePotentialGain(q.position, q.impressions, q.ctr),
    action_recommended: generateActionRecommended(OPPORTUNITY_TYPES.QUICK_WIN, q.query, q.position)
  }));
}

/**
 * Détecter les opportunités à faible CTR
 */
async function detectLowCtr(siteId) {
  const queries = await dbAll(`
    SELECT query, clicks, impressions, ctr, position
    FROM queries 
    WHERE site_id = ? 
      AND ctr < ?
      AND impressions >= ?
      AND position <= 20
    ORDER BY impressions DESC
  `, [siteId, DETECTION_CONFIG.lowCtrThreshold, DETECTION_CONFIG.minImpressions]);
  
  return queries.map(q => ({
    keyword: q.query,
    position: q.position,
    impressions: q.impressions,
    clicks: q.clicks,
    ctr: q.ctr,
    opportunity_type: OPPORTUNITY_TYPES.LOW_CTR,
    priority: calculatePriority(q.position, q.impressions, q.ctr),
    potential_gain: calculatePotentialGain(q.position, q.impressions, q.ctr),
    action_recommended: generateActionRecommended(OPPORTUNITY_TYPES.LOW_CTR, q.query, q.position)
  }));
}

/**
 * Détecter les opportunités d'amélioration de position (12-20)
 */
async function detectPositionImprovement(siteId) {
  const queries = await dbAll(`
    SELECT query, clicks, impressions, ctr, position
    FROM queries 
    WHERE site_id = ? 
      AND position > 12 
      AND position <= 20
      AND impressions >= ?
    ORDER BY impressions DESC
  `, [siteId, DETECTION_CONFIG.minImpressions]);
  
  return queries.map(q => ({
    keyword: q.query,
    position: q.position,
    impressions: q.impressions,
    clicks: q.clicks,
    ctr: q.ctr,
    opportunity_type: OPPORTUNITY_TYPES.POSITION_IMPROVEMENT,
    priority: calculatePriority(q.position, q.impressions, q.ctr),
    potential_gain: calculatePotentialGain(q.position, q.impressions, q.ctr),
    action_recommended: generateActionRecommended(OPPORTUNITY_TYPES.POSITION_IMPROVEMENT, q.query, q.position)
  }));
}

/**
 * Exécuter la détection complète des opportunités
 */
async function runOpportunityDetection(siteId = 1) {
  console.log('Starting opportunity detection for site:', siteId);
  
  const allOpportunities = [];
  
  // Détecter les quick wins
  const quickWins = await detectQuickWins(siteId);
  allOpportunities.push(...quickWins);
  console.log(`Found ${quickWins.length} quick wins`);
  
  // Détecter les faibles CTR
  const lowCtr = await detectLowCtr(siteId);
  // Filtrer pour éviter les doublons avec quick wins
  const uniqueLowCtr = lowCtr.filter(l => 
    !quickWins.some(q => q.keyword === l.keyword)
  );
  allOpportunities.push(...uniqueLowCtr);
  console.log(`Found ${uniqueLowCtr.length} low CTR opportunities`);
  
  // Détecter les améliorations de position
  const positionImprovements = await detectPositionImprovement(siteId);
  // Filtrer pour éviter les doublons
  const uniquePositionImprovements = positionImprovements.filter(p =>
    !allOpportunities.some(o => o.keyword === p.keyword)
  );
  allOpportunities.push(...uniquePositionImprovements);
  console.log(`Found ${uniquePositionImprovements.length} position improvements`);
  
  // Sauvegarder les opportunités en base
  let savedCount = 0;
  for (const opp of allOpportunities) {
    try {
      // Vérifier si l'opportunité existe déjà
      const existing = await dbGet(`
        SELECT id FROM opportunities 
        WHERE keyword = ? AND opportunity_type = ? AND status = 'pending'
      `, [opp.keyword, opp.opportunity_type]);
      
      if (!existing) {
        await dbRun(`
          INSERT INTO opportunities (
            type, keyword, position, impressions, clicks, ctr,
            opportunity_type, priority, status, action_recommended, potential_gain
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
        `, [
          'seo',
          opp.keyword,
          opp.position,
          opp.impressions,
          opp.clicks,
          opp.ctr,
          opp.opportunity_type,
          opp.priority,
          opp.action_recommended,
          opp.potential_gain
        ]);
        savedCount++;
      }
    } catch (err) {
      console.error('Error saving opportunity:', err.message);
    }
  }
  
  // Logger l'événement
  await logEvent('opportunity_detection_completed', {
    site_id: siteId,
    total_detected: allOpportunities.length,
    saved: savedCount,
    quick_wins: quickWins.length,
    low_ctr: uniqueLowCtr.length,
    position_improvements: uniquePositionImprovements.length
  });
  
  console.log(`Opportunity detection complete. Saved ${savedCount} new opportunities.`);
  
  return {
    total: allOpportunities.length,
    saved: savedCount,
    breakdown: {
      quick_wins: quickWins.length,
      low_ctr: uniqueLowCtr.length,
      position_improvements: uniquePositionImprovements.length
    },
    opportunities: allOpportunities
  };
}

/**
 * Récupérer toutes les opportunités
 */
async function getAllOpportunities(filters = {}) {
  let sql = `
    SELECT * FROM opportunities 
    WHERE 1=1
  `;
  const params = [];
  
  if (filters.status) {
    sql += ` AND status = ?`;
    params.push(filters.status);
  }
  
  if (filters.priority) {
    sql += ` AND priority = ?`;
    params.push(filters.priority);
  }
  
  if (filters.opportunity_type) {
    sql += ` AND opportunity_type = ?`;
    params.push(filters.opportunity_type);
  }
  
  sql += ` ORDER BY 
    CASE priority 
      WHEN 'high' THEN 1 
      WHEN 'medium' THEN 2 
      WHEN 'low' THEN 3 
    END,
    potential_gain DESC,
    impressions DESC
  `;
  
  return await dbAll(sql, params);
}

/**
 * Mettre à jour le statut d'une opportunité
 */
async function updateOpportunityStatus(id, status) {
  const validStatuses = ['pending', 'in_progress', 'completed', 'dismissed'];
  if (!validStatuses.includes(status)) {
    throw new Error('Statut invalide');
  }
  
  const result = await dbRun(`
    UPDATE opportunities 
    SET status = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `, [status, id]);
  
  return { changes: result.changes };
}

/**
 * Obtenir les statistiques des opportunités
 */
async function getOpportunityStats() {
  const stats = await dbAll(`
    SELECT 
      opportunity_type,
      priority,
      status,
      COUNT(*) as count,
      SUM(potential_gain) as total_potential_gain
    FROM opportunities
    GROUP BY opportunity_type, priority, status
  `);
  
  const totalPending = await dbGet(`
    SELECT COUNT(*) as count, SUM(potential_gain) as potential
    FROM opportunities WHERE status = 'pending'
  `);
  
  return {
    byType: stats,
    pending: {
      count: totalPending?.count || 0,
      potential_gain: totalPending?.potential || 0
    }
  };
}

module.exports = {
  runOpportunityDetection,
  getAllOpportunities,
  updateOpportunityStatus,
  getOpportunityStats,
  detectQuickWins,
  detectLowCtr,
  detectPositionImprovement,
  OPPORTUNITY_TYPES,
  DETECTION_CONFIG
};
