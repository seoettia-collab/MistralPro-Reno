/**
 * SEO Dashboard API - Server
 * Mistral Pro Reno
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { db, dbAll } = require('./services/db');
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

// Middleware
app.use(cors());
app.use(express.json());

// Route test /api/health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

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

// Démarrage serveur
app.listen(PORT, () => {
  console.log(`SEO API running on port ${PORT}`);
});
