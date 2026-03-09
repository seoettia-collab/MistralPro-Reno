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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
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

// Démarrage serveur avec init schema
const startServer = async () => {
  try {
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
