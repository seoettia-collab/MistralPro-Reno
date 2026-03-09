/**
 * Error Handler Middleware
 * Gestion centralisée des erreurs API
 */

// Logger d'erreurs
const logError = (err, req) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
  
  console.error(`[${timestamp}] ERROR ${method} ${url} - IP: ${ip}`);
  console.error(`  Message: ${err.message}`);
  console.error(`  Stack: ${err.stack?.split('\n').slice(0, 3).join('\n')}`);
};

// Middleware 404 - Route non trouvée
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
};

// Middleware erreurs globales
const errorHandler = (err, req, res, next) => {
  // Logger l'erreur
  logError(err, req);
  
  // Déterminer le code de statut
  const statusCode = err.statusCode || err.status || 500;
  
  // Construire la réponse
  const response = {
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  };
  
  // En développement, ajouter la stack trace
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }
  
  res.status(statusCode).json(response);
};

// Wrapper async pour capturer les erreurs dans les routes async
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  notFoundHandler,
  errorHandler,
  asyncHandler,
  logError
};
