/**
 * SEO Dashboard - Routes Google Search Console
 */

const express = require('express');
const router = express.Router();
const { fetchSearchConsoleData } = require('../services/gsc');
const { generateOpportunities } = require('../services/opportunities');
const { dbGet } = require('../services/db');

// GET /api/gsc/fetch
router.get('/gsc/fetch', async (req, res) => {
  try {
    // Récupérer site pilote
    const site = await dbGet('SELECT * FROM sites WHERE id = 1');
    
    if (!site) {
      return res.status(404).json({ status: 'error', message: 'Site not found' });
    }

    // Format GSC : sc-domain:domain.fr
    const siteUrl = `sc-domain:${site.domain}`;

    // Fetch et import données
    const importResult = await fetchSearchConsoleData(siteUrl, site.id);

    // Générer automatiquement les opportunités
    const opportunitiesResult = await generateOpportunities(site.id);

    res.json({ 
      status: 'ok', 
      imported: importResult.imported,
      opportunities: {
        generated: opportunitiesResult.generated,
        updated: opportunitiesResult.skipped
      }
    });

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
