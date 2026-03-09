/**
 * Rate Limiting Middleware
 * Limite les requêtes API à 100 par minute par IP
 */

// Stockage des requêtes par IP (en mémoire)
const requestCounts = new Map();

// Configuration
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100;    // 100 requêtes par fenêtre

// Nettoyage périodique des anciennes entrées
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestCounts.entries()) {
    if (now - data.windowStart > WINDOW_MS) {
      requestCounts.delete(ip);
    }
  }
}, WINDOW_MS);

const rateLimiter = (req, res, next) => {
  // Récupérer l'IP du client
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
             req.connection?.remoteAddress || 
             req.ip || 
             'unknown';
  
  const now = Date.now();
  
  // Récupérer ou créer les données pour cette IP
  let ipData = requestCounts.get(ip);
  
  if (!ipData || (now - ipData.windowStart > WINDOW_MS)) {
    // Nouvelle fenêtre
    ipData = {
      windowStart: now,
      count: 0
    };
  }
  
  // Incrémenter le compteur
  ipData.count++;
  requestCounts.set(ip, ipData);
  
  // Ajouter headers informatifs
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - ipData.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil((ipData.windowStart + WINDOW_MS) / 1000));
  
  // Vérifier la limite
  if (ipData.count > MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Maximum ${MAX_REQUESTS} requests per minute.`,
      retryAfter: Math.ceil((ipData.windowStart + WINDOW_MS - now) / 1000)
    });
  }
  
  next();
};

module.exports = rateLimiter;
