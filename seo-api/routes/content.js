/**
 * SEO Dashboard - Routes Contenu
 */

const express = require('express');
const router = express.Router();
const { getAllContents, getContentById, createContent, updateContentStatus, getNextTransitions, upsertPublishedContent, backfillPublishedArticles, VALID_TRANSITIONS, STATUS_LABELS } = require('../services/content');
const { generateContentIdeas, saveIdeaAsContent } = require('../services/contentIdeas');
const { dbGet } = require('../services/db');

// GET /api/content/ideas - Générer des idées de contenu à partir des données GSC
router.get('/content/ideas', async (req, res) => {
  try {
    const site = await dbGet('SELECT * FROM sites WHERE id = 1');
    
    if (!site) {
      return res.status(404).json({ status: 'error', message: 'Site not found' });
    }

    const result = await generateContentIdeas(site.id);

    res.json({ 
      status: 'ok', 
      summary: result.summary,
      ideas: result.ideas
    });

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST /api/content/ideas/save - Sauvegarder une idée comme contenu
router.post('/content/ideas/save', async (req, res) => {
  try {
    const idea = req.body;

    if (!idea || !idea.query || !idea.titleSuggestion) {
      return res.status(400).json({ status: 'error', message: 'Données incomplètes' });
    }

    const result = await saveIdeaAsContent(idea);

    res.json({ 
      status: 'ok', 
      id: result.id,
      message: 'Idée sauvegardée comme contenu'
    });

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

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

    const validStatuses = ['idea', 'draft', 'ready', 'deploying', 'deployed', 'live'];
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

// POST /api/content/register-published
// PUBLISHER-IMG-01 : UPSERT idempotent appelé par Studio SEO après push GitHub réussi.
router.post('/content/register-published', async (req, res) => {
  try {
    const {
      slug,
      title,
      keyword,
      type = 'blog',
      category,
      deployed_url,
      image_url,
      word_count,
      status = 'live'
    } = req.body || {};

    if (!slug || !title) {
      return res.status(400).json({ status: 'error', message: 'slug et title requis' });
    }

    const result = await upsertPublishedContent({
      slug,
      title,
      keyword,
      type,
      category,
      deployed_url,
      image_url,
      word_count,
      status
    });

    res.json({ status: 'ok', data: result });
  } catch (err) {
    console.error('[CONTENTS_DB_ERROR] register-published:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST /api/content/backfill
// PUBLISHER-IMG-01 : backfill one-shot idempotent des articles déjà en ligne.
// Body : { articles: [{ slug, title, keyword?, category?, deployed_url?, image_url? }, ...] }
// Si body.articles absent, utilise la liste connue des 6 articles de production.
router.post('/content/backfill', async (req, res) => {
  try {
    const providedArticles = Array.isArray(req.body?.articles) ? req.body.articles : null;

    // Liste canonique des 6 articles déjà en production (source de vérité)
    const DEFAULT_ARTICLES = [
      {
        slug: 'cout-renovation-appartement-paris',
        title: "Combien coûte une rénovation d'appartement à Paris ?",
        keyword: 'coût rénovation appartement Paris',
        category: 'Prix',
        image_url: 'cout-renovation-appartement-paris.webp'
      },
      {
        slug: 'degat-des-eaux-5-etapes',
        title: 'Dégât des eaux : les 5 étapes à suivre',
        keyword: 'dégât des eaux',
        category: 'Urgences',
        image_url: 'degat-des-eaux-5-etapes.webp'
      },
      {
        slug: 'prix-renovation-appartement-paris-2026',
        title: 'Prix Rénovation Appartement Paris 2026',
        keyword: 'prix rénovation appartement Paris 2026',
        category: 'Prix',
        image_url: 'prix-renovation-appartement-paris-2026.webp'
      },
      {
        slug: 'prix-renovation-de-habitation-ile-de-france',
        title: "Prix rénovation d'habitation en Île-de-France",
        keyword: 'prix rénovation habitation Île-de-France',
        category: 'Prix',
        image_url: 'prix-renovation-de-habitation-ile-de-france.webp'
      },
      {
        slug: 'prix-renovation-salle-de-bain-paris-2026',
        title: 'Prix Rénovation Salle de Bain Paris 2026',
        keyword: 'prix rénovation salle de bain Paris 2026',
        category: 'Salle de bain',
        image_url: 'prix-renovation-salle-de-bain-paris-2026.webp'
      },
      {
        slug: 'renovation-salle-de-bain-guide-prix',
        title: 'Rénovation salle de bain : guide des prix',
        keyword: 'rénovation salle de bain prix',
        category: 'Salle de bain',
        image_url: 'default-blog.webp'
      }
    ];

    const articles = providedArticles && providedArticles.length > 0 ? providedArticles : DEFAULT_ARTICLES;

    const stats = await backfillPublishedArticles(articles);

    res.json({
      status: 'ok',
      data: {
        ...stats,
        total: articles.length,
        source: providedArticles ? 'body' : 'default'
      }
    });
  } catch (err) {
    console.error('[CONTENTS_DB_ERROR] backfill:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
