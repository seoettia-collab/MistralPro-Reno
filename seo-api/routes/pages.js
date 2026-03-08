/**
 * SEO Dashboard - Routes Pages Analysis
 */

const express = require('express');
const router = express.Router();
const { dbGet } = require('../services/db');
const { analyzePagesPerformance, getPageQueries } = require('../services/pages');

// GET /api/pages/analysis - Analyse complète des pages
router.get('/pages/analysis', async (req, res) => {
  try {
    const site = await dbGet('SELECT * FROM sites WHERE id = 1');
    
    if (!site) {
      return res.status(404).json({ status: 'error', message: 'Site not found' });
    }

    const analysis = await analyzePagesPerformance(site.id);

    res.json({ 
      status: 'ok', 
      data: analysis
    });

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/pages/to-optimize - Pages à optimiser uniquement
router.get('/pages/to-optimize', async (req, res) => {
  try {
    const site = await dbGet('SELECT * FROM sites WHERE id = 1');
    
    if (!site) {
      return res.status(404).json({ status: 'error', message: 'Site not found' });
    }

    const analysis = await analyzePagesPerformance(site.id);

    // Combiner et trier toutes les pages à optimiser
    const allToOptimize = [
      ...analysis.pagesToOptimize.lowCtr,
      ...analysis.pagesToOptimize.quickWins
    ];

    // Dédupliquer par URL
    const unique = [];
    const seen = new Set();
    for (const page of allToOptimize) {
      if (!seen.has(page.url)) {
        seen.add(page.url);
        unique.push(page);
      }
    }

    // Trier par priorité
    const sortByPriority = (a, b) => {
      const order = { high: 1, medium: 2, low: 3 };
      return (order[a.priority] || 4) - (order[b.priority] || 4);
    };
    unique.sort(sortByPriority);

    const stats = {
      total: unique.length,
      high: unique.filter(p => p.priority === 'high').length,
      medium: unique.filter(p => p.priority === 'medium').length,
      low: unique.filter(p => p.priority === 'low').length
    };

    res.json({ 
      status: 'ok', 
      data: unique,
      stats
    });

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/pages/:url/queries - Requêtes associées à une page
router.get('/pages/queries', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ status: 'error', message: 'URL parameter required' });
    }

    const site = await dbGet('SELECT * FROM sites WHERE id = 1');
    
    if (!site) {
      return res.status(404).json({ status: 'error', message: 'Site not found' });
    }

    const queries = await getPageQueries(site.id, url);

    res.json({ 
      status: 'ok', 
      data: queries
    });

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
