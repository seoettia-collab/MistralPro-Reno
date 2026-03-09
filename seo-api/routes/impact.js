/**
 * SEO Dashboard - Impact Analysis Routes
 */

const express = require('express');
const router = express.Router();
const { 
  calculateContentImpact, 
  analyzeAllPublishedContent, 
  getImpactSummary,
  generateRecommendations 
} = require('../services/impactAnalysis');

// GET /api/impact - Analyse globale de tous les contenus publiés
router.get('/impact', async (req, res) => {
  try {
    const analysis = await analyzeAllPublishedContent();
    const recommendations = generateRecommendations(analysis.contents);
    
    res.json({
      status: 'ok',
      summary: {
        total_published: analysis.total_published,
        analyzed: analysis.analyzed,
        with_data: analysis.with_data,
        average_score: analysis.average_score,
        performance: analysis.performance_summary
      },
      contents: analysis.contents,
      recommendations
    });

  } catch (err) {
    console.error('Impact analysis error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/impact/summary - Résumé global SEO
router.get('/impact/summary', async (req, res) => {
  try {
    const summary = await getImpactSummary();
    
    res.json({
      status: 'ok',
      ...summary
    });

  } catch (err) {
    console.error('Impact summary error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/impact/:contentId - Analyse d'impact d'un contenu spécifique
router.get('/impact/:contentId', async (req, res) => {
  try {
    const { contentId } = req.params;
    const impact = await calculateContentImpact(parseInt(contentId));
    
    if (impact.error) {
      return res.status(400).json({ status: 'error', message: impact.error });
    }
    
    res.json({
      status: 'ok',
      ...impact
    });

  } catch (err) {
    console.error('Content impact error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
