/**
 * SEO Dashboard - Crawler Service
 */

const cheerio = require('cheerio');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

/**
 * Extraire les liens internes d'une page
 * @param {string} html - Contenu HTML
 * @param {string} baseUrl - URL de base du site
 * @returns {Array<string>} - Liste des URLs internes
 */
function extractInternalLinks(html, baseUrl) {
  const $ = cheerio.load(html);
  const links = new Set();
  const domain = new URL(baseUrl).hostname;

  $('a[href]').each((i, el) => {
    let href = $(el).attr('href');
    
    if (!href) return;
    
    // Ignorer les ancres, mailto, tel, javascript
    if (href.startsWith('#') || href.startsWith('mailto:') || 
        href.startsWith('tel:') || href.startsWith('javascript:')) {
      return;
    }

    // Convertir en URL absolue
    try {
      let url;
      if (href.startsWith('http')) {
        url = new URL(href);
      } else if (href.startsWith('/')) {
        url = new URL(href, baseUrl);
      } else {
        url = new URL(href, baseUrl);
      }

      // Vérifier que c'est le même domaine
      if (url.hostname === domain || url.hostname === 'www.' + domain || 
          'www.' + url.hostname === domain) {
        // Nettoyer l'URL (retirer hash et query)
        const cleanUrl = url.origin + url.pathname;
        
        // Garder uniquement les pages HTML
        if (!cleanUrl.match(/\.(jpg|jpeg|png|gif|webp|svg|pdf|css|js|ico|woff|woff2|ttf|eot)$/i)) {
          links.add(cleanUrl);
        }
      }
    } catch (e) {
      // URL invalide, ignorer
    }
  });

  return Array.from(links);
}

/**
 * Crawler le site et retourner les URLs à auditer
 * @param {string} siteUrl - URL du site
 * @param {number} maxPages - Nombre maximum de pages
 * @returns {Promise<Array<string>>}
 */
async function crawlSite(siteUrl, maxPages = 10) {
  const baseUrl = siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl;
  const toVisit = [baseUrl + '/'];
  const visited = new Set();
  const pages = [];

  while (toVisit.length > 0 && pages.length < maxPages) {
    const url = toVisit.shift();
    
    // Éviter les doublons
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'MistralSEOBot/1.0'
        },
        timeout: 10000
      });

      if (!response.ok) continue;
      
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) continue;

      const html = await response.text();
      pages.push({ url, html });

      // Extraire liens internes (seulement depuis page accueil)
      if (pages.length === 1) {
        const links = extractInternalLinks(html, baseUrl);
        for (const link of links) {
          if (!visited.has(link) && !toVisit.includes(link)) {
            toVisit.push(link);
          }
        }
      }

    } catch (err) {
      console.error(`Crawl error for ${url}:`, err.message);
    }
  }

  return pages;
}

module.exports = {
  extractInternalLinks,
  crawlSite
};
