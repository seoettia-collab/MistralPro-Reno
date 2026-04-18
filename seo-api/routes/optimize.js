/**
 * SEO Dashboard - Optimize Routes
 * API pour l'optimisation des pages existantes
 */

const express = require('express');
const router = express.Router();
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
    
    // Générer l'URL par défaut basée sur le keyword
    if (!targetUrl && keyword) {
      const slug = keyword.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      targetUrl = `https://www.mistralpro-reno.fr/blog/${slug}.html`;
    }

    // Récupérer les données SEO de cette page si elle existe
    let pageData = null;
    if (targetUrl) {
      try {
        pageData = await dbGet(`
          SELECT page_url, clicks, impressions, ctr, position
          FROM gsc_pages
          WHERE page_url = ?
        `, [targetUrl]);
      } catch (e) {
        console.log('[Optimize] Pas de données GSC pour cette URL');
      }
    }

    // Récupérer les requêtes associées au mot-clé
    let relatedQueries = [];
    if (keyword) {
      try {
        // Recherche simple avec le premier mot du keyword
        const searchTerm = keyword.split(' ')[0].toLowerCase();
        relatedQueries = await dbAll(`
          SELECT query, clicks, impressions, ctr, position
          FROM queries
          ORDER BY impressions DESC
          LIMIT 10
        `);
        // Filtrer côté JS
        relatedQueries = relatedQueries.filter(q => 
          q.query && q.query.toLowerCase().includes(searchTerm)
        );
      } catch (e) {
        console.log('[Optimize] Pas de requêtes trouvées');
      }
    }

    // Si pas d'API key Anthropic, générer une analyse simulée
    if (!ANTHROPIC_API_KEY) {
      const simData = generateSimulatedAnalysis(targetUrl, keyword, pageData, relatedQueries, actionType);
      // Toujours inclure pageUrl et keyword pour que le bouton "Appliquer" fonctionne
      simData.pageUrl = targetUrl;
      simData.keyword = keyword || '';
      return res.json({
        status: 'ok',
        data: simData,
        simulated: true
      });
    }

    // Appeler Claude pour l'analyse
    const analysis = await callClaudeForOptimization(targetUrl, keyword, pageData, relatedQueries, actionType);
    // OPTIMIZE-FIX : injecter pageUrl et keyword dans la reponse pour que
    // le bouton 'Appliquer' du frontend ait toujours ces valeurs
    analysis.pageUrl = targetUrl;
    analysis.keyword = keyword || '';

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
 * Applique reellement les optimisations SEO sur l article existant:
 * fetch GitHub -> modifie HTML (title, meta description, H1, og, twitter)
 * -> re-push GitHub.
 *
 * Body: { pageUrl, optimizations: [{ type, proposed, current, ... }] }
 * Supporte type: 'title', 'metaDescription', 'h1'
 * Le type 'content' n est pas applique automatiquement (a regenerer manuellement).
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
    if (!Array.isArray(optimizations) || optimizations.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'optimizations doit etre un tableau non vide'
      });
    }

    // 1. Extraire le slug depuis pageUrl
    // ex: https://www.mistralpro-reno.fr/blog/prix-renovation-appartement-paris-2026.html
    //  -> slug = prix-renovation-appartement-paris-2026
    const slugMatch = pageUrl.match(/\/blog\/([a-z0-9-]+)\.html/i);
    if (!slugMatch) {
      return res.status(400).json({
        status: 'error',
        message: 'Impossible d extraire le slug depuis pageUrl (attendu: /blog/{slug}.html)'
      });
    }
    const slug = slugMatch[1];
    const filePath = `blog/${slug}.html`;

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = 'seoettia-collab/MistralPro-Reno';
    const GITHUB_API_URL = 'https://api.github.com';

    if (!GITHUB_TOKEN) {
      return res.status(500).json({
        status: 'error',
        message: 'GITHUB_TOKEN non configure - impossible d applique les optimisations'
      });
    }

    // 2. Fetch fichier actuel depuis GitHub
    const getResp = await fetch(
      `${GITHUB_API_URL}/repos/${GITHUB_REPO}/contents/${filePath}?ref=main`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    );
    if (!getResp.ok) {
      return res.status(404).json({
        status: 'error',
        message: `Article ${filePath} introuvable sur GitHub (${getResp.status})`
      });
    }
    const fileData = await getResp.json();
    let html = Buffer.from(fileData.content, 'base64').toString('utf-8');
    const fileSha = fileData.sha;
    const htmlBefore = html;

    // 3. Appliquer chaque optimisation
    const applied = [];
    const skipped = [];

    const escapeForHtml = (s) => String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    const escapeForRegex = (s) => String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    for (const opt of optimizations) {
      const type = opt.type;
      const proposed = opt.proposed || '';

      if (!proposed) {
        skipped.push({ type, reason: 'proposed manquant' });
        continue;
      }

      let changed = false;

      if (type === 'title') {
        // Remplace <title>...</title> (premier match)
        const titleRegex = /<title>[^<]*<\/title>/i;
        if (titleRegex.test(html)) {
          html = html.replace(titleRegex, `<title>${escapeForHtml(proposed)}</title>`);
          changed = true;
        }
        // Aussi og:title
        const ogTitleRegex = /(<meta\s+property="og:title"\s+content=")[^"]*(")/i;
        if (ogTitleRegex.test(html)) {
          html = html.replace(ogTitleRegex, `$1${escapeForHtml(proposed)}$2`);
        }
        // Aussi twitter:title
        const twTitleRegex = /(<meta\s+name="twitter:title"\s+content=")[^"]*(")/i;
        if (twTitleRegex.test(html)) {
          html = html.replace(twTitleRegex, `$1${escapeForHtml(proposed)}$2`);
        }
      }

      else if (type === 'metaDescription' || type === 'meta' || type === 'description') {
        // Remplace <meta name="description" content="...">
        const metaRegex = /(<meta\s+name="description"\s+content=")[^"]*(")/i;
        if (metaRegex.test(html)) {
          html = html.replace(metaRegex, `$1${escapeForHtml(proposed)}$2`);
          changed = true;
        }
        // Aussi og:description
        const ogDescRegex = /(<meta\s+property="og:description"\s+content=")[^"]*(")/i;
        if (ogDescRegex.test(html)) {
          html = html.replace(ogDescRegex, `$1${escapeForHtml(proposed)}$2`);
        }
        // Aussi twitter:description
        const twDescRegex = /(<meta\s+name="twitter:description"\s+content=")[^"]*(")/i;
        if (twDescRegex.test(html)) {
          html = html.replace(twDescRegex, `$1${escapeForHtml(proposed)}$2`);
        }
      }

      else if (type === 'h1') {
        // Remplace le premier <h1 ...>...</h1>
        // Support <h1> simple et <h1 itemprop="headline">
        const h1Regex = /<h1\b[^>]*>[\s\S]*?<\/h1>/i;
        const match = html.match(h1Regex);
        if (match) {
          // Preserver les attributs du <h1> existant (itemprop, class, id, etc.)
          const openTagMatch = match[0].match(/<h1\b[^>]*>/i);
          const openTag = openTagMatch ? openTagMatch[0] : '<h1>';
          html = html.replace(h1Regex, `${openTag}${escapeForHtml(proposed)}</h1>`);
          changed = true;
        }
      }

      else if (type === 'content') {
        // Le contenu necessite une regeneration complete via Claude, trop complexe
        // pour une modif ciblee. On skip et on demande a l utilisateur de regenerer
        // l article entier depuis Studio SEO.
        skipped.push({
          type: 'content',
          reason: 'Modifications de contenu non automatisees. Regenerer article via Studio SEO.'
        });
        continue;
      }

      else {
        skipped.push({ type, reason: `Type non supporte: ${type}` });
        continue;
      }

      if (changed) {
        applied.push({ type, proposed: proposed.substring(0, 80) });
      } else {
        skipped.push({ type, reason: 'Pattern non trouve dans le HTML' });
      }
    }

    // 4. Si rien n'a change, ne pas re-pusher
    if (html === htmlBefore || applied.length === 0) {
      // On enregistre quand meme pour tracabilite
      try {
        await dbRun(`
          INSERT INTO optimization_history (page_url, optimizations, status, created_at)
          VALUES (?, ?, 'skipped', datetime('now'))
        `, [pageUrl, JSON.stringify(optimizations)]);
      } catch (e) { /* DB indispo, non bloquant */ }

      return res.json({
        status: 'ok',
        message: 'Aucune modification appliquee (patterns non trouves ou content skipped)',
        data: { pageUrl, applied, skipped }
      });
    }

    // 5. Re-push sur GitHub
    const commitMsg = `feat(seo): Optimisations SEO sur ${slug} (${applied.map(a => a.type).join(', ')})`;
    const putResp = await fetch(
      `${GITHUB_API_URL}/repos/${GITHUB_REPO}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28'
        },
        body: JSON.stringify({
          message: commitMsg,
          content: Buffer.from(html).toString('base64'),
          sha: fileSha,
          branch: 'main'
        })
      }
    );

    if (!putResp.ok) {
      const errData = await putResp.json().catch(() => ({}));
      console.error('[Optimize apply] GitHub PUT fail:', putResp.status, errData);
      return res.status(500).json({
        status: 'error',
        message: errData.message || `GitHub PUT erreur ${putResp.status}`
      });
    }
    const putResult = await putResp.json();

    // 6. Enregistrer dans la DB (trace)
    try {
      await dbRun(`
        INSERT INTO optimization_history (page_url, optimizations, status, created_at)
        VALUES (?, ?, 'applied', datetime('now'))
      `, [pageUrl, JSON.stringify(optimizations)]);
    } catch (e) { /* non bloquant */ }

    console.log(`[Optimize apply] ✅ ${slug} - ${applied.length} opti(s) applique(s), commit: ${putResult.commit?.sha?.substring(0, 7)}`);

    return res.json({
      status: 'ok',
      message: `${applied.length} optimisation(s) appliquee(s) avec succes`,
      data: {
        pageUrl,
        slug,
        applied,
        skipped,
        commitSha: putResult.commit?.sha,
        commitUrl: putResult.commit?.html_url,
        deployInfo: 'Deploiement OVH automatique via GitHub Actions (~45s)'
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
