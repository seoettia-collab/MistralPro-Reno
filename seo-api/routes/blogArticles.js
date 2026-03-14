/**
 * Blog Articles API - Liste les articles publiés
 * GET /api/blog/articles
 * DELETE /api/blog/articles/:slug
 */

const express = require('express');
const router = express.Router();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = 'seoettia-collab/MistralPro-Reno';
const GITHUB_API_URL = 'https://api.github.com';

/**
 * GET /api/blog/articles
 * Liste tous les articles du blog depuis GitHub
 */
router.get('/blog/articles', async (req, res) => {
  try {
    // Récupérer la liste des fichiers dans /blog/
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

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const files = await response.json();
    
    // Filtrer uniquement les fichiers HTML (pas TEMPLATE.html)
    const articles = files
      .filter(f => f.name.endsWith('.html') && f.name !== 'TEMPLATE.html')
      .map(f => ({
        slug: f.name.replace('.html', ''),
        filename: f.name,
        path: f.path,
        url: `https://www.mistralpro-reno.fr/blog/${f.name}`,
        githubUrl: f.html_url,
        size: f.size,
        sha: f.sha
      }));

    // Récupérer les images correspondantes
    const imagesResponse = await fetch(
      `${GITHUB_API_URL}/repos/${GITHUB_REPO}/contents/images/blog`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    );

    let images = [];
    if (imagesResponse.ok) {
      images = await imagesResponse.json();
    }

    // Associer les images aux articles
    const articlesWithImages = articles.map(article => {
      const mainImage = images.find(img => 
        img.name === `${article.slug}.webp` || 
        img.name === `${article.slug}.jpg` ||
        img.name === `${article.slug}.png`
      );
      
      return {
        ...article,
        image: mainImage ? `/images/blog/${mainImage.name}` : null,
        imageUrl: mainImage ? `https://www.mistralpro-reno.fr/images/blog/${mainImage.name}` : null
      };
    });

    // Trier par nom (les plus récents ont généralement des dates dans le nom)
    articlesWithImages.sort((a, b) => b.slug.localeCompare(a.slug));

    res.json({
      status: 'ok',
      count: articlesWithImages.length,
      articles: articlesWithImages
    });

  } catch (error) {
    console.error('[Blog Articles] Erreur:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * DELETE /api/blog/articles/:slug
 * Supprime un article du blog (fichier HTML + image + carte blog.html)
 */
router.delete('/blog/articles/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    if (!slug) {
      return res.status(400).json({ status: 'error', message: 'Slug requis' });
    }

    const deletedFiles = [];
    const errors = [];

    // 1. Supprimer le fichier HTML
    try {
      const htmlPath = `blog/${slug}.html`;
      const htmlSha = await getFileSha(htmlPath);
      if (htmlSha) {
        await deleteFile(htmlPath, htmlSha, `chore: Suppression article ${slug}`);
        deletedFiles.push(htmlPath);
      }
    } catch (e) {
      errors.push(`HTML: ${e.message}`);
    }

    // 2. Supprimer l'image principale
    try {
      const imgPath = `images/blog/${slug}.webp`;
      const imgSha = await getFileSha(imgPath);
      if (imgSha) {
        await deleteFile(imgPath, imgSha, `chore: Suppression image ${slug}`);
        deletedFiles.push(imgPath);
      }
    } catch (e) {
      // Image optionnelle, pas d'erreur
    }

    // 3. Supprimer les images secondaires (-2, -3, etc.)
    for (let i = 2; i <= 5; i++) {
      try {
        const imgPath = `images/blog/${slug}-${i}.webp`;
        const imgSha = await getFileSha(imgPath);
        if (imgSha) {
          await deleteFile(imgPath, imgSha, `chore: Suppression image ${slug}-${i}`);
          deletedFiles.push(imgPath);
        }
      } catch (e) {
        // Images secondaires optionnelles
      }
    }

    // 4. Mettre à jour blog.html pour retirer la carte
    // (Cette partie sera gérée côté frontend pour éviter les conflits)

    res.json({
      status: 'ok',
      message: `Article ${slug} supprimé`,
      deletedFiles,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('[Blog Articles] Erreur suppression:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * Récupère le SHA d'un fichier sur GitHub
 */
async function getFileSha(path) {
  const response = await fetch(
    `${GITHUB_API_URL}/repos/${GITHUB_REPO}/contents/${path}`,
    {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    }
  );
  
  if (response.ok) {
    const data = await response.json();
    return data.sha;
  }
  return null;
}

/**
 * Supprime un fichier sur GitHub
 */
async function deleteFile(path, sha, message) {
  const response = await fetch(
    `${GITHUB_API_URL}/repos/${GITHUB_REPO}/contents/${path}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        sha,
        branch: 'main'
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Delete failed: ${response.status} - ${error}`);
  }

  return true;
}

module.exports = router;
