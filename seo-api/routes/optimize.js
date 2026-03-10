/**
 * SEO Dashboard - Optimize Routes
 * API pour l'optimisation des pages existantes
 */

const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { dbGet, dbAll, dbRun } = require('../services/db');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * POST /api/optimize/analyze
 * Analyse une page existante et propose des optimisations
 */
router.post('/optimize/analyze', async (req, res) => {
  try {
    const { pageUrl, keyword, actionType } = req.body;
    
    if (!pageUrl && !keyword) {
      return res.status(400).json({
        status: 'error',
        message: 'pageUrl ou keyword requis'
      });
    }

    // Déterminer l'URL de la page à analyser
    let targetUrl = pageUrl;
    if (!targetUrl && keyword) {
      // Chercher la page correspondant au mot-clé dans GSC
      const gscPage = await dbGet(`
        SELECT page_url, clicks, impressions, ctr, position
        FROM gsc_pages
        WHERE page_url LIKE '%' || ? || '%'
        ORDER BY impressions DESC
        LIMIT 1
      `, [keyword.toLowerCase().replace(/\s+/g, '-')]);
      
      if (gscPage) {
        targetUrl = gscPage.page_url;
      }
    }

    // Si toujours pas d'URL, chercher dans les contenus
    if (!targetUrl && keyword) {
      const content = await dbGet(`
        SELECT url, title, keyword
        FROM contents
        WHERE LOWER(keyword) LIKE '%' || LOWER(?) || '%'
        OR LOWER(title) LIKE '%' || LOWER(?) || '%'
        ORDER BY id DESC
        LIMIT 1
      `, [keyword, keyword]);
      
      if (content && content.url) {
        targetUrl = content.url;
      }
    }

    // Récupérer les données SEO de cette page
    const pageData = await dbGet(`
      SELECT page_url, clicks, impressions, ctr, position
      FROM gsc_pages
      WHERE page_url = ?
    `, [targetUrl]);

    // Récupérer les requêtes associées
    const relatedQueries = await dbAll(`
      SELECT query, clicks, impressions, ctr, position
      FROM queries
      WHERE LOWER(query) LIKE '%' || LOWER(?) || '%'
      ORDER BY impressions DESC
      LIMIT 10
    `, [keyword || '']);

    // Si pas d'API key Anthropic, générer une analyse simulée
    if (!ANTHROPIC_API_KEY) {
      return res.json({
        status: 'ok',
        data: generateSimulatedAnalysis(targetUrl, keyword, pageData, relatedQueries, actionType),
        simulated: true
      });
    }

    // Appeler Claude pour l'analyse
    const analysis = await callClaudeForOptimization(targetUrl, keyword, pageData, relatedQueries, actionType);
    
    res.json({
      status: 'ok',
      data: analysis,
      simulated: false
    });

  } catch (error) {
    console.error('[Optimize] Erreur analyze:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * POST /api/optimize/apply
 * Applique les optimisations proposées
 */
router.post('/optimize/apply', async (req, res) => {
  try {
    const { pageUrl, optimizations } = req.body;
    
    if (!pageUrl || !optimizations) {
      return res.status(400).json({
        status: 'error',
        message: 'pageUrl et optimizations requis'
      });
    }

    // Pour l'instant, on enregistre l'action d'optimisation
    // L'application réelle nécessite l'accès GitHub (à implémenter)
    
    // Enregistrer dans la base
    await dbRun(`
      INSERT INTO optimization_history (page_url, optimizations, status, created_at)
      VALUES (?, ?, 'pending', datetime('now'))
    `, [pageUrl, JSON.stringify(optimizations)]);

    res.json({
      status: 'ok',
      message: 'Optimisations enregistrées',
      data: {
        pageUrl,
        optimizations,
        nextStep: 'Publication via GitHub requise'
      }
    });

  } catch (error) {
    console.error('[Optimize] Erreur apply:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * Appeler Claude pour analyser et proposer des optimisations
 */
async function callClaudeForOptimization(pageUrl, keyword, pageData, relatedQueries, actionType) {
  const prompt = buildOptimizationPrompt(pageUrl, keyword, pageData, relatedQueries, actionType);
  
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  const textContent = data.content.find(c => c.type === 'text');
  
  if (!textContent) {
    throw new Error('Pas de réponse textuelle de Claude');
  }

  // Parser la réponse JSON
  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Réponse non parseable');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Construire le prompt d'analyse pour Claude
 */
function buildOptimizationPrompt(pageUrl, keyword, pageData, relatedQueries, actionType) {
  const queriesInfo = relatedQueries.length > 0 
    ? relatedQueries.map(q => `- "${q.query}": ${q.impressions} imp., ${q.clicks} clics, pos. ${q.position?.toFixed(1) || 'N/A'}, CTR ${((q.ctr || 0) * 100).toFixed(2)}%`).join('\n')
    : 'Aucune donnée de requête disponible';

  const pageInfo = pageData 
    ? `Position: ${pageData.position?.toFixed(1) || 'N/A'}, CTR: ${((pageData.ctr || 0) * 100).toFixed(2)}%, Impressions: ${pageData.impressions || 0}, Clics: ${pageData.clicks || 0}`
    : 'Pas de données GSC pour cette page';

  return `Tu es un expert SEO. Analyse cette page et propose des optimisations concrètes.

PAGE À OPTIMISER:
URL: ${pageUrl || 'Non spécifiée'}
Mot-clé cible: ${keyword || 'Non spécifié'}
Type d'action: ${actionType || 'optimize_page'}

DONNÉES SEO ACTUELLES:
${pageInfo}

REQUÊTES ASSOCIÉES (Google Search Console):
${queriesInfo}

PROBLÈME IDENTIFIÉ:
${actionType === 'improve_ctr' ? 'CTR faible malgré les impressions - les title/meta ne convertissent pas assez' : 'Page sous-optimisée pour le mot-clé cible'}

Réponds UNIQUEMENT avec un objet JSON (pas de texte avant ou après) avec cette structure exacte:
{
  "diagnosis": {
    "mainIssue": "Description du problème principal",
    "currentState": "État actuel de la page",
    "targetState": "État souhaité après optimisation"
  },
  "optimizations": [
    {
      "type": "title",
      "current": "Titre actuel estimé",
      "proposed": "Nouveau titre optimisé (max 60 caractères)",
      "reason": "Pourquoi ce changement"
    },
    {
      "type": "metaDescription", 
      "current": "Meta description actuelle estimée",
      "proposed": "Nouvelle meta description (max 155 caractères)",
      "reason": "Pourquoi ce changement"
    },
    {
      "type": "h1",
      "current": "H1 actuel estimé",
      "proposed": "Nouveau H1 optimisé",
      "reason": "Pourquoi ce changement"
    },
    {
      "type": "content",
      "action": "add|modify|remove",
      "description": "Description de la modification de contenu",
      "reason": "Pourquoi ce changement"
    }
  ],
  "expectedImpact": {
    "ctrImprovement": "+X%",
    "positionImprovement": "+X positions",
    "estimatedClicks": "+X clics/mois"
  },
  "priority": "HIGH|MEDIUM|LOW"
}`;
}

/**
 * Générer une analyse simulée (mode fallback)
 */
function generateSimulatedAnalysis(pageUrl, keyword, pageData, relatedQueries, actionType) {
  const currentCTR = pageData?.ctr ? (pageData.ctr * 100).toFixed(2) : '0.9';
  const targetCTR = (parseFloat(currentCTR) + 2).toFixed(1);
  
  return {
    diagnosis: {
      mainIssue: actionType === 'improve_ctr' 
        ? `CTR de ${currentCTR}% trop faible pour ${pageData?.impressions || 100}+ impressions`
        : `Page non optimisée pour "${keyword || 'le mot-clé cible'}"`,
      currentState: `La page génère des impressions mais ne convertit pas assez en clics`,
      targetState: `Atteindre un CTR de ${targetCTR}% minimum`
    },
    optimizations: [
      {
        type: 'title',
        current: `Rénovation ${keyword || 'Paris'} - Mistral Pro Reno`,
        proposed: `${keyword ? keyword.charAt(0).toUpperCase() + keyword.slice(1) : 'Rénovation'} Paris | Devis Gratuit 48h ⭐ Mistral Pro`,
        reason: 'Ajout de CTA et emoji pour augmenter le taux de clic'
      },
      {
        type: 'metaDescription',
        current: `Découvrez nos services de rénovation à Paris.`,
        proposed: `🏠 ${keyword ? keyword.charAt(0).toUpperCase() + keyword.slice(1) : 'Rénovation'} Paris par des artisans certifiés. ✅ Devis gratuit sous 48h ✅ Garantie décennale ✅ 15 ans d'expérience. Appelez-nous !`,
        reason: 'Meta description avec emojis, bénéfices clairs et CTA'
      },
      {
        type: 'h1',
        current: `Nos services de rénovation`,
        proposed: `${keyword ? keyword.charAt(0).toUpperCase() + keyword.slice(1) : 'Rénovation complète'} à Paris et Île-de-France`,
        reason: 'H1 incluant le mot-clé cible et la zone géographique'
      },
      {
        type: 'content',
        action: 'add',
        description: 'Ajouter un bloc "Pourquoi nous choisir" avec 3 arguments clés en haut de page',
        reason: 'Renforcer la proposition de valeur dès le début'
      }
    ],
    expectedImpact: {
      ctrImprovement: `+${(parseFloat(targetCTR) - parseFloat(currentCTR)).toFixed(1)}%`,
      positionImprovement: '+2-3 positions',
      estimatedClicks: `+${Math.round((pageData?.impressions || 100) * 0.02)} clics/mois`
    },
    priority: actionType === 'improve_ctr' ? 'HIGH' : 'MEDIUM',
    pageUrl: pageUrl || `https://www.mistralpro-reno.fr/blog/${(keyword || 'renovation').toLowerCase().replace(/\s+/g, '-')}.html`,
    keyword: keyword
  };
}

module.exports = router;
