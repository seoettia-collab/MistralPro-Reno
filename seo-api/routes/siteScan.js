/**
 * SEO Dashboard - Site Scan API
 * Scan complet du site pour analyse SEO de toutes les pages
 * V2.18 - Mars 2026
 */

const express = require('express');
const router = express.Router();
const cheerio = require('cheerio');
const { crawlPage, crawlBatch } = require('../services/crawler');

// URL du site de production
const SITE_URL = 'https://www.mistralpro-reno.fr';

// Liste des pages principales à scanner
const MAIN_PAGES = [
  { path: '/', name: 'Accueil', priority: 'high' },
  { path: '/services.html', name: 'Services', priority: 'high' },
  { path: '/projets.html', name: 'Projets', priority: 'high' },
  { path: '/cost_calculator.html', name: 'Simulateur Devis', priority: 'high' },
  { path: '/degat-des-eaux.html', name: 'Dégât des Eaux', priority: 'medium' },
  { path: '/blog.html', name: 'Blog', priority: 'medium' },
  { path: '/mentions-legales.html', name: 'Mentions Légales', priority: 'low' }
];

/**
 * Analyse SEO d'une page HTML
 */
function analyzePage(html, url, pageName, priority) {
  const $ = cheerio.load(html);
  
  // Title
  const title = $('title').text().trim();
  const titleLength = title.length;
  const titleStatus = titleLength === 0 ? 'missing' : titleLength > 65 ? 'too_long' : titleLength < 30 ? 'too_short' : 'ok';
  
  // Meta description
  const metaDesc = $('meta[name="description"]').attr('content') || '';
  const metaLength = metaDesc.length;
  const metaStatus = metaLength === 0 ? 'missing' : metaLength > 160 ? 'too_long' : metaLength < 70 ? 'too_short' : 'ok';
  
  // H1
  const h1List = [];
  $('h1').each((i, el) => h1List.push($(el).text().trim()));
  const h1Status = h1List.length === 0 ? 'missing' : h1List.length > 1 ? 'multiple' : 'ok';
  
  // H2
  const h2List = [];
  $('h2').each((i, el) => h2List.push($(el).text().trim()));
  
  // Images
  const images = [];
  let imagesWithoutAlt = 0;
  let imagesLargeSize = 0;
  
  $('img').each((i, el) => {
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt') || '';
    const loading = $(el).attr('loading') || '';
    
    if (!alt || alt.trim() === '') {
      imagesWithoutAlt++;
    }
    
    // Vérifier si l'image est en WebP
    const isWebP = src.toLowerCase().endsWith('.webp');
    
    images.push({
      src: src.substring(0, 100), // Limiter la longueur
      alt: alt.substring(0, 50),
      hasAlt: !!alt && alt.trim() !== '',
      isWebP,
      hasLazyLoading: loading === 'lazy'
    });
  });
  
  // Canonical
  const canonical = $('link[rel="canonical"]').attr('href') || '';
  
  // Open Graph
  const ogTitle = $('meta[property="og:title"]').attr('content') || '';
  const ogDescription = $('meta[property="og:description"]').attr('content') || '';
  const ogImage = $('meta[property="og:image"]').attr('content') || '';
  
  // Schema.org
  let hasSchemaOrg = false;
  $('script[type="application/ld+json"]').each((i, el) => {
    hasSchemaOrg = true;
  });
  
  // Liens internes et externes
  let internalLinks = 0;
  let externalLinks = 0;
  $('a[href]').each((i, el) => {
    const href = $(el).attr('href') || '';
    if (href.startsWith('http') && !href.includes('mistralpro-reno.fr')) {
      externalLinks++;
    } else if (href.startsWith('/') || href.includes('mistralpro-reno.fr')) {
      internalLinks++;
    }
  });
  
  // Calculer le score SEO de la page
  let score = 100;
  const issues = [];
  
  // Title (25 points)
  if (titleStatus === 'missing') {
    score -= 25;
    issues.push({ type: 'critical', message: 'Title manquant' });
  } else if (titleStatus === 'too_long') {
    score -= 10;
    issues.push({ type: 'warning', message: `Title trop long (${titleLength} car.)` });
  } else if (titleStatus === 'too_short') {
    score -= 5;
    issues.push({ type: 'info', message: `Title court (${titleLength} car.)` });
  }
  
  // Meta description (20 points)
  if (metaStatus === 'missing') {
    score -= 20;
    issues.push({ type: 'critical', message: 'Meta description manquante' });
  } else if (metaStatus === 'too_long') {
    score -= 8;
    issues.push({ type: 'warning', message: `Meta description trop longue (${metaLength} car.)` });
  } else if (metaStatus === 'too_short') {
    score -= 5;
    issues.push({ type: 'info', message: `Meta description courte (${metaLength} car.)` });
  }
  
  // H1 (20 points)
  if (h1Status === 'missing') {
    score -= 20;
    issues.push({ type: 'critical', message: 'H1 manquant' });
  } else if (h1Status === 'multiple') {
    score -= 10;
    issues.push({ type: 'warning', message: `${h1List.length} H1 détectés (1 seul recommandé)` });
  }
  
  // Images alt (15 points)
  if (imagesWithoutAlt > 0) {
    const penalty = Math.min(15, imagesWithoutAlt * 3);
    score -= penalty;
    issues.push({ type: 'warning', message: `${imagesWithoutAlt} image(s) sans attribut alt` });
  }
  
  // Canonical (5 points)
  if (!canonical) {
    score -= 5;
    issues.push({ type: 'info', message: 'URL canonique manquante' });
  }
  
  // Open Graph (5 points)
  if (!ogTitle || !ogDescription) {
    score -= 5;
    issues.push({ type: 'info', message: 'Balises Open Graph incomplètes' });
  }
  
  // Schema.org (5 points)
  if (!hasSchemaOrg) {
    score -= 5;
    issues.push({ type: 'info', message: 'Données structurées Schema.org absentes' });
  }
  
  // Liens internes (5 points)
  if (internalLinks < 3) {
    score -= 5;
    issues.push({ type: 'info', message: `Peu de liens internes (${internalLinks})` });
  }
  
  return {
    url,
    name: pageName,
    priority,
    score: Math.max(0, score),
    title: {
      value: title.substring(0, 70),
      length: titleLength,
      status: titleStatus
    },
    metaDescription: {
      value: metaDesc.substring(0, 170),
      length: metaLength,
      status: metaStatus
    },
    h1: {
      values: h1List.slice(0, 3),
      count: h1List.length,
      status: h1Status
    },
    h2: {
      values: h2List.slice(0, 5),
      count: h2List.length
    },
    images: {
      total: images.length,
      withoutAlt: imagesWithoutAlt,
      webpCount: images.filter(i => i.isWebP).length,
      lazyLoadCount: images.filter(i => i.hasLazyLoading).length
    },
    links: {
      internal: internalLinks,
      external: externalLinks
    },
    seo: {
      canonical: !!canonical,
      ogComplete: !!(ogTitle && ogDescription && ogImage),
      hasSchemaOrg
    },
    issues
  };
}

/**
 * GET /api/site-scan
 * Scan complet de toutes les pages du site
 */
router.get('/', async (req, res) => {
  try {
    console.log('[Site Scan] Démarrage du scan...');
    const startTime = Date.now();
    
    // Construire les URLs à scanner
    const urls = MAIN_PAGES.map(p => ({
      url: SITE_URL + p.path,
      name: p.name,
      priority: p.priority
    }));
    
    // Scanner les pages principales
    const results = [];
    let totalScore = 0;
    let criticalIssues = 0;
    let warningIssues = 0;
    
    for (const page of urls) {
      try {
        const crawlResult = await crawlPage(page.url);
        
        if (crawlResult.error) {
          results.push({
            url: page.url,
            name: page.name,
            priority: page.priority,
            error: crawlResult.error,
            score: 0,
            issues: [{ type: 'critical', message: `Page inaccessible: ${crawlResult.error}` }]
          });
          criticalIssues++;
        } else {
          const analysis = analyzePage(crawlResult.html, page.url, page.name, page.priority);
          results.push(analysis);
          totalScore += analysis.score;
          
          // Compter les issues
          analysis.issues.forEach(issue => {
            if (issue.type === 'critical') criticalIssues++;
            else if (issue.type === 'warning') warningIssues++;
          });
        }
      } catch (err) {
        console.error(`[Site Scan] Erreur sur ${page.url}:`, err.message);
        results.push({
          url: page.url,
          name: page.name,
          priority: page.priority,
          error: err.message,
          score: 0,
          issues: [{ type: 'critical', message: `Erreur: ${err.message}` }]
        });
        criticalIssues++;
      }
    }
    
    // Scanner les articles de blog
    const blogResult = await crawlPage(SITE_URL + '/blog.html');
    const blogArticles = [];
    
    if (!blogResult.error && blogResult.html) {
      const $ = cheerio.load(blogResult.html);
      
      // Extraire les liens des articles
      $('a[href*="/blog/"]').each((i, el) => {
        const href = $(el).attr('href');
        if (href && href.endsWith('.html') && !blogArticles.includes(href)) {
          blogArticles.push(href.startsWith('http') ? href : SITE_URL + href);
        }
      });
      
      // Scanner les 5 premiers articles
      const articlesToScan = blogArticles.slice(0, 5);
      for (const articleUrl of articlesToScan) {
        try {
          const articleResult = await crawlPage(articleUrl);
          if (!articleResult.error) {
            const articleName = articleUrl.split('/').pop().replace('.html', '').replace(/-/g, ' ');
            const analysis = analyzePage(articleResult.html, articleUrl, `Blog: ${articleName}`, 'medium');
            results.push(analysis);
            totalScore += analysis.score;
            
            analysis.issues.forEach(issue => {
              if (issue.type === 'critical') criticalIssues++;
              else if (issue.type === 'warning') warningIssues++;
            });
          }
        } catch (err) {
          console.error(`[Site Scan] Erreur article ${articleUrl}:`, err.message);
        }
      }
    }
    
    const duration = Date.now() - startTime;
    const avgScore = results.length > 0 ? Math.round(totalScore / results.length) : 0;
    
    console.log(`[Site Scan] Terminé: ${results.length} pages, score moyen ${avgScore}, ${duration}ms`);
    
    res.json({
      success: true,
      data: {
        pages: results,
        summary: {
          totalPages: results.length,
          avgScore,
          criticalIssues,
          warningIssues,
          scanDuration: duration
        },
        scannedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[Site Scan] Erreur:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/site-scan/page?url=...
 * Scanner une page spécifique
 */
router.get('/page', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL requise'
      });
    }
    
    const crawlResult = await crawlPage(url);
    
    if (crawlResult.error) {
      return res.status(400).json({
        success: false,
        error: crawlResult.error
      });
    }
    
    const analysis = analyzePage(crawlResult.html, url, 'Page personnalisée', 'medium');
    
    res.json({
      success: true,
      data: analysis
    });
    
  } catch (error) {
    console.error('[Site Scan] Erreur page:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
