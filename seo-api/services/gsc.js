/**
 * SEO Dashboard - Google Search Console Service
 */

const { google } = require('googleapis');
const { dbRun, dbAll } = require('./db');

// Configuration OAuth2
const oauth2Client = new google.auth.OAuth2(
  process.env.GSC_CLIENT_ID,
  process.env.GSC_CLIENT_SECRET
);

// Set refresh token
oauth2Client.setCredentials({
  refresh_token: process.env.GSC_REFRESH_TOKEN
});

const searchconsole = google.searchconsole({ version: 'v1', auth: oauth2Client });

/**
 * Fetch Search Console data
 * @param {string} siteUrl - URL du site (format: sc-domain:mistralpro-reno.fr)
 * @param {number} siteId - ID du site dans la base
 * @returns {Promise<{imported: number}>}
 */
async function fetchSearchConsoleData(siteUrl, siteId) {
  // Calcul dates (28 derniers jours)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 28);

  const formatDate = (d) => d.toISOString().split('T')[0];

  try {
    const response = await searchconsole.searchanalytics.query({
      siteUrl: siteUrl,
      requestBody: {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        dimensions: ['query'],
        rowLimit: 100
      }
    });

    const rows = response.data.rows || [];

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
