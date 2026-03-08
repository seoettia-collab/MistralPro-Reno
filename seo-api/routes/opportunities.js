/**
 * SEO Dashboard - Routes Opportunités
 */

const express = require('express');
const router = express.Router();
const { dbAll, dbGet } = require('../services/db');
const { 
  generateOpportunities, 
  getPagesToOptimize, 
  analyzeOpportunities,
  generateAndSaveOpportunities,
  OPPORTUNITY_TYPES,
  RECOMMENDED_ACTIONS
} = require('../services/opportunities');

// GET /api/opportunities/analyze - Analyser et classifier les opportunités
router.get('/opportunities/analyze', async (req, res) => {
  try {
    // Récupérer site pilote
    const site = await dbGet('SELECT * FROM sites WHERE id = 1');
    
    if (!site) {
      return res.status(404).json({ status: 'error', message: 'Site not found' });
    }

    // Analyser les opportunités
    const analysis = await analyzeOpportunities(site.id);

    // Sauvegarder les opportunités en base
    const saveResult = await generateAndSaveOpportunities(site.id);

    res.json({ 
      status: 'ok', 
      summary: analysis.summary,
      saved: saveResult,
      opportunities: analysis.opportunities
    });

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

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
        CASE o.type
          WHEN 'quick-win' THEN 1
          WHEN 'low-ctr' THEN 2
          WHEN 'content-gap' THEN 3
          ELSE 4
        END,
        q.impressions DESC
    `);

    // Enrichir avec les actions recommandées
    const enriched = opportunities.map(o => ({
      ...o,
      action_recommended: o.action_recommended || RECOMMENDED_ACTIONS[o.type] || 'Analyser cette opportunité',
      ctr_percent: o.ctr ? Math.round(o.ctr * 10000) / 100 : 0,
      position_rounded: o.position ? Math.round(o.position * 10) / 10 : null
    }));

    // Statistiques par type
    const stats = {
      total: enriched.length,
      byType: {
        'quick-win': enriched.filter(o => o.type === 'quick-win').length,
        'low-ctr': enriched.filter(o => o.type === 'low-ctr').length,
        'content-gap': enriched.filter(o => o.type === 'content-gap').length
      },
      byPriority: {
        high: enriched.filter(o => o.priority === 'high').length,
        medium: enriched.filter(o => o.priority === 'medium').length,
        low: enriched.filter(o => o.priority === 'low').length
      }
    };

    res.json({ status: 'ok', data: enriched, stats });

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
