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
    
    // Construire le prompt système
    const systemPrompt = `Tu es un rédacteur SEO expert spécialisé dans le secteur de la rénovation et du BTP en France.
Tu rédiges des articles pour Mistral Pro Reno, une entreprise de rénovation basée à Paris (17ème) intervenant en Île-de-France.

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
    
    // Construire le HTML final
    const htmlContent = buildArticleHTML(articleData, keyword, slug);
    
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
 */
function buildArticleHTML(article, keyword, slug) {
  const dateISO = new Date().toISOString();
  const dateLocal = new Date().toLocaleDateString('fr-FR');
  
  // Schema.org Article
  const schemaOrg = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.h1,
    "description": article.metaDescription,
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

  // HTML final
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(article.title)}</title>
  <meta name="description" content="${escapeHtml(article.metaDescription)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://www.mistralpro-reno.fr/blog/${slug}.html">
  
  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(article.title)}">
  <meta property="og:description" content="${escapeHtml(article.metaDescription)}">
  <meta property="og:url" content="https://www.mistralpro-reno.fr/blog/${slug}.html">
  <meta property="og:site_name" content="Mistral Pro Reno">
  <meta property="og:image" content="https://www.mistralpro-reno.fr/images/blog/${slug}.webp">
  
  <!-- Schema.org Article -->
  <script type="application/ld+json">
${JSON.stringify(schemaOrg, null, 2)}
  </script>
  ${faqSchema}
  
  <link rel="stylesheet" href="/css/main.css">
  <link rel="stylesheet" href="/css/blog.css">
</head>
<body>
  <!-- Header inclus via JS -->
  
  <main class="blog-article">
    <article itemscope itemtype="https://schema.org/Article">
      <header class="article-header">
        <h1 itemprop="headline">${escapeHtml(article.h1)}</h1>
        <div class="article-meta">
          <span class="article-date" itemprop="datePublished" content="${dateISO}">Publié le ${dateLocal}</span>
          <span class="article-author" itemprop="author" itemscope itemtype="https://schema.org/Organization">
            Par <span itemprop="name">Mistral Pro Reno</span>
          </span>
        </div>
      </header>
      
      <div class="article-content" itemprop="articleBody">
        <p class="article-intro"><strong>${formatContent(article.introduction)}</strong></p>
        
${sectionsHTML}
        
        <div class="article-conclusion">
          <p>${formatContent(article.conclusion)}</p>
        </div>
        
${faqHTML}
        
        <div class="article-cta">
          <h3>Besoin d'un devis pour votre projet ?</h3>
          <p>Contactez Mistral Pro Reno pour un devis gratuit et personnalisé.</p>
          <a href="/cost_calculator.html" class="btn-primary">Obtenir un devis gratuit</a>
        </div>
      </div>
    </article>
  </main>
  
  <!-- Footer inclus via JS -->
  <script src="/js/main.js"></script>
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
  
  const htmlContent = buildArticleHTML(article, keyword, slug);
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
    sections: article.sections.length,
    faq: article.faq.length,
    generatedAt: new Date().toISOString()
  };
}

module.exports = router;
