/**
 * SEO Dashboard - Routes Contenu
 */

const express = require('express');
const router = express.Router();
const { getAllContents, getContentById, createContent, updateContentStatus, getNextTransitions, VALID_TRANSITIONS, STATUS_LABELS } = require('../services/content');

// GET /api/content
router.get('/content', async (req, res) => {
  try {
    const contents = await getAllContents();
    res.json({ status: 'ok', data: contents });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/content/:id/transitions
router.get('/content/:id/transitions', async (req, res) => {
  try {
    const { id } = req.params;
    const content = await getContentById(id);
    
    if (!content) {
      return res.status(404).json({ status: 'error', message: 'Contenu non trouvé' });
    }

    const transitions = getNextTransitions(content.status);
    res.json({ 
      status: 'ok', 
      currentStatus: content.status,
      allowedTransitions: transitions,
      labels: STATUS_LABELS
    });

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST /api/content/create
router.post('/content/create', async (req, res) => {
  try {
    const { type, title, keyword } = req.body;

    if (!type || !title) {
      return res.status(400).json({ status: 'error', message: 'type et title requis' });
    }

    const result = await createContent({ type, title, keyword });
    res.json({ status: 'ok', id: result.id });

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// PATCH /api/content/:id/status
router.patch('/content/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['idea', 'draft', 'validated', 'published'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ status: 'error', message: 'Statut invalide' });
    }

    const result = await updateContentStatus(id, status);
    
    if (!result.success) {
      return res.status(400).json({ status: 'error', message: result.error });
    }
    
    res.json({ status: 'ok', changes: result.changes });

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
