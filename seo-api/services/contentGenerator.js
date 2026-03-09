/**
 * Générateur de contenu pour articles SEO
 * Mode Template : contenu structuré basique
 * Mode IA : contenu rédigé par Claude (à venir)
 */

const SITE_URL = 'https://www.mistralpro-reno.fr';

/**
 * Générer le contenu HTML de l'article (sans le wrapper page)
 * @param {Object} brief - Brief SEO
 * @param {string} keyword - Mot-clé principal
 * @param {string} aiContent - Contenu IA optionnel
 * @returns {string} - HTML du corps de l'article
 */
function generateArticleBody(brief, keyword, aiContent = null) {
  // Si contenu IA fourni, l'utiliser directement
  if (aiContent) {
    return aiContent;
  }
  
  // Sinon, générer le template
  return generateTemplateContent(brief, keyword);
}

/**
 * Générer un contenu template structuré (sans IA)
 */
function generateTemplateContent(brief, keyword) {
  // Extraire les H2 du brief
  const h2List = extractH2FromBrief(brief);
  
  const introduction = `
      <p><strong>Vous recherchez des informations sur ${escapeHTML(keyword)} ?</strong> Vous êtes au bon endroit. Chez Mistral Pro Reno, nous accompagnons les particuliers et professionnels dans leurs projets de rénovation à Paris et en Île-de-France depuis plus de 30 ans.</p>
      
      <p>Dans ce guide complet, nous vous expliquons tout ce que vous devez savoir : les différentes options disponibles, les prix pratiqués sur le marché, et nos conseils d'experts pour réussir votre projet.</p>
  `;

  let sectionsHTML = '';
  
  if (h2List.length > 0) {
    h2List.forEach((h2Title, index) => {
      const cleanTitle = h2Title.replace(/^[-*•]\s*/, '').trim();
      sectionsHTML += `
      <h2>${escapeHTML(cleanTitle)}</h2>
      <p>${getTemplateParagraph(cleanTitle, keyword, index)}</p>
      <p>${getTemplateParagraph2(cleanTitle, keyword, index)}</p>
      `;
    });
  } else {
    // Sections par défaut
    sectionsHTML = `
      <h2>Pourquoi choisir ${escapeHTML(keyword)} ?</h2>
      <p>Opter pour ${escapeHTML(keyword)} présente de nombreux avantages. Que vous souhaitiez moderniser votre intérieur, augmenter la valeur de votre bien, ou simplement améliorer votre confort au quotidien, cette solution répond à de nombreux besoins.</p>
      <p>Nos équipes expertes analysent votre projet en détail pour vous proposer la solution la plus adaptée à vos attentes et à votre budget.</p>

      <h2>Comment se déroule votre projet ?</h2>
      <p>Chez Mistral Pro Reno, nous suivons un processus rigoureux pour garantir la réussite de chaque chantier. Tout commence par une visite technique gratuite, suivie d'un devis détaillé et transparent.</p>
      <p>Une fois le projet validé, nos artisans qualifiés interviennent dans le respect des délais convenus. Nous assurons un suivi régulier et restons disponibles pour répondre à toutes vos questions.</p>

      <h2>Nos tarifs</h2>
      <p>Les prix varient selon l'ampleur des travaux, les matériaux choisis et les spécificités de votre logement. À Paris, comptez en moyenne entre 500€ et 1500€ par m² pour une rénovation complète.</p>
      <p>Pour obtenir un chiffrage précis adapté à votre situation, utilisez notre simulateur de devis en ligne ou contactez-nous directement pour une estimation gratuite.</p>

      <h2>Pourquoi faire confiance à Mistral Pro Reno ?</h2>
      <p>Avec plus de 30 ans d'expérience dans la rénovation à Paris, nous avons accompagné des centaines de clients dans leurs projets. Notre garantie décennale et notre assurance RC Pro vous assurent une tranquillité totale.</p>
      <p>Nos équipes sont composées d'artisans qualifiés et passionnés, soucieux de livrer un travail impeccable.</p>
    `;
  }

  const conclusion = `
      <h2>Conclusion</h2>
      <p>Vous avez maintenant toutes les clés en main pour votre projet de ${escapeHTML(keyword)}. Que vous soyez en phase de réflexion ou prêt à démarrer les travaux, notre équipe est à votre disposition pour vous accompagner.</p>
      <p><strong>Contactez Mistral Pro Reno dès aujourd'hui</strong> pour bénéficier d'un devis gratuit et d'un accompagnement personnalisé.</p>
  `;

  return introduction + sectionsHTML + conclusion;
}

/**
 * Extraire les H2 du brief
 */
function extractH2FromBrief(brief) {
  const briefContent = brief.brief_content || brief.instructions || '';
  const h2List = [];
  
  const lines = briefContent.split('\n');
  let inH2Section = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Détecter la section H2
    if (trimmed.toLowerCase().includes('h2 recommandés') || trimmed.toLowerCase().includes('h2 :')) {
      inH2Section = true;
      continue;
    }
    
    // Sortir de la section H2
    if (inH2Section && (trimmed.startsWith('#') || trimmed.toLowerCase().includes('maillage') || trimmed.toLowerCase().includes('fichiers') || trimmed.toLowerCase().includes('action'))) {
      inH2Section = false;
      continue;
    }
    
    // Collecter les H2
    if (inH2Section && trimmed.startsWith('-') && trimmed.length > 5) {
      h2List.push(trimmed.substring(1).trim());
    }
  }
  
  return h2List;
}

/**
 * Générer un paragraphe template selon le titre
 */
function getTemplateParagraph(title, keyword, index) {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('prix') || titleLower.includes('coût') || titleLower.includes('tarif') || titleLower.includes('combien')) {
    return `Les tarifs pour ${escapeHTML(keyword)} varient selon plusieurs facteurs : la surface concernée, les matériaux sélectionnés, et la complexité des travaux. À Paris, les prix du marché se situent généralement entre 400€ et 1200€ par m² selon le niveau de finition souhaité.`;
  }
  
  if (titleLower.includes('pourquoi') || titleLower.includes('avantage')) {
    return `Choisir ${escapeHTML(keyword)} offre de nombreux bénéfices. Au-delà de l'aspect esthétique, c'est aussi une façon d'améliorer le confort de votre logement et potentiellement d'augmenter sa valeur sur le marché immobilier parisien.`;
  }
  
  if (titleLower.includes('comment') || titleLower.includes('étape') || titleLower.includes('déroulement')) {
    return `La réalisation de votre projet se déroule en plusieurs étapes clés. Tout commence par une analyse approfondie de vos besoins, suivie d'une proposition technique et financière détaillée.`;
  }
  
  if (titleLower.includes('service') || titleLower.includes('prestation') || titleLower.includes('nos ')) {
    return `Mistral Pro Reno vous propose une gamme complète de services pour ${escapeHTML(keyword)}. De la conception à la réalisation, nos équipes vous accompagnent à chaque étape de votre projet.`;
  }
  
  if (titleLower.includes('faq') || titleLower.includes('question')) {
    return `Vous vous posez des questions sur ${escapeHTML(keyword)} ? C'est tout à fait normal. Nos experts sont disponibles pour répondre à toutes vos interrogations et vous guider dans vos choix.`;
  }
  
  if (titleLower.includes('qu\'est-ce') || titleLower.includes('définition') || titleLower.includes('c\'est quoi')) {
    return `${escapeHTML(keyword)} désigne l'ensemble des travaux visant à rénover, moderniser ou transformer votre espace de vie. Ces interventions peuvent aller d'une simple remise en état à une transformation complète de votre intérieur.`;
  }
  
  // Paragraphe générique
  return `En matière de ${escapeHTML(keyword)}, il est essentiel de bien s'informer avant de se lancer. Chez Mistral Pro Reno, nous mettons notre expertise à votre service pour vous aider à faire les bons choix.`;
}

/**
 * Générer un second paragraphe template
 */
function getTemplateParagraph2(title, keyword, index) {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('prix') || titleLower.includes('coût') || titleLower.includes('tarif')) {
    return `Pour obtenir une estimation précise adaptée à votre projet, nous vous invitons à utiliser notre simulateur de devis en ligne. Vous pouvez également nous contacter directement pour une visite technique gratuite et sans engagement.`;
  }
  
  if (titleLower.includes('pourquoi') || titleLower.includes('avantage')) {
    return `Nos clients apprécient particulièrement notre approche personnalisée et notre souci du détail. Chaque projet est unique, et nous nous adaptons à vos contraintes et vos envies pour un résultat à la hauteur de vos attentes.`;
  }
  
  if (titleLower.includes('comment') || titleLower.includes('étape') || titleLower.includes('déroulement')) {
    return `Tout au long des travaux, vous bénéficiez d'un interlocuteur dédié qui coordonne les différents corps de métier et vous tient informé de l'avancement. Notre objectif : vous garantir un chantier serein et bien organisé.`;
  }
  
  return `N'hésitez pas à nous contacter pour discuter de votre projet. Nos conseillers sont à votre écoute du lundi au vendredi, de 8h à 18h.`;
}

/**
 * Échapper les caractères HTML
 */
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = {
  generateArticleBody,
  generateTemplateContent,
  extractH2FromBrief,
  escapeHTML
};
