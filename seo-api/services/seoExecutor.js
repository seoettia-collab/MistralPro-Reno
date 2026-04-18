/**
 * SEO Dashboard - Auto SEO Executor Service
 * Génération automatique de pages SEO optimisées
 */

const { dbAll, dbRun, dbGet } = require('./db');

/**
 * Templates de contenu par type
 */
const CONTENT_TEMPLATES = {
  service: {
    intro: (keyword, location) => `
Vous recherchez un professionnel pour **${keyword}** ${location ? `à ${location}` : ''} ? Mistral Pro Reno est votre partenaire de confiance pour tous vos projets de rénovation en Île-de-France.

Notre équipe d'experts intervient rapidement et efficacement pour répondre à vos besoins, avec un engagement qualité et des tarifs transparents.
    `.trim(),
    
    whyUs: (keyword) => `
## Pourquoi choisir Mistral Pro Reno pour ${keyword} ?

- **Expertise reconnue** : Plus de 10 ans d'expérience dans la rénovation
- **Intervention rapide** : Prise en charge sous 48h en Île-de-France
- **Devis gratuit** : Estimation détaillée sans engagement
- **Garantie décennale** : Tous nos travaux sont assurés
- **Artisans qualifiés** : Équipe certifiée et formée aux dernières normes
    `.trim(),
    
    services: (keyword) => `
## Nos services ${keyword}

Mistral Pro Reno propose une gamme complète de prestations :

### Diagnostic et expertise
Nous réalisons un diagnostic complet de votre situation pour identifier les travaux nécessaires et vous proposer les solutions les plus adaptées.

### Travaux de rénovation
Notre équipe prend en charge l'intégralité des travaux, de la démolition aux finitions, en respectant les délais convenus.

### Suivi et garantie
Nous assurons un suivi rigoureux du chantier et restons disponibles après la fin des travaux pour toute question.
    `.trim(),
    
    pricing: (keyword) => `
## Prix et tarifs ${keyword}

Nos tarifs sont transparents et adaptés à chaque projet :

| Prestation | Prix indicatif |
|------------|----------------|
| Diagnostic initial | Gratuit |
| Devis détaillé | Gratuit |
| Intervention standard | Sur devis |
| Urgence 24h/48h | Sur devis |

**Demandez votre devis gratuit** pour obtenir une estimation précise adaptée à votre situation.
    `.trim(),
    
    faq: (keyword, location) => `
## Questions fréquentes

### Combien coûte ${keyword} ?
Le coût dépend de l'ampleur des travaux. Nous proposons un devis gratuit et sans engagement pour évaluer précisément votre projet.

### Quels sont vos délais d'intervention ?
Nous intervenons sous 48h en Île-de-France pour les urgences, et planifions les travaux selon vos disponibilités pour les autres projets.

### Êtes-vous assurés ?
Oui, Mistral Pro Reno dispose d'une garantie décennale et d'une assurance responsabilité civile professionnelle.

### Intervenez-vous ${location ? `à ${location}` : 'dans toute l\'Île-de-France'} ?
Oui, nous couvrons ${location || 'Paris et toute l\'Île-de-France'} (75, 92, 93, 94, 77, 78, 91, 95).
    `.trim(),
    
    cta: () => `
## Demandez votre devis gratuit

Contactez-nous dès maintenant pour discuter de votre projet :

- **Téléphone** : 01 84 80 02 28
- **Email** : contact@mistralpro-reno.fr
- **Devis en ligne** : [Simulateur de devis](/cost_calculator.html)

Notre équipe vous répond sous 24h pour planifier une visite gratuite.
    `.trim()
  },
  
  article: {
    intro: (keyword) => `
Découvrez notre guide complet sur **${keyword}**. Que vous soyez propriétaire ou locataire, cet article vous donnera toutes les informations nécessaires pour mener à bien votre projet.
    `.trim(),
    
    content: (keyword) => `
## Comprendre ${keyword}

${keyword} est une étape importante dans tout projet de rénovation. Il est essentiel de bien s'informer avant de se lancer pour éviter les mauvaises surprises et optimiser son budget.

### Les points clés à retenir

- Faites toujours appel à des professionnels qualifiés
- Demandez plusieurs devis pour comparer
- Vérifiez les assurances et garanties
- Planifiez les travaux en fonction de votre planning

### Les erreurs à éviter

1. Ne pas comparer les devis
2. Négliger les finitions
3. Sous-estimer le budget
4. Oublier les démarches administratives
    `.trim(),
    
    conclusion: () => `
## Conclusion

Un projet bien préparé est un projet réussi. N'hésitez pas à nous contacter pour obtenir des conseils personnalisés et un devis gratuit.

**Mistral Pro Reno** vous accompagne dans tous vos projets de rénovation en Île-de-France.
    `.trim()
  }
};

/**
 * Extraire la localisation d'une requête
 * @param {string} query
 * @returns {string|null}
 */
function extractLocation(query) {
  const q = query.toLowerCase();
  
  if (q.includes('paris')) return 'Paris';
  if (q.includes('ile de france') || q.includes('île-de-france') || q.includes('idf')) return 'Île-de-France';
  if (q.includes('92') || q.includes('hauts-de-seine')) return 'Hauts-de-Seine (92)';
  if (q.includes('93') || q.includes('seine-saint-denis')) return 'Seine-Saint-Denis (93)';
  if (q.includes('94') || q.includes('val-de-marne')) return 'Val-de-Marne (94)';
  if (q.includes('95') || q.includes('val-d\'oise')) return 'Val-d\'Oise (95)';
  if (q.includes('77') || q.includes('seine-et-marne')) return 'Seine-et-Marne (77)';
  if (q.includes('78') || q.includes('yvelines')) return 'Yvelines (78)';
  if (q.includes('91') || q.includes('essonne')) return 'Essonne (91)';
  
  return null;
}

/**
 * Générer un slug SEO-friendly
 * @param {string} title
 * @returns {string}
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
}

/**
 * Générer le contenu SEO complet
 * @param {Object} opportunity - Opportunité ou idée de contenu
 * @returns {Object}
 */
function generateSEOContent(opportunity) {
  const keyword = opportunity.query || opportunity.target;
  const type = opportunity.contentType || 'service';
  const location = extractLocation(keyword);
  
  // Générer les métadonnées
  const capitalizedKeyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);
  const title = type === 'service' 
    ? `${capitalizedKeyword} | Mistral Pro Reno`
    : `${capitalizedKeyword} : Guide complet 2026`;
  
  const metaDescription = type === 'service'
    ? `${capitalizedKeyword} par Mistral Pro Reno. Intervention rapide en Île-de-France, devis gratuit. Artisans qualifiés, garantie décennale. ☎ 01 84 80 02 28`
    : `Découvrez notre guide complet sur ${keyword}. Conseils d'experts, prix, étapes et astuces pour réussir votre projet de rénovation.`;
  
  const h1 = capitalizedKeyword;
  const slug = generateSlug(keyword);
  
  // Générer le contenu selon le type
  let content = '';
  const template = CONTENT_TEMPLATES[type] || CONTENT_TEMPLATES.service;
  
  if (type === 'service') {
    content = `
${template.intro(keyword, location)}

${template.whyUs(keyword)}

${template.services(keyword)}

${template.pricing(keyword)}

${template.faq(keyword, location)}

${template.cta()}
    `.trim();
  } else {
    content = `
${template.intro(keyword)}

${template.content(keyword)}

${template.conclusion()}
    `.trim();
  }
  
  // Générer la structure H2
  const h2Structure = type === 'service'
    ? [
        `Pourquoi choisir Mistral Pro Reno pour ${keyword} ?`,
        `Nos services ${keyword}`,
        `Prix et tarifs ${keyword}`,
        'Questions fréquentes',
        'Demandez votre devis gratuit'
      ]
    : [
        `Comprendre ${keyword}`,
        'Conclusion'
      ];
  
  // Liens internes recommandés
  const internalLinks = [
    { anchor: 'nos services', target: '/services.html' },
    { anchor: 'nos réalisations', target: '/projets.html' },
    { anchor: 'simulateur de devis', target: '/cost_calculator.html' },
    { anchor: 'nous contacter', target: '/#contact' }
  ];
  
  return {
    title,
    metaDescription,
    h1,
    h2Structure,
    slug,
    content,
    internalLinks,
    type,
    keyword,
    location,
    wordCount: content.split(/\s+/).length
  };
}

/**
 * Générer le HTML de la page
 * @param {Object} seoContent
 * @returns {string}
 */
function generatePageHTML(seoContent) {
  const { title, metaDescription, h1, content, slug, type } = seoContent;
  
  // Convertir le markdown en HTML basique
  let htmlContent = content
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/<\/h2><p>/g, '</h2><p>')
    .replace(/<\/h3><p>/g, '</h3><p>');
  
  // Wrapper les listes
  htmlContent = htmlContent.replace(/(<li>.+<\/li>\n?)+/g, '<ul>$&</ul>');
  
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${metaDescription}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://www.mistralpro-reno.fr/${type === 'service' ? 'services' : 'blog'}/${slug}.html">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${metaDescription}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://www.mistralpro-reno.fr/${type === 'service' ? 'services' : 'blog'}/${slug}.html">
  
  <!-- Styles -->
  <link rel="stylesheet" href="/css/style.css?v=2.0">
  <link rel="stylesheet" href="/css/blog.css?v=1.1">
  
  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-5MZSVPL');</script>
</head>
<body>
  <!-- Google Tag Manager (noscript) -->
  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5MZSVPL"
  height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>

  <!-- Header -->
  <header class="header">
    <div class="top-bar">
      <div class="container">
        <a href="tel:0184800228">📞 01 84 80 02 28</a>
        <a href="mailto:contact@mistralpro-reno.fr">✉️ contact@mistralpro-reno.fr</a>
      </div>
    </div>
    <nav class="main-nav">
      <div class="container">
        <a href="/" class="logo">
          <img src="/images/logo-mistral-pro-reno.webp" alt="Mistral Pro Reno" width="180" height="60">
        </a>
        <ul class="nav-links">
          <li><a href="/">Accueil</a></li>
          <li><a href="/services.html">Services</a></li>
          <li><a href="/projets.html">Réalisations</a></li>
          <li><a href="/blog.html">Blog</a></li>
          <li><a href="/cost_calculator.html" class="btn-primary">Devis gratuit</a></li>
        </ul>
      </div>
    </nav>
  </header>

  <!-- Breadcrumb -->
  <nav class="breadcrumb" aria-label="Fil d'Ariane">
    <div class="container">
      <a href="/">Accueil</a> &gt; 
      <a href="/${type === 'service' ? 'services' : 'blog'}.html">${type === 'service' ? 'Services' : 'Blog'}</a> &gt; 
      <span>${h1}</span>
    </div>
  </nav>

  <!-- Main Content -->
  <main class="main-content">
    <article class="article-content">
      <div class="container">
        <h1>${h1}</h1>
        
        <div class="article-body">
          <p>${htmlContent}</p>
        </div>
        
        <!-- CTA Box -->
        <div class="cta-box">
          <h3>Besoin d'un devis ?</h3>
          <p>Contactez-nous pour une estimation gratuite de votre projet.</p>
          <a href="/cost_calculator.html" class="btn-primary">Demander un devis gratuit</a>
        </div>
      </div>
    </article>
  </main>

  <!-- Footer -->
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-col">
          <h4>Mistral Pro Reno</h4>
          <p>Entreprise de rénovation en Île-de-France</p>
        </div>
        <div class="footer-col">
          <h4>Contact</h4>
          <p>📞 01 84 80 02 28</p>
          <p>✉️ contact@mistralpro-reno.fr</p>
        </div>
        <div class="footer-col">
          <h4>Liens utiles</h4>
          <ul>
            <li><a href="/services.html">Services</a></li>
            <li><a href="/projets.html">Réalisations</a></li>
            <li><a href="/mentions-legales.html">Mentions légales</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 Mistral Pro Reno - Tous droits réservés</p>
      </div>
    </div>
  </footer>

  <script src="/js/main.js"></script>
</body>
</html>`;

  return html;
}

/**
 * Exécuter l'optimisation SEO automatique
 * @param {number} contentId - ID du contenu à optimiser
 * @returns {Promise<Object>}
 */
async function executeSEO(contentId) {
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
  const pageHTML = generatePageHTML(seoContent);
  
  // Déterminer le chemin du fichier
  const folder = seoContent.type === 'service' ? 'services' : 'blog';
  const filePath = `/${folder}/${seoContent.slug}.html`;
  
  // Mettre à jour le contenu dans la base
  await dbRun(`
    UPDATE contents 
    SET title = ?,
        title_suggested = ?,
        slug_suggested = ?,
        meta_suggested = ?,
        structure_suggested = ?,
        status = 'validated'
    WHERE id = ?
  `, [
    seoContent.title,
    seoContent.title,
    seoContent.slug,
    seoContent.metaDescription,
    JSON.stringify({ h1: seoContent.h1, h2: seoContent.h2Structure }),
    contentId
  ]);
  
  return {
    contentId,
    title: seoContent.title,
    slug: seoContent.slug,
    filePath,
    type: seoContent.type,
    wordCount: seoContent.wordCount,
    metaDescription: seoContent.metaDescription,
    h1: seoContent.h1,
    h2Structure: seoContent.h2Structure,
    internalLinks: seoContent.internalLinks,
    html: pageHTML,
    status: 'generated'
  };
}

/**
 * Récupérer les opportunités prioritaires pour exécution
 * @returns {Promise<Array>}
 */
async function getHighPriorityOpportunities() {
  // Récupérer les contenus en statut "idea" ou "draft"
  const contents = await dbAll(`
    SELECT c.*, q.impressions, q.position, q.clicks
    FROM contents c
    LEFT JOIN queries q ON LOWER(q.query) = LOWER(c.keyword)
    WHERE c.status IN ('idea', 'draft')
    ORDER BY q.impressions DESC
    LIMIT 10
  `);
  
  return contents;
}

module.exports = {
  generateSEOContent,
  generatePageHTML,
  executeSEO,
  getHighPriorityOpportunities,
  generateSlug,
  extractLocation
};
