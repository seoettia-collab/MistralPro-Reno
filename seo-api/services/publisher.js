/**
 * SEO Dashboard - Auto SEO Publisher
 * Génère des pages HTML à partir des briefs et les déploie sur le site
 */

const { dbGet, dbRun } = require('./db');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const SITE_URL = 'https://www.mistralpro-reno.fr';
const GITHUB_REPO = 'seoettia-collab/MistralPro-Reno';
const GITHUB_BRANCH = 'main';

/**
 * Générer le HTML complet à partir d'un brief
 * @param {Object} brief - Brief du contenu
 * @param {Object} content - Données du contenu
 * @returns {string} - HTML complet
 */
function generateHTMLFromBrief(brief, content) {
  const today = new Date().toISOString().split('T')[0];
  const slug = content.slug_suggested || generateSlug(content.title);
  const category = content.type === 'blog' ? 'Blog' : 'Rénovation';
  
  // Parser le brief pour extraire les sections
  const sections = parseBriefSections(brief.brief_content || '');
  
  // Générer le contenu des sections
  const sectionsHTML = sections.map(section => `
      <h2>${escapeHTML(section.title)}</h2>
      ${section.content.map(p => `<p>${escapeHTML(p)}</p>`).join('\n      ')}
  `).join('\n');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-5MZSVPL');</script>
  <!-- End Google Tag Manager -->

<!-- BLOG_META
title: ${escapeHTML(content.title)}
date: ${today}
image: renovation_general_(9).webp
category: ${category.toLowerCase()}
excerpt: ${escapeHTML(content.keyword)} - Guide complet par Mistral Pro Reno
-->
  
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index, follow">
  
  <title>${escapeHTML(content.title)} | Mistral Pro Reno</title>
  <meta name="description" content="${escapeHTML(brief.meta_description || content.keyword + ' - Découvrez notre guide complet. Devis gratuit à Paris et Île-de-France.')}">
  <link rel="canonical" href="${SITE_URL}/blog/${slug}.html">
  
  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${SITE_URL}/blog/${slug}.html">
  <meta property="og:title" content="${escapeHTML(content.title)}">
  <meta property="og:description" content="${escapeHTML(brief.meta_description || content.keyword)}">
  <meta property="og:image" content="${SITE_URL}/images/renovation_general_(9).webp">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Mistral Pro Reno">
  <meta property="og:locale" content="fr_FR">
  <meta property="article:published_time" content="${today}">
  <meta property="article:author" content="Mistral Pro Reno">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHTML(content.title)}">
  <meta name="twitter:description" content="${escapeHTML(brief.meta_description || content.keyword)}">
  <meta name="twitter:image" content="${SITE_URL}/images/renovation_general_(9).webp">
  
  <!-- Favicons -->
  <link rel="icon" type="image/x-icon" href="/images/favicon.ico">
  <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/images/apple-touch-icon.png">
  
  <!-- CSS -->
  <link rel="stylesheet" href="../css/style.css?v=2.0">
  <link rel="stylesheet" href="../css/blog.css?v=1.1">
  
  <!-- Schema.org -->
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Article","headline":"${escapeHTML(content.title)}","datePublished":"${today}","dateModified":"${today}","author":{"@type":"Organization","name":"Mistral Pro Reno"},"publisher":{"@type":"Organization","name":"Mistral Pro Reno","logo":{"@type":"ImageObject","url":"${SITE_URL}/images/logo.webp"}},"description":"${escapeHTML(brief.meta_description || content.keyword)}","image":"${SITE_URL}/images/renovation_general_(9).webp","mainEntityOfPage":{"@type":"WebPage","@id":"${SITE_URL}/blog/${slug}.html"}}
  </script>
</head>
<body>
  <!-- Google Tag Manager (noscript) -->
  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5MZSVPL" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>

  <header>
    <div class="top-bar">
      <div class="container">
        <div class="top-bar-content">
          <div class="contact-info">
            <a href="tel:0755188937" aria-label="Téléphone"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg> 07 55 18 89 37</a>
            <a href="#" data-eml aria-label="Email"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> <span class="eml-addr"></span></a>
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
          <a href="/">Accueil</a> &gt; <a href="../blog.html">Blog</a> &gt; <span>${escapeHTML(content.keyword)}</span>
        </nav>
        <h1>${escapeHTML(brief.h1 || content.title)}</h1>
        <div class="article-meta">
          <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${formatDate(today)}</span>
          <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${estimateReadTime(sections)} min de lecture</span>
          <span class="article-tag">${category}</span>
        </div>
      </div>
    </section>

    <article class="article-content">
      
      <p><strong>${escapeHTML(brief.introduction || content.keyword + ' : tout ce que vous devez savoir.')}</strong> Mistral Pro Reno, expert en rénovation à Paris et en Île-de-France, vous accompagne dans votre projet.</p>

      <figure style="margin:30px 0">
        <img src="../images/renovation_general_(9).webp" alt="${escapeHTML(content.keyword)}" width="800" height="500" loading="lazy" style="width:100%;height:auto;border-radius:12px">
      </figure>

${sectionsHTML}

      <h2>Conclusion</h2>
      <p>${escapeHTML(brief.conclusion || 'Pour votre projet de ' + content.keyword + ', faites confiance à Mistral Pro Reno. Contactez-nous pour un devis gratuit.')}</p>

      <div class="article-share">
        <span>Partager cet article :</span>
        <a href="https://www.facebook.com/sharer/sharer.php?u=${SITE_URL}/blog/${slug}.html" target="_blank" rel="noopener noreferrer" class="share-btn share-facebook" aria-label="Partager sur Facebook">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
          Facebook
        </a>
        <button class="share-btn share-copy" onclick="navigator.clipboard.writeText(window.location.href);this.textContent='✓ Copié !'" aria-label="Copier le lien">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          Copier le lien
        </button>
      </div>

      <div class="article-cta">
        <h3>Besoin d'un devis pour votre projet ?</h3>
        <p>Obtenez une estimation gratuite en quelques clics avec notre simulateur de devis.</p>
        <a href="../cost_calculator.html" class="btn btn-primary">Simulateur de Devis Gratuit</a>
      </div>

      <div class="author-box">
        <div class="author-avatar">MPR</div>
        <div class="author-info">
          <h4>Mistral Pro Reno</h4>
          <p>Expert en rénovation à Paris depuis plus de 30 ans. Garantie décennale.</p>
        </div>
      </div>

    </article>

    <section class="related-articles">
      <div class="container">
        <h2>Articles similaires</h2>
        <div class="related-grid">
          
          <article class="blog-card">
            <div class="blog-card-img">
              <img src="../images/renovation_general_(9).webp" alt="Rénovation appartement Paris" width="400" height="250" loading="lazy">
            </div>
            <div class="blog-card-body">
              <span class="blog-card-tag">Prix</span>
              <h3><a href="cout-renovation-appartement-paris.html">Combien coûte une rénovation d'appartement à Paris ?</a></h3>
              <a href="cout-renovation-appartement-paris.html" class="blog-card-link">Lire →</a>
            </div>
          </article>

          <article class="blog-card">
            <div class="blog-card-img">
              <img src="../images/plomberie.webp" alt="Dégât des eaux" width="400" height="250" loading="lazy">
            </div>
            <div class="blog-card-body">
              <span class="blog-card-tag">Urgences</span>
              <h3><a href="degat-des-eaux-5-etapes.html">Dégât des eaux : les 5 étapes à suivre</a></h3>
              <a href="degat-des-eaux-5-etapes.html" class="blog-card-link">Lire →</a>
            </div>
          </article>

        </div>
      </div>
    </section>

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

  return html;
}

/**
 * Parser le brief pour extraire les sections H2
 * @param {string} briefContent - Contenu du brief
 * @returns {Array} - Sections avec titre et contenu
 */
function parseBriefSections(briefContent) {
  // Si le brief est vide, générer des sections par défaut
  if (!briefContent || briefContent.trim() === '') {
    return [
      {
        title: 'Pourquoi choisir nos services ?',
        content: [
          'Mistral Pro Reno vous accompagne dans tous vos projets de rénovation à Paris et en Île-de-France.',
          'Notre équipe d\'experts vous garantit un travail de qualité, dans les délais et le budget convenus.'
        ]
      },
      {
        title: 'Notre expertise',
        content: [
          'Avec plus de 30 ans d\'expérience, nous maîtrisons tous les aspects de la rénovation.',
          'Garantie décennale, assurance RC Pro, et équipe qualifiée à votre service.'
        ]
      },
      {
        title: 'Nos tarifs',
        content: [
          'Nous proposons des devis gratuits et détaillés pour tous vos projets.',
          'Contactez-nous pour obtenir une estimation personnalisée.'
        ]
      }
    ];
  }

  // Parser le brief pour extraire les sections
  const sections = [];
  const lines = briefContent.split('\n');
  let currentSection = null;

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Détecter les titres H2 (## ou lignes en majuscules ou avec :)
    if (trimmed.startsWith('## ') || trimmed.startsWith('H2:') || /^[A-Z][A-Z\s]+:?$/.test(trimmed)) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: trimmed.replace(/^##\s*/, '').replace(/^H2:\s*/, '').replace(/:$/, ''),
        content: []
      };
    } else if (currentSection && trimmed.length > 20) {
      // Ajouter le contenu à la section courante
      currentSection.content.push(trimmed);
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  // Si aucune section trouvée, retourner les sections par défaut
  if (sections.length === 0) {
    return parseBriefSections('');
  }

  return sections;
}

/**
 * Générer un slug à partir du titre
 * @param {string} title - Titre
 * @returns {string} - Slug
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer accents
    .replace(/[^a-z0-9]+/g, '-')      // Remplacer caractères spéciaux par -
    .replace(/^-+|-+$/g, '')          // Supprimer - au début/fin
    .substring(0, 60);                 // Limiter la longueur
}

/**
 * Échapper les caractères HTML
 * @param {string} str - Chaîne à échapper
 * @returns {string} - Chaîne échappée
 */
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Formater une date
 * @param {string} dateStr - Date ISO
 * @returns {string} - Date formatée
 */
function formatDate(dateStr) {
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const date = new Date(dateStr);
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Estimer le temps de lecture
 * @param {Array} sections - Sections de l'article
 * @returns {number} - Minutes de lecture
 */
function estimateReadTime(sections) {
  let wordCount = 0;
  for (const section of sections) {
    wordCount += section.title.split(' ').length;
    for (const p of section.content) {
      wordCount += p.split(' ').length;
    }
  }
  // ~200 mots par minute
  return Math.max(3, Math.ceil(wordCount / 200));
}

/**
 * Publier un contenu : générer HTML, créer fichier via GitHub API
 * @param {number} contentId - ID du contenu
 * @returns {Promise<Object>} - Résultat de la publication
 */
async function publishContent(contentId) {
  try {
    // 1. Récupérer le contenu
    const content = await dbGet('SELECT * FROM contents WHERE id = ?', [contentId]);
    if (!content) {
      return { success: false, error: 'Contenu non trouvé' };
    }

    // 2. Récupérer le brief associé
    const brief = await dbGet('SELECT * FROM briefs WHERE content_id = ?', [contentId]);
    if (!brief) {
      return { success: false, error: 'Brief non trouvé. Générez d\'abord un brief.' };
    }

    // 3. Générer le slug
    const slug = content.slug_suggested || generateSlug(content.title);
    const filename = `${slug}.html`;
    const filepath = `blog/${filename}`;

    // 4. Générer le HTML
    const html = generateHTMLFromBrief(brief, content);

    // 5. Mettre à jour le contenu avec le slug
    await dbRun('UPDATE contents SET slug_suggested = ? WHERE id = ?', [slug, contentId]);

    // 6. Retourner le HTML et les infos pour création via GitHub API
    return {
      success: true,
      slug,
      filename,
      filepath,
      html,
      url: `${SITE_URL}/blog/${filename}`,
      message: `Article prêt : ${filename}`
    };

  } catch (err) {
    console.error('publishContent error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Vérifier si une URL est accessible
 * @param {string} url - URL à vérifier
 * @returns {Promise<Object>} - Résultat du test
 */
async function checkURL(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return {
      success: response.ok,
      status: response.status,
      url
    };
  } catch (err) {
    return {
      success: false,
      status: 0,
      error: err.message,
      url
    };
  }
}

module.exports = {
  generateHTMLFromBrief,
  generateSlug,
  publishContent,
  checkURL,
  parseBriefSections,
  SITE_URL,
  GITHUB_REPO
};
