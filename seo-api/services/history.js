/**
 * SEO Dashboard - History Service
 */

const { dbAll, dbRun } = require('./db');

// Types d'actions
const ACTION_TYPES = {
  CONTENT_CREATED: 'content_created',
  CONTENT_STATUS_CHANGED: 'content_status_changed',
  BRIEF_GENERATED: 'brief_generated',
  PUBLICATION_BRIEF_GENERATED: 'publication_brief_generated',
  EDITORIAL_PLAN_GENERATED: 'editorial_plan_generated',
  GSC_IMPORT: 'gsc_import',
  OPPORTUNITIES_GENERATED: 'opportunities_generated'
};

// Labels des actions pour l'affichage
const ACTION_LABELS = {
  'content_created': '📄 Contenu créé',
  'content_status_changed': '🔄 Statut modifié',
  'brief_generated': '📝 Brief généré',
  'publication_brief_generated': '📋 Brief publication',
  'editorial_plan_generated': '📊 Plan éditorial',
  'gsc_import': '📥 Import GSC',
  'opportunities_generated': '🎯 Opportunités'
};

/**
 * Enregistrer un événement dans l'historique
 * @param {string} action - Type d'action
 * @param {Object} data - Données associées
 * @returns {Promise<{id: number}>}
 */
async function logEvent(action, data = {}) {
  const target = JSON.stringify(data);
  
  const result = await dbRun(`
    INSERT INTO history (action, target)
    VALUES (?, ?)
  `, [action, target]);

  return { id: result.lastID };
}

/**
 * Récupérer l'historique récent
 * @param {number} limit - Nombre d'entrées
 * @returns {Promise<Array>}
 */
async function getRecentHistory(limit = 20) {
  const rows = await dbAll(`
    SELECT * FROM history 
    ORDER BY created_at DESC 
    LIMIT ?
  `, [limit]);

  // Parser les données JSON et ajouter les labels
  return rows.map(row => {
    let parsedTarget = {};
    try {
      parsedTarget = JSON.parse(row.target || '{}');
    } catch (e) {
      parsedTarget = { raw: row.target };
    }

    return {
      ...row,
      parsedTarget,
      actionLabel: ACTION_LABELS[row.action] || row.action
    };
  });
}

/**
 * Compter les événements par type
 * @returns {Promise<Object>}
 */
async function countEventsByType() {
  const rows = await dbAll(`
    SELECT action, COUNT(*) as count 
    FROM history 
    GROUP BY action
  `);

  const counts = {};
  for (const row of rows) {
    counts[row.action] = row.count;
  }
  return counts;
}

module.exports = {
  logEvent,
  getRecentHistory,
  countEventsByType,
  ACTION_TYPES,
  ACTION_LABELS
};
