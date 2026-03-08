/**
 * SEO Dashboard - Routes Audit
 */

const express = require('express');
const router = express.Router();
const { runAudit, runCrawl, getAuditResults } = require('../services/audit');
const { analyzeInternalLinks, getInternalLinksStats } = require('../services/internalLinks');
const { dbGet } = require('../services/db');

// POST /api/audit/run
router.post('/audit/run', async (req, res) => {
  try {
    // Récupérer site pilote
    const site = await dbGet('SELECT * FROM sites WHERE id = 1');
    
    if (!site) {
      return res.status(404).json({ status: 'error', message: 'Site not found' });
    }

    const siteUrl = `https://www.${site.domain}`;
    const result = await runAudit(siteUrl, site.id);

    res.json({ status: 'ok', audited: result.audited });

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST /api/audit/crawl
router.post('/audit/crawl', async (req, res) => {
  try {
    // Récupérer site pilote
    const site = await dbGet('SELECT * FROM sites WHERE id = 1');
    
    if (!site) {
      return res.status(404).json({ status: 'error', message: 'Site not found' });
    }

    const siteUrl = `https://www.${site.domain}`;
    const maxPages = req.body.maxPages || 10;
    const result = await runCrawl(siteUrl, site.id, maxPages);

    res.json({ status: 'ok', audited: result.audited });

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/audit
router.get('/audit', async (req, res) => {
  try {
    const results = await getAuditResults();
    res.json({ status: 'ok', data: results });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/audit/internal-links
router.get('/audit/internal-links', async (req, res) => {
  try {
    const site = await dbGet('SELECT * FROM sites WHERE id = 1');
    
    if (!site) {
      return res.status(404).json({ status: 'error', message: 'Site not found' });
    }

    const links = await analyzeInternalLinks(site.id);
    const stats = await getInternalLinksStats(site.id);

    res.json({ status: 'ok', data: links, stats });

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
