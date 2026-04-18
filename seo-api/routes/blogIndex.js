/**
 * Blog Index Routes - Mise à jour automatique de blog.html
 * POST /api/blog/add-article
 */

const express = require('express');
const router = express.Router();

// Configuration GitHub
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = 'seoettia-collab/MistralPro-Reno';
const GITHUB_API_URL = 'https://api.github.com';

/**
 * POST /api/blog/add-article
 * Ajoute une carte article dans blog.html
 */
router.post('/blog/add-article', async (req, res) => {
  try {
    const { slug, title, description, category, imageUrl, readTime } = req.body;
    
    if (!slug || !title) {
      return res.status(400).json({
        status: 'error',
        message: 'slug et title requis'
      });
    }
    
    // Vérifier le token GitHub
    if (!GITHUB_TOKEN) {
      console.warn('[BlogIndex] GITHUB_TOKEN non configuré, mode simulation');
      return res.json({
        status: 'ok',
        data: {
          simulated: true,
          message: 'Article ajouté (simulation)'
        }
      });
    }
    
    // 1. Récupérer blog.html actuel
    const getResponse = await fetch(
      `${GITHUB_API_URL}/repos/${GITHUB_REPO}/contents/blog.html?ref=main`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    );
    
    if (!getResponse.ok) {
      throw new Error('Impossible de récupérer blog.html');
    }
    
    const fileData = await getResponse.json();
    const currentContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
    const fileSha = fileData.sha;
    
    // VÉRIFICATION DOUBLON : Si l'article existe déjà, ne pas l'ajouter
    if (currentContent.includes(`blog/${slug}.html`)) {
      console.log(`[BlogIndex] Article "${slug}" existe déjà dans blog.html, skip`);
      return res.json({
        status: 'ok',
        data: {
          slug: slug,
          skipped: true,
          message: 'Article déjà présent dans blog.html'
        }
      });
    }
    
    // 2. Générer la carte HTML du nouvel article
    const today = new Date();
    const dateStr = today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const categoryTag = category || 'Rénovation';
    const imagePath = imageUrl || `images/blog/${slug}.webp`;
    const readTimeStr = readTime || '5 min';
    const descriptionText = description || title;
    
    const newArticleCard = `
        <article class="blog-card" data-category="${categoryTag.toLowerCase().replace(/\s+/g, '-')}">
          <div class="blog-card-img">
            <img src="${imagePath}" alt="${title}" width="400" height="250" loading="lazy">
          </div>
          <div class="blog-card-body">
            <div class="blog-card-meta">
              <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${dateStr}</span>
              <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${readTimeStr}</span>
            </div>
            <span class="blog-card-tag">${categoryTag}</span>
            <h2><a href="blog/${slug}.html">${title}</a></h2>
            <p>${descriptionText}</p>
            <div class="blog-card-actions">
              <a href="blog/${slug}.html" class="blog-card-link">Lire l'article →</a>
              <a href="https://business.facebook.com/latest/composer?asset_id=61587951641785&text=https://www.mistralpro-reno.fr/blog/${slug}.html" target="_blank" rel="noopener noreferrer" class="card-share-fb" aria-label="Partager sur Facebook">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
              </a>
            </div>
          </div>
        </article>
`;
    
    // 3. Insérer la carte après <div class="blog-grid">
    const insertMarker = '<div class="blog-grid">';
    const insertIndex = currentContent.indexOf(insertMarker);
    
    if (insertIndex === -1) {
      throw new Error('Marqueur blog-grid non trouvé dans blog.html');
    }
    
    const insertPosition = insertIndex + insertMarker.length;
    const updatedContent = 
      currentContent.slice(0, insertPosition) + 
      '\n' + newArticleCard +
      currentContent.slice(insertPosition);
    
    // 4. Pusher le fichier mis à jour
    const updateResponse = await fetch(
      `${GITHUB_API_URL}/repos/${GITHUB_REPO}/contents/blog.html`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28'
        },
        body: JSON.stringify({
          message: `feat(blog): Ajout article "${title}" dans blog.html`,
          content: Buffer.from(updatedContent).toString('base64'),
          sha: fileSha,
          branch: 'main'
        })
      }
    );
    
    if (!updateResponse.ok) {
      const errorData = await updateResponse.json().catch(() => ({}));
      throw new Error(errorData.message || 'Erreur lors de la mise à jour de blog.html');
    }
    
    const result = await updateResponse.json();
    
    console.log(`[BlogIndex] ✅ Article "${slug}" ajouté à blog.html`);
    
    res.json({
      status: 'ok',
      data: {
        slug: slug,
        title: title,
        commitSha: result.commit?.sha,
        message: 'Article ajouté à blog.html'
      }
    });
    
  } catch (err) {
    console.error('[BlogIndex] Erreur:', err.message);
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
});

/**
 * POST /api/blog/remove-article
 * Retire la carte d'un article de blog.html (utilise apres deleteArticle)
 */
router.post('/blog/remove-article', async (req, res) => {
  try {
    const { slug } = req.body;

    if (!slug) {
      return res.status(400).json({ status: 'error', message: 'slug requis' });
    }

    if (!GITHUB_TOKEN) {
      console.warn('[BlogIndex] GITHUB_TOKEN non configuré, mode simulation');
      return res.json({ status: 'ok', data: { simulated: true } });
    }

    // 1. Récupérer blog.html actuel
    const getResponse = await fetch(
      `${GITHUB_API_URL}/repos/${GITHUB_REPO}/contents/blog.html?ref=main`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    );
    if (!getResponse.ok) throw new Error('Impossible de récupérer blog.html');

    const fileData = await getResponse.json();
    const currentContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
    const fileSha = fileData.sha;

    // Verifier si l'article est présent
    if (!currentContent.includes(`blog/${slug}.html`)) {
      console.log(`[BlogIndex] Article "${slug}" absent de blog.html, rien à supprimer`);
      return res.json({
        status: 'ok',
        data: { slug, skipped: true, message: 'Article absent de blog.html' }
      });
    }

    // 2. Supprimer le bloc <article ...>...</article> contenant blog/{slug}.html
    // On cherche le bloc d'article contenant la reference au slug
    const articleBlockRegex = new RegExp(
      `\\s*<article class="blog-card"[^>]*>[\\s\\S]*?blog\\/${slug.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\.html[\\s\\S]*?<\\/article>\\s*`,
      'g'
    );

    const updatedContent = currentContent.replace(articleBlockRegex, '\n');

    if (updatedContent === currentContent) {
      console.warn(`[BlogIndex] Pattern article-card non trouvé pour ${slug}`);
      return res.json({
        status: 'ok',
        data: { slug, skipped: true, message: 'Article non trouvé dans blog.html (pattern)' }
      });
    }

    // 3. Pusher le fichier mis à jour
    const updateResponse = await fetch(
      `${GITHUB_API_URL}/repos/${GITHUB_REPO}/contents/blog.html`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28'
        },
        body: JSON.stringify({
          message: `chore(blog): Suppression carte "${slug}" de blog.html`,
          content: Buffer.from(updatedContent).toString('base64'),
          sha: fileSha,
          branch: 'main'
        })
      }
    );

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json().catch(() => ({}));
      throw new Error(errorData.message || 'Erreur mise à jour blog.html');
    }

    const result = await updateResponse.json();
    console.log(`[BlogIndex] ✅ Carte "${slug}" supprimée de blog.html`);

    res.json({
      status: 'ok',
      data: {
        slug,
        commitSha: result.commit?.sha,
        message: 'Carte retirée de blog.html'
      }
    });

  } catch (err) {
    console.error('[BlogIndex] Erreur remove:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;