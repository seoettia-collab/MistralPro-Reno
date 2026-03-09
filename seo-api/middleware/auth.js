/**
 * API Authentication Middleware
 * Vérifie la présence et validité de la clé API
 */

const apiAuth = (req, res, next) => {
  // Récupérer la clé API depuis le header
  const apiKey = req.headers['x-api-key'];
  
  // Vérifier si la clé est présente
  if (!apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API key is required'
    });
  }
  
  // Vérifier si la clé est valide
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key'
    });
  }
  
  // Clé valide, continuer
  next();
};

module.exports = apiAuth;
