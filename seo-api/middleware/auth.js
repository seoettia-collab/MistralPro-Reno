const publicRoutes = [
  '/api/gsc/data',
  '/api/gsc/test'
];

const apiAuth = (req, res, next) => {
  // Autoriser certaines routes sans API key
  if (publicRoutes.includes(req.path)) {
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
