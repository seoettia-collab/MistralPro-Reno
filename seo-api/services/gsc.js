/**
 * SEO Dashboard - Google Search Console Service
 */

const { google } = require('googleapis');
const { dbRun, dbAll, dbGet } = require('./db');

/**
 * Get access token from refresh token manually
 * @returns {Promise<string>}
 */
async function getAccessToken() {
  const params = new URLSearchParams();
  params.append('client_id', process.env.GSC_CLIENT_ID);
  params.append('client_secret', process.env.GSC_CLIENT_SECRET);
  params.append('refresh_token', process.env.GSC_REFRESH_TOKEN);
  params.append('grant_type', 'refresh_token');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error_description || data.error);
  }
  
  return data.access_token;
}

/**
 * Fetch Search Console data (queries only)
 * @param {string} siteUrl - URL du site (format: sc-domain:mistralpro-reno.fr)
 * @param {number} siteId - ID du site dans la base
 * @returns {Promise<{imported: number}>}
 */
async function fetchSearchConsoleData(siteUrl, siteId) {
  const accessToken = await getAccessToken();
  
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 28);

  const formatDate = (d) => d.toISOString().split('T')[0];

  try {
    // 1. Fetch queries data (agrégé)
    const queriesResponse = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          dimensions: ['query'],
          rowLimit: 100
        })
      }
    );

    const queriesData = await queriesResponse.json();
    
    if (queriesData.error) {
      throw new Error(queriesData.error.message || JSON.stringify(queriesData.error));
    }

    const queryRows = queriesData.rows || [];

    // Supprimer anciennes données queries (agrégées)
    await dbRun('DELETE FROM queries WHERE site_id = ?', [siteId]);

    // Insérer nouvelles données queries
    for (const row of queryRows) {
      await dbRun(
        `INSERT INTO queries (site_id, query, clicks, impressions, ctr, position)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [siteId, row.keys[0], row.clicks, row.impressions, row.ctr, row.position]
      );
    }

    // 2. Fetch pages data
    const pagesResponse = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          dimensions: ['page'],
          rowLimit: 100
        })
      }
    );

    const pagesData = await pagesResponse.json();
    const pageRows = pagesData.rows || [];

    // Supprimer anciennes données pages
    await dbRun('DELETE FROM gsc_pages WHERE site_id = ?', [siteId]);

    // Insérer nouvelles données pages
    for (const row of pageRows) {
      await dbRun(
        `INSERT INTO gsc_pages (site_id, page_url, clicks, impressions, ctr, position)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [siteId, row.keys[0], row.clicks, row.impressions, row.ctr, row.position]
      );
    }

    // 3. Fetch page+query combinations
    const pageQueryResponse = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          dimensions: ['page', 'query'],
          rowLimit: 500
        })
      }
    );

    const pageQueryData = await pageQueryResponse.json();
    const pageQueryRows = pageQueryData.rows || [];

    // Supprimer anciennes données page_queries
    await dbRun('DELETE FROM page_queries WHERE site_id = ?', [siteId]);

    // Insérer nouvelles données page_queries
    for (const row of pageQueryRows) {
      await dbRun(
        `INSERT INTO page_queries (site_id, page_url, query, clicks, impressions, ctr, position)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [siteId, row.keys[0], row.keys[1], row.clicks, row.impressions, row.ctr, row.position]
      );
    }

    // 4. Fetch daily data (date + query + page) pour l'historique
    const dailyResponse = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          dimensions: ['date', 'query', 'page'],
          rowLimit: 1000
        })
      }
    );

    const dailyData = await dailyResponse.json();
    const dailyRows = dailyData.rows || [];

    // Insérer données historiques (UPSERT - ne pas écraser l'existant)
    let dailyInserted = 0;
    for (const row of dailyRows) {
      const date = row.keys[0];
      const query = row.keys[1];
      const pageUrl = row.keys[2];
      
      // Utiliser INSERT OR REPLACE pour mettre à jour si existe déjà
      await dbRun(
        `INSERT OR REPLACE INTO query_daily 
         (site_id, date, query, page_url, clicks, impressions, ctr, position)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [siteId, date, query, pageUrl, row.clicks, row.impressions, row.ctr, row.position]
      );
      dailyInserted++;
    }

    return { 
      imported: queryRows.length,
      pages: pageRows.length,
      pageQueries: pageQueryRows.length,
      dailyRecords: dailyInserted
    };

  } catch (err) {
    console.error('GSC Error:', err.message);
    throw err;
  }
}

/**
 * Récupérer l'historique d'une requête
 * @param {number} siteId
 * @param {string} query
 * @returns {Promise<Array>}
 */
async function getQueryHistory(siteId, query) {
  const rows = await dbAll(`
    SELECT date, 
           SUM(clicks) as clicks, 
           SUM(impressions) as impressions,
           AVG(ctr) as ctr,
           AVG(position) as position
    FROM query_daily 
    WHERE site_id = ? AND query = ?
    GROUP BY date
    ORDER BY date ASC
  `, [siteId, query]);
  
  return rows.map(r => ({
    date: r.date,
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: Math.round((r.ctr || 0) * 10000) / 100,
    position: Math.round((r.position || 0) * 10) / 10
  }));
}

/**
 * Récupérer l'historique d'une page
 * @param {number} siteId
 * @param {string} pageUrl
 * @returns {Promise<Array>}
 */
async function getPageHistory(siteId, pageUrl) {
  const rows = await dbAll(`
    SELECT date, 
           SUM(clicks) as clicks, 
           SUM(impressions) as impressions,
           AVG(ctr) as ctr,
           AVG(position) as position
    FROM query_daily 
    WHERE site_id = ? AND page_url = ?
    GROUP BY date
    ORDER BY date ASC
  `, [siteId, pageUrl]);
  
  return rows.map(r => ({
    date: r.date,
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: Math.round((r.ctr || 0) * 10000) / 100,
    position: Math.round((r.position || 0) * 10) / 10
  }));
}

/**
 * Récupérer les statistiques globales par jour
 * @param {number} siteId
 * @returns {Promise<Array>}
 */
async function getDailyStats(siteId) {
  const rows = await dbAll(`
    SELECT date, 
           SUM(clicks) as clicks, 
           SUM(impressions) as impressions,
           AVG(position) as avg_position
    FROM query_daily 
    WHERE site_id = ?
    GROUP BY date
    ORDER BY date ASC
  `, [siteId]);
  
  return rows.map(r => ({
    date: r.date,
    clicks: r.clicks,
    impressions: r.impressions,
    avgPosition: Math.round((r.avg_position || 0) * 10) / 10
  }));
}

module.exports = {
  fetchSearchConsoleData,
  getAccessToken,
  getQueryHistory,
  getPageHistory,
  getDailyStats
};
