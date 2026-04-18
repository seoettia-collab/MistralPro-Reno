/**
 * Audit IA Routes - Analyse SEO avec Claude
 * POST /api/audit-ia/analyze
 */

const express = require('express');
const router = express.Router();
const { countLive, getAllLive, checkIntegrity } = require('../services/contentCounter');
const { analyzeBlogPage } = require('../services/blogPageAnalyzer');
const { dbAll } = require('../services/db');

// Clé API Anthropic depuis variables d'environnement
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = 'seoettia-collab/MistralPro-Reno';
const GITHUB_API_URL = 'https://api.github.com';

/**
 * AUDIT-COUNT-02 — Source terrain articles GitHub
 * Sert de contrôle d'intégrité pour valider le compteur DB.
 */
async function getGroundTruthArticlesCount() {
  if (!GITHUB_TOKEN) return 0;
  try {
    const response = await fetch(
      `${GITHUB_API_URL}/repos/${GITHUB_REPO}/contents/blog`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    );
    if (!response.ok) return 0;
    const files = await response.json();
    return files.filter(f => f.name.endsWith('.html') && f.name !== 'TEMPLATE.html').length;
  } catch (e) {
    console.error('[AUDIT_COUNT_INTEGRITY_ALERT] ground truth fetch failed:', e.message);
    return 0;
  }
}

/**
 * Génère un slug URL-friendly à partir d'un texte
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9\s-]/g, '') // Supprime les caractères spéciaux
    .trim()
    .replace(/\s+/g, '-') // Remplace les espaces par des tirets
    .replace(/-+/g, '-'); // Évite les tirets multiples
}

/**
 * Génère des décisions de fallback structurées
 */
function generateFallbackDecisions(cockpitData, timestamp) {
  const decisions = [];
  let counter = 0;
  
  const { opportunites = [], concurrents = [], contenu = {} } = cockpitData;
  
  // Décision 1: Créer contenu depuis opportunité haute priorité
  const highOpp = opportunites.find(o => o.priority === 'high');
  if (highOpp) {
    const keyword = highOpp.keyword || 'rénovation paris';
    decisions.push({
      decisionId: `decision_${timestamp}_${counter++}`,
      type: 'create_content',
      keyword: keyword,
      target_page: `/blog/${slugify(keyword)}.html`,
      title_suggested: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} | Guide complet`,
      reason: `Opportunité haute priorité avec position ${highOpp.position || 'améliorable'}`,
      impact_score: 85,
      competitor: concurrents[0]?.domaine || null
    });
  }
  
  // Décision 2: Publier contenu ready
  if (contenu.en_attente && contenu.en_attente > 0) {
    decisions.push({
      decisionId: `decision_${timestamp}_${counter++}`,
      type: 'publish_content',
      slug: 'contenu-ready',
      title: 'Contenu en attente de publication',
      source: 'ready_content',
      reason: `${contenu.en_attente} contenu(s) prêt(s) à publier`,
      impact_score: 75
    });
  }
  
  // Décision 3: Optimiser page existante
  if (opportunites.length > 0) {
    const oppToOptimize = opportunites.find(o => o.position && o.position > 10 && o.position < 30);
    if (oppToOptimize) {
      decisions.push({
        decisionId: `decision_${timestamp}_${counter++}`,
        type: 'optimize_page',
        page: '/',
        keyword: oppToOptimize.keyword || 'rénovation appartement paris',
        fixes: ['Améliorer title', 'Enrichir meta description', 'Ajouter contenu H2'],
        reason: `Position ${oppToOptimize.position} proche du top 10`,
        impact_score: 70
      });
    }
  }
  
  // Décision par défaut si aucune autre
  if (decisions.length === 0) {
    decisions.push({
      decisionId: `decision_${timestamp}_${counter++}`,
      type: 'create_content',
      keyword: 'rénovation appartement paris prix',
      target_page: '/blog/renovation-appartement-paris-prix.html',
      title_suggested: 'Prix rénovation appartement Paris 2026 | Guide complet',
      reason: 'Mot-clé stratégique pour le secteur rénovation Paris',
      impact_score: 65,
      competitor: null
    });
  }
  
  return decisions;
}

/**
 * POST /api/audit-ia/analyze
 * Analyse les données cockpit avec Claude et retourne des recommandations
 */
router.post('/audit-ia/analyze', async (req, res) => {
  try {
    const { cockpitData } = req.body;
    
    if (!cockpitData) {
      return res.status(400).json({
        status: 'error',
        message: 'cockpitData requis'
      });
    }

    // AUDIT-COUNT-02 — Garde-fou d'intégrité obligatoire
    // Croise le compteur DB canonique avec la source terrain GitHub
    // pour empêcher l'audit IA de partir sur une donnée mensongère.
    console.log('[AUDIT_COUNT_TRACE] audit-ia incoming cockpit contenu:', cockpitData.contenu);
    const dbLive = await countLive();
    const groundLive = await getGroundTruthArticlesCount();
    const integrity = checkIntegrity(dbLive, groundLive);

    if (!integrity.ok) {
      // Cas critique : DB=0 mais articles terrain existent → ne pas laisser
      // le prompt partir avec un faux "0 article publié"
      if (integrity.alert === 'DB_EMPTY_BUT_GROUND_NONEMPTY') {
        console.error('[AUDIT_COUNT_PROMPT_BLOCKED]', integrity);
      }
      // Corriger cockpitData.contenu avec la valeur effective (max(DB, terrain))
      const corrected = {
        ...(cockpitData.contenu || {}),
        live: integrity.effectiveCount,
        total: integrity.effectiveCount + ((cockpitData.contenu && cockpitData.contenu.en_attente) || 0),
        integrity_alert: integrity.alert
      };
      cockpitData.contenu = corrected;
      console.log('[AUDIT_COUNT_FIXED]', { before: dbLive, effective: integrity.effectiveCount });
    } else {
      // Aligner explicitement sur la valeur DB canonique
      if (cockpitData.contenu) {
        cockpitData.contenu.live = dbLive;
      }
      console.log('[AUDIT_COUNT_FIXED]', { dbLive, groundLive, ok: true });
    }

    // AUDIT-COUNT-02 — Enrichissement prompt : liste explicite des articles live
    // pour empêcher Claude de reproposer des sujets déjà publiés.
    let liveArticlesList = [];
    try {
      const rows = await getAllLive();
      liveArticlesList = rows.map(r => ({
        slug: r.slug_suggested || null,
        title: r.title || null,
        keyword: r.keyword || null,
        deployed_url: r.deployed_url || null
      }));
      console.log('[AUDIT_COUNT_TRACE] liveArticlesList size:', liveArticlesList.length);
    } catch (e) {
      console.warn('[AUDIT_COUNT_INTEGRITY_ALERT] getAllLive failed:', e.message);
    }

    // AUDIT-BLOG-01 — Analyse complète de blog.html en production
    // Donne à l'IA la vision de ce qui est réellement affiché sur la page blog
    let blogPageAnalysis = null;
    try {
      blogPageAnalysis = await analyzeBlogPage();
      console.log('[AUDIT_BLOG_01_FETCHED]', {
        featured: blogPageAnalysis.featured?.slug,
        cards: blogPageAnalysis.stats.cards_count,
        consistent: blogPageAnalysis.consistency.is_consistent
      });
    } catch (e) {
      console.warn('[AUDIT_BLOG_01] analyse blog.html échouée:', e.message);
    }

    // AUDIT-OPT-DEDUPE — liste des pages deja optimisees recemment pour le prompt
    let recentlyOptimizedInfo = [];
    try {
      const recentOpts = await dbAll(`
        SELECT page_url, created_at FROM optimization_history
        WHERE status = 'applied'
          AND created_at >= datetime('now', '-7 days')
        ORDER BY created_at DESC
      `);
      recentlyOptimizedInfo = recentOpts.map(r => {
        const u = String(r.page_url || '');
        const m = u.match(/\/blog\/([a-z0-9-]+)\.html/i);
        return {
          slug: m ? m[1] : u,
          page_url: u,
          date: r.created_at
        };
      });
    } catch (e) {
      console.warn('[AUDIT_OPT_DEDUPE] prompt info failed:', e.message);
    }

    // Vérifier la clé API
    if (!ANTHROPIC_API_KEY) {
      console.warn('[Audit IA] ANTHROPIC_API_KEY non configurée, mode simulation');
      return res.json({
        status: 'ok',
        data: generateSimulatedAudit(cockpitData),
        simulated: true
      });
    }
    
    // Construire le prompt pour Claude
    const currentYear = new Date().getFullYear();
    const systemPrompt = `Tu es un expert SEO senior spécialisé dans les sites de rénovation et BTP en France.
Tu analyses les données d'un dashboard SEO et tu produis des DÉCISIONS EXÉCUTABLES.

CONTEXTE IMPORTANT :
- Nous sommes en ${currentYear}
- Le site cible les clients à PARIS et en ÎLE-DE-FRANCE
- Tous les titres d'articles doivent mentionner "${currentYear}" (jamais 2024 ou autre)
- L'entreprise s'appelle "Mistral Pro Reno"

RÈGLES IMPORTANTES :
- Réponds UNIQUEMENT en JSON valide, sans markdown ni texte avant/après
- Chaque décision doit être directement exécutable par un système automatisé
- Priorise par impact potentiel et faisabilité
- Adapte au secteur rénovation Paris
- Les titres doivent inclure "${currentYear}" et "Paris" quand pertinent

FORMAT DE RÉPONSE OBLIGATOIRE (JSON) :
{
  "summary": "Résumé de 200 caractères max",
  "strengths": ["Force 1", "Force 2", "Force 3"],
  "weaknesses": ["Faiblesse 1", "Faiblesse 2", "Faiblesse 3"],
  "competition": {
    "analysis": "Analyse concurrentielle en 1-2 phrases",
    "competitors": [
      {
        "domain": "domaine.com",
        "threat_level": "HIGH|MEDIUM|LOW",
        "positioning": "Positionnement observé"
      }
    ],
    "opportunities": ["Opportunité 1", "Opportunité 2"]
  },
  "decisions": [
    {
      "type": "create_content",
      "keyword": "mot-clé principal",
      "target_page": "/blog/slug-article.html",
      "title_suggested": "Titre SEO optimisé",
      "reason": "Pourquoi créer ce contenu",
      "impact_score": 0-100,
      "competitor": "domaine-concurrent.com ou null"
    },
    {
      "type": "optimize_page",
      "page": "/page-existante.html",
      "keyword": "mot-clé à renforcer",
      "fixes": ["Améliorer title", "Ajouter H2", "Enrichir contenu"],
      "reason": "Pourquoi optimiser",
      "impact_score": 0-100
    },
    {
      "type": "publish_content",
      "slug": "slug-contenu-ready",
      "title": "Titre du contenu",
      "source": "ready_content",
      "reason": "Pourquoi publier maintenant",
      "impact_score": 0-100
    }
  ]
}

TYPES DE DÉCISIONS :
- create_content : Créer un nouvel article/page (ouvre Studio SEO)
- optimize_page : Optimiser une page existante (ouvre module optimisation)
- publish_content : Publier un contenu status=ready (lance publication)

Maximum 5 décisions, triées par impact_score décroissant.`;

    const userPrompt = `Analyse ces données SEO du site mistralpro-reno.fr (entreprise de rénovation à Paris et Île-de-France) et produis des DÉCISIONS EXÉCUTABLES.

RAPPEL : Nous sommes en ${currentYear}. Tous les titres d'articles doivent mentionner "${currentYear}" (pas 2024 ni autre année).

DONNÉES COCKPIT :
${JSON.stringify(cockpitData, null, 2)}

CONCURRENTS SUIVIS :
${cockpitData.concurrents && cockpitData.concurrents.length > 0 
  ? cockpitData.concurrents.map(c => `- ${c.domaine}`).join('\n')
  : 'Aucun concurrent suivi'}

CONTENUS PRÊTS À PUBLIER :
${cockpitData.contenu && cockpitData.contenu.en_attente > 0
  ? `${cockpitData.contenu.en_attente} contenus en attente de publication`
  : 'Aucun contenu en attente'}

ARTICLES DÉJÀ PUBLIÉS (interdiction absolue de les reproposer en create_content) :
${liveArticlesList.length > 0
  ? `${liveArticlesList.length} article(s) live ci-dessous.

LISTE EXHAUSTIVE DES ARTICLES EXISTANTS :
${liveArticlesList.map((a, i) =>
  `${i + 1}. slug="${a.slug}" | titre="${a.title}" | keyword="${a.keyword || '-'}" | url=${a.deployed_url || '/blog/' + a.slug + '.html'}`
).join('\n')}

RÈGLES STRICTES AVANT TOUTE DÉCISION create_content :
- NE PROPOSE JAMAIS un article dont le slug correspond à un slug ci-dessus
- NE PROPOSE JAMAIS un article dont le keyword principal duplique exactement un keyword ci-dessus
- Si un sujet est déjà couvert, propose plutôt 'optimize_page' sur la page existante
- Tu peux proposer des angles DIFFÉRENTS (arrondissement précis, sous-niche, longue traîne) tant que le slug final sera distinct`
  : 'Aucun article live actuellement — la création de contenu est prioritaire'}

PAGES OPTIMISÉES RÉCEMMENT (derniers 7 jours) — NE PAS RE-PROPOSER en optimize_page :
${recentlyOptimizedInfo.length > 0
  ? `${recentlyOptimizedInfo.length} page(s) deja optimisee(s) recemment :
${recentlyOptimizedInfo.map((o, i) =>
  `${i + 1}. slug="${o.slug}" | url=${o.page_url} | optimisee le ${o.date}`
).join('\n')}

RÈGLE STRICTE : NE PROPOSE JAMAIS un optimize_page sur une des URL/slugs ci-dessus. Elles ont ete traitees recemment. Propose plutot optimize_page sur des pages NON presentes dans cette liste.`
  : 'Aucune page optimisee recemment — tu peux proposer des optimize_page sur les articles existants qui en ont besoin.'}

${blogPageAnalysis ? `ANALYSE DE LA PAGE PUBLIQUE /blog.html (source terrain visuelle) :
- URL analysée : ${blogPageAnalysis.url}
- Article à la une (featured) : ${blogPageAnalysis.featured ? `"${blogPageAnalysis.featured.title}" (slug=${blogPageAnalysis.featured.slug}, catégorie=${blogPageAnalysis.featured.category}, date=${blogPageAnalysis.featured.date_shown || '?'})` : 'aucun'}
- Nombre de cartes dans la grille : ${blogPageAnalysis.stats.cards_count}
- Catégories utilisées : ${Object.entries(blogPageAnalysis.stats.by_category).map(([k,v]) => `${k}(${v})`).join(', ') || 'aucune'}
- Filtres catégories disponibles : ${blogPageAnalysis.categories_available.join(', ') || 'aucun filtre détecté'}

COHÉRENCE DB ↔ PAGE BLOG :
- Cohérent : ${blogPageAnalysis.consistency.is_consistent ? 'OUI ✅' : 'NON ⚠️'}
${blogPageAnalysis.consistency.missing_on_page.length > 0 ? `- Articles EN DB mais NON AFFICHÉS sur blog.html (${blogPageAnalysis.consistency.missing_on_page.length}) : ${blogPageAnalysis.consistency.missing_on_page.join(', ')}` : ''}
${blogPageAnalysis.consistency.orphans_on_page.length > 0 ? `- Articles AFFICHÉS sur blog.html mais INCONNUS en DB (${blogPageAnalysis.consistency.orphans_on_page.length}) : ${blogPageAnalysis.consistency.orphans_on_page.join(', ')}` : ''}

DÉTAIL DE CHAQUE CARTE AFFICHÉE :
${[blogPageAnalysis.featured, ...blogPageAnalysis.cards].filter(Boolean).map((c, i) =>
  `${i + 1}. ${c.is_featured ? '[À LA UNE]' : '[GRILLE]   '} slug=${c.slug} | cat=${c.category || '-'} | date=${c.date_shown || '-'} | lecture=${c.read_time || '-'}`
).join('\n')}

INSIGHTS À UTILISER :
- Si des cartes sont "orphelines" (affichées mais plus en DB), propose fix_technical pour les nettoyer
- Si des articles DB ne sont pas affichés, propose fix_technical pour les ajouter à blog.html
- Si des catégories sont sur-représentées (ex: 5 articles "Prix" sur 6), suggère diversification
- Identifie les catégories manquantes dans les filtres mais présentes dans les cartes (ou inversement)
- Évalue si l'article featured est bien choisi (date récente, impact SEO)
` : 'Analyse de blog.html non disponible pour cette session (fallback sur DB uniquement).'}

Fournis ton analyse ET tes décisions en JSON selon le format spécifié.`;

    // Appel API Claude
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
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Audit IA] Erreur API Claude:', response.status, errorText);
      
      // Fallback simulation si erreur API
      return res.json({
        status: 'ok',
        data: generateSimulatedAudit(cockpitData),
        simulated: true,
        error: `API error: ${response.status}`
      });
    }
    
    const result = await response.json();
    
    // Extraire le contenu de la réponse Claude
    const content = result.content?.[0]?.text;
    
    if (!content) {
      throw new Error('Réponse Claude vide');
    }
    
    // Parser le JSON de la réponse
    let auditData;
    try {
      // Nettoyer le contenu (enlever éventuels backticks markdown)
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      auditData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('[Audit IA] Erreur parsing JSON:', parseError.message);
      console.error('[Audit IA] Contenu brut:', content);
      
      // Fallback simulation si parsing échoue
      return res.json({
        status: 'ok',
        data: generateSimulatedAudit(cockpitData),
        simulated: true,
        error: 'JSON parse error'
      });
    }
    
    // Ajouter les decisionId aux decisions
    const timestamp = Date.now();
    if (auditData.decisions) {
      auditData.decisions = auditData.decisions.map((decision, index) => ({
        ...decision,
        decisionId: `decision_${timestamp}_${index}`
      }));
    }

    // AUDIT-COUNT-02 — Filtre serveur anti-doublon (dernière défense)
    // Si malgré le prompt Claude propose un create_content dont le slug correspond
    // à un article déjà live, on le retire automatiquement.
    //
    // AUDIT-OPT-DEDUPE — aussi filtrer les optimize_page sur pages optimisees
    // dans les 7 derniers jours (via table optimization_history)
    if (auditData.decisions && liveArticlesList.length > 0) {
      const liveSlugsSet = new Set(
        liveArticlesList.map(a => (a.slug || '').toLowerCase()).filter(Boolean)
      );
      const liveKeywordsSet = new Set(
        liveArticlesList.map(a => (a.keyword || '').toLowerCase().trim()).filter(Boolean)
      );

      // Recuperer les pages optimisees dans les 7 derniers jours
      let recentlyOptimizedPaths = new Set();
      try {
        const recentOpts = await dbAll(`
          SELECT page_url FROM optimization_history
          WHERE status = 'applied'
            AND created_at >= datetime('now', '-7 days')
        `);
        recentlyOptimizedPaths = new Set(
          recentOpts.map(r => {
            // Normaliser: extraire juste le slug/nom de fichier quelle que soit la forme
            // Supporte /blog/X.html ET /X.html (racine) - OPTIMIZE-PATH-FIX
            const u = String(r.page_url || '').toLowerCase();
            const m = u.match(/(?:^|\/)([a-z0-9_-]+)\.html?(?:$|\?)/);
            return m ? m[1] : u;
          }).filter(Boolean)
        );
        console.log('[AUDIT_OPT_DEDUPE] pages optimisees recemment (7j):', recentlyOptimizedPaths.size, Array.from(recentlyOptimizedPaths));
      } catch (e) {
        console.warn('[AUDIT_OPT_DEDUPE] lecture optimization_history failed:', e.message);
      }

      const beforeFilter = auditData.decisions.length;
      auditData.decisions = auditData.decisions.filter(d => {
        // create_content: filtrer si slug ou keyword match article live
        if (d.type === 'create_content') {
          const targetSlug = (d.target_page || '')
            .replace(/^\/?blog\//, '')
            .replace(/\.html$/, '')
            .toLowerCase();
          const targetKeyword = (d.keyword || '').toLowerCase().trim();

          if (targetSlug && liveSlugsSet.has(targetSlug)) {
            console.warn('[AUDIT_COUNT_PROMPT_BLOCKED] doublon slug retiré:', targetSlug);
            return false;
          }
          if (targetKeyword && liveKeywordsSet.has(targetKeyword)) {
            console.warn('[AUDIT_COUNT_PROMPT_BLOCKED] doublon keyword retiré:', targetKeyword);
            return false;
          }
          return true;
        }

        // optimize_page: filtrer si la page a ete optimisee dans les 7 derniers jours
        if (d.type === 'optimize_page' && recentlyOptimizedPaths.size > 0) {
          const targetRaw = String(d.target_page || d.keyword || '').toLowerCase();
          // Meme normalisation que recentlyOptimizedPaths : on extrait le slug/nom de fichier
          const mSlug = targetRaw.match(/(?:^|\/)([a-z0-9_-]+)\.html?(?:$|\?)/);
          const targetSlug = mSlug ? mSlug[1] : targetRaw.replace(/^\/+|\/+$/g, '');

          if (targetSlug && recentlyOptimizedPaths.has(targetSlug)) {
            console.warn('[AUDIT_OPT_DEDUPE] optimize_page recent retiré:', targetSlug);
            return false;
          }
        }

        return true;
      });
      if (beforeFilter !== auditData.decisions.length) {
        console.log('[AUDIT_COUNT_FIXED] filtre doublons:', beforeFilter, '→', auditData.decisions.length);
      }
    }
    
    // Compatibilité : si Claude retourne actions au lieu de decisions, convertir
    if (auditData.actions && !auditData.decisions) {
      auditData.decisions = auditData.actions.map((action, index) => ({
        decisionId: `decision_${timestamp}_${index}`,
        type: action.type,
        keyword: action.target,
        target_page: action.type === 'create_content' ? `/blog/${slugify(action.target)}.html` : action.target,
        title_suggested: action.target,
        reason: action.reason,
        impact_score: action.impactScore || 50,
        competitor: action.vs_competitor || null
      }));
      delete auditData.actions;
    }
    
    // Fallback decisions si Claude n'en a pas fourni
    if (!auditData.decisions || auditData.decisions.length === 0) {
      auditData.decisions = generateFallbackDecisions(cockpitData, timestamp);
    }
    
    // Fallback section competition si Claude ne l'a pas fournie
    if (!auditData.competition && cockpitData.concurrents && cockpitData.concurrents.length > 0) {
      const concurrents = cockpitData.concurrents;
      auditData.competition = {
        analysis: `${concurrents.length} concurrent(s) suivi(s). Analyse comparative à approfondir.`,
        competitors: concurrents.slice(0, 4).map((c, idx) => ({
          domain: c.domaine,
          threat_level: idx === 0 ? 'HIGH' : idx < 2 ? 'MEDIUM' : 'LOW',
          positioning: 'Rénovation généraliste Paris/IDF'
        })),
        opportunities: [
          'Se différencier par le contenu expert',
          'Cibler des mots-clés longue traîne',
          'Renforcer la présence locale'
        ]
      };
    }
    
    res.json({
      status: 'ok',
      data: auditData,
      simulated: false
    });
    
  } catch (error) {
    console.error('[Audit IA] Erreur:', error.message);
    
    // Fallback simulation en cas d'erreur
    res.json({
      status: 'ok',
      data: generateSimulatedAudit(req.body?.cockpitData || {}),
      simulated: true,
      error: error.message
    });
  }
});

/**
 * Génère un audit simulé basé sur les données cockpit
 * Produit des DECISIONS exécutables (pas des actions)
 */
function generateSimulatedAudit(cockpitData) {
  const { 
    score_global = 0, 
    search_console = {}, 
    opportunites = [], 
    alertes = [],
    concurrents = [],
    contenu = {}
  } = cockpitData;
  
  const timestamp = Date.now();
  let decisionCounter = 0;
  
  // Générer des décisions exécutables
  const decisions = [];
  
  // Décision 1: Publier contenus ready (priorité haute)
  if (contenu.en_attente && contenu.en_attente > 0) {
    decisions.push({
      decisionId: `decision_${timestamp}_${decisionCounter++}`,
      type: 'publish_content',
      slug: 'contenus-ready',
      title: `${contenu.en_attente} contenu(s) prêt(s)`,
      source: 'ready_content',
      reason: 'Contenus validés en attente de publication',
      impact_score: 80
    });
  }
  
  // Décision 2: Créer contenu depuis opportunité haute priorité
  const highOpp = opportunites.find(o => o.priority === 'high');
  if (highOpp) {
    const keyword = highOpp.keyword || 'rénovation paris';
    decisions.push({
      decisionId: `decision_${timestamp}_${decisionCounter++}`,
      type: 'create_content',
      keyword: keyword,
      target_page: `/blog/${slugify(keyword)}.html`,
      title_suggested: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} | Guide complet`,
      reason: `Position ${highOpp.position || 'N/A'} avec ${highOpp.impressions || 0} impressions`,
      impact_score: 85,
      competitor: concurrents[0]?.domaine || null
    });
  }
  
  // Décision 3: Optimiser page si position proche top 10
  const nearTop10 = opportunites.find(o => o.position && o.position > 8 && o.position < 20);
  if (nearTop10) {
    decisions.push({
      decisionId: `decision_${timestamp}_${decisionCounter++}`,
      type: 'optimize_page',
      page: '/',
      keyword: nearTop10.keyword || 'rénovation appartement paris',
      fixes: ['Améliorer title', 'Enrichir meta description', 'Ajouter sections H2'],
      reason: `Quick win: position ${nearTop10.position} proche du top 10`,
      impact_score: 75
    });
  }
  
  // Décision 4: Créer contenu additionnel si peu de contenu live
  if (contenu.live !== undefined && contenu.live < 5) {
    const mediumOpp = opportunites.find(o => o.priority === 'medium');
    if (mediumOpp) {
      const keyword = mediumOpp.keyword || 'devis rénovation paris';
      decisions.push({
        decisionId: `decision_${timestamp}_${decisionCounter++}`,
        type: 'create_content',
        keyword: keyword,
        target_page: `/blog/${slugify(keyword)}.html`,
        title_suggested: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} | Mistral Pro Reno`,
        reason: `Seulement ${contenu.live} pages live - volume insuffisant`,
        impact_score: 70,
        competitor: concurrents[1]?.domaine || null
      });
    }
  }
  
  // Décision par défaut si aucune autre
  if (decisions.length === 0) {
    decisions.push({
      decisionId: `decision_${timestamp}_${decisionCounter++}`,
      type: 'create_content',
      keyword: 'rénovation appartement paris prix',
      target_page: '/blog/renovation-appartement-paris-prix.html',
      title_suggested: 'Prix rénovation appartement Paris 2026 | Guide complet',
      reason: 'Mot-clé stratégique pour le secteur rénovation Paris',
      impact_score: 65,
      competitor: null
    });
  }
  
  // Trier par impact_score décroissant
  decisions.sort((a, b) => b.impact_score - a.impact_score);
  
  // Générer l'analyse concurrentielle
  const competition = {
    analysis: concurrents.length > 0 
      ? `${concurrents.length} concurrent(s) suivi(s). Positionnement sur le marché de la rénovation Paris à renforcer.`
      : 'Aucun concurrent suivi. Recommandation : ajouter 3-5 concurrents directs pour benchmark.',
    competitors: concurrents.slice(0, 4).map((c, idx) => ({
      domain: c.domaine,
      threat_level: idx === 0 ? 'HIGH' : idx < 2 ? 'MEDIUM' : 'LOW',
      positioning: 'Rénovation généraliste Paris/IDF'
    })),
    opportunities: concurrents.length > 0 
      ? [
          'Se différencier par le contenu expert (guides détaillés)',
          'Cibler des mots-clés longue traîne moins concurrentiels',
          'Renforcer la présence locale (Paris 17, arrondissements)'
        ]
      : [
          'Identifier les concurrents directs sur Google',
          'Analyser leurs stratégies de contenu',
          'Définir un positionnement différenciant'
        ]
  };
  
  return {
    summary: `Score SEO ${score_global}/100. ${search_console.clics || 0} clics, ${search_console.impressions || 0} impressions. ${decisions.length} décision(s) générée(s).`,
    strengths: [
      'Site techniquement fonctionnel',
      'Présence locale Paris établie',
      'Structure de pages cohérente'
    ],
    weaknesses: [
      score_global < 50 ? 'Score SEO faible nécessitant optimisation' : 'Contenu à enrichir',
      'Volume de clics à améliorer',
      'Opportunités de mots-clés non exploitées'
    ],
    competition,
    decisions: decisions.slice(0, 5)
  };
}

module.exports = router;
// Force redeploy Tue Mar 10 07:06:50 UTC 2026
