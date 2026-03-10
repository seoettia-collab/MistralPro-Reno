/**
 * GitHub API Routes - Publication de contenu
 * POST /api/github/publish
 */

const express = require('express');
const router = express.Router();

// Configuration GitHub depuis variables d'environnement
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = 'seoettia-collab/MistralPro-Reno';
const GITHUB_API_URL = 'https://api.github.com';

/**
 * POST /api/github/publish
 * Publie ou met à jour un fichier sur GitHub
 */
router.post('/github/publish', async (req, res) => {
  try {
    const { path, content, message, branch = 'main' } = req.body;
    
    if (!path || !content) {
      return res.status(400).json({
        status: 'error',
        message: 'path et content requis'
      });
    }
    
    // Vérifier le token GitHub
    if (!GITHUB_TOKEN) {
      console.warn('[GitHub] GITHUB_TOKEN non configuré, mode simulation');
      return res.json({
        status: 'ok',
        data: {
          simulated: true,
          path: path,
          message: 'Publication simulée (token non configuré)'
        }
      });
    }
    
    // Encoder le contenu en base64
    const contentBase64 = Buffer.from(content, 'utf-8').toString('base64');
    
    // Vérifier si le fichier existe déjà (pour obtenir le SHA)
    let existingSha = null;
    try {
      const checkResponse = await fetch(
        `${GITHUB_API_URL}/repos/${GITHUB_REPO}/contents/${path}?ref=${branch}`,
        {
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
          }
        }
      );
      
      if (checkResponse.ok) {
        const existingFile = await checkResponse.json();
        existingSha = existingFile.sha;
        console.log(`[GitHub] Fichier existant détecté: ${path} (SHA: ${existingSha.substring(0, 7)})`);
      }
    } catch (e) {
      // Fichier n'existe pas, c'est OK
    }
    
    // Créer ou mettre à jour le fichier
    const publishBody = {
      message: message || `feat: Ajout ${path} via Studio SEO`,
      content: contentBase64,
      branch: branch
    };
    
    // Ajouter le SHA si le fichier existe (mise à jour)
    if (existingSha) {
      publishBody.sha = existingSha;
    }
    
    const publishResponse = await fetch(
      `${GITHUB_API_URL}/repos/${GITHUB_REPO}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(publishBody)
      }
    );
    
    if (!publishResponse.ok) {
      const errorText = await publishResponse.text();
      console.error('[GitHub] Erreur publication:', publishResponse.status, errorText);
      throw new Error(`GitHub API error: ${publishResponse.status}`);
    }
    
    const result = await publishResponse.json();
    
    console.log(`[GitHub] ✅ Fichier publié: ${path}`);
    console.log(`[GitHub] Commit: ${result.commit.sha.substring(0, 7)} - ${result.commit.message}`);
    
    res.json({
      status: 'ok',
      data: {
        simulated: false,
        path: path,
        commit: {
          sha: result.commit.sha,
          message: result.commit.message,
          html_url: result.commit.html_url
        },
        content: {
          name: result.content.name,
          path: result.content.path,
          html_url: result.content.html_url
        }
      }
    });
    
  } catch (error) {
    console.error('[GitHub] Erreur:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * GET /api/github/file/:path
 * Vérifie si un fichier existe sur GitHub
 */
router.get('/github/file/*', async (req, res) => {
  try {
    const filePath = req.params[0];
    
    if (!filePath) {
      return res.status(400).json({
        status: 'error',
        message: 'path requis'
      });
    }
    
    if (!GITHUB_TOKEN) {
      return res.json({
        status: 'ok',
        data: { exists: false, simulated: true }
      });
    }
    
    const response = await fetch(
      `${GITHUB_API_URL}/repos/${GITHUB_REPO}/contents/${filePath}?ref=main`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    );
    
    if (response.ok) {
      const file = await response.json();
      res.json({
        status: 'ok',
        data: {
          exists: true,
          name: file.name,
          path: file.path,
          size: file.size,
          sha: file.sha
        }
      });
    } else if (response.status === 404) {
      res.json({
        status: 'ok',
        data: { exists: false }
      });
    } else {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
  } catch (error) {
    console.error('[GitHub] Erreur check file:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;
