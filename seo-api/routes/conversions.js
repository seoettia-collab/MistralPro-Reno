/**
 * SEO Dashboard - Routes Conversions
 */

const express = require('express');
const router = express.Router();
const { trackConversion, getConversions, getConversionStats } = require('../services/conversions');

// POST /api/conversions/track
router.post('/conversions/track', async (req, res) => {
  try {
    const { page, source, type } = req.body;

    if (!page) {
      return res.status(400).json({ status: 'error', message: 'Page is required' });
    }

    const result = await trackConversion({
      page,
      source: source || 'organic',
      type: type || 'seo_conversion'
    });

    res.json({ status: 'ok', id: result.id });

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/conversions
router.get('/conversions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const conversions = await getConversions(limit);
    res.json({ status: 'ok', data: conversions });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/conversions/stats
router.get('/conversions/stats', async (req, res) => {
  try {
    const stats = await getConversionStats();
    res.json({ status: 'ok', data: stats });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
