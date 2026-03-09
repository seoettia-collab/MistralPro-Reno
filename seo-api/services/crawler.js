/**
 * SEO Dashboard - Crawler Service
 * Avec gestion robuste des erreurs
 */

const cheerio = require('cheerio');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Configuration
const CRAWLER_CONFIG = {
  timeout: 10000,        // 10 secondes timeout
  maxRetries: 2,         // Nombre de tentatives
  retryDelay: 1000,      // Délai entre tentatives (ms)
  userAgent: 'MistralSEOBot/1.0'
};

/**
 * Fetch avec timeout et retry
 */
async function fetchWithRetry(url, options = {}, retries = CRAWLER_CONFIG.maxRetries) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CRAWLER_CONFIG.timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': CRAWLER_CONFIG.userAgent,
        ...options.headers
      }
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    
    // Si timeout ou erreur réseau, réessayer
    if (retries > 0 && (err.name === 'AbortError' || err.code === 'ECONNRESET')) {
      console.log(`Retry ${url} (${retries} left)`);
      await new Promise(r => setTimeout(r, CRAWLER_CONFIG.retryDelay));
      return fetchWithRetry(url, options, retries - 1);
    }
    
    throw err;
  }
}

/**
 * Extraire les liens internes d'une page
 * @param {string} html - Contenu HTML
 * @param {string} baseUrl - URL de base du site
 * @returns {Array<string>} - Liste des URLs internes
 */
function extractInternalLinks(html, baseUrl) {
  try {
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
  } catch (err) {
    console.error('Error extracting links:', err.message);
    return [];
  }
}

/**
 * Crawler le site et retourner les URLs à auditer
 * @param {string} siteUrl - URL du site
 * @param {number} maxPages - Nombre maximum de pages
 * @returns {Promise<Array<{url: string, html: string, error?: string}>>}
 */
async function crawlSite(siteUrl, maxPages = 10) {
  const baseUrl = siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl;
  const toVisit = [baseUrl + '/'];
  const visited = new Set();
  const pages = [];
  const errors = [];

  while (toVisit.length > 0 && pages.length < maxPages) {
    const url = toVisit.shift();
    
    // Éviter les doublons
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      const response = await fetchWithRetry(url);

      // Gérer les codes d'erreur HTTP
      if (!response.ok) {
        errors.push({
          url,
          status: response.status,
          message: `HTTP ${response.status}`
        });
        console.warn(`Crawl warning: ${url} returned ${response.status}`);
        continue;
      }
      
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        console.log(`Skipping non-HTML: ${url}`);
        continue;
      }

      const html = await response.text();
      pages.push({ url, html, status: response.status });

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
      // Logger l'erreur mais ne pas crasher
      const errorInfo = {
        url,
        message: err.message,
        type: err.name || 'Error'
      };
      errors.push(errorInfo);
      console.error(`Crawl error for ${url}:`, err.message);
    }
  }

  // Log résumé
  console.log(`Crawl complete: ${pages.length} pages, ${errors.length} errors`);
  
  return { pages, errors };
}

module.exports = {
  extractInternalLinks,
  crawlSite,
  fetchWithRetry,
  CRAWLER_CONFIG
};
