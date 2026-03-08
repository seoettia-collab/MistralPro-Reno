/**
 * SEO Dashboard - Routes Competitors
 */

const express = require('express');
const router = express.Router();
const { addCompetitor, getCompetitors, deleteCompetitor, countCompetitors } = require('../services/competitors');

// POST /api/competitors/add
router.post('/competitors/add', async (req, res) => {
  try {
    const { domain } = req.body;

    if (!domain) {
      return res.status(400).json({ status: 'error', message: 'Domain is required' });
    }

    const result = await addCompetitor(domain);
    res.json({ status: 'ok', id: result.id });

  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// GET /api/competitors
router.get('/competitors', async (req, res) => {
  try {
    const competitors = await getCompetitors();
    const count = await countCompetitors();
    res.json({ status: 'ok', data: competitors, count: count.count, max: count.max });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// DELETE /api/competitors/:id
router.delete('/competitors/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid ID' });
    }

    const result = await deleteCompetitor(id);
    
    if (result.deleted) {
      res.json({ status: 'ok', deleted: true });
    } else {
      res.status(404).json({ status: 'error', message: 'Competitor not found' });
    }

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
