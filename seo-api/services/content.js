/**
 * SEO Dashboard - Content Service
 */

const { dbAll, dbRun, dbGet } = require('./db');
const { logEvent, ACTION_TYPES } = require('./history');

// Transitions autorisées
const VALID_TRANSITIONS = {
  'idea': ['draft'],
  'draft': ['ready', 'idea'],
  'ready': ['published', 'draft'],
  'published': ['ready']
};

// Labels des statuts
const STATUS_LABELS = {
  'idea': '💡 Idée',
  'draft': '📝 Brouillon',
  'ready': '✅ Prêt',
  'published': '🚀 Publié'
};

/**
 * Récupérer tous les contenus
 * @returns {Promise<Array>}
 */
async function getAllContents() {
  return await dbAll(`
    SELECT * FROM contents 
    ORDER BY 
      CASE status 
        WHEN 'idea' THEN 1 
        WHEN 'draft' THEN 2 
        WHEN 'ready' THEN 3 
        WHEN 'published' THEN 4 
      END,
      created_at DESC
  `);
}

/**
 * Récupérer un contenu par ID
 * @param {number} id - ID du contenu
 * @returns {Promise<Object>}
 */
async function getContentById(id) {
  return await dbGet('SELECT * FROM contents WHERE id = ?', [id]);
}

/**
 * Créer un nouveau contenu
 * @param {Object} data - Données du contenu
 * @returns {Promise<{id: number}>}
 */
async function createContent(data) {
  const { type, title, keyword } = data;
  
  const result = await dbRun(`
    INSERT INTO contents (type, title, keyword, status)
    VALUES (?, ?, ?, 'idea')
  `, [type, title, keyword]);

  // Logger l'événement
  await logEvent(ACTION_TYPES.CONTENT_CREATED, {
    content_id: result.lastID,
    title,
    type,
    keyword
  });

  return { id: result.lastID };
}

/**
 * Vérifier si une transition de statut est valide
 * @param {string} currentStatus - Statut actuel
 * @param {string} newStatus - Nouveau statut
 * @returns {boolean}
 */
function isValidTransition(currentStatus, newStatus) {
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  return allowed.includes(newStatus);
}

/**
 * Obtenir les prochaines transitions possibles
 * @param {string} currentStatus - Statut actuel
 * @returns {Array}
 */
function getNextTransitions(currentStatus) {
  return VALID_TRANSITIONS[currentStatus] || [];
}

/**
 * Mettre à jour le statut d'un contenu avec validation
 * @param {number} id - ID du contenu
 * @param {string} newStatus - Nouveau statut
 * @returns {Promise<{success: boolean, changes?: number, error?: string}>}
 */
async function updateContentStatus(id, newStatus) {
  // Récupérer le contenu actuel
  const content = await getContentById(id);
  
  if (!content) {
    return { success: false, error: 'Contenu non trouvé' };
  }
  
  // Vérifier la validité de la transition
  if (!isValidTransition(content.status, newStatus)) {
    const allowed = getNextTransitions(content.status);
    return { 
      success: false, 
      error: `Transition invalide: ${content.status} → ${newStatus}. Transitions autorisées: ${allowed.join(', ') || 'aucune'}` 
    };
  }
  
  // Effectuer la mise à jour
  const result = await dbRun(`
    UPDATE contents SET status = ? WHERE id = ?
  `, [newStatus, id]);

  // Logger l'événement
  await logEvent(ACTION_TYPES.CONTENT_STATUS_CHANGED, {
    content_id: id,
    title: content.title,
    old_status: content.status,
    new_status: newStatus
  });

  return { success: true, changes: result.changes };
}

module.exports = {
  getAllContents,
  getContentById,
  createContent,
  updateContentStatus,
  isValidTransition,
  getNextTransitions,
  VALID_TRANSITIONS,
  STATUS_LABELS
};
