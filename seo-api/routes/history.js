/**
 * SEO Dashboard - Routes History
 */

const express = require('express');
const router = express.Router();
const { getRecentHistory, countEventsByType, ACTION_LABELS } = require('../services/history');

// GET /api/history
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const history = await getRecentHistory(limit);
    res.json({ status: 'ok', data: history });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/history/stats
router.get('/history/stats', async (req, res) => {
  try {
    const counts = await countEventsByType();
    res.json({ status: 'ok', data: counts, labels: ACTION_LABELS });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
