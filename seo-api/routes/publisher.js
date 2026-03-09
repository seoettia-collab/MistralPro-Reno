/**
 * SEO Dashboard - Publisher Routes
 * API pour la publication AUTOMATIQUE de contenus
 * 
 * PRINCIPE GOUVERNANCE :
 * Un clic "Publier" = exécution complète automatique
 */

const express = require('express');
const router = express.Router();
const { autoPublish, checkURL, generateSlug, SITE_URL } = require('../services/publisher');
const { dbGet, dbRun } = require('../services/db');

// POST /api/publish/:contentId - PUBLICATION AUTOMATIQUE COMPLÈTE
router.post('/publish/:contentId', async (req, res) => {
  try {
    const { contentId } = req.params;

    // Vérifier que le contenu existe et est en statut "ready"
    const content = await dbGet('SELECT * FROM contents WHERE id = ?', [contentId]);
    if (!content) {
      return res.status(404).json({ status: 'error', message: 'Contenu non trouvé' });
    }

    if (content.status !== 'ready' && content.status !== 'validated') {
      return res.status(400).json({ 
        status: 'error', 
        message: `Le contenu doit être en statut "ready" pour être publié (statut actuel: ${content.status})` 
      });
    }

    // Lancer la publication automatique complète
    const result = await autoPublish(contentId);

    if (result.success) {
      res.json({
        status: 'ok',
        message: result.message,
        data: {
          content_id: contentId,
          final_status: result.status,
          url: result.url,
          steps: result.steps
        }
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: result.message,
        data: {
          content_id: contentId,
          failed_step: result.step,
          steps: result.steps
        }
      });
    }

  } catch (err) {
    console.error('Publish error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST /api/publish/:contentId/verify - Vérifier manuellement si l'URL est accessible
router.post('/publish/:contentId/verify', async (req, res) => {
  try {
    const { contentId } = req.params;

    const content = await dbGet('SELECT * FROM contents WHERE id = ?', [contentId]);
    if (!content) {
      return res.status(404).json({ status: 'error', message: 'Contenu non trouvé' });
    }

    if (!content.slug_suggested) {
      return res.status(400).json({ status: 'error', message: 'Pas de slug défini pour ce contenu' });
    }

    const url = `${SITE_URL}/blog/${content.slug_suggested}.html`;
    const checkResult = await checkURL(url);

    if (checkResult.success) {
      // URL accessible → marquer "live"
      await dbRun(
        'UPDATE contents SET status = ?, live_at = ?, deployed_url = ? WHERE id = ?',
        ['live', new Date().toISOString(), url, contentId]
      );

      res.json({
        status: 'ok',
        message: '✅ Page en ligne !',
        data: {
          content_id: contentId,
          status: 'live',
          url,
          http_status: checkResult.status
        }
      });
    } else {
      res.json({
        status: 'warning',
        message: '⚠️ Page non accessible',
        data: {
          content_id: contentId,
          url,
          http_status: checkResult.status,
          error: checkResult.error
        }
      });
    }

  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/publish/:contentId/status - Obtenir le statut de publication
router.get('/publish/:contentId/status', async (req, res) => {
  try {
    const { contentId } = req.params;

    const content = await dbGet('SELECT * FROM contents WHERE id = ?', [contentId]);
    if (!content) {
      return res.status(404).json({ status: 'error', message: 'Contenu non trouvé' });
    }

    res.json({
      status: 'ok',
      data: {
        content_id: contentId,
        title: content.title,
        current_status: content.status,
        slug: content.slug_suggested,
        deployed_url: content.deployed_url,
        deployed_at: content.deployed_at,
        live_at: content.live_at
      }
    });

  } catch (err) {
    console.error('Status error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
