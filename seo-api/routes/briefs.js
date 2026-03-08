/**
 * SEO Dashboard - Routes Briefs
 */

const express = require('express');
const router = express.Router();
const { generateBrief, generatePublicationBrief, generateOptimizationBrief, getAllBriefs, getBriefById, updateBriefStatus } = require('../services/briefs');

// GET /api/briefs
router.get('/briefs', async (req, res) => {
  try {
    const briefs = await getAllBriefs();
    res.json({ status: 'ok', data: briefs });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST /api/briefs/optimize
router.post('/briefs/optimize', async (req, res) => {
  try {
    const { keyword } = req.body;
    
    if (!keyword) {
      return res.status(400).json({ status: 'error', message: 'Mot-clé requis' });
    }

    const result = await generateOptimizationBrief(keyword);
    res.json({ status: 'ok', data: result });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/briefs/publication/:contentId
router.get('/briefs/publication/:contentId', async (req, res) => {
  try {
    const { contentId } = req.params;
    const result = await generatePublicationBrief(parseInt(contentId));
    res.json({ status: 'ok', markdown: result.markdown });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/briefs/:id
router.get('/briefs/:id', async (req, res) => {
  try {
    const brief = await getBriefById(req.params.id);
    if (!brief) {
      return res.status(404).json({ status: 'error', message: 'Brief non trouvé' });
    }
    res.json({ status: 'ok', data: brief });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST /api/briefs/generate/:contentId
router.post('/briefs/generate/:contentId', async (req, res) => {
  try {
    const { contentId } = req.params;
    const result = await generateBrief(contentId);
    res.json({ status: 'ok', id: result.id });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// PATCH /api/briefs/:id/status
router.patch('/briefs/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['draft', 'validated', 'executed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ status: 'error', message: 'Statut invalide' });
    }

    const result = await updateBriefStatus(id, status);
    res.json({ status: 'ok', changes: result.changes });

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
