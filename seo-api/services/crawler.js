/**
 * SEO Dashboard - Crawler Service
 * Avec gestion robuste des erreurs et optimisation performance
 */

const cheerio = require('cheerio');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Configuration
const CRAWLER_CONFIG = {
  timeout: 10000,        // 10 secondes timeout
  maxRetries: 2,         // Nombre de tentatives
  retryDelay: 1000,      // Délai entre tentatives (ms)
  userAgent: 'MistralSEOBot/1.0',
  concurrency: 3,        // Requêtes parallèles max
  maxDepth: 2            // Profondeur de crawl max
};

// Cache en mémoire pour éviter les requêtes doublons
const crawlCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Vérifier si une URL est en cache et valide
 */
function getCachedResult(url) {
  const cached = crawlCache.get(url);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }
  return null;
}

/**
 * Mettre en cache le résultat d'un crawl
 */
function setCachedResult(url, data) {
  crawlCache.set(url, { data, timestamp: Date.now() });
}

/**
 * Nettoyer le cache expiré
 */
function cleanCache() {
  const now = Date.now();
  for (const [url, cached] of crawlCache.entries()) {
    if (now - cached.timestamp > CACHE_TTL) {
      crawlCache.delete(url);
    }
  }
}

// Nettoyage périodique du cache
setInterval(cleanCache, CACHE_TTL);

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
 * Crawler une seule page avec cache
 */
async function crawlPage(url) {
  // Vérifier le cache
  const cached = getCachedResult(url);
  if (cached) {
    console.log(`Cache hit: ${url}`);
    return { ...cached, fromCache: true };
  }
  
  try {
    const response = await fetchWithRetry(url);

    if (!response.ok) {
      return { url, error: `HTTP ${response.status}`, status: response.status };
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return { url, error: 'Not HTML', status: response.status };
    }

    const html = await response.text();
    const result = { url, html, status: response.status };
    
    // Mettre en cache
    setCachedResult(url, result);
    
    return result;
  } catch (err) {
    return { url, error: err.message, type: err.name || 'Error' };
  }
}

/**
 * Crawler plusieurs URLs en parallèle (contrôlé)
 */
async function crawlBatch(urls, concurrency = CRAWLER_CONFIG.concurrency) {
  const results = [];
  
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(url => crawlPage(url)));
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Crawler le site et retourner les URLs à auditer
 * Version optimisée avec parallélisation et cache
 * @param {string} siteUrl - URL du site
 * @param {number} maxPages - Nombre maximum de pages
 * @returns {Promise<{pages: Array, errors: Array, stats: Object}>}
 */
async function crawlSite(siteUrl, maxPages = 10) {
  const startTime = Date.now();
  const baseUrl = siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl;
  const visited = new Set();
  const pages = [];
  const errors = [];
  let cacheHits = 0;
  let depth = 0;

  // Phase 1: Crawler la page d'accueil
  const homeResult = await crawlPage(baseUrl + '/');
  visited.add(baseUrl + '/');
  
  if (homeResult.error) {
    errors.push(homeResult);
  } else {
    pages.push(homeResult);
    if (homeResult.fromCache) cacheHits++;
  }

  // Phase 2: Extraire les liens et crawler en parallèle
  if (pages.length > 0 && pages[0].html) {
    const links = extractInternalLinks(pages[0].html, baseUrl);
    const toVisit = links.filter(link => !visited.has(link)).slice(0, maxPages - 1);
    
    // Marquer comme visités
    toVisit.forEach(link => visited.add(link));
    
    // Crawler en parallèle par lots
    if (toVisit.length > 0 && depth < CRAWLER_CONFIG.maxDepth) {
      depth++;
      const batchResults = await crawlBatch(toVisit);
      
      for (const result of batchResults) {
        if (result.error) {
          errors.push(result);
        } else {
          pages.push(result);
          if (result.fromCache) cacheHits++;
        }
        
        if (pages.length >= maxPages) break;
      }
    }
  }

  const duration = Date.now() - startTime;
  
  // Log résumé
  console.log(`Crawl complete: ${pages.length} pages, ${errors.length} errors, ${cacheHits} cache hits, ${duration}ms`);
  
  return { 
    pages, 
    errors,
    stats: {
      duration,
      pagesCount: pages.length,
      errorsCount: errors.length,
      cacheHits,
      depth
    }
  };
}

/**
 * Invalider le cache pour une URL ou tout le cache
 */
function invalidateCache(url = null) {
  if (url) {
    crawlCache.delete(url);
  } else {
    crawlCache.clear();
  }
}

module.exports = {
  extractInternalLinks,
  crawlSite,
  crawlPage,
  crawlBatch,
  fetchWithRetry,
  invalidateCache,
  getCachedResult,
  CRAWLER_CONFIG
};
