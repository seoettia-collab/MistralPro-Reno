/**
 * SEO Dashboard - Routes Editorial
 */

const express = require('express');
const router = express.Router();
const { generateEditorialPlan, getEditorialPlan, generateMonthlyPlan } = require('../services/editorialPlan');

// POST /api/editorial/generate
router.post('/editorial/generate', async (req, res) => {
  try {
    const result = await generateEditorialPlan();
    res.json({ status: 'ok', generated: result.generated });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/editorial
router.get('/editorial', async (req, res) => {
  try {
    const plan = await getEditorialPlan();
    res.json({ status: 'ok', data: plan });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/editorial/monthly-plan
router.get('/editorial/monthly-plan', async (req, res) => {
  try {
    const plan = await generateMonthlyPlan();
    
    // Calculer statistiques
    const stats = {
      total: plan.length,
      create_content: plan.filter(p => p.type === 'create_content').length,
      optimize_page: plan.filter(p => p.type === 'optimize_page').length,
      high_priority: plan.filter(p => p.priority === 'high').length,
      medium_priority: plan.filter(p => p.priority === 'medium').length,
      low_priority: plan.filter(p => p.priority === 'low').length
    };
    
    res.json({ status: 'ok', data: plan, stats });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
