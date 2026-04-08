const apiAuth = (req, res, next) => {
  const url = req.originalUrl;

  // Autoriser GSC sans clé API
  if (url.includes('/api/gsc/')) {
    return next();
  }

  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API key is required'
    });
  }

  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key'
    });
  }

  next();
};

module.exports = apiAuth;
