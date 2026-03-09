/**
 * SEO Dashboard - Routes Auto SEO Executor
 */

const express = require('express');
const router = express.Router();
const { dbGet } = require('../services/db');
const { 
  executeSEO, 
  getHighPriorityOpportunities,
  generateSEOContent,
  generatePageHTML
} = require('../services/seoExecutor');

// GET /api/seo/candidates - Récupérer les contenus candidats à l'exécution
router.get('/seo/candidates', async (req, res) => {
  try {
    const candidates = await getHighPriorityOpportunities();
    
    res.json({ 
      status: 'ok', 
      count: candidates.length,
      data: candidates
    });

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST /api/seo/preview/:contentId - Prévisualiser le contenu généré
router.post('/seo/preview/:contentId', async (req, res) => {
  try {
    const { contentId } = req.params;
    
    const content = await dbGet('SELECT * FROM contents WHERE id = ?', [contentId]);
    
    if (!content) {
      return res.status(404).json({ status: 'error', message: 'Contenu non trouvé' });
    }
    
    // Générer le contenu SEO (sans sauvegarder)
    const seoContent = generateSEOContent({
      query: content.keyword,
      contentType: content.type === 'blog' ? 'article' : 'service'
    });
    
    res.json({ 
      status: 'ok', 
      preview: {
        title: seoContent.title,
        metaDescription: seoContent.metaDescription,
        h1: seoContent.h1,
        h2Structure: seoContent.h2Structure,
        slug: seoContent.slug,
        type: seoContent.type,
        wordCount: seoContent.wordCount,
        content: seoContent.content.substring(0, 1000) + '...',
        internalLinks: seoContent.internalLinks
      }
    });

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST /api/seo/execute/:contentId - Exécuter la génération SEO complète
router.post('/seo/execute/:contentId', async (req, res) => {
  try {
    const { contentId } = req.params;
    
    const result = await executeSEO(parseInt(contentId));
    
    // Ne pas renvoyer le HTML complet (trop lourd)
    const { html, ...resultWithoutHtml } = result;
    
    res.json({ 
      status: 'ok', 
      message: 'Contenu SEO généré avec succès',
      result: resultWithoutHtml,
      htmlLength: html.length
    });

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/seo/execute/:contentId/html - Récupérer le HTML généré
router.get('/seo/execute/:contentId/html', async (req, res) => {
  try {
    const { contentId } = req.params;
    
    const content = await dbGet('SELECT * FROM contents WHERE id = ?', [contentId]);
    
    if (!content) {
      return res.status(404).json({ status: 'error', message: 'Contenu non trouvé' });
    }
    
    // Générer le contenu SEO
    const seoContent = generateSEOContent({
      query: content.keyword,
      contentType: content.type === 'blog' ? 'article' : 'service'
    });
    
    // Générer le HTML
    const pageHTML = generatePageHTML(seoContent);
    
    // Renvoyer en tant que HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(pageHTML);

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST /api/seo/execute-all - Exécuter pour tous les contenus prioritaires
router.post('/seo/execute-all', async (req, res) => {
  try {
    const candidates = await getHighPriorityOpportunities();
    
    if (candidates.length === 0) {
      return res.json({ 
        status: 'ok', 
        message: 'Aucun contenu à traiter',
        executed: 0
      });
    }
    
    const results = [];
    const errors = [];
    
    // Limiter à 5 exécutions max par appel
    const toProcess = candidates.slice(0, 5);
    
    for (const content of toProcess) {
      try {
        const result = await executeSEO(content.id);
        results.push({
          id: content.id,
          title: result.title,
          slug: result.slug,
          status: 'success'
        });
      } catch (err) {
        errors.push({
          id: content.id,
          keyword: content.keyword,
          error: err.message
        });
      }
    }
    
    res.json({ 
      status: 'ok', 
      message: `${results.length} contenus traités`,
      executed: results.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
