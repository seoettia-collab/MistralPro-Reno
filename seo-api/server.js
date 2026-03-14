/**
 * SEO Dashboard API - Server
 * Mistral Pro Reno
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiAuth = require('./middleware/auth');
const rateLimiter = require('./middleware/rateLimiter');
const { db, dbAll, initSchema } = require('./services/db');
const seoRoutes = require('./routes/seo');
const gscRoutes = require('./routes/gsc');
const opportunitiesRoutes = require('./routes/opportunities');
const contentRoutes = require('./routes/content');
const briefsRoutes = require('./routes/briefs');
const statsRoutes = require('./routes/stats');
const auditRoutes = require('./routes/audit');
const alertsRoutes = require('./routes/alerts');
const editorialRoutes = require('./routes/editorial');
const conversionsRoutes = require('./routes/conversions');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware CORS - autoriser le frontend OVH
const corsOptions = {
  origin: [
    'https://www.mistralpro-reno.fr',
    'https://mistralpro-reno.fr',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
};
app.use(cors(corsOptions));
app.use(express.json());

// Route test /api/health (sans authentification ni rate limiting pour monitoring)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Appliquer rate limiting sur toutes les routes /api/*
app.use('/api', rateLimiter);

// Appliquer middleware authentification API sur toutes les routes /api/*
app.use('/api', apiAuth);

// Route test /api/db-check
app.get('/api/db-check', async (req, res) => {
  try {
    const rows = await dbAll("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    const tables = rows.map(r => r.name);
    res.json({ status: 'ok', tables });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Routes SEO
app.use('/api', seoRoutes);

// Routes GSC
app.use('/api', gscRoutes);

// Routes Opportunities
app.use('/api', opportunitiesRoutes);

// Routes Content
app.use('/api', contentRoutes);

// Routes Briefs
app.use('/api', briefsRoutes);

// Routes Stats
app.use('/api', statsRoutes);

// Routes Audit
app.use('/api', auditRoutes);

// Routes Alerts
app.use('/api', alertsRoutes);

// Routes Editorial
app.use('/api', editorialRoutes);

// Routes Conversions
app.use('/api', conversionsRoutes);

// Routes Impact Analysis
const impactRoutes = require('./routes/impact');
app.use('/api', impactRoutes);

// Routes Actions (Decision Engine)
const actionsRoutes = require('./routes/actions');
app.use('/api', actionsRoutes);

// Routes Publisher (Auto SEO)
const publisherRoutes = require('./routes/publisher');
app.use('/api', publisherRoutes);

// Routes Competitors
const competitorsRoutes = require('./routes/competitors');
app.use('/api', competitorsRoutes);

// Routes SEO Score
const seoScoreRoutes = require('./routes/seoScore');
app.use('/api', seoScoreRoutes);

// Routes History
const historyRoutes = require('./routes/history');
app.use('/api', historyRoutes);

// Routes Pages Analysis
const pagesRoutes = require('./routes/pages');
app.use('/api', pagesRoutes);

// Routes SEO Executor
const seoExecutorRoutes = require('./routes/seoExecutor');
app.use('/api', seoExecutorRoutes);

// Routes Audit IA (Claude)
const auditIARoutes = require('./routes/auditIA');
app.use('/api', auditIARoutes);

// Routes DALL-E (Image Generation)
const dalleRoutes = require('./routes/dalle');
app.use('/api', dalleRoutes);

// Routes Optimize (Page Optimization)
const optimizeRoutes = require('./routes/optimize');
app.use('/api', optimizeRoutes);

// Routes GitHub (Publication)
const githubRoutes = require('./routes/github');
app.use('/api', githubRoutes);

// Routes Content Generation (Claude API)
const contentGenRoutes = require('./routes/contentGen');
app.use('/api', contentGenRoutes);

// Routes Blog Index (Mise à jour blog.html)
const blogIndexRoutes = require('./routes/blogIndex');
app.use('/api', blogIndexRoutes);

// Route RESET DATABASE (remise à zéro)
app.post('/api/reset-database', async (req, res) => {
  try {
    console.log('[RESET] Début remise à zéro base de données...');
    
    // Tables à vider (garder la structure, supprimer les données)
    const tablesToClear = [
      'opportunities',
      'contents',
      'briefs',
      'alerts',
      'history',
      'queries',
      'gsc_pages',
      'page_queries',
      'query_daily',
      'audits',
      'optimization_history'
    ];
    
    for (const table of tablesToClear) {
      try {
        await db.execute(`DELETE FROM ${table}`);
        console.log(`[RESET] Table ${table} vidée`);
      } catch (e) {
        console.warn(`[RESET] Table ${table} n'existe pas ou erreur:`, e.message);
      }
    }
    
    // Garder le site principal
    await db.execute("DELETE FROM sites WHERE domain != 'mistralpro-reno.fr'");
    
    // Réinitialiser les pages mais garder les vraies
    await db.execute("DELETE FROM pages WHERE url LIKE '%test%'");
    
    console.log('[RESET] Base de données remise à zéro');
    
    res.json({
      status: 'ok',
      message: 'Base de données remise à zéro',
      tablesCleared: tablesToClear
    });
    
  } catch (err) {
    console.error('[RESET] Erreur:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Import error handlers
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// 404 handler - doit être après toutes les routes
app.use(notFoundHandler);

// Error handler global - doit être le dernier middleware
app.use(errorHandler);

// Gestion erreurs non capturées
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err.message);
  console.error(err.stack);
  // Ne pas exit en production Vercel
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
});

// Démarrage serveur avec init schema
const startServer = async () => {
  try {
    // Version log pour debug déploiement
    console.log('[Server] Version: 2.12.1 - GitHub routes enabled');
    console.log('[Server] Routes disponibles: github/publish, github/check-file');
    
    await initSchema();
    app.listen(PORT, () => {
      console.log(`SEO API running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();

