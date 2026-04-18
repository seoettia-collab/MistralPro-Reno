/**
 * Content Generation Routes - Génération d'articles SEO via Claude
 * POST /api/content/generate
 */

const express = require('express');
const router = express.Router();

// Clé API Anthropic depuis variables d'environnement
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * POST /api/content/generate
 * Génère un article SEO complet via Claude API
 */
router.post('/content/generate', async (req, res) => {
  try {
    const { keyword, type = 'blog', tone = 'professional', length = 'medium', context = '' } = req.body;
    
    if (!keyword) {
      return res.status(400).json({
        status: 'error',
        message: 'keyword requis'
      });
    }
    
    // Vérifier la clé API
    if (!ANTHROPIC_API_KEY) {
      console.warn('[Content Gen] ANTHROPIC_API_KEY non configurée, mode simulation');
      return res.json({
        status: 'ok',
        data: generateSimulatedContent(keyword, type, tone, length, context),
        simulated: true
      });
    }
    
    // Déterminer le nombre de mots cible
    const wordTargets = {
      short: { min: 400, max: 600 },
      medium: { min: 700, max: 900 },
      long: { min: 1000, max: 1400 }
    };
    const target = wordTargets[length] || wordTargets.medium;
    const currentYear = new Date().getFullYear();
    
    // Construire le prompt système
    const systemPrompt = `Tu es un rédacteur SEO expert spécialisé dans le secteur de la rénovation et du BTP en France.
Tu rédiges des articles pour Mistral Pro Reno, une entreprise de rénovation basée à Paris (17ème) intervenant en Île-de-France.

CONTEXTE IMPORTANT :
- Nous sommes en ${currentYear}
- Tous les titres et références d'année doivent mentionner "${currentYear}" (jamais 2024 ou autre)
- Les prix mentionnés doivent être actuels (${currentYear})

RÈGLES DE RÉDACTION :
- Ton ${tone === 'professional' ? 'professionnel et expert' : tone === 'friendly' ? 'chaleureux et accessible' : 'informatif et pédagogique'}
- Ciblage géographique : Paris et Île-de-France
- Intégrer naturellement le mot-clé principal et ses variantes
- Structure SEO optimisée avec H2 et H3
- Inclure des conseils pratiques et des fourchettes de prix réalistes
- Terminer par un appel à l'action vers Mistral Pro Reno

FORMAT DE RÉPONSE OBLIGATOIRE (JSON) :
{
  "title": "Titre SEO optimisé (60-65 caractères)",
  "h1": "Titre H1 de l'article",
  "metaDescription": "Meta description SEO (150-160 caractères)",
  "introduction": "Paragraphe d'introduction accrocheur (100-150 mots)",
  "sections": [
    {
      "h2": "Titre de section H2",
      "content": "Contenu de la section (150-250 mots)",
      "h3s": [
        {
          "title": "Sous-titre H3 (optionnel)",
          "content": "Contenu sous-section"
        }
      ]
    }
  ],
  "conclusion": "Paragraphe de conclusion avec CTA (80-120 mots)",
  "faq": [
    {
      "question": "Question fréquente",
      "answer": "Réponse concise"
    }
  ]
}

Réponds UNIQUEMENT en JSON valide, sans markdown ni texte avant/après.`;

    const userPrompt = `Rédige un article SEO complet sur le sujet suivant :

MOT-CLÉ PRINCIPAL : ${keyword}
TYPE DE CONTENU : ${type === 'blog' ? 'Article de blog' : type === 'service' ? 'Page service' : 'Landing page'}
LONGUEUR CIBLE : ${target.min}-${target.max} mots
${context ? `CONTEXTE ADDITIONNEL : ${context}` : ''}

L'article doit :
1. Avoir 4-6 sections H2 bien structurées
2. Inclure des conseils pratiques pour les propriétaires
3. Mentionner des fourchettes de prix réalistes pour Paris/IDF
4. Intégrer naturellement "Mistral Pro Reno" et "Île-de-France"
5. Se terminer par un appel à l'action pour demander un devis

Génère l'article complet en JSON selon le format spécifié.`;

    console.log(`[Content Gen] Génération article: "${keyword}" (${length})`);

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
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Content Gen] Erreur API Claude:', response.status, errorData);
      
      // Fallback simulation
      return res.json({
        status: 'ok',
        data: generateSimulatedContent(keyword, type, tone, length, context),
        simulated: true,
        error: `Claude API error: ${response.status}`
      });
    }
    
    const result = await response.json();
    const content = result.content?.[0]?.text;
    
    if (!content) {
      throw new Error('Réponse Claude vide');
    }
    
    // Parser le JSON de la réponse
    let articleData;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      articleData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('[Content Gen] Erreur parsing JSON:', parseError.message);
      console.error('[Content Gen] Contenu brut:', content.substring(0, 500));
      
      // Fallback simulation
      return res.json({
        status: 'ok',
        data: generateSimulatedContent(keyword, type, tone, length, context),
        simulated: true,
        error: 'JSON parse error'
      });
    }
    
    // Générer le slug
    const slug = generateSlug(keyword);

    // PUBLISHER-IMG-01 : image path explicite (accepte override du frontend si fourni)
    const imagePath = (req.body?.imagePath && typeof req.body.imagePath === 'string')
      ? req.body.imagePath
      : `/images/blog/${slug}.webp`;

    console.log('[PUBLISHER_IMG_TRACE] contentGen', { slug, imagePath, providedBy: req.body?.imagePath ? 'frontend' : 'convention' });

    // Construire le HTML final
    const htmlContent = buildArticleHTML(articleData, keyword, slug, imagePath);

    // Compter les mots
    const wordCount = countWords(htmlContent);

    console.log(`[Content Gen] ✅ Article généré: ${wordCount} mots`);

    res.json({
      status: 'ok',
      data: {
        keyword,
        type,
        slug,
        title: articleData.title,
        h1: articleData.h1,
        metaDescription: articleData.metaDescription,
        wordCount,
        htmlContent,
        imagePath,
        sections: articleData.sections?.length || 0,
        faq: articleData.faq?.length || 0,
        generatedAt: new Date().toISOString()
      },
      simulated: false
    });
    
  } catch (error) {
    console.error('[Content Gen] Erreur:', error.message);
    
    // Fallback simulation
    const keyword = req.body?.keyword || 'rénovation';
    res.json({
      status: 'ok',
      data: generateSimulatedContent(keyword, req.body?.type, req.body?.tone, req.body?.length, req.body?.context),
      simulated: true,
      error: error.message
    });
  }
});

/**
 * Génère un slug URL-friendly
 */
function generateSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Compte les mots dans un texte HTML
 */
function countWords(html) {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.split(' ').filter(w => w.length > 0).length;
}

/**
 * Construit le HTML complet de l'article
 * PUBLISHER-IMG-01 : accepte imagePath explicite (default-blog.webp par défaut)
 */
function buildArticleHTML(article, keyword, slug, imagePath) {
  const dateISO = new Date().toISOString();
  const dateLocal = new Date().toLocaleDateString('fr-FR');

  // Résolution image : explicite > convention slug > default
  const resolvedImagePath = imagePath
    || `/images/blog/${slug}.webp`;
  const absoluteImageUrl = resolvedImagePath.startsWith('http')
    ? resolvedImagePath
    : `https://www.mistralpro-reno.fr${resolvedImagePath.startsWith('/') ? resolvedImagePath : '/' + resolvedImagePath}`;

  // STUDIO-PUB-01A : chemin relatif depuis /blog/ pour l'affichage <img>
  const imagePathRelative = resolvedImagePath.startsWith('http')
    ? resolvedImagePath
    : resolvedImagePath.startsWith('/')
      ? `..${resolvedImagePath}`
      : `../${resolvedImagePath}`;

  // Schema.org Article
  const schemaOrg = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.h1,
    "description": article.metaDescription,
    "image": absoluteImageUrl,
    "author": {
      "@type": "Organization",
      "name": "Mistral Pro Reno",
      "url": "https://www.mistralpro-reno.fr"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Mistral Pro Reno",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.mistralpro-reno.fr/images/logo.webp"
      }
    },
    "datePublished": dateISO,
    "dateModified": dateISO,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://www.mistralpro-reno.fr/blog/${slug}.html`
    }
  };
  
  // Construire les sections
  let sectionsHTML = '';
  if (article.sections && article.sections.length > 0) {
    article.sections.forEach(section => {
      sectionsHTML += `
        <h2>${escapeHtml(section.h2)}</h2>
        <p>${formatContent(section.content)}</p>
`;
      // Sous-sections H3
      if (section.h3s && section.h3s.length > 0) {
        section.h3s.forEach(h3 => {
          sectionsHTML += `
        <h3>${escapeHtml(h3.title)}</h3>
        <p>${formatContent(h3.content)}</p>
`;
        });
      }
    });
  }
  
  // FAQ Schema
  let faqHTML = '';
  let faqSchema = '';
  if (article.faq && article.faq.length > 0) {
    faqHTML = `
        <section class="article-faq">
          <h2>Questions fréquentes</h2>
          <div class="faq-list">
`;
    const faqItems = [];
    article.faq.forEach(item => {
      faqHTML += `
            <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
              <h3 itemprop="name">${escapeHtml(item.question)}</h3>
              <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
                <p itemprop="text">${escapeHtml(item.answer)}</p>
              </div>
            </div>
`;
      faqItems.push({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.answer
        }
      });
    });
    faqHTML += `
          </div>
        </section>
`;
    faqSchema = `
  <script type="application/ld+json">
${JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": faqItems }, null, 2)}
  </script>`;
  }

  // HTML final — STUDIO-PUB-01A : template complet aligne avec le site
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-5MZSVPL');</script>
  <!-- End Google Tag Manager -->

  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index, follow">
  <title>${escapeHtml(article.title)}</title>
  <meta name="description" content="${escapeHtml(article.metaDescription)}">
  <link rel="canonical" href="https://www.mistralpro-reno.fr/blog/${slug}.html">

  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(article.title)}">
  <meta property="og:description" content="${escapeHtml(article.metaDescription)}">
  <meta property="og:url" content="https://www.mistralpro-reno.fr/blog/${slug}.html">
  <meta property="og:site_name" content="Mistral Pro Reno">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:image" content="${absoluteImageUrl}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(article.title)}">
  <meta name="twitter:description" content="${escapeHtml(article.metaDescription)}">
  <meta name="twitter:image" content="${absoluteImageUrl}">

  <!-- Favicons -->
  <link rel="icon" type="image/x-icon" href="/images/favicon.ico">
  <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/images/apple-touch-icon.png">

  <!-- CSS (paths relatifs depuis /blog/) -->
  <link rel="stylesheet" href="../css/style.css?v=2.0">
  <link rel="stylesheet" href="../css/blog.css?v=1.1">

  <!-- Schema.org Article -->
  <script type="application/ld+json">
${JSON.stringify(schemaOrg, null, 2)}
  </script>
  ${faqSchema}
</head>
<body>
  <!-- Google Tag Manager (noscript) -->
  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5MZSVPL" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
  <!-- End Google Tag Manager (noscript) -->

  <header>
    <div class="top-bar">
      <div class="container">
        <div class="top-bar-content">
          <div class="contact-info">
            <a href="tel:0755188937"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg> 07 55 18 89 37</a>
            <span class="hide-mobile"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Lun-Ven 08h-18h</span>
          </div>
        </div>
      </div>
    </div>
    <nav class="main-nav">
      <div class="container">
        <a href="/" class="logo">MISTRAL PRO RENO</a>
        <button class="mobile-menu-btn" aria-label="Menu" onclick="document.querySelector('.nav-links').classList.toggle('active')">
          <span></span><span></span><span></span>
        </button>
        <ul class="nav-links">
          <li><a href="/">ACCUEIL</a></li>
          <li><a href="../services.html">SERVICES</a></li>
          <li><a href="../projets.html">PROJETS</a></li>
          <li><a href="../degat-des-eaux.html">DÉGÂT DES EAUX</a></li>
          <li><a href="../blog.html" class="active">BLOG</a></li>
          <li><a href="../cost_calculator.html">SIMULATEUR DEVIS</a></li>
        </ul>
      </div>
    </nav>
  </header>

  <main>
    <section class="article-hero">
      <div class="container">
        <nav class="article-breadcrumb" aria-label="Fil d'Ariane">
          <a href="/">Accueil</a> &gt; <a href="../blog.html">Blog</a> &gt; <span>${escapeHtml(article.h1)}</span>
        </nav>
        <h1 itemprop="headline">${escapeHtml(article.h1)}</h1>
        <div class="article-meta">
          <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Publié le ${dateLocal}</span>
          <span class="article-author">Par Mistral Pro Reno</span>
        </div>
      </div>
    </section>

    <article class="article-content" itemscope itemtype="https://schema.org/Article">
      <meta itemprop="datePublished" content="${dateISO}">
      <figure style="margin:0 0 30px 0">
        <img src="${imagePathRelative}" alt="${escapeHtml(article.h1)}" width="800" height="500" loading="eager" style="width:100%;height:auto;border-radius:12px">
      </figure>

      <div itemprop="articleBody">
        <p class="article-intro"><strong>${formatContent(article.introduction)}</strong></p>

${sectionsHTML}

        <div class="article-conclusion">
          <p>${formatContent(article.conclusion)}</p>
        </div>

${faqHTML}

        <div class="article-cta">
          <h3>Besoin d'un devis pour votre projet ?</h3>
          <p>Obtenez une estimation gratuite en quelques clics avec notre simulateur.</p>
          <a href="../cost_calculator.html" class="btn btn-primary">Simulateur de Devis Gratuit</a>
        </div>

        <div class="article-share">
          <span>Partager cet article :</span>
          <a href="https://www.facebook.com/sharer/sharer.php?u=https://www.mistralpro-reno.fr/blog/${slug}.html" target="_blank" rel="noopener noreferrer" class="share-btn share-facebook">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
            Facebook
          </a>
          <button class="share-btn share-copy" onclick="navigator.clipboard.writeText(window.location.href);this.textContent='✓ Copié !'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            Copier le lien
          </button>
        </div>

        <div class="author-box">
          <div class="author-avatar">MPR</div>
          <div class="author-info">
            <h4>Mistral Pro Reno</h4>
            <p>Expert en rénovation à Paris et Île-de-France depuis plus de 30 ans. Garantie décennale.</p>
          </div>
        </div>
      </div>
    </article>
  </main>

  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-col">
          <h4>Mistral Pro Reno</h4>
          <p>Expert en rénovation à Paris et Île-de-France depuis plus de 30 ans.</p>
        </div>
        <div class="footer-col">
          <h4>Services</h4>
          <ul>
            <li><a href="../services.html">Rénovation complète</a></li>
            <li><a href="../degat-des-eaux.html">Dégât des eaux</a></li>
            <li><a href="../cost_calculator.html">Devis gratuit</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Contact</h4>
          <p><a href="tel:0755188937">07 55 18 89 37</a></p>
          <p>Paris & Île-de-France</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} Mistral Pro Reno - Tous droits réservés</p>
        <a href="../mentions-legales.html">Mentions légales</a>
      </div>
    </div>
  </footer>

  <script src="../js/main.js" defer></script>
</body>
</html>`;
}

/**
 * Échappe les caractères HTML
 */
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Formate le contenu (gère les sauts de ligne)
 */
function formatContent(text) {
  if (!text) return '';
  return escapeHtml(text).replace(/\n\n/g, '</p>\n        <p>').replace(/\n/g, '<br>');
}

/**
 * Génère un contenu simulé (fallback)
 */
function generateSimulatedContent(keyword, type = 'blog', tone = 'professional', length = 'medium', context = '') {
  const slug = generateSlug(keyword);
  const keywordCap = keyword.charAt(0).toUpperCase() + keyword.slice(1);
  
  const article = {
    title: `${keywordCap} | Guide Complet 2026 - Mistral Pro Reno`,
    h1: `${keywordCap} : Guide et Conseils d'Experts`,
    metaDescription: `Découvrez tout sur ${keyword}. Conseils d'experts, prix, étapes et devis gratuit. Mistral Pro Reno, votre partenaire rénovation en Île-de-France.`,
    introduction: `Le ${keyword} est un élément essentiel pour tout projet de rénovation en Île-de-France. Chez Mistral Pro Reno, nous accompagnons nos clients dans cette démarche avec expertise et professionnalisme depuis plus de 10 ans.`,
    sections: [
      {
        h2: `Qu'est-ce que ${keyword} ?`,
        content: `Le ${keyword} désigne l'ensemble des travaux visant à améliorer, moderniser ou transformer un espace. À Paris et en Île-de-France, ces projets sont particulièrement courants dans les appartements haussmanniens et les maisons de ville.`,
        h3s: []
      },
      {
        h2: `Les étapes clés pour réussir votre ${keyword}`,
        content: `Pour mener à bien votre projet de ${keyword}, plusieurs étapes sont essentielles :\n\n1. Évaluation initiale : Analyse de vos besoins et de l'existant\n2. Devis détaillé : Estimation précise des coûts\n3. Planification : Organisation du chantier\n4. Réalisation : Travaux par nos artisans certifiés\n5. Réception : Vérification et validation finale`,
        h3s: []
      },
      {
        h2: `Prix et budget pour ${keyword} en 2026`,
        content: `Le budget pour ${keyword} varie selon plusieurs facteurs : surface, matériaux, complexité. En moyenne en Île-de-France :\n\n• Entrée de gamme : à partir de 150€/m²\n• Milieu de gamme : 250 à 400€/m²\n• Haut de gamme : 500€/m² et plus\n\nContactez-nous pour un devis gratuit personnalisé adapté à votre projet.`,
        h3s: []
      },
      {
        h2: `Pourquoi choisir Mistral Pro Reno ?`,
        content: `Mistral Pro Reno est votre partenaire de confiance pour ${keyword} :\n\n✅ +10 ans d'expérience en rénovation\n✅ Artisans certifiés RGE\n✅ Devis gratuit sous 24h\n✅ Garantie décennale\n✅ Intervention Paris et Île-de-France`,
        h3s: []
      }
    ],
    conclusion: `Votre projet de ${keyword} mérite l'accompagnement d'experts. Mistral Pro Reno vous propose un devis gratuit et personnalisé sous 24h. Contactez-nous dès maintenant pour concrétiser votre projet de rénovation en Île-de-France.`,
    faq: [
      {
        question: `Quel est le prix moyen pour ${keyword} ?`,
        answer: `Le prix varie de 150€ à 500€/m² selon la qualité des finitions et la complexité du projet. Demandez un devis personnalisé pour une estimation précise.`
      },
      {
        question: `Combien de temps dure un projet de ${keyword} ?`,
        answer: `La durée dépend de l'ampleur des travaux. Comptez en moyenne 2 à 6 semaines pour un projet standard. Nous établissons un planning détaillé lors du devis.`
      }
    ]
  };
  
  const simulatedImagePath = '/images/blog/default-blog.webp';
  const htmlContent = buildArticleHTML(article, keyword, slug, simulatedImagePath);
  const wordCount = countWords(htmlContent);

  return {
    keyword,
    type,
    slug,
    title: article.title,
    h1: article.h1,
    metaDescription: article.metaDescription,
    wordCount,
    htmlContent,
    imagePath: simulatedImagePath,
    sections: article.sections.length,
    faq: article.faq.length,
    generatedAt: new Date().toISOString()
  };
}

/**
 * POST /api/content/generate-prompt
 * Genere un court texte via Claude API (utilise pour le prompt image, etc.)
 * Body: { prompt: string, maxTokens?: number }
 */
router.post('/content/generate-prompt', async (req, res) => {
  try {
    const { prompt, maxTokens = 200 } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ status: 'error', message: 'prompt requis' });
    }

    if (!ANTHROPIC_API_KEY) {
      console.warn('[Generate Prompt] ANTHROPIC_API_KEY non configuree');
      return res.status(503).json({
        status: 'error',
        message: 'API Anthropic non configuree, fallback local attendu'
      });
    }

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: Math.min(Math.max(Number(maxTokens) || 200, 50), 500),
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error('[Generate Prompt] Erreur Anthropic:', response.status, errText);
      return res.status(502).json({ status: 'error', message: 'Erreur API Anthropic' });
    }

    const data = await response.json();
    const text = (data.content && data.content[0] && data.content[0].text) || '';

    return res.json({
      status: 'ok',
      data: {
        text: text.trim(),
        usage: data.usage || null
      }
    });
  } catch (err) {
    console.error('[Generate Prompt] Erreur:', err.message);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
