/**
 * SEO Dashboard - Publisher Routes
 * API pour la publication automatique de contenus
 */

const express = require('express');
const router = express.Router();
const { publishContent, checkURL, generateSlug, SITE_URL } = require('../services/publisher');
const { dbGet, dbRun } = require('../services/db');
const { updateContentStatus } = require('../services/content');

// POST /api/publish/:contentId - Générer le HTML pour un contenu
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

    // Générer le HTML
    const result = await publishContent(contentId);

    if (!result.success) {
      return res.status(400).json({ status: 'error', message: result.error });
    }

    // Mettre à jour le statut en "deploying"
    await dbRun('UPDATE contents SET status = ? WHERE id = ?', ['deploying', contentId]);

    res.json({
      status: 'ok',
      message: 'HTML généré avec succès',
      data: {
        slug: result.slug,
        filename: result.filename,
        filepath: result.filepath,
        url: result.url,
        html_preview: result.html.substring(0, 500) + '...',
        html_length: result.html.length
      },
      // Le HTML complet pour que le client puisse le copier ou l'envoyer à GitHub
      html: result.html
    });

  } catch (err) {
    console.error('Publish error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST /api/publish/:contentId/confirm - Confirmer le déploiement après push Git
router.post('/publish/:contentId/confirm', async (req, res) => {
  try {
    const { contentId } = req.params;
    const { commit_sha, deployed_url } = req.body;

    const content = await dbGet('SELECT * FROM contents WHERE id = ?', [contentId]);
    if (!content) {
      return res.status(404).json({ status: 'error', message: 'Contenu non trouvé' });
    }

    // Mettre à jour le statut en "deployed"
    await dbRun(
      'UPDATE contents SET status = ?, deployed_at = ?, deployed_url = ? WHERE id = ?',
      ['deployed', new Date().toISOString(), deployed_url || null, contentId]
    );

    res.json({
      status: 'ok',
      message: 'Déploiement confirmé',
      data: {
        content_id: contentId,
        status: 'deployed',
        commit_sha,
        deployed_url
      }
    });

  } catch (err) {
    console.error('Confirm deploy error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST /api/publish/:contentId/verify - Vérifier si l'URL est accessible et marquer "live"
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
        message: 'Page en ligne !',
        data: {
          content_id: contentId,
          status: 'live',
          url,
          http_status: checkResult.status
        }
      });
    } else {
      // URL non accessible
      res.json({
        status: 'error',
        message: 'Page non accessible',
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

// GET /api/publish/:contentId/preview - Prévisualiser le HTML généré
router.get('/publish/:contentId/preview', async (req, res) => {
  try {
    const { contentId } = req.params;

    const result = await publishContent(contentId);

    if (!result.success) {
      return res.status(400).json({ status: 'error', message: result.error });
    }

    // Retourner le HTML complet pour prévisualisation
    res.json({
      status: 'ok',
      data: {
        slug: result.slug,
        filename: result.filename,
        url: result.url,
        html: result.html
      }
    });

  } catch (err) {
    console.error('Preview error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
