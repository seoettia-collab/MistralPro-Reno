/**
 * SEO Dashboard - SEO Score Service
 */

const { dbAll, dbGet } = require('./db');

// Poids des catégories
const WEIGHTS = {
  technique: 0.30,
  contenu: 0.40,
  performance: 0.30
};

/**
 * Calculer le score technique (audits)
 * @returns {Promise<{score: number, details: Object}>}
 */
async function calculateTechniqueScore() {
  const audits = await dbAll(`
    SELECT * FROM audits
  `);

  if (audits.length === 0) {
    return { score: 0, details: { pages: 0, title: 0, h1: 0, alt: 0 } };
  }

  const totalPages = audits.length;
  const pagesWithTitle = audits.filter(a => a.has_title).length;
  const pagesWithH1 = audits.filter(a => a.has_h1).length;
  const totalAltMissing = audits.reduce((sum, a) => sum + (a.alt_missing || 0), 0);

  // Score title : % de pages avec title
  const titleScore = (pagesWithTitle / totalPages) * 100;

  // Score H1 : % de pages avec H1
  const h1Score = (pagesWithH1 / totalPages) * 100;

  // Score ALT : pénalité si images sans ALT (max 20 points de pénalité)
  const altPenalty = Math.min(totalAltMissing * 5, 20);
  const altScore = 100 - altPenalty;

  // Score technique moyen
  const score = Math.round((titleScore + h1Score + altScore) / 3);

  return {
    score,
    details: {
      pages: totalPages,
      title_pct: Math.round(titleScore),
      h1_pct: Math.round(h1Score),
      alt_missing: totalAltMissing
    }
  };
}

/**
 * Calculer le score contenu
 * AUDIT-COUNT-02 : utilise LIVE_STATUSES canonique pour 'published'
 * @returns {Promise<{score: number, details: Object}>}
 */
async function calculateContenuScore() {
  const stats = await dbGet(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status IN ('live','deployed','published') THEN 1 ELSE 0 END) as published,
      SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
      SUM(CASE WHEN status IN ('ready','validated') THEN 1 ELSE 0 END) as validated
    FROM contents
  `);

  const total = stats.total || 0;
  const published = stats.published || 0;
  const draft = stats.draft || 0;
  const validated = stats.validated || 0;

  if (total === 0) {
    return { score: 0, details: { total: 0, published: 0, draft: 0, validated: 0 } };
  }

  // Score basé sur le ratio de contenus publiés/validés
  // Publié = 100%, Validé = 75%, Draft = 25%, Idée = 10%
  const publishedScore = published * 100;
  const validatedScore = validated * 75;
  const draftScore = draft * 25;
  const ideaScore = (total - published - validated - draft) * 10;

  const maxScore = total * 100;
  const currentScore = publishedScore + validatedScore + draftScore + ideaScore;

  const score = Math.round((currentScore / maxScore) * 100);

  return {
    score: Math.min(score, 100),
    details: {
      total,
      published,
      draft,
      validated
    }
  };
}

/**
 * Calculer le score performance (Search Console)
 * @returns {Promise<{score: number, details: Object}>}
 */
async function calculatePerformanceScore() {
  const stats = await dbGet(`
    SELECT 
      COUNT(*) as queries,
      COALESCE(SUM(clicks), 0) as clicks,
      COALESCE(SUM(impressions), 0) as impressions,
      COALESCE(AVG(position), 0) as avg_position
    FROM queries
  `);

  const queries = stats.queries || 0;
  const clicks = stats.clicks || 0;
  const impressions = stats.impressions || 0;
  const avgPosition = stats.avg_position || 0;

  if (queries === 0 || impressions === 0) {
    return { score: 0, details: { queries: 0, clicks: 0, impressions: 0, avg_position: 0 } };
  }

  // CTR score (max 40 points)
  const ctr = (clicks / impressions) * 100;
  const ctrScore = Math.min(ctr * 10, 40); // 4% CTR = 40 points

  // Position score (max 40 points)
  // Position 1 = 40 points, Position 10 = 20 points, Position 20+ = 0
  let positionScore = 0;
  if (avgPosition <= 1) {
    positionScore = 40;
  } else if (avgPosition <= 10) {
    positionScore = 40 - ((avgPosition - 1) * 2.2);
  } else if (avgPosition <= 20) {
    positionScore = 20 - ((avgPosition - 10) * 2);
  }

  // Volume score (max 20 points)
  // Basé sur le nombre de requêtes
  const volumeScore = Math.min(queries * 2, 20);

  const score = Math.round(ctrScore + positionScore + volumeScore);

  return {
    score: Math.min(score, 100),
    details: {
      queries,
      clicks,
      impressions,
      avg_position: Math.round(avgPosition * 10) / 10,
      ctr: Math.round(ctr * 100) / 100
    }
  };
}

/**
 * Calculer le score SEO global
 * @returns {Promise<Object>}
 */
async function calculateSeoScore() {
  const technique = await calculateTechniqueScore();
  const contenu = await calculateContenuScore();
  const performance = await calculatePerformanceScore();

  // Score pondéré
  const globalScore = Math.round(
    technique.score * WEIGHTS.technique +
    contenu.score * WEIGHTS.contenu +
    performance.score * WEIGHTS.performance
  );

  // Déterminer le niveau
  let level, color;
  if (globalScore >= 71) {
    level = 'bon';
    color = 'green';
  } else if (globalScore >= 41) {
    level = 'moyen';
    color = 'orange';
  } else {
    level = 'faible';
    color = 'red';
  }

  return {
    score: globalScore,
    level,
    color,
    breakdown: {
      technique: {
        score: technique.score,
        weight: WEIGHTS.technique * 100,
        details: technique.details
      },
      contenu: {
        score: contenu.score,
        weight: WEIGHTS.contenu * 100,
        details: contenu.details
      },
      performance: {
        score: performance.score,
        weight: WEIGHTS.performance * 100,
        details: performance.details
      }
    }
  };
}

module.exports = {
  calculateSeoScore,
  calculateTechniqueScore,
  calculateContenuScore,
  calculatePerformanceScore
};
