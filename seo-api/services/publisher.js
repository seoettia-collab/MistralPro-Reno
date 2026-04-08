/**
 * SEO Dashboard - Auto SEO Publisher
 * Génère des pages HTML et les déploie AUTOMATIQUEMENT sur le site
 * 
 * PRINCIPE GOUVERNANCE :
 * Ricardo clique "Publier" → Le système EXÉCUTE tout automatiquement
 * Pas d'intervention manuelle de Ricardo dans l'exécution technique
 */

const { dbGet, dbRun } = require('./db');
const { generateArticleBody, escapeHTML: escapeHTMLContent } = require('./contentGenerator');

// Configuration
const SITE_URL = 'https://www.mistralpro-reno.fr';
const GITHUB_REPO = 'seoettia-collab/MistralPro-Reno';
const GITHUB_BRANCH = 'main';
// Token GitHub depuis variable d'environnement Vercel
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

/**
 * WORKFLOW COMPLET AUTOMATIQUE
 * 1. Générer HTML
 * 2. Créer fichier via GitHub API
 * 3. Attendre déploiement
 * 4. Vérifier URL
 * 5. Marquer LIVE
 */
async function autoPublish(contentId) {
  const steps = [];
  let currentStep = '';

  try {
    // === ÉTAPE 1 : Récupérer le contenu ===
    currentStep = 'Récupération contenu';
    steps.push({ step: currentStep, status: 'running' });
    
    const content = await dbGet('SELECT * FROM contents WHERE id = ?', [contentId]);
    if (!content) {
      throw new Error('Contenu non trouvé');
    }
    steps[steps.length - 1].status = 'ok';

    // === ÉTAPE 2 : Générer le slug et le HTML ===
    currentStep = 'Génération HTML';
    steps.push({ step: currentStep, status: 'running' });
    
    const slug = content.slug_suggested || generateSlug(content.title);
    const filename = `${slug}.html`;
    const filepath = `blog/${filename}`;
    
    // Récupérer le brief
    const brief = await dbGet(
      'SELECT * FROM briefs WHERE target = ? OR target LIKE ? ORDER BY id DESC LIMIT 1', 
      [slug, `%${content.keyword}%`]
    );
    
    const briefData = brief || {
      h1: content.title,
      meta_description: `${content.keyword} - Guide complet par Mistral Pro Reno.`,
      introduction: `Découvrez notre guide complet sur ${content.keyword}.`,
      conclusion: `Pour votre projet, faites confiance à Mistral Pro Reno.`,
      brief_content: ''
    };

    const html = generateHTMLFromBrief(briefData, content);
    steps[steps.length - 1].status = 'ok';
    steps[steps.length - 1].details = { filename, size: html.length };

    // === ÉTAPE 3 : Mettre à jour statut → deploying ===
    currentStep = 'Mise à jour statut';
    steps.push({ step: currentStep, status: 'running' });
    
    await dbRun('UPDATE contents SET status = ?, slug_suggested = ? WHERE id = ?', 
      ['deploying', slug, contentId]);
    steps[steps.length - 1].status = 'ok';

    // === ÉTAPE 4 : Créer/Mettre à jour le fichier via GitHub API ===
    currentStep = 'Push GitHub';
    steps.push({ step: currentStep, status: 'running' });
    
    const githubResult = await createOrUpdateFile(filepath, html, `Auto-publish: ${content.title}`);
    
    if (!githubResult.success) {
      throw new Error(`GitHub API: ${githubResult.error}`);
    }
    steps[steps.length - 1].status = 'ok';
    steps[steps.length - 1].details = { commit: githubResult.commit_sha };

    // === ÉTAPE 5 : Mettre à jour statut → deployed ===
    currentStep = 'Confirmation déploiement';
    steps.push({ step: currentStep, status: 'running' });
    
    const deployedUrl = `${SITE_URL}/blog/${filename}`;
    await dbRun('UPDATE contents SET status = ? WHERE id = ?', ['deployed', contentId]);
    steps[steps.length - 1].status = 'ok';

    // === ÉTAPE 6 : Attendre le déploiement OVH (via GitHub Actions) ===
    currentStep = 'Attente déploiement OVH';
    steps.push({ step: currentStep, status: 'running', details: { wait: '45s' } });
    
    await sleep(45000); // 45 secondes pour GitHub Actions + FTP
    steps[steps.length - 1].status = 'ok';

    // === ÉTAPE 7 : Vérifier que l'URL est accessible ===
    currentStep = 'Vérification URL';
    steps.push({ step: currentStep, status: 'running' });
    
    const urlCheck = await checkURLWithRetry(deployedUrl, 3);
    
    if (urlCheck.success) {
      // === ÉTAPE 8 : Marquer LIVE ===
      currentStep = 'Marquage LIVE';
      steps.push({ step: currentStep, status: 'running' });
      
      await dbRun(
        'UPDATE contents SET status = ? WHERE id = ?',
        ['live', contentId]
      );
      steps[steps.length - 1].status = 'ok';
      
      return {
        success: true,
        status: 'live',
        url: deployedUrl,
        steps,
        message: `✅ Page publiée et en ligne : ${deployedUrl}`
      };
    } else {
      // URL pas encore accessible - rester en "deployed"
      steps[steps.length - 1].status = 'warning';
      steps[steps.length - 1].details = { http_status: urlCheck.status, error: urlCheck.error };
      
      return {
        success: true,
        status: 'deployed',
        url: deployedUrl,
        steps,
        message: `⚠️ Page déployée mais pas encore accessible. Vérifiez dans quelques minutes.`
      };
    }

  } catch (err) {
    // Marquer l'étape en erreur
    if (steps.length > 0) {
      steps[steps.length - 1].status = 'error';
      steps[steps.length - 1].error = err.message;
    }

    // Remettre en statut "ready" en cas d'erreur
    try {
      await dbRun('UPDATE contents SET status = ? WHERE id = ?', ['ready', contentId]);
    } catch (e) {}

    return {
      success: false,
      status: 'error',
      error: err.message,
      step: currentStep,
      steps,
      message: `❌ Erreur à l'étape "${currentStep}": ${err.message}`
    };
  }
}

/**
 * Créer ou mettre à jour un fichier via GitHub API
 */
async function createOrUpdateFile(filepath, content, commitMessage) {
  try {
    const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filepath}`;
    
    // Encoder le contenu en base64
    const contentBase64 = Buffer.from(content, 'utf-8').toString('base64');

    // Vérifier si le fichier existe déjà (pour récupérer le SHA)
    let sha = null;
    try {
      const checkResponse = await fetch(apiUrl, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (checkResponse.ok) {
        const fileData = await checkResponse.json();
        sha = fileData.sha;
      }
    } catch (e) {
      // Fichier n'existe pas, on le crée
    }

    // Créer ou mettre à jour le fichier
    const body = {
      message: commitMessage,
      content: contentBase64,
      branch: GITHUB_BRANCH
    };
    
    if (sha) {
      body.sha = sha; // Nécessaire pour mise à jour
    }

    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      commit_sha: result.commit.sha,
      html_url: result.content.html_url
    };

  } catch (err) {
    console.error('GitHub API error:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Vérifier si une URL est accessible avec retry
 */
async function checkURLWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        headers: { 'User-Agent': 'SEO-Dashboard-Verifier/1.0' }
      });
      
      if (response.ok) {
        return { success: true, status: response.status };
      }
      
      // Attendre avant retry
      if (i < maxRetries - 1) {
        await sleep(10000); // 10 secondes entre chaque tentative
      }
    } catch (err) {
      if (i < maxRetries - 1) {
        await sleep(10000);
      }
    }
  }
  
  return { success: false, status: 0, error: 'URL non accessible après 3 tentatives' };
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Générer le HTML complet à partir d'un brief
 * Utilise le contentGenerator pour le corps de l'article
 */
function generateHTMLFromBrief(brief, content) {
  const today = new Date().toISOString().split('T')[0];
  const slug = content.slug_suggested || generateSlug(content.title);
  const category = content.type === 'blog' ? 'Blog' : 'Rénovation';
  const keyword = content.keyword || content.title;
  
  // Générer le corps de l'article via le contentGenerator
  const articleBody = generateArticleBody(brief, keyword);
  const selectedImage = content.image_url || content.imageUrl || 'renovation_general_(9).webp';

const articleImagePath = selectedImage.startsWith('http')
  ? selectedImage
  : selectedImage.startsWith('/images/')
    ? selectedImage
    : selectedImage.startsWith('images/')
      ? `/${selectedImage}`
      : `/images/blog/${selectedImage}`;

const articleImageRelative = articleImagePath.startsWith('/images/')
  ? `..${articleImagePath}`
  : articleImagePath;
  

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
image: ${articleImagePath.replace('/images/blog/', '').replace('/images/', '')}
category: ${category.toLowerCase()}
excerpt: ${escapeHTML(keyword)} - Guide complet par Mistral Pro Reno
-->
  
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index, follow">
  
  <title>${escapeHTML(content.title)} | Mistral Pro Reno</title>
  <meta name="description" content="${escapeHTML(brief.meta_description || keyword + ' - Découvrez notre guide complet. Devis gratuit à Paris.')}">
  <link rel="canonical" href="${SITE_URL}/blog/${slug}.html">
  
  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${SITE_URL}/blog/${slug}.html">
  <meta property="og:title" content="${escapeHTML(content.title)}">
  <meta property="og:description" content="${escapeHTML(brief.meta_description || keyword)}">
  <meta property="og:image" content="${articleImagePath.startsWith('http') ? articleImagePath : `${SITE_URL}${articleImagePath}`}">
  <meta property="og:site_name" content="Mistral Pro Reno">
  <meta property="og:locale" content="fr_FR">
  <meta property="article:published_time" content="${today}">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHTML(content.title)}">
  <meta name="twitter:description" content="${escapeHTML(brief.meta_description || keyword)}">
  
  <!-- Favicons -->
  <link rel="icon" type="image/x-icon" href="/images/favicon.ico">
  <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/images/apple-touch-icon.png">
  
  <!-- CSS -->
  <link rel="stylesheet" href="../css/style.css?v=2.0">
  <link rel="stylesheet" href="../css/blog.css?v=1.1">
  
  <!-- Schema.org -->
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Article","headline":"${escapeHTML(content.title)}","datePublished":"${today}","dateModified":"${today}","author":{"@type":"Organization","name":"Mistral Pro Reno"},"publisher":{"@type":"Organization","name":"Mistral Pro Reno","logo":{"@type":"ImageObject","url":"${SITE_URL}/images/logo.webp"}},"description":"${escapeHTML(brief.meta_description || keyword)}",""image":"${articleImagePath.startsWith('http') ? articleImagePath : `${SITE_URL}${articleImagePath}`}"","mainEntityOfPage":{"@type":"WebPage","@id":"${SITE_URL}/blog/${slug}.html"}}
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
            <a href="tel:0755188937"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg> 07 55 18 89 37</a>
            <a href="#" data-eml><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> <span class="eml-addr"></span></a>
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
          <a href="/">Accueil</a> &gt; <a href="../blog.html">Blog</a> &gt; <span>${escapeHTML(keyword)}</span>
        </nav>
        <h1>${escapeHTML(brief.h1 || content.title)}</h1>
        <div class="article-meta">
          <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${formatDate(today)}</span>
          <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 5 min de lecture</span>
          <span class="article-tag">${category}</span>
        </div>
      </div>
    </section>

    <article class="article-content">
      
      <figure style="margin:0 0 30px 0">
        <img src="${articleImageRelative}" alt="${escapeHTML(keyword)}" width="800" height="500" loading="eager" style="width:100%;height:auto;border-radius:12px">
      </figure>

${articleBody}

      <div class="article-cta">
        <h3>Besoin d'un devis pour votre projet ?</h3>
        <p>Obtenez une estimation gratuite en quelques clics avec notre simulateur de devis.</p>
        <a href="../cost_calculator.html" class="btn btn-primary">Simulateur de Devis Gratuit</a>
      </div>

      <div class="article-share">
        <span>Partager cet article :</span>
        <a href="https://www.facebook.com/sharer/sharer.php?u=${SITE_URL}/blog/${slug}.html" target="_blank" rel="noopener noreferrer" class="share-btn share-facebook">
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
 * Générer un slug à partir du titre
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}

/**
 * Échapper les caractères HTML
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
 */
function formatDate(dateStr) {
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const date = new Date(dateStr);
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Vérifier si une URL est accessible (simple)
 */
async function checkURL(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return { success: response.ok, status: response.status, url };
  } catch (err) {
    return { success: false, status: 0, error: err.message, url };
  }
}

module.exports = {
  autoPublish,
  generateHTMLFromBrief,
  generateSlug,
  checkURL,
  createOrUpdateFile,
  SITE_URL,
  GITHUB_REPO
};
