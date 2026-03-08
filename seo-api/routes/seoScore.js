/**
 * SEO Dashboard - Routes SEO Score
 */

const express = require('express');
const router = express.Router();
const { calculateSeoScore } = require('../services/seoScore');

// GET /api/seo-score
router.get('/seo-score', async (req, res) => {
  try {
    const score = await calculateSeoScore();
    res.json({ status: 'ok', data: score });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
