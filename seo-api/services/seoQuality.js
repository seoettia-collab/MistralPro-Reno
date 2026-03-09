/**
 * SEO Dashboard - Service Contrôle Qualité SEO
 * Vérifie la qualité minimale des pages générées avant publication
 */

const { dbGet } = require('./db');
const { generateSEOContent, generatePageHTML } = require('./seoExecutor');

/**
 * Critères de qualité SEO
 */
const QUALITY_CRITERIA = {
  title: {
    minLength: 30,
    maxLength: 60,
    required: true
  },
  metaDescription: {
    minLength: 120,
    maxLength: 160,
    required: true
  },
  h1: {
    required: true,
    maxCount: 1
  },
  h2: {
    minCount: 3
  },
  content: {
    minWords: 300
  },
  internalLinks: {
    minCount: 2
  },
  canonical: {
    required: true
  },
  noindex: {
    mustBeAbsent: true
  }
};

/**
 * Analyser le HTML et extraire les éléments SEO
 * @param {string} html
 * @returns {Object}
 */
function parseHTML(html) {
  // Extraire le title
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : null;

  // Extraire la meta description
  const metaDescMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : null;

  // Extraire le H1
  const h1Matches = html.match(/<h1[^>]*>([^<]+)<\/h1>/gi) || [];
  const h1Count = h1Matches.length;
  const h1Text = h1Matches.length > 0 ? h1Matches[0].replace(/<\/?h1[^>]*>/gi, '').trim() : null;

  // Extraire les H2
  const h2Matches = html.match(/<h2[^>]*>[^<]+<\/h2>/gi) || [];
  const h2Count = h2Matches.length;

  // Compter les mots dans le body
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : html;
  const textContent = bodyContent
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length;

  // Compter les liens internes
  const internalLinkMatches = html.match(/<a[^>]+href=["'][^"']*(?:\/|mistralpro-reno\.fr)[^"']*["'][^>]*>/gi) || [];
  const internalLinksCount = internalLinkMatches.length;

  // Vérifier canonical
  const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  const canonical = canonicalMatch ? canonicalMatch[1] : null;

  // Vérifier noindex
  const noindexMatch = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex[^"']*["']/i);
  const hasNoindex = !!noindexMatch;

  // Extraire le slug depuis canonical ou og:url
  const ogUrlMatch = html.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i);
  const pageUrl = canonical || (ogUrlMatch ? ogUrlMatch[1] : null);
  const slug = pageUrl ? pageUrl.split('/').pop().replace('.html', '') : null;

  return {
    title,
    titleLength: title ? title.length : 0,
    metaDescription,
    metaDescriptionLength: metaDescription ? metaDescription.length : 0,
    h1Text,
    h1Count,
    h2Count,
    wordCount,
    internalLinksCount,
    canonical,
    hasNoindex,
    slug,
    pageUrl
  };
}

/**
 * Évaluer la qualité SEO
 * @param {Object} parsed - Résultat de parseHTML
 * @returns {Object}
 */
function evaluateQuality(parsed) {
  const checks = [];
  let passCount = 0;
  let warningCount = 0;
  let failCount = 0;

  // 1. Title
  if (!parsed.title) {
    checks.push({ name: 'title', status: 'fail', message: 'Title manquant' });
    failCount++;
  } else if (parsed.titleLength < QUALITY_CRITERIA.title.minLength) {
    checks.push({ name: 'title', status: 'warning', message: `Title trop court (${parsed.titleLength} < ${QUALITY_CRITERIA.title.minLength})` });
    warningCount++;
  } else if (parsed.titleLength > QUALITY_CRITERIA.title.maxLength) {
    checks.push({ name: 'title', status: 'warning', message: `Title trop long (${parsed.titleLength} > ${QUALITY_CRITERIA.title.maxLength})` });
    warningCount++;
  } else {
    checks.push({ name: 'title', status: 'pass', message: `Title OK (${parsed.titleLength} caractères)` });
    passCount++;
  }

  // 2. Meta Description
  if (!parsed.metaDescription) {
    checks.push({ name: 'metaDescription', status: 'fail', message: 'Meta description manquante' });
    failCount++;
  } else if (parsed.metaDescriptionLength < QUALITY_CRITERIA.metaDescription.minLength) {
    checks.push({ name: 'metaDescription', status: 'warning', message: `Meta description courte (${parsed.metaDescriptionLength} < ${QUALITY_CRITERIA.metaDescription.minLength})` });
    warningCount++;
  } else if (parsed.metaDescriptionLength > QUALITY_CRITERIA.metaDescription.maxLength) {
    checks.push({ name: 'metaDescription', status: 'warning', message: `Meta description longue (${parsed.metaDescriptionLength} > ${QUALITY_CRITERIA.metaDescription.maxLength})` });
    warningCount++;
  } else {
    checks.push({ name: 'metaDescription', status: 'pass', message: `Meta description OK (${parsed.metaDescriptionLength} caractères)` });
    passCount++;
  }

  // 3. H1
  if (parsed.h1Count === 0) {
    checks.push({ name: 'h1', status: 'fail', message: 'H1 manquant' });
    failCount++;
  } else if (parsed.h1Count > 1) {
    checks.push({ name: 'h1', status: 'warning', message: `Plusieurs H1 détectés (${parsed.h1Count})` });
    warningCount++;
  } else {
    checks.push({ name: 'h1', status: 'pass', message: 'H1 unique présent' });
    passCount++;
  }

  // 4. H2 (minimum 3)
  if (parsed.h2Count < QUALITY_CRITERIA.h2.minCount) {
    checks.push({ name: 'h2', status: 'warning', message: `Peu de H2 (${parsed.h2Count} < ${QUALITY_CRITERIA.h2.minCount})` });
    warningCount++;
  } else {
    checks.push({ name: 'h2', status: 'pass', message: `${parsed.h2Count} H2 présents` });
    passCount++;
  }

  // 5. Nombre de mots
  if (parsed.wordCount < QUALITY_CRITERIA.content.minWords) {
    checks.push({ name: 'wordCount', status: 'fail', message: `Contenu trop court (${parsed.wordCount} < ${QUALITY_CRITERIA.content.minWords} mots)` });
    failCount++;
  } else {
    checks.push({ name: 'wordCount', status: 'pass', message: `${parsed.wordCount} mots` });
    passCount++;
  }

  // 6. Liens internes
  if (parsed.internalLinksCount < QUALITY_CRITERIA.internalLinks.minCount) {
    checks.push({ name: 'internalLinks', status: 'warning', message: `Peu de liens internes (${parsed.internalLinksCount} < ${QUALITY_CRITERIA.internalLinks.minCount})` });
    warningCount++;
  } else {
    checks.push({ name: 'internalLinks', status: 'pass', message: `${parsed.internalLinksCount} liens internes` });
    passCount++;
  }

  // 7. Canonical
  if (!parsed.canonical) {
    checks.push({ name: 'canonical', status: 'fail', message: 'Canonical manquante' });
    failCount++;
  } else {
    checks.push({ name: 'canonical', status: 'pass', message: 'Canonical présente' });
    passCount++;
  }

  // 8. Noindex
  if (parsed.hasNoindex) {
    checks.push({ name: 'noindex', status: 'fail', message: 'Noindex détecté (bloque indexation)' });
    failCount++;
  } else {
    checks.push({ name: 'noindex', status: 'pass', message: 'Pas de noindex' });
    passCount++;
  }

  // 9. Slug cohérent
  if (!parsed.slug || parsed.slug.length < 3) {
    checks.push({ name: 'slug', status: 'warning', message: 'Slug absent ou trop court' });
    warningCount++;
  } else if (parsed.slug.includes(' ') || parsed.slug !== parsed.slug.toLowerCase()) {
    checks.push({ name: 'slug', status: 'warning', message: 'Slug non optimisé' });
    warningCount++;
  } else {
    checks.push({ name: 'slug', status: 'pass', message: `Slug OK: ${parsed.slug}` });
    passCount++;
  }

  // Déterminer le statut global
  let globalStatus;
  if (failCount > 0) {
    globalStatus = 'fail';
  } else if (warningCount > 2) {
    globalStatus = 'warning';
  } else {
    globalStatus = 'pass';
  }

  return {
    status: globalStatus,
    score: Math.round((passCount / checks.length) * 100),
    summary: {
      pass: passCount,
      warning: warningCount,
      fail: failCount,
      total: checks.length
    },
    checks
  };
}

/**
 * Contrôler la qualité SEO d'un contenu
 * @param {number} contentId
 * @returns {Promise<Object>}
 */
async function checkContentQuality(contentId) {
  // Récupérer le contenu
  const content = await dbGet('SELECT * FROM contents WHERE id = ?', [contentId]);
  
  if (!content) {
    throw new Error('Contenu non trouvé');
  }

  // Générer le contenu SEO
  const seoContent = generateSEOContent({
    query: content.keyword,
    contentType: content.type === 'blog' ? 'article' : 'service'
  });

  // Générer le HTML
  const html = generatePageHTML(seoContent);

  // Parser le HTML
  const parsed = parseHTML(html);

  // Évaluer la qualité
  const quality = evaluateQuality(parsed);

  return {
    contentId,
    keyword: content.keyword,
    type: content.type,
    parsed: {
      title: parsed.title,
      titleLength: parsed.titleLength,
      metaDescription: parsed.metaDescription ? parsed.metaDescription.substring(0, 50) + '...' : null,
      metaDescriptionLength: parsed.metaDescriptionLength,
      h1: parsed.h1Text,
      h2Count: parsed.h2Count,
      wordCount: parsed.wordCount,
      internalLinksCount: parsed.internalLinksCount,
      canonical: parsed.canonical,
      hasNoindex: parsed.hasNoindex,
      slug: parsed.slug
    },
    quality
  };
}

module.exports = {
  parseHTML,
  evaluateQuality,
  checkContentQuality,
  QUALITY_CRITERIA
};
