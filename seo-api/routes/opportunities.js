/**
 * SEO Dashboard - Routes Opportunités
 */

const express = require('express');
const router = express.Router();
const { dbAll, dbGet } = require('../services/db');
const { generateOpportunities, getPagesToOptimize } = require('../services/opportunities');

// POST /api/opportunities/generate
router.post('/opportunities/generate', async (req, res) => {
  try {
    // Récupérer site pilote
    const site = await dbGet('SELECT * FROM sites WHERE id = 1');
    
    if (!site) {
      return res.status(404).json({ status: 'error', message: 'Site not found' });
    }

    const result = await generateOpportunities(site.id);

    res.json({ status: 'ok', generated: result.generated });

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/opportunities/pages-to-optimize
router.get('/opportunities/pages-to-optimize', async (req, res) => {
  try {
    const pages = await getPagesToOptimize();
    
    // Calculer statistiques
    const stats = {
      total: pages.length,
      high: pages.filter(p => p.priority === 'high').length,
      medium: pages.filter(p => p.priority === 'medium').length,
      low: pages.filter(p => p.priority === 'low').length,
      total_potential_gain: pages.reduce((sum, p) => sum + p.potential_gain, 0)
    };

    res.json({ status: 'ok', data: pages, stats });

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/opportunities (avec données queries jointes)
router.get('/opportunities', async (req, res) => {
  try {
    const opportunities = await dbAll(`
      SELECT o.*, q.impressions, q.position, q.clicks, q.ctr
      FROM opportunities o
      LEFT JOIN queries q ON q.query = o.target
      ORDER BY 
        CASE o.priority 
          WHEN 'high' THEN 1 
          WHEN 'medium' THEN 2 
          ELSE 3 
        END,
        q.impressions DESC
    `);

    res.json({ status: 'ok', data: opportunities });

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
