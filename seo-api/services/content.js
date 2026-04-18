/**
 * SEO Dashboard - Content Service
 */

const { dbAll, dbRun, dbGet } = require('./db');
const { logEvent, ACTION_TYPES } = require('./history');

// Transitions autorisées (workflow: idea → draft → ready → deploying → deployed → live)
// Note: 'published' et 'validated' sont des anciens statuts, mappés vers deployed
const VALID_TRANSITIONS = {
  'idea': ['draft'],
  'draft': ['ready', 'idea'],
  'ready': ['deploying', 'deployed', 'draft'],
  'deploying': ['deployed', 'ready'],
  'deployed': ['live', 'ready'],
  'live': ['deployed'],
  // Compatibilité anciens statuts
  'published': ['live', 'ready', 'deployed'],
  'validated': ['deployed', 'draft', 'ready', 'deploying']
};

// Labels des statuts
const STATUS_LABELS = {
  'idea': '💡 Idée',
  'draft': '📝 Brouillon',
  'ready': '✅ Prêt',
  'deploying': '⏳ Déploiement...',
  'deployed': '🚀 Déployé',
  'live': '🟢 En ligne',
  // Compatibilité anciens statuts
  'published': '🚀 Déployé',
  'validated': '✅ Prêt'
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
        WHEN 'validated' THEN 3 
        WHEN 'deployed' THEN 4 
        WHEN 'published' THEN 4 
        WHEN 'live' THEN 5 
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

/**
 * PUBLISHER-IMG-01 : Insérer OU mettre à jour un contenu déjà publié
 * Source : Studio SEO après push GitHub réussi, ou backfill articles existants.
 * Comportement idempotent : si un enregistrement existe déjà pour ce slug,
 * on fait UPDATE ; sinon INSERT.
 *
 * @param {Object} data
 * @param {string} data.slug - slug canonique (sert de clé logique)
 * @param {string} data.title
 * @param {string} [data.keyword]
 * @param {string} [data.type='blog']
 * @param {string} [data.category]
 * @param {string} [data.deployed_url]
 * @param {string} [data.image_url]
 * @param {number} [data.word_count]
 * @param {string} [data.status='live']
 * @returns {Promise<{id:number, action:'insert'|'update'}>}
 */
async function upsertPublishedContent(data) {
  const {
    slug,
    title,
    keyword = null,
    type = 'blog',
    category = null,
    deployed_url = null,
    image_url = null,
    word_count = 0,
    status = 'live'
  } = data;

  if (!slug || !title) {
    throw new Error('slug et title requis');
  }

  console.log('[CONTENTS_UPSERT_START]', { slug, title, status });

  // Chercher un enregistrement existant par slug_suggested
  const existing = await dbGet(
    'SELECT id FROM contents WHERE slug_suggested = ? LIMIT 1',
    [slug]
  );

  const nowIso = new Date().toISOString();
  const isLive = ['live', 'deployed', 'published'].includes(status);
  const liveAt = isLive ? nowIso : null;
  const deployedAt = isLive ? nowIso : null;

  if (existing && existing.id) {
    // UPDATE : ne pas écraser les valeurs non fournies
    await dbRun(
      `UPDATE contents
       SET title = COALESCE(?, title),
           keyword = COALESCE(?, keyword),
           type = COALESCE(?, type),
           category = COALESCE(?, category),
           status = ?,
           deployed_url = COALESCE(?, deployed_url),
           image_url = COALESCE(?, image_url),
           word_count = COALESCE(NULLIF(?, 0), word_count),
           live_at = COALESCE(live_at, ?),
           deployed_at = COALESCE(deployed_at, ?)
       WHERE id = ?`,
      [title, keyword, type, category, status, deployed_url, image_url, word_count, liveAt, deployedAt, existing.id]
    );
    console.log('[CONTENTS_UPDATE_OK]', { id: existing.id, slug });
    return { id: existing.id, action: 'update' };
  }

  // INSERT
  const result = await dbRun(
    `INSERT INTO contents
       (type, title, keyword, status, slug_suggested, category, deployed_url, image_url, word_count, live_at, deployed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [type, title, keyword, status, slug, category, deployed_url, image_url, word_count, liveAt, deployedAt]
  );

  console.log('[CONTENTS_INSERT_OK]', { id: result.lastID, slug });

  try {
    await logEvent(ACTION_TYPES.CONTENT_CREATED, {
      content_id: result.lastID,
      title,
      type,
      keyword,
      source: 'upsertPublishedContent'
    });
  } catch (e) {
    // Log non bloquant
  }

  return { id: result.lastID, action: 'insert' };
}

/**
 * PUBLISHER-IMG-01 : backfill idempotent des articles déjà en ligne.
 * Source : liste explicite fournie par l'appelant (route backfill).
 *
 * @param {Array<Object>} articles - chaque objet doit contenir au moins
 *   { slug, title, keyword, category, deployed_url, image_url }
 * @returns {Promise<{inserted:number, updated:number, errors:Array}>}
 */
async function backfillPublishedArticles(articles) {
  const stats = { inserted: 0, updated: 0, errors: [] };

  if (!Array.isArray(articles) || articles.length === 0) {
    return stats;
  }

  for (const a of articles) {
    try {
      const res = await upsertPublishedContent({
        slug: a.slug,
        title: a.title,
        keyword: a.keyword || null,
        type: a.type || 'blog',
        category: a.category || null,
        deployed_url: a.deployed_url || `https://www.mistralpro-reno.fr/blog/${a.slug}.html`,
        image_url: a.image_url || null,
        word_count: a.word_count || 0,
        status: 'live'
      });
      if (res.action === 'insert') stats.inserted++;
      else stats.updated++;
    } catch (e) {
      stats.errors.push({ slug: a.slug, error: e.message });
    }
  }

  console.log('[CONTENTS_BACKFILL_OK]', stats);
  return stats;
}

module.exports = {
  getAllContents,
  getContentById,
  createContent,
  updateContentStatus,
  isValidTransition,
  getNextTransitions,
  upsertPublishedContent,
  backfillPublishedArticles,
  VALID_TRANSITIONS,
  STATUS_LABELS
};
