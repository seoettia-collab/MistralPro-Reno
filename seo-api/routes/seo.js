/**
 * SEO Dashboard - Routes SEO
 */

const express = require('express');
const router = express.Router();
const { dbAll } = require('../services/db');

// GET /api/sites
router.get('/sites', async (req, res) => {
  try {
    const sites = await dbAll('SELECT * FROM sites ORDER BY id');
    res.json({ status: 'ok', data: sites });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/pages
router.get('/pages', async (req, res) => {
  try {
    const pages = await dbAll('SELECT * FROM pages ORDER BY id');
    res.json({ status: 'ok', data: pages });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/queries
router.get('/queries', async (req, res) => {
  try {
    const queries = await dbAll('SELECT * FROM queries ORDER BY impressions DESC');
    res.json({ status: 'ok', data: queries });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/opportunities
router.get('/opportunities', async (req, res) => {
  try {
    const opportunities = await dbAll('SELECT * FROM opportunities ORDER BY id DESC');
    res.json({ status: 'ok', data: opportunities });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/alerts
router.get('/alerts', async (req, res) => {
  try {
    const alerts = await dbAll('SELECT * FROM alerts ORDER BY created_at DESC');
    res.json({ status: 'ok', data: alerts });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
