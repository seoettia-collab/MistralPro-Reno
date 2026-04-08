/**
 * SEO Dashboard - Routes Google Search Console
 */

const express = require('express');
const router = express.Router();
const {
  fetchSearchConsoleData,
  getQueryHistory,
  getPageHistory,
  getDailyStats
} = require('../services/gsc');
const { generateOpportunities } = require('../services/opportunities');
const { dbGet, dbAll } = require('../services/db');

// TEST
router.get('/gsc/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'GSC route OK'
  });
});

// FETCH
router.get('/gsc/fetch', async (req, res) => {
  try {
    const site = await dbGet('SELECT * FROM sites WHERE id = 1');

    if (!site) {
      return res.status(404).json({ status: 'error', message: 'Site not found' });
    }

    const siteUrl = `sc-domain:${site.domain}`;
    const importResult = await fetchSearchConsoleData(siteUrl, site.id);
    const opportunitiesResult = await generateOpportunities(site.id);

    res.json({
      status: 'ok',
      imported: importResult.imported,
      pages: importResult.pages,
      pageQueries: importResult.pageQueries,
      dailyRecords: importResult.dailyRecords,
      opportunities: {
        generated: opportunitiesResult.generated,
        updated: opportunitiesResult.skipped
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// HISTORY
router.get('/gsc/history', async (req, res) => {
  try {
    const { query, page } = req.query;
    const siteId = 1;

    if (query) {
      const history = await getQueryHistory(siteId, query);
      return res.json({ status: 'ok', type: 'query', target: query, data: history });
    }

    if (page) {
      const history = await getPageHistory(siteId, page);
      return res.json({ status: 'ok', type: 'page', target: page, data: history });
    }

    const dailyStats = await getDailyStats(siteId);

    res.json({
      status: 'ok',
      type: 'global',
      data: dailyStats
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// QUERIES
router.get('/gsc/history/queries', async (req, res) => {
  try {
    const siteId = 1;

    const queries = await dbAll(`
      SELECT query,
      COUNT(DISTINCT date) as days_tracked,
      SUM(clicks) as total_clicks,
      SUM(impressions) as total_impressions,
      AVG(position) as avg_position,
      MIN(date) as first_date,
      MAX(date) as last_date
      FROM query_daily 
      WHERE site_id = ?
      GROUP BY query
      ORDER BY total_impressions DESC
      LIMIT 50
    `, [siteId]);

    res.json({
      status: 'ok',
      data: queries
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// PAGES
router.get('/gsc/history/pages', async (req, res) => {
  try {
    const siteId = 1;

    const pages = await dbAll(`
      SELECT page_url,
      COUNT(DISTINCT date) as days_tracked,
      SUM(clicks) as total_clicks,
      SUM(impressions) as total_impressions,
      AVG(position) as avg_position,
      MIN(date) as first_date,
      MAX(date) as last_date
      FROM query_daily 
      WHERE site_id = ?
      GROUP BY page_url
      ORDER BY total_impressions DESC
      LIMIT 50
    `, [siteId]);

    res.json({
      status: 'ok',
      data: pages
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// EVOLUTION
router.get('/gsc/history/evolution', async (req, res) => {
  try {
    const siteId = 1;

    const today = new Date();
    const currentWeekEnd = today.toISOString().split('T')[0];
    const currentWeekStart = new Date(today - 7 * 86400000).toISOString().split('T')[0];
    const previousWeekEnd = new Date(today - 8 * 86400000).toISOString().split('T')[0];
    const previousWeekStart = new Date(today - 15 * 86400000).toISOString().split('T')[0];

    const currentStats = await dbGet(`
      SELECT SUM(clicks) as clicks, SUM(impressions) as impressions, AVG(position) as avg_position
      FROM query_daily WHERE site_id = ? AND date BETWEEN ? AND ?
    `, [siteId, currentWeekStart, currentWeekEnd]);

    const previousStats = await dbGet(`
      SELECT SUM(clicks) as clicks, SUM(impressions) as impressions, AVG(position) as avg_position
      FROM query_daily WHERE site_id = ? AND date BETWEEN ? AND ?
    `, [siteId, previousWeekStart, previousWeekEnd]);

    res.json({
      status: 'ok',
      current: currentStats,
      previous: previousStats
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
