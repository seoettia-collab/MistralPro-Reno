/**
 * SEO Dashboard - Actions Routes
 * API pour le moteur de décision IA
 */

const express = require('express');
const router = express.Router();
const { 
  getRecommendedActions, 
  getTopActions,
  collectSignals 
} = require('../services/decisionEngine');

// GET /api/actions - Obtenir toutes les actions recommandées
router.get('/actions', async (req, res) => {
  try {
    const result = await getRecommendedActions();
    
    res.json({
      status: 'ok',
      ...result
    });

  } catch (err) {
    console.error('Actions error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/actions/top - Obtenir les top actions pour le Cockpit
router.get('/actions/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const actions = await getTopActions(limit);
    
    res.json({
      status: 'ok',
      count: actions.length,
      actions
    });

  } catch (err) {
    console.error('Top actions error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/actions/signals - Obtenir les signaux bruts (debug)
router.get('/actions/signals', async (req, res) => {
  try {
    const signals = await collectSignals();
    
    res.json({
      status: 'ok',
      signals
    });

  } catch (err) {
    console.error('Signals error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
