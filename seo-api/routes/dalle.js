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
 * Style : photo immobilière réaliste, magazine, exploitable commercialement
 */
function generateImagePrompt(keyword, contentType = 'blog') {
  const keywordLower = (keyword || '').toLowerCase();
  
  // Thèmes visuels pour rénovation (style photo immobilière réaliste)
  const themes = {
    'cuisine': {
      scene: 'renovated modern kitchen',
      details: 'clean marble countertops, wooden cabinets, stainless steel appliances, tiled backsplash, clear view of the entire room'
    },
    'salle de bain': {
      scene: 'renovated bathroom',
      details: 'white tiles, modern vanity unit, wall-mounted mirror, walk-in shower with glass panel, chrome fixtures'
    },
    'appartement': {
      scene: 'renovated Parisian apartment living room',
      details: 'oak parquet flooring, white walls, large windows, neutral furniture, clean lines'
    },
    'maison': {
      scene: 'renovated house interior living space',
      details: 'open plan layout, wooden floors, white painted walls, modern furniture, natural daylight'
    },
    'peinture': {
      scene: 'freshly painted living room',
      details: 'smooth matte walls, neutral beige or white tones, wooden floor, simple furniture'
    },
    'parquet': {
      scene: 'room with new hardwood flooring',
      details: 'oak parquet in herringbone pattern, clean baseboards, minimal furniture, natural light from window'
    },
    'électricité': {
      scene: 'modern living room with contemporary lighting',
      details: 'recessed ceiling lights, wall switches, clean white walls, simple decor'
    },
    'plomberie': {
      scene: 'modern bathroom with new plumbing fixtures',
      details: 'chrome faucets, white ceramic sink, wall-mounted toilet, tiled floor'
    },
    'isolation': {
      scene: 'cozy renovated living room',
      details: 'double-glazed windows, warm interior, radiator, comfortable atmosphere'
    },
    'toiture': {
      scene: 'house exterior with new roof',
      details: 'slate or tile roofing, clean gutters, blue sky background, well-maintained facade'
    },
    'charpente': {
      scene: 'attic conversion with exposed wooden beams',
      details: 'oak ceiling beams, skylight window, wooden floor, simple furnishing'
    },
    'rénovation': {
      scene: 'renovated apartment interior',
      details: 'modern finishes, parquet floor, white walls, natural light, clean design'
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
  
  // Construire le prompt final avec règles strictes
  const prompt = `Professional real estate photography of a ${selectedTheme.scene}.

Scene details: ${selectedTheme.details}.

COMPOSITION RULES:
- Full room view, nothing cropped at edges
- Camera at chest height (1.2m from floor)
- Perfectly straight horizon line
- Wide-angle lens (24mm), no distortion
- Subject centered, walls visible on both sides
- Floor and ceiling partially visible

LIGHTING RULES:
- Soft natural daylight from windows
- No harsh shadows, no overexposure
- No lens flare, no glow effects
- Even illumination across the room

QUALITY RULES:
- Sharp focus on entire scene
- No motion blur, no bokeh
- No vignette, no color cast
- Clean professional look

STRICT PROHIBITIONS:
- No black bars or letterboxing
- No cinematic effects
- No people, pets, text, watermarks
- No artificial dramatic lighting

Output: Real estate magazine style, Paris property agency quality.
Format: Landscape 1.75:1 ratio, fill entire frame edge to edge.`;

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
