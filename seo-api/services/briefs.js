/**
 * SEO Dashboard - Briefs Service
 */

const { dbAll, dbRun, dbGet } = require('./db');
const { logEvent, ACTION_TYPES } = require('./history');

/**
 * Générer un brief d'optimisation pour une page existante
 * @param {string} keyword - Mot-clé cible
 * @returns {Promise<{keyword: string, instructions: string, data: Object}>}
 */
async function generateOptimizationBrief(keyword) {
  if (!keyword) {
    throw new Error('Mot-clé requis');
  }

  // Récupérer les données Search Console pour ce keyword
  const queryData = await dbGet(`
    SELECT * FROM queries WHERE query = ?
  `, [keyword]);

  if (!queryData) {
    throw new Error('Mot-clé non trouvé dans les données Search Console');
  }

  // Calculer le gain potentiel
  const potentialCtr = 0.05;
  const potentialClicks = Math.round(queryData.impressions * potentialCtr);
  const currentClicks = queryData.clicks || 0;
  const potentialGain = potentialClicks - currentClicks;

  // Déterminer la priorité
  let priority;
  if (queryData.position <= 10) {
    priority = 'high';
  } else if (queryData.position <= 15) {
    priority = 'medium';
  } else {
    priority = 'low';
  }

  // Générer les instructions
  const ctrPercent = Math.round(queryData.ctr * 10000) / 100;
  const positionRounded = Math.round(queryData.position * 10) / 10;

  let instructions = `# Brief Optimisation SEO

## Informations actuelles

| Métrique | Valeur |
|----------|--------|
| **Mot-clé cible** | ${keyword} |
| **Position actuelle** | ${positionRounded} |
| **Impressions** | ${queryData.impressions} |
| **Clics actuels** | ${currentClicks} |
| **CTR actuel** | ${ctrPercent}% |
| **Priorité** | ${priority.toUpperCase()} |

---

## Objectif

- **Gain potentiel** : +${potentialGain} clics/mois (si CTR passe à 5%)
- **Position cible** : Top 5 Google

---

## Actions recommandées

### 1. 🏷️ Améliorer le Title

Le title doit :
- Contenir le mot-clé "${keyword}" au début
- Être accrocheur et incitatif au clic
- Faire entre 50 et 60 caractères

**Suggestion** :
\`\`\`
${keyword.charAt(0).toUpperCase() + keyword.slice(1)} | Expert à Paris — Devis Gratuit
\`\`\`

### 2. 📝 Améliorer la Meta Description

La meta description doit :
- Contenir le mot-clé "${keyword}"
- Inclure un appel à l'action
- Faire entre 140 et 160 caractères

**Suggestion** :
\`\`\`
Besoin de ${keyword} ? Mistral Pro Reno vous accompagne avec qualité et transparence. Devis gratuit sous 24h. ✓ Artisans qualifiés ✓ Paris & IDF
\`\`\`

### 3. 📄 Enrichir le contenu

- Ajouter 200-300 mots supplémentaires
- Intégrer le mot-clé naturellement (2-3 occurrences)
- Ajouter une FAQ avec 3-5 questions
- Inclure des données chiffrées si possible

### 4. 🔗 Ajouter du maillage interne

Liens à ajouter :
- Lien vers \`/services.html\` avec ancre "${keyword}"
- Lien vers \`/projets.html\` avec ancre "nos réalisations"
- Lien vers \`/cost_calculator.html\` avec ancre "demander un devis"

### 5. 🔤 Vérifier la structure H1 / H2

- **H1** : Doit contenir le mot-clé "${keyword}"
- **H2** : 3-5 sous-titres pertinents

---

## Checklist avant publication

- [ ] Title optimisé (50-60 car.)
- [ ] Meta description optimisée (140-160 car.)
- [ ] Contenu enrichi (+200 mots)
- [ ] Mot-clé présent dans H1
- [ ] 3+ liens internes ajoutés
- [ ] Images avec ALT contenant le mot-clé

---

*Brief généré automatiquement par SEO Dashboard — Mistral Pro Reno*
`;

  // Logger l'événement
  await logEvent('optimization_brief_generated', {
    keyword,
    position: positionRounded,
    ctr: ctrPercent,
    potential_gain: potentialGain
  });

  return {
    keyword,
    instructions,
    data: {
      position: positionRounded,
      impressions: queryData.impressions,
      clicks: currentClicks,
      ctr: ctrPercent,
      priority,
      potential_gain: potentialGain
    }
  };
}

/**
 * Générer un brief de publication complet en markdown
 * @param {number} contentId - ID du contenu
 * @returns {Promise<{markdown: string}>}
 */
async function generatePublicationBrief(contentId) {
  // Récupérer le contenu
  const content = await dbGet('SELECT * FROM contents WHERE id = ?', [contentId]);
  
  if (!content) {
    throw new Error('Contenu non trouvé');
  }

  // Parser les données JSON
  let structure = null;
  if (content.structure_suggested) {
    try {
      structure = JSON.parse(content.structure_suggested);
    } catch (e) {
      structure = null;
    }
  }

  let internalLinks = null;
  if (content.internal_links_suggested) {
    try {
      internalLinks = JSON.parse(content.internal_links_suggested);
    } catch (e) {
      internalLinks = null;
    }
  }

  // Générer le markdown
  const typeLabels = {
    'blog': '📝 Article de blog',
    'service': '🔧 Page service'
  };

  let markdown = `# Brief Publication SEO

## Informations générales

| Élément | Valeur |
|---------|--------|
| **Mot-clé cible** | ${content.keyword || '-'} |
| **Type** | ${typeLabels[content.type] || content.type} |
| **Statut** | ${content.status} |

---

## SEO On-Page

### Titre SEO (Title)
\`\`\`
${content.title_suggested || content.title || '-'}
\`\`\`

### Slug (URL)
\`\`\`
${content.slug_suggested || '-'}
\`\`\`

### Meta Description
\`\`\`
${content.meta_suggested || '-'}
\`\`\`

---

## Structure du contenu

`;

  // Ajouter structure H1/H2
  if (structure && structure.h1) {
    markdown += `### H1\n\`\`\`\n${structure.h1}\n\`\`\`\n\n`;
    
    if (structure.h2 && structure.h2.length > 0) {
      markdown += `### H2 (sections)\n`;
      structure.h2.forEach((h2, index) => {
        markdown += `${index + 1}. ${h2}\n`;
      });
      markdown += '\n';
    }
  } else {
    markdown += `*Structure non générée*\n\n`;
  }

  markdown += `---

## Maillage interne

`;

  // Ajouter liens internes
  if (internalLinks && internalLinks.length > 0) {
    markdown += `| Texte d'ancre | Page cible |\n`;
    markdown += `|---------------|------------|\n`;
    internalLinks.forEach(link => {
      markdown += `| ${link.anchor} | \`${link.target}\` |\n`;
    });
  } else {
    markdown += `*Aucun lien suggéré*\n`;
  }

  markdown += `

---

## Actions à réaliser

`;

  if (content.type === 'blog') {
    markdown += `1. Créer le fichier \`/blog/${content.slug_suggested || 'nouveau-article'}.html\`
2. Rédiger le contenu selon la structure ci-dessus
3. Ajouter les liens internes suggérés
4. Mettre à jour \`/blog.html\` avec le lien vers l'article
5. Mettre à jour \`/sitemap.xml\`
6. Commit + Push pour déploiement`;
  } else {
    markdown += `1. Créer ou modifier la page service concernée
2. Appliquer le titre SEO et la meta description
3. Structurer le contenu avec les H1/H2 suggérés
4. Insérer les liens internes
5. Mettre à jour \`/sitemap.xml\` si nouvelle page
6. Commit + Push pour déploiement`;
  }

  markdown += `

---

*Brief généré automatiquement par SEO Dashboard — Mistral Pro Reno*
`;

  // Logger l'événement
  await logEvent(ACTION_TYPES.PUBLICATION_BRIEF_GENERATED, {
    content_id: contentId,
    title: content.title || content.keyword,
    type: content.type
  });

  return { markdown };
}

/**
 * Générer un brief à partir d'un contenu
 * @param {number} contentId - ID du contenu
 * @returns {Promise<{id: number}>}
 */
async function generateBrief(contentId) {
  // Récupérer le contenu
  const content = await dbGet('SELECT * FROM contents WHERE id = ?', [contentId]);
  
  if (!content) {
    throw new Error('Contenu non trouvé');
  }

  // Générer le slug
  const slug = content.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // Déterminer le type de brief
  const briefType = content.type === 'blog' ? 'creation' : 'optimisation';

  // Générer les instructions
  const instructions = generateInstructions(content, slug);

  // Insérer le brief
  const result = await dbRun(`
    INSERT INTO briefs (type, target, instructions, status)
    VALUES (?, ?, ?, 'draft')
  `, [briefType, slug, instructions]);

  // Mettre à jour le statut du contenu
  await dbRun(`UPDATE contents SET status = 'draft' WHERE id = ?`, [contentId]);

  // Logger l'événement
  await logEvent(ACTION_TYPES.BRIEF_GENERATED, {
    content_id: contentId,
    brief_id: result.lastID,
    title: content.title,
    type: briefType
  });

  return { id: result.lastID };
}

/**
 * Générer les instructions du brief
 * @param {Object} content - Données du contenu
 * @param {string} slug - Slug généré
 * @returns {string}
 */
function generateInstructions(content, slug) {
  const typeLabels = {
    'blog': 'Article de blog',
    'service': 'Page service',
    'optimization': 'Optimisation page existante'
  };

  const typeLabel = typeLabels[content.type] || content.type;
  const keyword = content.keyword || '[à définir]';

  let instructions = `## Objectif SEO

Créer un contenu optimisé pour le mot-clé principal : **${keyword}**

## Type de contenu

${typeLabel}

## Titre

${content.title}

## Structure suggérée

### H1
${content.title}

### H2 recommandés
- Qu'est-ce que ${keyword} ?
- Pourquoi choisir ${keyword} ?
- Nos services ${keyword}
- Prix et tarifs
- FAQ ${keyword}

## Maillage interne

Liens internes recommandés :
- /services.html
- /projets.html
- /cost_calculator.html
- /blog.html

## Fichiers à modifier

`;

  if (content.type === 'blog') {
    instructions += `- Créer : /blog/${slug}.html
- Modifier : /blog.html (ajouter lien article)
- Modifier : /sitemap.xml (ajouter URL)`;
  } else if (content.type === 'service') {
    instructions += `- Créer : /${slug}.html
- Modifier : /index.html (ajouter lien navigation)
- Modifier : /sitemap.xml (ajouter URL)`;
  } else {
    instructions += `- Modifier : Page cible à identifier
- Vérifier : Title, meta description, H1
- Optimiser : Densité mot-clé, images alt`;
  }

  instructions += `

## Action attendue

1. Lire ce brief
2. Créer/modifier les fichiers indiqués
3. Respecter la charte graphique existante
4. Commit avec message descriptif
5. Push sur main pour déploiement`;

  return instructions;
}

/**
 * Récupérer tous les briefs
 * @returns {Promise<Array>}
 */
async function getAllBriefs() {
  return await dbAll(`
    SELECT * FROM briefs 
    ORDER BY 
      CASE status 
        WHEN 'draft' THEN 1 
        WHEN 'validated' THEN 2 
        WHEN 'executed' THEN 3 
      END,
      id DESC
  `);
}

/**
 * Récupérer un brief par ID
 * @param {number} id - ID du brief
 * @returns {Promise<Object>}
 */
async function getBriefById(id) {
  return await dbGet('SELECT * FROM briefs WHERE id = ?', [id]);
}

/**
 * Mettre à jour le statut d'un brief
 * @param {number} id - ID du brief
 * @param {string} status - Nouveau statut
 * @returns {Promise<{changes: number}>}
 */
async function updateBriefStatus(id, status) {
  const result = await dbRun(`
    UPDATE briefs SET status = ? WHERE id = ?
  `, [status, id]);

  return { changes: result.changes };
}

module.exports = {
  generateBrief,
  generatePublicationBrief,
  generateOptimizationBrief,
  getAllBriefs,
  getBriefById,
  updateBriefStatus
};
