/**
 * SEO Dashboard - Google Search Console Service
 */

const { google } = require('googleapis');
const { dbRun, dbAll } = require('./db');

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
 * Fetch Search Console data
 * @param {string} siteUrl - URL du site (format: sc-domain:mistralpro-reno.fr)
 * @param {number} siteId - ID du site dans la base
 * @returns {Promise<{imported: number}>}
 */
async function fetchSearchConsoleData(siteUrl, siteId) {
  // Get access token manually
  const accessToken = await getAccessToken();
  
  // Calcul dates (28 derniers jours)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 28);

  const formatDate = (d) => d.toISOString().split('T')[0];

  try {
    // Call Search Console API directly
    const response = await fetch(
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

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || JSON.stringify(data.error));
    }

    const rows = data.rows || [];

    // Supprimer anciennes données pour ce site
    await dbRun('DELETE FROM queries WHERE site_id = ?', [siteId]);

    // Insérer nouvelles données
    for (const row of rows) {
      await dbRun(
        `INSERT INTO queries (site_id, query, clicks, impressions, ctr, position)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          siteId,
          row.keys[0],
          row.clicks,
          row.impressions,
          row.ctr,
          row.position
        ]
      );
    }

    return { imported: rows.length };

  } catch (err) {
    console.error('GSC Error:', err.message);
    throw err;
  }
}

module.exports = {
  fetchSearchConsoleData
};
