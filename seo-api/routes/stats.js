/**
 * SEO Dashboard - Routes Stats
 */

const express = require('express');
const router = express.Router();
const { getStats } = require('../services/stats');

// GET /api/stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await getStats();
    res.json({ status: 'ok', data: stats });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
