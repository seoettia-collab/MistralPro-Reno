/**
 * SEO Dashboard - Competitors Service
 */

const { dbAll, dbRun, dbGet } = require('./db');

const MAX_COMPETITORS = 5;

/**
 * Ajouter un concurrent
 * @param {string} domain - Domaine du concurrent
 * @returns {Promise<{id: number}>}
 */
async function addCompetitor(domain) {
  // Vérifier le nombre de concurrents
  const count = await dbGet('SELECT COUNT(*) as count FROM competitors');
  
  if (count.count >= MAX_COMPETITORS) {
    throw new Error(`Maximum ${MAX_COMPETITORS} concurrents autorisés`);
  }

  // Vérifier si le domaine existe déjà
  const existing = await dbGet('SELECT * FROM competitors WHERE domain = ?', [domain]);
  
  if (existing) {
    throw new Error('Ce concurrent est déjà suivi');
  }

  // Nettoyer le domaine
  const cleanDomain = domain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .toLowerCase();

  const result = await dbRun(`
    INSERT INTO competitors (domain, tracked_since)
    VALUES (?, datetime('now'))
  `, [cleanDomain]);

  return { id: result.lastID };
}

/**
 * Récupérer tous les concurrents
 * @returns {Promise<Array>}
 */
async function getCompetitors() {
  return await dbAll(`
    SELECT * FROM competitors 
    ORDER BY tracked_since DESC
  `);
}

/**
 * Supprimer un concurrent
 * @param {number} id - ID du concurrent
 * @returns {Promise<{deleted: boolean}>}
 */
async function deleteCompetitor(id) {
  const result = await dbRun('DELETE FROM competitors WHERE id = ?', [id]);
  return { deleted: result.changes > 0 };
}

/**
 * Compter les concurrents
 * @returns {Promise<{count: number, max: number}>}
 */
async function countCompetitors() {
  const result = await dbGet('SELECT COUNT(*) as count FROM competitors');
  return {
    count: result.count,
    max: MAX_COMPETITORS
  };
}

module.exports = {
  addCompetitor,
  getCompetitors,
  deleteCompetitor,
  countCompetitors,
  MAX_COMPETITORS
};
