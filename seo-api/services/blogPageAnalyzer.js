/**
 * SEO Dashboard - Blog Page Analyzer
 * AUDIT-BLOG-01 : parse /blog.html en production pour donner à l'audit IA
 * la vision complète de la page blog publique (featured + grid + catégories).
 *
 * Retour structuré :
 *   {
 *     url: 'https://.../blog.html',
 *     fetchedAt: ISO,
 *     featured: { slug, title, excerpt, category, date_shown, read_time, image, url },
 *     cards: [ { slug, title, excerpt, category, date_shown, read_time, image, url, is_featured }, ... ],
 *     categories_available: ['Rénovation','Salle de bain',...],
 *     stats: { total_visible, featured_count, by_category: {...} },
 *     consistency: {
 *        db_slugs: [...], visible_slugs: [...],
 *        missing_on_page: [slugs en DB mais pas sur blog.html],
 *        orphans_on_page: [slugs sur blog.html mais pas en DB]
 *     }
 *   }
 */

const { getAllLive } = require('./contentCounter');

const BLOG_URL = 'https://www.mistralpro-reno.fr/blog.html';

/**
 * Extrait un attribut depuis un tag HTML (regex sûr, pas de DOM côté Node).
 */
function pick(regex, html) {
  const m = html.match(regex);
  return m ? m[1].trim() : null;
}

/**
 * Parse une chaîne de <article>...</article> (featured ou card).
 */
function parseArticleBlock(block, isFeatured = false) {
  // URL & slug
  const href = pick(/<h2>\s*<a href="([^"]+)"/, block) || pick(/href="(blog\/[^"]+)"/, block);
  const slug = href ? href.replace(/^blog\//, '').replace(/\.html$/, '') : null;

  // Titre (dans <h2><a>...</a></h2>)
  const title = pick(/<h2>\s*<a[^>]*>([^<]+)<\/a>/, block);

  // Excerpt (premier <p> après le h2)
  const excerpt = pick(/<\/h2>\s*<p>([^<]+)<\/p>/, block);

  // Catégorie : data-category + tag texte
  const dataCategory = pick(/data-category="([^"]+)"/, block);
  const tagLabel = pick(/<span class="blog-card-tag">([^<]+)<\/span>/, block);
  const category = tagLabel || dataCategory || null;

  // Date affichée (après l'icône calendrier)
  const dateShown = pick(/<\/svg>\s*(\d{1,2}\s+[a-zéû]+\s+\d{4})/i, block);

  // Temps de lecture (après icône horloge) — repérage par "min"
  const readTime = pick(/<\/svg>\s*(\d+\s*min)/i, block);

  // Image principale
  const image = pick(/<img src="([^"]+)"/, block);

  return {
    slug,
    title,
    excerpt,
    category,
    date_shown: dateShown,
    read_time: readTime,
    image,
    url: slug ? `https://www.mistralpro-reno.fr/blog/${slug}.html` : null,
    is_featured: isFeatured
  };
}

/**
 * Extrait les catégories du menu de filtres.
 */
function parseCategoriesFromFilters(html) {
  const section = pick(/<div class="blog-filters"[\s\S]*?<\/div>/, html)
    || pick(/<nav class="blog-nav"[\s\S]*?<\/nav>/, html)
    || '';
  const matches = [...(section || '').matchAll(/>([A-Za-zÀ-ÿ\s]+)<\/button>/g)];
  return matches.map(m => m[1].trim()).filter(c => c && c !== 'Tous');
}

/**
 * Analyse complète de blog.html.
 */
async function analyzeBlogPage() {
  const response = await fetch(BLOG_URL, {
    headers: { 'User-Agent': 'MistralProReno-BlogAnalyzer/1.0' }
  });
  if (!response.ok) {
    throw new Error(`blog.html non accessible (HTTP ${response.status})`);
  }
  const html = await response.text();

  // Article featured (un seul)
  const featuredMatch = html.match(/<article class="featured-card"[\s\S]*?<\/article>/);
  const featured = featuredMatch ? parseArticleBlock(featuredMatch[0], true) : null;

  // Cartes de la grille
  const cardRegex = /<article class="blog-card"[\s\S]*?<\/article>/g;
  const cardMatches = [...html.matchAll(cardRegex)];
  const cards = cardMatches.map(m => parseArticleBlock(m[0], false));

  // Dédoublonnage par slug (au cas où)
  const seen = new Set();
  const uniqueCards = [];
  for (const c of cards) {
    if (!c.slug || seen.has(c.slug)) continue;
    seen.add(c.slug);
    uniqueCards.push(c);
  }

  // Catégories disponibles dans les filtres
  const categoriesAvailable = parseCategoriesFromFilters(html);

  // Stats
  const byCategory = {};
  [featured, ...uniqueCards].filter(Boolean).forEach(a => {
    const key = a.category || 'Sans catégorie';
    byCategory[key] = (byCategory[key] || 0) + 1;
  });

  // Vérif cohérence avec DB contents
  let dbSlugs = [];
  try {
    const dbLive = await getAllLive();
    dbSlugs = dbLive.map(r => r.slug_suggested).filter(Boolean);
  } catch (e) {
    console.warn('[AUDIT_BLOG_01] DB non accessible:', e.message);
  }

  const visibleSlugs = [featured, ...uniqueCards]
    .filter(Boolean)
    .map(a => a.slug)
    .filter(Boolean);

  const visibleSet = new Set(visibleSlugs);
  const dbSet = new Set(dbSlugs);

  const missingOnPage = dbSlugs.filter(s => !visibleSet.has(s));
  const orphansOnPage = visibleSlugs.filter(s => !dbSet.has(s));

  console.log('[AUDIT_BLOG_01_ANALYZED]', {
    featured: featured?.slug,
    cards_count: uniqueCards.length,
    db_count: dbSlugs.length,
    missing_on_page: missingOnPage.length,
    orphans_on_page: orphansOnPage.length
  });

  return {
    url: BLOG_URL,
    fetched_at: new Date().toISOString(),
    featured,
    cards: uniqueCards,
    categories_available: categoriesAvailable,
    stats: {
      total_visible: visibleSlugs.length,
      featured_count: featured ? 1 : 0,
      cards_count: uniqueCards.length,
      by_category: byCategory
    },
    consistency: {
      db_slugs: dbSlugs,
      visible_slugs: visibleSlugs,
      missing_on_page: missingOnPage,
      orphans_on_page: orphansOnPage,
      is_consistent: missingOnPage.length === 0 && orphansOnPage.length === 0
    }
  };
}

module.exports = { analyzeBlogPage };
