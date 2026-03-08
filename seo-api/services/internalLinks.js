/**
 * SEO Dashboard - Internal Links Service
 */

const { dbAll, dbRun, dbGet } = require('./db');

/**
 * Analyser le maillage interne
 * @param {number} siteId - ID du site
 * @returns {Promise<Array>}
 */
async function analyzeInternalLinks(siteId) {
  // Récupérer toutes les pages auditées avec leurs liens sortants
  const pages = await dbAll(`
    SELECT 
      p.id,
      p.url,
      p.title,
      a.internal_links as links_out
    FROM pages p
    JOIN audits a ON a.page_id = p.id
    WHERE p.site_id = ?
  `, [siteId]);

  // Construire la map des liens entrants
  const linksIn = {};
  
  // Initialiser à 0 pour toutes les pages
  for (const page of pages) {
    linksIn[page.url] = 0;
  }

  // Pour chaque page, simuler que ses liens sortants pointent vers d'autres pages
  // Note: Dans une implémentation réelle, on parserait les hrefs de chaque page
  // Ici on utilise une heuristique simple basée sur le nombre de liens
  
  // La page d'accueil reçoit généralement des liens de toutes les pages
  if (linksIn['/'] !== undefined) {
    linksIn['/'] = pages.length - 1; // Toutes les pages sauf elle-même
  }

  // Les autres pages reçoivent des liens proportionnellement
  for (const page of pages) {
    if (page.url !== '/') {
      // Heuristique: la page d'accueil lie vers toutes les pages internes
      linksIn[page.url] = 1; // Au minimum depuis la page d'accueil
    }
  }

  // Construire le résultat avec statut
  const results = pages.map(page => {
    const inLinks = linksIn[page.url] || 0;
    const outLinks = page.links_out || 0;
    
    let status;
    if (inLinks === 0) {
      status = 'orphan';
    } else if (inLinks < 2 || outLinks < 3) {
      status = 'warning';
    } else {
      status = 'ok';
    }

    return {
      url: page.url,
      title: page.title,
      internal_links_out: outLinks,
      internal_links_in: inLinks,
      status
    };
  });

  return results;
}

/**
 * Récupérer les statistiques de maillage
 * @param {number} siteId - ID du site
 * @returns {Promise<Object>}
 */
async function getInternalLinksStats(siteId) {
  const links = await analyzeInternalLinks(siteId);
  
  const total = links.length;
  const orphans = links.filter(l => l.status === 'orphan').length;
  const warnings = links.filter(l => l.status === 'warning').length;
  const ok = links.filter(l => l.status === 'ok').length;

  return {
    total,
    orphans,
    warnings,
    ok
  };
}

module.exports = {
  analyzeInternalLinks,
  getInternalLinksStats
};
