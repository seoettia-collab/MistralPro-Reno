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

// GET /api/gsc/test
router.get('/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'GSC route OK'
  });
});

// GET /api/gsc/fetch - Import données GSC
router.get('/fetch', async (req, res) => {
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

// GET /api/gsc/history - Historique global ou filtré
router.get('/history', async (req, res) => {
  try {
    const { query, page } = req.query;
    const siteId = 1;

    if (query) {
      const history = await getQueryHistory(siteId, query);
      return res.json({
        status: 'ok',
        type: 'query',
        target: query,
        data: history
      });
    }

    if (page) {
      const history = await getPageHistory(siteId, page);
      return res.json({
        status: 'ok',
        type: 'page',
        target: page,
        data: history
      });
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

// GET /api/gsc/history/queries - Liste des requêtes avec historique
router.get('/history/queries', async (req, res) => {
  try {
    const siteId = 1;

    const queries = await dbAll(`
      SELECT
        query,
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
      count: queries.length,
      data: queries.map(q => ({
        query: q.query,
        daysTracked: q.days_tracked,
        totalClicks: q.total_clicks,
        totalImpressions: q.total_impressions,
        avgPosition: Math.round((q.avg_position || 0) * 10) / 10,
        firstDate: q.first_date,
        lastDate: q.last_date
      }))
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/gsc/history/pages - Liste des pages avec historique
router.get('/history/pages', async (req, res) => {
  try {
    const siteId = 1;

    const pages = await dbAll(`
      SELECT
        page_url,
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
      count: pages.length,
      data: pages.map(p => ({
        pageUrl: p.page_url,
        daysTracked: p.days_tracked,
        totalClicks: p.total_clicks,
        totalImpressions: p.total_impressions,
        avgPosition: Math.round((p.avg_position || 0) * 10) / 10,
        firstDate: p.first_date,
        lastDate: p.last_date
      }))
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/gsc/history/evolution - Évolution comparée
router.get('/history/evolution', async (req, res) => {
  try {
    const siteId = 1;

    const today = new Date();
    const currentWeekEnd = today.toISOString().split('T')[0];
    const currentWeekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const previousWeekEnd = new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const previousWeekStart = new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const currentStats = await dbGet(`
      SELECT
        SUM(clicks) as clicks,
        SUM(impressions) as impressions,
        AVG(position) as avg_position
      FROM query_daily
      WHERE site_id = ? AND date BETWEEN ? AND ?
    `, [siteId, currentWeekStart, currentWeekEnd]);

    const previousStats = await dbGet(`
      SELECT
        SUM(clicks) as clicks,
        SUM(impressions) as impressions,
        AVG(position) as avg_position
      FROM query_daily
      WHERE site_id = ? AND date BETWEEN ? AND ?
    `, [siteId, previousWeekStart, previousWeekEnd]);

    const calcEvolution = (current, previous) => {
      if (!previous || previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    res.json({
      status: 'ok',
      periods: {
        current: { start: currentWeekStart, end: currentWeekEnd },
        previous: { start: previousWeekStart, end: previousWeekEnd }
      },
      current: {
        clicks: currentStats?.clicks || 0,
        impressions: currentStats?.impressions || 0,
        avgPosition: Math.round((currentStats?.avg_position || 0) * 10) / 10
      },
      previous: {
        clicks: previousStats?.clicks || 0,
        impressions: previousStats?.impressions || 0,
        avgPosition: Math.round((previousStats?.avg_position || 0) * 10) / 10
      },
      evolution: {
        clicks: calcEvolution(currentStats?.clicks || 0, previousStats?.clicks || 0),
        impressions: calcEvolution(currentStats?.impressions || 0, previousStats?.impressions || 0),
        position: -calcEvolution(currentStats?.avg_position || 0, previousStats?.avg_position || 0)
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
