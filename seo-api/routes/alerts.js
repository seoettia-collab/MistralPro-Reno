/**
 * SEO Dashboard - Routes Alerts
 */

const express = require('express');
const router = express.Router();
const { generateAlerts, generatePriorityAlerts, getAllAlerts, countAlerts } = require('../services/alerts');

// POST /api/alerts/generate
router.post('/alerts/generate', async (req, res) => {
  try {
    const result = await generateAlerts();
    res.json({ status: 'ok', generated: result.generated });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/alerts/priority
router.get('/alerts/priority', async (req, res) => {
  try {
    const alerts = await generatePriorityAlerts();
    
    const stats = {
      total: alerts.length,
      high: alerts.filter(a => a.priority === 'high').length,
      medium: alerts.filter(a => a.priority === 'medium').length
    };
    
    res.json({ status: 'ok', data: alerts, stats });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/alerts - Retourne les alertes automatiques générées en temps réel
router.get('/alerts', async (req, res) => {
  try {
    // Générer les alertes automatiques (pas stockées en base)
    const alerts = await generatePriorityAlerts();
    res.json({ status: 'ok', data: alerts });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/alerts/count
router.get('/alerts/count', async (req, res) => {
  try {
    const counts = await countAlerts();
    res.json({ status: 'ok', data: counts });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
// Force redeploy Tue Mar 10 06:34:09 UTC 2026
