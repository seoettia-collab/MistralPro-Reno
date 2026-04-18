/**
 * SEO Dashboard - Content Counter Canonical Service
 * AUDIT-COUNT-02 : source canonique UNIQUE pour tout l'écosystème
 *   (audit IA, alerts, decisionEngine, stats, seoScore, impactAnalysis, cockpit)
 *
 * Règle : un contenu est considéré "publié/live" si sa valeur status appartient
 * à LIVE_STATUSES. Les colonnes live_at / deployed_url confirment la publication.
 *
 * Ne JAMAIS filtrer ailleurs par "WHERE status='published'" seul.
 * Importer et utiliser countLive() / isLive() / LIVE_STATUSES depuis ce module.
 */

const { dbGet, dbAll } = require('./db');

/**
 * Statuts qui comptent comme "publié/live".
 * - 'live'      : statut canonique actuel (PUBLISHER-IMG-01)
 * - 'deployed'  : article déployé en attente de verification HTTP
 * - 'published' : ancien statut conservé pour rétro-compatibilité
 */
const LIVE_STATUSES = ['live', 'deployed', 'published'];

/**
 * Vrai si l'objet content passe la définition canonique "live".
 * @param {Object} content
 * @returns {boolean}
 */
function isLive(content) {
  if (!content) return false;
  return LIVE_STATUSES.includes(content.status);
}

/**
 * Compte les contenus live en DB (source canonique).
 * @returns {Promise<number>}
 */
async function countLive() {
  const placeholders = LIVE_STATUSES.map(() => '?').join(',');
  const row = await dbGet(
    `SELECT COUNT(*) as count FROM contents WHERE status IN (${placeholders})`,
    LIVE_STATUSES
  );
  const count = row && row.count ? row.count : 0;
  console.log('[AUDIT_COUNT_DB_CANONICAL]', { count, statuses: LIVE_STATUSES });
  return count;
}

/**
 * Compte les contenus live ET "en attente" (idea/draft/ready/deploying).
 * @returns {Promise<{live:number, pending:number, total:number}>}
 */
async function countAll() {
  const total = await dbGet('SELECT COUNT(*) as count FROM contents');
  const live = await countLive();
  const pending = Math.max(0, (total?.count || 0) - live);
  return {
    live,
    pending,
    total: total?.count || 0
  };
}

/**
 * Récupère tous les contenus live (source canonique).
 * @returns {Promise<Array>}
 */
async function getAllLive() {
  const placeholders = LIVE_STATUSES.map(() => '?').join(',');
  return await dbAll(
    `SELECT * FROM contents WHERE status IN (${placeholders}) ORDER BY live_at DESC NULLS LAST, created_at DESC`,
    LIVE_STATUSES
  );
}

/**
 * AUDIT-COUNT-02 garde-fou d'intégrité.
 * Croise le compteur DB avec une source terrain (GitHub /api/blog/articles).
 * Si mismatch critique (DB=0 mais terrain>0), retourne une alerte structurée.
 *
 * @param {number} dbCount - compteur canonique DB
 * @param {number} groundCount - compteur source terrain
 * @returns {{ok:boolean, dbCount:number, groundCount:number, alert:string|null, effectiveCount:number}}
 */
function checkIntegrity(dbCount, groundCount) {
  // Cas critique : DB vide mais terrain non vide
  if (dbCount === 0 && groundCount > 0) {
    console.warn('[AUDIT_COUNT_INTEGRITY_ALERT]', {
      severity: 'critical',
      dbCount,
      groundCount,
      reason: 'DB contents vide alors que des articles existent en ligne'
    });
    return {
      ok: false,
      dbCount,
      groundCount,
      alert: 'DB_EMPTY_BUT_GROUND_NONEMPTY',
      effectiveCount: groundCount // fallback sécurité, PAS source canonique
    };
  }

  // Cas warning : écart notable
  if (groundCount > 0 && Math.abs(dbCount - groundCount) >= 2) {
    console.warn('[AUDIT_COUNT_INTEGRITY_ALERT]', {
      severity: 'warning',
      dbCount,
      groundCount,
      reason: 'Écart entre DB et source terrain'
    });
    return {
      ok: false,
      dbCount,
      groundCount,
      alert: 'DB_GROUND_MISMATCH',
      effectiveCount: Math.max(dbCount, groundCount)
    };
  }

  // OK
  return {
    ok: true,
    dbCount,
    groundCount,
    alert: null,
    effectiveCount: dbCount
  };
}

module.exports = {
  LIVE_STATUSES,
  isLive,
  countLive,
  countAll,
  getAllLive,
  checkIntegrity
};
