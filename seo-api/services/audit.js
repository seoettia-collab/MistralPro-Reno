/**
 * SEO Dashboard - Audit Service
 */

const cheerio = require('cheerio');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { dbRun, dbAll, dbGet } = require('./db');
const { crawlSite } = require('./crawler');

/**
 * Analyser une page HTML et retourner les métriques
 * @param {string} html - Contenu HTML
 * @param {string} siteUrl - URL du site pour calcul liens internes
 * @returns {Object}
 */
function analyzePage(html, siteUrl) {
  const $ = cheerio.load(html);
  
  const title = $('title').text().trim();
  const metaDescription = $('meta[name="description"]').attr('content') || '';
  const h1 = $('h1').first().text().trim();
  
  // Images sans alt
  let imagesWithoutAlt = 0;
  $('img').each((i, el) => {
    const alt = $(el).attr('alt');
    if (!alt || alt.trim() === '') {
      imagesWithoutAlt++;
    }
  });
  
  // Liens internes
  let internalLinks = 0;
  const domain = siteUrl.replace('https://', '').replace('http://', '').replace('www.', '');
  $('a[href]').each((i, el) => {
    const href = $(el).attr('href');
    if (href && (href.startsWith('/') || href.includes(domain))) {
      internalLinks++;
    }
  });

  return {
    title,
    metaDescription,
    h1,
    imagesWithoutAlt,
    internalLinks
  };
}

/**
 * Lancer un audit sur une URL
 * @param {string} siteUrl - URL du site (ex: https://www.mistralpro-reno.fr)
 * @param {number} siteId - ID du site
 * @returns {Promise<{audited: number}>}
 */
async function runAudit(siteUrl, siteId) {
  const pageUrl = siteUrl.endsWith('/') ? siteUrl : siteUrl + '/';
  
  try {
    const response = await fetch(pageUrl);
    const html = await response.text();
    
    const metrics = analyzePage(html, siteUrl);
    
    // Enregistrer dans la base
    await saveAuditResult(siteId, '/', metrics);

    return { audited: 1 };

  } catch (err) {
    console.error('Audit error:', err.message);
    throw err;
  }
}

/**
 * Lancer un crawl multi-pages
 * @param {string} siteUrl - URL du site
 * @param {number} siteId - ID du site
 * @param {number} maxPages - Nombre max de pages
 * @returns {Promise<{audited: number}>}
 */
async function runCrawl(siteUrl, siteId, maxPages = 10) {
  try {
    // Crawler le site
    const pages = await crawlSite(siteUrl, maxPages);
    
    let audited = 0;
    const baseUrl = siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl;

    for (const page of pages) {
      try {
        const metrics = analyzePage(page.html, siteUrl);
        
        // Calculer le path relatif
        const url = new URL(page.url);
        const path = url.pathname || '/';
        
        await saveAuditResult(siteId, path, metrics);
        audited++;
        
      } catch (err) {
        console.error(`Audit error for ${page.url}:`, err.message);
      }
    }

    return { audited };

  } catch (err) {
    console.error('Crawl error:', err.message);
    throw err;
  }
}

/**
 * Enregistrer un résultat d'audit
 * @param {number} siteId - ID du site
 * @param {string} path - Chemin de la page
 * @param {Object} metrics - Métriques analysées
 */
async function saveAuditResult(siteId, path, metrics) {
  // Vérifier si la page existe
  let page = await dbGet('SELECT * FROM pages WHERE site_id = ? AND url = ?', [siteId, path]);
  
  if (!page) {
    const result = await dbRun(`
      INSERT INTO pages (site_id, url, title, last_crawl)
      VALUES (?, ?, ?, datetime('now'))
    `, [siteId, path, metrics.title]);
    page = { id: result.lastID };
  } else {
    await dbRun(`
      UPDATE pages SET title = ?, last_crawl = datetime('now') WHERE id = ?
    `, [metrics.title, page.id]);
  }

  // Supprimer ancien audit
  await dbRun('DELETE FROM audits WHERE page_id = ?', [page.id]);

  // Enregistrer l'audit
  await dbRun(`
    INSERT INTO audits (page_id, has_title, has_meta, has_h1, alt_missing, internal_links)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    page.id,
    metrics.title ? 1 : 0,
    metrics.metaDescription ? 1 : 0,
    metrics.h1 ? 1 : 0,
    metrics.imagesWithoutAlt,
    metrics.internalLinks
  ]);
}

/**
 * Récupérer les résultats d'audit
 * @returns {Promise<Array>}
 */
async function getAuditResults() {
  return await dbAll(`
    SELECT 
      p.url as page_url,
      p.title,
      p.last_crawl,
      a.has_title,
      a.has_meta,
      a.has_h1,
      a.alt_missing,
      a.internal_links
    FROM audits a
    JOIN pages p ON p.id = a.page_id
    ORDER BY p.url ASC
  `);
}

module.exports = {
  runAudit,
  runCrawl,
  getAuditResults
};
