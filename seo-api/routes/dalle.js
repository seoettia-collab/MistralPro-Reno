/**
 * DALL-E Image Generation Routes
 * POST /api/dalle/generate
 */

const express = require('express');
const router = express.Router();

// Clé API OpenAI depuis variables d'environnement
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/images/generations';

/**
 * POST /api/dalle/generate
 * Génère une image via DALL-E 3
 */
router.post('/dalle/generate', async (req, res) => {
  try {
    const { prompt, size = '1792x1024', keyword } = req.body;
    
    if (!prompt && !keyword) {
      return res.status(400).json({
        status: 'error',
        message: 'prompt ou keyword requis'
      });
    }
    
    // Vérifier la clé API
    if (!OPENAI_API_KEY) {
      console.warn('[DALL-E] OPENAI_API_KEY non configurée, mode simulation');
      return res.json({
        status: 'ok',
        data: {
          url: generatePlaceholderUrl(keyword || prompt),
          prompt: prompt || generateImagePrompt(keyword),
          simulated: true
        }
      });
    }
    
    // Générer ou utiliser le prompt fourni
    const finalPrompt = prompt || generateImagePrompt(keyword);
    
    // Appel API DALL-E 3
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: finalPrompt,
        n: 1,
        size: size,
        quality: 'standard',
        style: 'natural'
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[DALL-E] Erreur API:', response.status, errorData);
      
      // Fallback placeholder si erreur API
      return res.json({
        status: 'ok',
        data: {
          url: generatePlaceholderUrl(keyword || prompt),
          prompt: finalPrompt,
          simulated: true,
          error: `API error: ${response.status}`
        }
      });
    }
    
    const result = await response.json();
    const imageUrl = result.data?.[0]?.url;
    
    if (!imageUrl) {
      throw new Error('URL image non retournée par DALL-E');
    }
    
    res.json({
      status: 'ok',
      data: {
        url: imageUrl,
        prompt: finalPrompt,
        revised_prompt: result.data?.[0]?.revised_prompt,
        simulated: false
      }
    });
    
  } catch (error) {
    console.error('[DALL-E] Erreur:', error.message);
    
    // Fallback placeholder en cas d'erreur
    const keyword = req.body?.keyword || req.body?.prompt || 'renovation';
    res.json({
      status: 'ok',
      data: {
        url: generatePlaceholderUrl(keyword),
        prompt: req.body?.prompt || generateImagePrompt(keyword),
        simulated: true,
        error: error.message
      }
    });
  }
});

/**
 * POST /api/dalle/generate-from-content
 * Génère une image à partir du contenu article (extraction automatique du sujet)
 */
router.post('/dalle/generate-from-content', async (req, res) => {
  try {
    const { title, keyword, contentType } = req.body;
    
    if (!keyword && !title) {
      return res.status(400).json({
        status: 'error',
        message: 'keyword ou title requis'
      });
    }
    
    // Générer le prompt optimisé pour rénovation
    const prompt = generateImagePrompt(keyword || title, contentType);
    
    // Réutiliser la logique de génération
    req.body.prompt = prompt;
    
    // Appeler la route principale
    return router.handle(req, res);
    
  } catch (error) {
    console.error('[DALL-E] Erreur generate-from-content:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * Génère un prompt image optimisé pour le secteur rénovation
 */
function generateImagePrompt(keyword, contentType = 'blog') {
  const keywordLower = (keyword || '').toLowerCase();
  
  // Thèmes visuels pour rénovation (style magazine immobilier)
  const themes = {
    'cuisine': {
      scene: 'modern renovated kitchen interior',
      details: 'white marble countertops, wooden cabinets, natural light from large window, minimalist design'
    },
    'salle de bain': {
      scene: 'luxury renovated bathroom',
      details: 'walk-in shower with glass door, elegant tiles, modern fixtures, soft ambient lighting'
    },
    'appartement': {
      scene: 'renovated Parisian apartment interior',
      details: 'herringbone parquet floors, high ceilings, large windows, contemporary furniture, bright and airy'
    },
    'maison': {
      scene: 'beautifully renovated house interior',
      details: 'open floor plan, modern finishes, natural materials, warm lighting'
    },
    'peinture': {
      scene: 'freshly painted living room',
      details: 'smooth walls, neutral elegant colors, natural light, tasteful decoration'
    },
    'parquet': {
      scene: 'renovated room with beautiful hardwood floors',
      details: 'oak parquet flooring, natural finish, sunlight reflections, minimalist interior'
    },
    'électricité': {
      scene: 'modern smart home living room',
      details: 'contemporary lighting fixtures, clean walls, elegant switches, ambient lighting'
    },
    'plomberie': {
      scene: 'modern bathroom with elegant fixtures',
      details: 'designer faucets, clean lines, marble surfaces, luxury atmosphere'
    },
    'isolation': {
      scene: 'cozy renovated living space',
      details: 'comfortable interior, large windows, warm atmosphere, energy efficient home'
    },
    'toiture': {
      scene: 'beautiful house exterior with new roof',
      details: 'quality slate or tile roofing, clear blue sky, well-maintained facade'
    },
    'charpente': {
      scene: 'attic renovation with exposed wooden beams',
      details: 'beautiful oak beams, skylights, modern loft conversion, warm wood tones'
    },
    'rénovation': {
      scene: 'stunning before and after home renovation',
      details: 'modern interior design, bright spaces, quality finishes, professional renovation'
    }
  };
  
  // Trouver le thème correspondant
  let selectedTheme = themes['rénovation']; // défaut
  for (const [key, theme] of Object.entries(themes)) {
    if (keywordLower.includes(key)) {
      selectedTheme = theme;
      break;
    }
  }
  
  // Construire le prompt final
  const prompt = `Professional interior photography of ${selectedTheme.scene}, ${selectedTheme.details}. 
Style: high-end real estate magazine, photorealistic, 16:9 aspect ratio.
Mood: bright, clean, inviting, luxurious yet accessible.
Technical: soft natural lighting, shallow depth of field, no text or watermarks, no people.
Location context: Paris, France renovation project.`;

  return prompt;
}

/**
 * Génère une URL placeholder pour le mode simulation
 */
function generatePlaceholderUrl(keyword) {
  const keywordLower = (keyword || '').toLowerCase();
  
  // Couleurs par thème
  let bgColor = '1a1a2e';
  let textColor = 'ffffff';
  let text = 'Rénovation';
  
  if (keywordLower.includes('cuisine')) {
    bgColor = '2d5016';
    text = 'Cuisine';
  } else if (keywordLower.includes('salle de bain') || keywordLower.includes('bain')) {
    bgColor = '164e63';
    text = 'Salle+de+Bain';
  } else if (keywordLower.includes('appartement')) {
    bgColor = '7c3aed';
    text = 'Appartement';
  } else if (keywordLower.includes('peinture')) {
    bgColor = 'dc2626';
    text = 'Peinture';
  } else if (keywordLower.includes('parquet')) {
    bgColor = '92400e';
    text = 'Parquet';
  }
  
  return `https://placehold.co/1792x1024/${bgColor}/${textColor}?text=${text}+Rénovation`;
}

module.exports = router;
