/**
 * SEO Dashboard - Navigation & Data
 */

// URL API Backend (Vercel)
// À remplacer par l'URL réelle après déploiement
const API_BASE = 'https://mistral-pro-reno.vercel.app';

document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabSections = document.querySelectorAll('.tab-section');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;

      // Désactiver tous les onglets
      tabButtons.forEach(b => b.classList.remove('active'));
      tabSections.forEach(s => s.classList.remove('active'));

      // Activer l'onglet cliqué
      btn.classList.add('active');
      document.getElementById(targetTab).classList.add('active');

      // Charger données si nécessaire
      if (targetTab === 'cockpit') {
        loadCockpit();
      } else if (targetTab === 'searchconsole') {
        loadQueries();
      } else if (targetTab === 'opportunities') {
        loadOpportunities();
      } else if (targetTab === 'content') {
        loadContents();
      } else if (targetTab === 'brief') {
        loadBriefs();
      } else if (targetTab === 'audit') {
        loadAudit();
      } else if (targetTab === 'conversions') {
        loadConversions();
      } else if (targetTab === 'competitors') {
        loadCompetitors();
      } else if (targetTab === 'pages') {
        loadPagesAnalysis();
      } else if (targetTab === 'contentplan') {
        loadContentIdeas();
      }
    });
  });

  // Charger Cockpit au démarrage (onglet actif par défaut)
  loadCockpit();
});

/**
 * Charger et afficher le Cockpit SEO
 */
async function loadCockpit() {
  const container = document.getElementById('cockpit-container');
  
  try {
    // Charger stats, alertes et score en parallèle
    const [statsResponse, alertsResponse, scoreResponse] = await Promise.all([
      fetch(`${API_BASE}/api/stats`),
      fetch(`${API_BASE}/api/alerts`),
      fetch(`${API_BASE}/api/seo-score`)
    ]);
    
    const statsResult = await statsResponse.json();
    const alertsResult = await alertsResponse.json();
    const scoreResult = await scoreResponse.json();

    if (statsResult.status !== 'ok') {
      container.innerHTML = '<p class="error">Erreur de chargement</p>';
      return;
    }

    const stats = statsResult.data;
    const alerts = alertsResult.status === 'ok' ? alertsResult.data : [];
    const seoScore = scoreResult.status === 'ok' ? scoreResult.data : null;

    // Charger les alertes prioritaires
    loadPriorityAlerts();

    // Déterminer l'état général
    let statusMessage, statusClass;
    const totalOpportunities = stats.opportunities_high + stats.opportunities_medium + stats.opportunities_low;
    
    if (stats.total_queries === 0 && stats.contents_total === 0) {
      statusMessage = '⚪ Aucune donnée';
      statusClass = 'status-neutral';
    } else if (alerts.length > 0) {
      statusMessage = '🔴 Alertes actives';
      statusClass = 'status-alert';
    } else if (totalOpportunities > 0) {
      statusMessage = '🟠 Opportunités détectées';
      statusClass = 'status-warning';
    } else {
      statusMessage = '🟢 SEO actif';
      statusClass = 'status-success';
    }

    // Construire section alertes
    let alertsHtml = '';
    if (alerts.length > 0) {
      alertsHtml = `
        <div class="alerts-section">
          <div class="alerts-header">
            <h3>🚨 Alertes SEO (${alerts.length})</h3>
          </div>
          <ul class="alerts-list">
            ${alerts.slice(0, 5).map(a => `
              <li class="alert-item alert-${a.type.split('_')[0]}">
                <span class="alert-message">${escapeHtml(a.message)}</span>
              </li>
            `).join('')}
          </ul>
          ${alerts.length > 5 ? `<p class="alerts-more">+ ${alerts.length - 5} autres alertes</p>` : ''}
        </div>
      `;
    }

    // Construire bloc score SEO
    let scoreHtml = '';
    if (seoScore) {
      const scoreColorClass = `score-${seoScore.color}`;
      const levelLabels = { 'bon': '🟢 Bon', 'moyen': '🟠 Moyen', 'faible': '🔴 Faible' };
      const levelLabel = levelLabels[seoScore.level] || seoScore.level;
      
      scoreHtml = `
        <div class="seo-score-section">
          <div class="score-main ${scoreColorClass}">
            <span class="score-value">${seoScore.score}</span>
            <span class="score-max">/100</span>
          </div>
          <div class="score-level">${levelLabel}</div>
          <div class="score-breakdown">
            <div class="breakdown-item">
              <span class="breakdown-label">Technique (${seoScore.breakdown.technique.weight}%)</span>
              <span class="breakdown-value">${seoScore.breakdown.technique.score}/100</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">Contenu (${seoScore.breakdown.contenu.weight}%)</span>
              <span class="breakdown-value">${seoScore.breakdown.contenu.score}/100</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">Performance (${seoScore.breakdown.performance.weight}%)</span>
              <span class="breakdown-value">${seoScore.breakdown.performance.score}/100</span>
            </div>
          </div>
        </div>
      `;
    }

    // Construire les blocs
    const html = `
      ${alertsHtml}
      ${scoreHtml}
      <div class="cockpit-grid">
        <div class="cockpit-card">
          <div class="card-header">
            <span class="card-icon">📊</span>
            <h3>Search Console</h3>
          </div>
          <div class="card-stats">
            <div class="stat-item">
              <span class="stat-value">${stats.total_queries}</span>
              <span class="stat-label">Requêtes</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${stats.total_clicks}</span>
              <span class="stat-label">Clics</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${formatNumber(stats.total_impressions)}</span>
              <span class="stat-label">Impressions</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${stats.avg_position || '-'}</span>
              <span class="stat-label">Position moy.</span>
            </div>
          </div>
        </div>

        <div class="cockpit-card">
          <div class="card-header">
            <span class="card-icon">🎯</span>
            <h3>Opportunités</h3>
          </div>
          <div class="card-stats">
            <div class="stat-item priority-high">
              <span class="stat-value">${stats.opportunities_high}</span>
              <span class="stat-label">🔴 Haute</span>
            </div>
            <div class="stat-item priority-medium">
              <span class="stat-value">${stats.opportunities_medium}</span>
              <span class="stat-label">🟠 Moyenne</span>
            </div>
            <div class="stat-item priority-low">
              <span class="stat-value">${stats.opportunities_low}</span>
              <span class="stat-label">🟢 Basse</span>
            </div>
          </div>
        </div>

        <div class="cockpit-card">
          <div class="card-header">
            <span class="card-icon">📝</span>
            <h3>Contenu SEO</h3>
          </div>
          <div class="card-stats">
            <div class="stat-item">
              <span class="stat-value">${stats.contents_total}</span>
              <span class="stat-label">Contenus créés</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${stats.contents_published}</span>
              <span class="stat-label">Publiés</span>
            </div>
          </div>
        </div>

        <div class="cockpit-card ${statusClass}">
          <div class="card-header">
            <span class="card-icon">⚡</span>
            <h3>État général</h3>
          </div>
          <div class="card-status">
            <span class="status-message">${statusMessage}</span>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;

  } catch (err) {
    container.innerHTML = '<p class="error">Erreur de connexion à l\'API</p>';
    console.error('loadCockpit error:', err);
  }
}

/**
 * Formater un nombre avec séparateurs
 */
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

/**
 * Charger et afficher les données Search Console
 */
async function loadQueries() {
  const container = document.getElementById('queries-container');
  
  try {
    const response = await fetch(`${API_BASE}/api/queries`);
    const result = await response.json();

    if (result.status !== 'ok') {
      container.innerHTML = '<p class="error">Erreur de chargement</p>';
      return;
    }

    const queries = result.data;

    if (queries.length === 0) {
      container.innerHTML = '<p class="empty-state">Aucune donnée Search Console disponible.<br>Lancez un import GSC pour voir les requêtes.</p>';
      return;
    }

    // Construire tableau
    let html = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Requête</th>
            <th>Clics</th>
            <th>Impressions</th>
            <th>CTR</th>
            <th>Position</th>
          </tr>
        </thead>
        <tbody>
    `;

    for (const q of queries) {
      const ctr = (q.ctr * 100).toFixed(2);
      const position = q.position.toFixed(1);
      html += `
        <tr>
          <td class="query-cell">${escapeHtml(q.query)}</td>
          <td class="num-cell">${q.clicks}</td>
          <td class="num-cell">${q.impressions}</td>
          <td class="num-cell">${ctr}%</td>
          <td class="num-cell">${position}</td>
        </tr>
      `;
    }

    html += '</tbody></table>';
    container.innerHTML = html;

  } catch (err) {
    container.innerHTML = '<p class="error">Erreur de connexion à l\'API</p>';
    console.error('loadQueries error:', err);
  }
}

/**
 * Importer les données Google Search Console
 */
async function importGscData() {
  const statusDiv = document.getElementById('gsc-status');
  const container = document.getElementById('queries-container');
  
  // Afficher statut
  statusDiv.classList.remove('hidden');
  statusDiv.className = 'import-status importing';
  statusDiv.innerHTML = '⏳ Import en cours...';
  
  try {
    const response = await fetch(`${API_BASE}/api/gsc/fetch`);
    const result = await response.json();

    if (result.status === 'ok') {
      statusDiv.className = 'import-status success';
      
      // Message avec opportunités
      let message = `✅ Import réussi : ${result.imported} requêtes`;
      if (result.opportunities) {
        const opp = result.opportunities;
        if (opp.generated > 0) {
          message += ` | ${opp.generated} nouvelles opportunités`;
        }
        if (opp.updated > 0) {
          message += ` | ${opp.updated} mises à jour`;
        }
      }
      statusDiv.innerHTML = message;
      
      // Recharger les données
      loadQueries();
      
      // Masquer le message après 5 secondes
      setTimeout(() => {
        statusDiv.classList.add('hidden');
      }, 5000);
    } else {
      statusDiv.className = 'import-status error';
      statusDiv.innerHTML = `❌ Erreur : ${result.message}`;
    }

  } catch (err) {
    statusDiv.className = 'import-status error';
    statusDiv.innerHTML = '❌ Erreur de connexion à l\'API GSC';
    console.error('importGscData error:', err);
  }
}

/**
 * Charger et afficher les opportunités SEO
 */
async function loadOpportunities() {
  const container = document.getElementById('opportunities-container');
  
  try {
    const response = await fetch(`${API_BASE}/api/opportunities`);
    const result = await response.json();

    if (result.status !== 'ok') {
      container.innerHTML = '<p class="error">Erreur de chargement</p>';
      return;
    }

    const opportunities = result.data;

    if (opportunities.length === 0) {
      container.innerHTML = '<p class="empty-state">Aucune opportunité détectée.<br>Importez des données GSC puis générez les opportunités.</p>';
      return;
    }

    // Construire tableau
    let html = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Requête</th>
            <th>Impressions</th>
            <th>Position</th>
            <th>Priorité</th>
          </tr>
        </thead>
        <tbody>
    `;

    for (const o of opportunities) {
      const position = o.position ? o.position.toFixed(1) : '-';
      const impressions = o.impressions || 0;
      const priorityClass = `priority-${o.priority}`;
      const priorityLabel = o.priority === 'high' ? '🔴 Haute' : o.priority === 'medium' ? '🟠 Moyenne' : '🟢 Basse';
      
      html += `
        <tr>
          <td class="query-cell">${escapeHtml(o.target)}</td>
          <td class="num-cell">${impressions}</td>
          <td class="num-cell">${position}</td>
          <td class="${priorityClass}">${priorityLabel}</td>
        </tr>
      `;
    }

    html += '</tbody></table>';
    container.innerHTML = html;

    // Charger les pages à optimiser
    loadPagesToOptimize();

  } catch (err) {
    container.innerHTML = '<p class="error">Erreur de connexion à l\'API</p>';
    console.error('loadOpportunities error:', err);
  }
}

/**
 * Échapper HTML
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Charger et afficher les contenus
 */
async function loadContents() {
  const container = document.getElementById('content-container');
  
  try {
    const response = await fetch(`${API_BASE}/api/content`);
    const result = await response.json();

    if (result.status !== 'ok') {
      container.innerHTML = '<p class="error">Erreur de chargement</p>';
      return;
    }

    const contents = result.data;

    if (contents.length === 0) {
      container.innerHTML = '<p class="empty-state">Aucun contenu planifié.<br>Cliquez sur "Créer contenu" pour ajouter une idée.</p>';
      return;
    }

    // Transitions autorisées
    const transitions = {
      'idea': ['draft'],
      'draft': ['validated', 'idea'],
      'validated': ['published', 'draft'],
      'published': ['validated']
    };

    const transitionLabels = {
      'draft': '📝 Brouillon',
      'validated': '✅ Valider',
      'published': '🚀 Publier',
      'idea': '💡 Idée'
    };

    // Construire tableau
    let html = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Titre</th>
            <th>Mot-clé</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
    `;

    const typeLabels = {
      'blog': '📝 Blog',
      'service': '🏠 Service',
      'optimization': '⚡ Optim'
    };

    const statusLabels = {
      'idea': '💡 Idée',
      'draft': '📋 Brouillon',
      'validated': '✅ Validé',
      'published': '🚀 Publié'
    };

    for (const c of contents) {
      const typeLabel = typeLabels[c.type] || c.type;
      const statusLabel = statusLabels[c.status] || c.status;
      const statusClass = `status-${c.status}`;
      const allowedTransitions = transitions[c.status] || [];
      
      // Générer les boutons d'action
      let actionsHtml = '';
      
      // Bouton principal (avancer dans le workflow)
      if (allowedTransitions.length > 0) {
        const nextStatus = allowedTransitions[0]; // Premier = action principale
        actionsHtml += `<button class="btn-small btn-action-${nextStatus}" onclick="updateContentStatus(${c.id}, '${nextStatus}')">${transitionLabels[nextStatus]}</button>`;
      }
      
      // Bouton secondaire (retour si possible)
      if (allowedTransitions.length > 1) {
        const prevStatus = allowedTransitions[1];
        actionsHtml += ` <button class="btn-small btn-secondary" onclick="updateContentStatus(${c.id}, '${prevStatus}')">↩️</button>`;
      }
      
      if (!actionsHtml) {
        actionsHtml = '-';
      }
      
      html += `
        <tr>
          <td>${typeLabel}</td>
          <td>${escapeHtml(c.title)}</td>
          <td>${escapeHtml(c.keyword) || '-'}</td>
          <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
          <td class="actions-cell">${actionsHtml}</td>
        </tr>
      `;
    }

    html += '</tbody></table>';
    container.innerHTML = html;

    // Charger le plan mensuel
    loadMonthlyPlan();
    
    // Charger aussi le plan éditorial
    loadEditorialPlan();
    
    // Charger l'historique récent
    loadHistory();

  } catch (err) {
    container.innerHTML = '<p class="error">Erreur de connexion à l\'API</p>';
    console.error('loadContents error:', err);
  }
}

/**
 * Charger et afficher le plan éditorial
 */
async function loadEditorialPlan() {
  const container = document.getElementById('editorial-container');
  
  try {
    const response = await fetch(`${API_BASE}/api/editorial`);
    const result = await response.json();

    if (result.status !== 'ok') {
      container.innerHTML = '<p class="error">Erreur de chargement</p>';
      return;
    }

    const plan = result.data;

    if (plan.length === 0) {
      container.innerHTML = '<p class="empty-state">Aucune proposition.<br>Cliquez sur "Générer plan éditorial" pour créer des propositions à partir des opportunités.</p>';
      return;
    }

    const typeLabels = {
      'blog': '📝 Blog',
      'service': '🔧 Service',
      'optimization': '⚡ Optim'
    };

    const priorityLabels = {
      'high': '🔴 Haute',
      'medium': '🟠 Moyenne',
      'low': '🟢 Basse'
    };

    let html = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Titre proposé</th>
            <th>Slug</th>
            <th>Mot-clé</th>
            <th>Priorité</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
    `;

    for (const p of plan) {
      const typeLabel = typeLabels[p.type] || p.type;
      const priorityLabel = priorityLabels[p.opportunity_priority] || '-';
      // Utiliser title_suggested si disponible, sinon title
      const displayTitle = p.title_suggested || p.title;
      const slug = p.slug_suggested || '-';
      
      html += `
        <tr>
          <td>${typeLabel}</td>
          <td class="title-cell">
            <span class="seo-title">${escapeHtml(displayTitle)}</span>
            ${p.title_suggested ? '<span class="seo-badge">SEO</span>' : ''}
          </td>
          <td class="slug-cell"><code>${escapeHtml(slug)}</code></td>
          <td>${escapeHtml(p.keyword) || '-'}</td>
          <td>${priorityLabel}</td>
          <td>
            <button class="btn-small" onclick="showContentDetails(${p.id})">👁️ Détails</button>
          </td>
        </tr>
      `;
    }

    html += '</tbody></table>';
    
    // Zone pour afficher les détails
    html += '<div id="content-details-panel" class="details-panel hidden"></div>';
    
    container.innerHTML = html;

  } catch (err) {
    container.innerHTML = '<p class="error">Erreur de connexion à l\'API</p>';
    console.error('loadEditorialPlan error:', err);
  }
}

/**
 * Générer le plan éditorial
 */
async function generateEditorialPlan() {
  const container = document.getElementById('editorial-container');
  container.innerHTML = '<p class="loading">Génération du plan éditorial...</p>';

  try {
    const response = await fetch(`${API_BASE}/api/editorial/generate`, {
      method: 'POST'
    });

    const result = await response.json();

    if (result.status === 'ok') {
      alert(`Plan généré : ${result.generated} proposition(s) créée(s)`);
      loadContents(); // Recharge contenus et plan
    } else {
      container.innerHTML = '<p class="error">Erreur: ' + result.message + '</p>';
    }

  } catch (err) {
    container.innerHTML = '<p class="error">Erreur de connexion</p>';
    console.error('generateEditorialPlan error:', err);
  }
}

/**
 * Toggle formulaire création contenu
 */
function toggleContentForm() {
  const form = document.getElementById('content-form');
  form.classList.toggle('hidden');
}

/**
 * Soumettre nouveau contenu
 */
async function submitContent(event) {
  event.preventDefault();

  const type = document.getElementById('content-type').value;
  const title = document.getElementById('content-title').value;
  const keyword = document.getElementById('content-keyword').value;

  try {
    const response = await fetch(`${API_BASE}/api/content/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, title, keyword })
    });

    const result = await response.json();

    if (result.status === 'ok') {
      // Reset form
      document.getElementById('content-title').value = '';
      document.getElementById('content-keyword').value = '';
      toggleContentForm();
      loadContents();
    } else {
      alert('Erreur: ' + result.message);
    }

  } catch (err) {
    alert('Erreur de connexion');
    console.error('submitContent error:', err);
  }
}

/**
 * Charger et afficher les briefs
 */
async function loadBriefs() {
  const container = document.getElementById('briefs-container');
  
  try {
    const response = await fetch(`${API_BASE}/api/briefs`);
    const result = await response.json();

    if (result.status !== 'ok') {
      container.innerHTML = '<p class="error">Erreur de chargement</p>';
      return;
    }

    const briefs = result.data;

    if (briefs.length === 0) {
      container.innerHTML = '<p class="empty-state">Aucun brief généré.<br>Créez un contenu puis cliquez sur "Brief" pour générer les instructions.</p>';
      return;
    }

    // Construire tableau
    let html = `
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Type</th>
            <th>Target</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
    `;

    const statusLabels = {
      'draft': '📋 Brouillon',
      'validated': '✅ Validé',
      'executed': '🚀 Exécuté',
      'cancelled': '❌ Annulé'
    };

    for (const b of briefs) {
      const statusLabel = statusLabels[b.status] || b.status;
      const statusClass = `status-${b.status}`;
      
      html += `
        <tr>
          <td>#${b.id}</td>
          <td>${b.type === 'creation' ? '📝 Création' : '⚡ Optimisation'}</td>
          <td>${escapeHtml(b.target)}</td>
          <td class="${statusClass}">${statusLabel}</td>
          <td>
            <button class="btn-small" onclick="viewBrief(${b.id})">👁 Voir</button>
          </td>
        </tr>
      `;
    }

    html += '</tbody></table>';
    container.innerHTML = html;

  } catch (err) {
    container.innerHTML = '<p class="error">Erreur de connexion à l\'API</p>';
    console.error('loadBriefs error:', err);
  }
}

/**
 * Générer un brief pour un contenu
 */
async function generateBrief(contentId) {
  try {
    const response = await fetch(`${API_BASE}/api/briefs/generate/${contentId}`, {
      method: 'POST'
    });

    const result = await response.json();

    if (result.status === 'ok') {
      alert('Brief généré avec succès (ID: ' + result.id + ')');
      loadContents();
    } else {
      alert('Erreur: ' + result.message);
    }

  } catch (err) {
    alert('Erreur de connexion');
    console.error('generateBrief error:', err);
  }
}

/**
 * Afficher le détail d'un brief
 */
async function viewBrief(briefId) {
  try {
    const response = await fetch(`${API_BASE}/api/briefs/${briefId}`);
    const result = await response.json();

    if (result.status !== 'ok') {
      alert('Erreur: ' + result.message);
      return;
    }

    const brief = result.data;
    
    document.getElementById('brief-detail-title').textContent = `Brief #${brief.id} — ${brief.target}`;
    document.getElementById('brief-detail-content').innerHTML = markdownToHtml(brief.instructions);
    document.getElementById('brief-detail').classList.remove('hidden');
    document.getElementById('briefs-container').classList.add('hidden');

  } catch (err) {
    alert('Erreur de connexion');
    console.error('viewBrief error:', err);
  }
}

/**
 * Fermer le détail du brief
 */
function closeBriefDetail() {
  document.getElementById('brief-detail').classList.add('hidden');
  document.getElementById('briefs-container').classList.remove('hidden');
}

/**
 * Convertir markdown basique en HTML
 */
function markdownToHtml(text) {
  if (!text) return '';
  return text
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
}

/**
 * Charger et afficher les résultats d'audit
 */
async function loadAudit() {
  const container = document.getElementById('audit-container');
  
  try {
    const response = await fetch(`${API_BASE}/api/audit`);
    const result = await response.json();

    if (result.status !== 'ok') {
      container.innerHTML = '<p class="error">Erreur de chargement</p>';
      return;
    }

    const audits = result.data;

    if (audits.length === 0) {
      container.innerHTML = '<p class="empty-state">Aucun audit disponible.<br>Cliquez sur "Lancer audit" pour analyser le site.</p>';
      return;
    }

    // Construire tableau
    let html = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Page</th>
            <th>Title</th>
            <th>Meta</th>
            <th>H1</th>
            <th>Images sans ALT</th>
            <th>Liens internes</th>
          </tr>
        </thead>
        <tbody>
    `;

    for (const a of audits) {
      const titleStatus = a.has_title ? '✅' : '❌';
      const metaStatus = a.has_meta ? '✅' : '❌';
      const h1Status = a.has_h1 ? '✅' : '❌';
      const altClass = a.alt_missing > 0 ? 'status-warning' : 'status-ok';
      
      html += `
        <tr>
          <td>${escapeHtml(a.page_url)}</td>
          <td class="center-cell">${titleStatus}</td>
          <td class="center-cell">${metaStatus}</td>
          <td class="center-cell">${h1Status}</td>
          <td class="center-cell ${altClass}">${a.alt_missing}</td>
          <td class="center-cell">${a.internal_links}</td>
        </tr>
      `;
    }

    html += '</tbody></table>';
    container.innerHTML = html;

    // Charger aussi le maillage interne
    loadInternalLinks();

  } catch (err) {
    container.innerHTML = '<p class="error">Erreur de connexion à l\'API</p>';
    console.error('loadAudit error:', err);
  }
}

/**
 * Charger et afficher le maillage interne
 */
async function loadInternalLinks() {
  const container = document.getElementById('internal-links-container');
  
  try {
    const response = await fetch(`${API_BASE}/api/audit/internal-links`);
    const result = await response.json();

    if (result.status !== 'ok') {
      container.innerHTML = '<p class="error">Erreur de chargement</p>';
      return;
    }

    const links = result.data;
    const stats = result.stats;

    if (links.length === 0) {
      container.innerHTML = '<p class="empty-state">Aucune donnée de maillage.<br>Lancez un crawl pour analyser les liens internes.</p>';
      return;
    }

    // Stats summary
    let html = `
      <div class="maillage-stats">
        <span class="stat-badge stat-ok">${stats.ok} OK</span>
        <span class="stat-badge stat-warning">${stats.warnings} Warning</span>
        <span class="stat-badge stat-orphan">${stats.orphans} Orphelines</span>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Page</th>
            <th>Liens sortants</th>
            <th>Liens entrants</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
    `;

    const statusLabels = {
      'ok': '✅ OK',
      'warning': '⚠️ Faible',
      'orphan': '🔴 Orpheline'
    };

    for (const l of links) {
      const statusLabel = statusLabels[l.status] || l.status;
      const statusClass = `maillage-${l.status}`;
      
      html += `
        <tr>
          <td>${escapeHtml(l.url)}</td>
          <td class="center-cell">${l.internal_links_out}</td>
          <td class="center-cell">${l.internal_links_in}</td>
          <td class="center-cell ${statusClass}">${statusLabel}</td>
        </tr>
      `;
    }

    html += '</tbody></table>';
    container.innerHTML = html;

  } catch (err) {
    container.innerHTML = '<p class="error">Erreur de connexion à l\'API</p>';
    console.error('loadInternalLinks error:', err);
  }
}

/**
 * Lancer un audit
 */
async function runAudit() {
  const container = document.getElementById('audit-container');
  container.innerHTML = '<p class="loading">Audit en cours...</p>';

  try {
    const response = await fetch(`${API_BASE}/api/audit/run`, {
      method: 'POST'
    });

    const result = await response.json();

    if (result.status === 'ok') {
      loadAudit();
    } else {
      container.innerHTML = '<p class="error">Erreur: ' + result.message + '</p>';
    }

  } catch (err) {
    container.innerHTML = '<p class="error">Erreur de connexion</p>';
    console.error('runAudit error:', err);
  }
}

/**
 * Lancer un crawl multi-pages
 */
async function runCrawl() {
  const container = document.getElementById('audit-container');
  container.innerHTML = '<p class="loading">Crawl en cours (jusqu\'à 10 pages)...</p>';

  try {
    const response = await fetch(`${API_BASE}/api/audit/crawl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maxPages: 10 })
    });

    const result = await response.json();

    if (result.status === 'ok') {
      alert(`Crawl terminé : ${result.audited} pages analysées`);
      loadAudit();
    } else {
      container.innerHTML = '<p class="error">Erreur: ' + result.message + '</p>';
    }

  } catch (err) {
    container.innerHTML = '<p class="error">Erreur de connexion</p>';
    console.error('runCrawl error:', err);
  }
}

/**
 * Charger et afficher les conversions
 */
async function loadConversions() {
  const statsContainer = document.getElementById('conversions-stats');
  const container = document.getElementById('conversions-container');
  
  try {
    // Charger stats et conversions en parallèle
    const [statsResponse, conversionsResponse] = await Promise.all([
      fetch(`${API_BASE}/api/conversions/stats`),
      fetch(`${API_BASE}/api/conversions`)
    ]);
    
    const statsResult = await statsResponse.json();
    const conversionsResult = await conversionsResponse.json();

    // Afficher les stats
    if (statsResult.status === 'ok') {
      const stats = statsResult.data;
      statsContainer.innerHTML = `
        <div class="conversions-stats-grid">
          <div class="stat-card">
            <span class="stat-value">${stats.today}</span>
            <span class="stat-label">Aujourd'hui</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${stats.this_week}</span>
            <span class="stat-label">Cette semaine</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${stats.this_month}</span>
            <span class="stat-label">Ce mois</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${stats.total}</span>
            <span class="stat-label">Total</span>
          </div>
        </div>
      `;
    }

    // Afficher les conversions
    if (conversionsResult.status !== 'ok') {
      container.innerHTML = '<p class="error">Erreur de chargement</p>';
      return;
    }

    const conversions = conversionsResult.data;

    if (conversions.length === 0) {
      container.innerHTML = '<p class="empty-state">Aucune conversion enregistrée.<br>Les conversions seront suivies automatiquement depuis la page /merci.html</p>';
      return;
    }

    let html = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Page</th>
            <th>Source</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
    `;

    for (const c of conversions) {
      const date = new Date(c.created_at).toLocaleString('fr-FR');
      
      html += `
        <tr>
          <td>${date}</td>
          <td>${escapeHtml(c.page)}</td>
          <td>${escapeHtml(c.source)}</td>
          <td>${escapeHtml(c.type)}</td>
        </tr>
      `;
    }

    html += '</tbody></table>';
    container.innerHTML = html;

  } catch (err) {
    statsContainer.innerHTML = '<p class="error">Erreur de connexion</p>';
    container.innerHTML = '';
    console.error('loadConversions error:', err);
  }
}

/**
 * Charger et afficher les concurrents
 */
async function loadCompetitors() {
  const container = document.getElementById('competitors-container');
  
  try {
    const response = await fetch(`${API_BASE}/api/competitors`);
    const result = await response.json();

    if (result.status !== 'ok') {
      container.innerHTML = '<p class="error">Erreur de chargement</p>';
      return;
    }

    const competitors = result.data;
    const count = result.count;
    const max = result.max;

    // Info limite
    let html = `<p class="competitors-info">Concurrents suivis : ${count}/${max}</p>`;

    if (competitors.length === 0) {
      html += '<p class="empty-state">Aucun concurrent suivi.<br>Ajoutez jusqu\'à 5 concurrents pour surveiller leur présence SEO.</p>';
      container.innerHTML = html;
      return;
    }

    html += `
      <table class="data-table">
        <thead>
          <tr>
            <th>Domaine</th>
            <th>Suivi depuis</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
    `;

    for (const c of competitors) {
      const trackedSince = new Date(c.tracked_since).toLocaleDateString('fr-FR');
      
      html += `
        <tr>
          <td><a href="https://${escapeHtml(c.domain)}" target="_blank">${escapeHtml(c.domain)}</a></td>
          <td>${trackedSince}</td>
          <td>
            <button class="btn-small btn-danger" onclick="deleteCompetitor(${c.id})">🗑️ Supprimer</button>
          </td>
        </tr>
      `;
    }

    html += '</tbody></table>';
    container.innerHTML = html;

  } catch (err) {
    container.innerHTML = '<p class="error">Erreur de connexion à l\'API</p>';
    console.error('loadCompetitors error:', err);
  }
}

/**
 * Toggle formulaire ajout concurrent
 */
function toggleCompetitorForm() {
  const form = document.getElementById('competitor-form');
  form.classList.toggle('hidden');
}

/**
 * Soumettre nouveau concurrent
 */
async function submitCompetitor(event) {
  event.preventDefault();

  const domain = document.getElementById('competitor-domain').value;

  try {
    const response = await fetch(`${API_BASE}/api/competitors/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain })
    });

    const result = await response.json();

    if (result.status === 'ok') {
      document.getElementById('competitor-domain').value = '';
      toggleCompetitorForm();
      loadCompetitors();
    } else {
      alert('Erreur: ' + result.message);
    }

  } catch (err) {
    alert('Erreur de connexion');
    console.error('submitCompetitor error:', err);
  }
}

/**
 * Supprimer un concurrent
 */
async function deleteCompetitor(id) {
  if (!confirm('Supprimer ce concurrent ?')) return;

  try {
    const response = await fetch(`${API_BASE}/api/competitors/${id}`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (result.status === 'ok') {
      loadCompetitors();
    } else {
      alert('Erreur: ' + result.message);
    }

  } catch (err) {
    alert('Erreur de connexion');
    console.error('deleteCompetitor error:', err);
  }
}

/**
 * Afficher les détails SEO d'un contenu
 */
async function showContentDetails(contentId) {
  const panel = document.getElementById('content-details-panel');
  
  try {
    const response = await fetch(`${API_BASE}/api/editorial`);
    const result = await response.json();

    if (result.status !== 'ok') {
      panel.innerHTML = '<p class="error">Erreur de chargement</p>';
      panel.classList.remove('hidden');
      return;
    }

    const content = result.data.find(c => c.id === contentId);
    
    if (!content) {
      panel.innerHTML = '<p class="error">Contenu non trouvé</p>';
      panel.classList.remove('hidden');
      return;
    }

    const metaLength = content.meta_suggested ? content.meta_suggested.length : 0;
    const metaStatus = metaLength >= 140 && metaLength <= 160 ? 'optimal' : (metaLength > 0 ? 'warning' : 'missing');

    // Parser la structure JSON
    let structure = null;
    if (content.structure_suggested) {
      try {
        structure = JSON.parse(content.structure_suggested);
      } catch (e) {
        structure = null;
      }
    }

    // Parser les liens internes JSON
    let internalLinks = null;
    if (content.internal_links_suggested) {
      try {
        internalLinks = JSON.parse(content.internal_links_suggested);
      } catch (e) {
        internalLinks = null;
      }
    }

    // Générer HTML structure H1/H2
    let structureHtml = '';
    if (structure && structure.h1) {
      structureHtml = `
        <div class="detail-item">
          <span class="detail-label">Structure SEO</span>
          <div class="structure-preview">
            <div class="structure-h1">H1: ${escapeHtml(structure.h1)}</div>
            ${structure.h2 && structure.h2.length > 0 ? 
              structure.h2.map(h2 => `<div class="structure-h2">H2: ${escapeHtml(h2)}</div>`).join('') 
              : ''}
          </div>
        </div>
      `;
    }

    // Générer HTML liens internes
    let linksHtml = '';
    if (internalLinks && internalLinks.length > 0) {
      linksHtml = `
        <div class="detail-item">
          <span class="detail-label">Liens internes suggérés</span>
          <div class="links-preview">
            ${internalLinks.map(link => `
              <div class="link-item">
                <span class="link-anchor">${escapeHtml(link.anchor)}</span>
                <span class="link-arrow">→</span>
                <code class="link-target">${escapeHtml(link.target)}</code>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    panel.innerHTML = `
      <div class="details-header">
        <h4>📋 Détails SEO</h4>
        <div class="details-actions">
          <button class="btn-primary btn-small" onclick="generatePublicationBrief(${content.id})">📄 Générer brief publication</button>
          <button class="btn-small" onclick="closeContentDetails()">✕ Fermer</button>
        </div>
      </div>
      <div class="details-content">
        <div class="detail-item">
          <span class="detail-label">Mot-clé cible</span>
          <span class="detail-value">${escapeHtml(content.keyword)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Titre SEO</span>
          <span class="detail-value seo-title-preview">${escapeHtml(content.title_suggested || content.title)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Slug</span>
          <code class="detail-value">${escapeHtml(content.slug_suggested || '-')}</code>
        </div>
        <div class="detail-item">
          <span class="detail-label">Meta description <span class="meta-length ${metaStatus}">(${metaLength} car.)</span></span>
          <span class="detail-value meta-preview">${escapeHtml(content.meta_suggested || 'Non générée')}</span>
        </div>
        ${structureHtml}
        ${linksHtml}
      </div>
      <div id="brief-output" class="brief-output hidden"></div>
    `;
    
    panel.classList.remove('hidden');

  } catch (err) {
    panel.innerHTML = '<p class="error">Erreur de connexion</p>';
    panel.classList.remove('hidden');
    console.error('showContentDetails error:', err);
  }
}

/**
 * Fermer le panneau de détails
 */
function closeContentDetails() {
  const panel = document.getElementById('content-details-panel');
  panel.classList.add('hidden');
}

/**
 * Générer et afficher le brief de publication
 */
async function generatePublicationBrief(contentId) {
  const output = document.getElementById('brief-output');
  
  output.classList.remove('hidden');
  output.innerHTML = '<p class="loading">Génération du brief...</p>';
  
  try {
    const response = await fetch(`${API_BASE}/api/briefs/publication/${contentId}`);
    const result = await response.json();

    if (result.status !== 'ok') {
      output.innerHTML = `<p class="error">Erreur : ${result.message}</p>`;
      return;
    }

    output.innerHTML = `
      <div class="brief-header">
        <h5>📄 Brief Publication</h5>
        <button class="btn-small" onclick="copyBriefToClipboard()">📋 Copier</button>
      </div>
      <pre class="brief-markdown" id="brief-markdown-content">${escapeHtml(result.markdown)}</pre>
    `;

  } catch (err) {
    output.innerHTML = '<p class="error">Erreur de connexion</p>';
    console.error('generatePublicationBrief error:', err);
  }
}

/**
 * Copier le brief dans le presse-papier
 */
function copyBriefToClipboard() {
  const content = document.getElementById('brief-markdown-content');
  if (content) {
    navigator.clipboard.writeText(content.textContent).then(() => {
      alert('Brief copié dans le presse-papier !');
    }).catch(err => {
      console.error('Erreur copie:', err);
      alert('Erreur lors de la copie');
    });
  }
}

/**
 * Mettre à jour le statut d'un contenu
 */
async function updateContentStatus(contentId, newStatus) {
  try {
    const response = await fetch(`${API_BASE}/api/content/${contentId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    const result = await response.json();

    if (result.status !== 'ok') {
      alert('Erreur : ' + result.message);
      return;
    }

    // Rafraîchir le tableau contenus
    loadContents();
    
    // Rafraîchir le cockpit
    loadStats();

  } catch (err) {
    alert('Erreur de connexion');
    console.error('updateContentStatus error:', err);
  }
}

/**
 * Charger et afficher l'historique récent
 */
async function loadHistory() {
  const container = document.getElementById('history-container');
  
  if (!container) return;
  
  try {
    const response = await fetch(`${API_BASE}/api/history?limit=10`);
    const result = await response.json();

    if (result.status !== 'ok') {
      container.innerHTML = '<p class="error">Erreur de chargement</p>';
      return;
    }

    const history = result.data;

    if (history.length === 0) {
      container.innerHTML = '<p class="empty-state">Aucune action récente.</p>';
      return;
    }

    let html = `
      <table class="data-table history-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Action</th>
            <th>Contenu</th>
            <th>Détail</th>
          </tr>
        </thead>
        <tbody>
    `;

    for (const h of history) {
      const date = new Date(h.created_at).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const target = h.parsedTarget || {};
      const title = target.title || target.keyword || '-';
      
      let detail = '-';
      if (h.action === 'content_status_changed' && target.old_status && target.new_status) {
        detail = `${target.old_status} → ${target.new_status}`;
      } else if (target.type) {
        detail = target.type;
      }

      html += `
        <tr>
          <td class="date-cell">${date}</td>
          <td>${h.actionLabel}</td>
          <td>${escapeHtml(title)}</td>
          <td class="detail-cell">${escapeHtml(detail)}</td>
        </tr>
      `;
    }

    html += '</tbody></table>';
    container.innerHTML = html;

  } catch (err) {
    container.innerHTML = '<p class="error">Erreur de connexion</p>';
    console.error('loadHistory error:', err);
  }
}

/**
 * Charger et afficher le plan éditorial mensuel
 */
async function loadMonthlyPlan() {
  const container = document.getElementById('monthly-plan-container');
  
  if (!container) return;
  
  try {
    const response = await fetch(`${API_BASE}/api/editorial/monthly-plan`);
    const result = await response.json();

    if (result.status !== 'ok') {
      container.innerHTML = '<p class="error">Erreur de chargement</p>';
      return;
    }

    const plan = result.data;
    const stats = result.stats;

    if (plan.length === 0) {
      container.innerHTML = '<p class="empty-state">Aucune action planifiée.<br>Importez des données Search Console et générez des opportunités.</p>';
      return;
    }

    // Afficher les statistiques
    let html = `
      <div class="monthly-stats">
        <div class="stat-item">
          <span class="stat-value">${stats.total}</span>
          <span class="stat-label">Actions</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.create_content}</span>
          <span class="stat-label">Créations</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.optimize_page}</span>
          <span class="stat-label">Optimisations</span>
        </div>
        <div class="stat-item priority-high">
          <span class="stat-value">${stats.high_priority}</span>
          <span class="stat-label">Priorité haute</span>
        </div>
      </div>
    `;

    // Tableau des actions
    html += `
      <table class="data-table monthly-table">
        <thead>
          <tr>
            <th>Action</th>
            <th>Titre / Page</th>
            <th>Mot-clé</th>
            <th>Priorité</th>
          </tr>
        </thead>
        <tbody>
    `;

    const priorityLabels = {
      'high': '🔴 Haute',
      'medium': '🟠 Moyenne',
      'low': '🟢 Basse'
    };

    for (const item of plan) {
      const priorityLabel = priorityLabels[item.priority] || item.priority;
      
      html += `
        <tr class="priority-row-${item.priority}">
          <td>${item.action_label}</td>
          <td>${escapeHtml(item.title)}</td>
          <td>${escapeHtml(item.keyword)}</td>
          <td>${priorityLabel}</td>
        </tr>
      `;
    }

    html += '</tbody></table>';
    container.innerHTML = html;

  } catch (err) {
    container.innerHTML = '<p class="error">Erreur de connexion</p>';
    console.error('loadMonthlyPlan error:', err);
  }
}

/**
 * Charger et afficher les alertes prioritaires
 */
async function loadPriorityAlerts() {
  const container = document.getElementById('priority-alerts-container');
  
  if (!container) return;
  
  try {
    const response = await fetch(`${API_BASE}/api/alerts/priority`);
    const result = await response.json();

    if (result.status !== 'ok') {
      container.innerHTML = '';
      return;
    }

    const alerts = result.data;

    if (alerts.length === 0) {
      container.innerHTML = `
        <div class="priority-alerts-success">
          <span class="success-icon">✅</span>
          <span class="success-message">Aucune alerte prioritaire — Tout est en ordre !</span>
        </div>
      `;
      return;
    }

    let html = `
      <div class="priority-alerts-header">
        <h3>🚨 Alertes prioritaires</h3>
        <span class="alerts-count">${alerts.length}</span>
      </div>
      <div class="priority-alerts-list">
    `;

    for (const alert of alerts) {
      const priorityClass = alert.priority === 'high' ? 'alert-high' : 'alert-medium';
      
      html += `
        <div class="priority-alert-item ${priorityClass}">
          <span class="alert-icon">${alert.icon}</span>
          <span class="alert-message">${escapeHtml(alert.message)}</span>
          <span class="alert-priority">${alert.priority === 'high' ? 'Urgent' : 'Important'}</span>
        </div>
      `;
    }

    html += '</div>';
    container.innerHTML = html;

  } catch (err) {
    container.innerHTML = '';
    console.error('loadPriorityAlerts error:', err);
  }
}

/**
 * Charger et afficher les pages à optimiser
 */
async function loadPagesToOptimize() {
  const container = document.getElementById('pages-to-optimize-container');
  
  if (!container) return;
  
  try {
    const response = await fetch(`${API_BASE}/api/opportunities/pages-to-optimize`);
    const result = await response.json();

    if (result.status !== 'ok') {
      container.innerHTML = '<p class="error">Erreur de chargement</p>';
      return;
    }

    const pages = result.data;
    const stats = result.stats;

    if (pages.length === 0) {
      container.innerHTML = '<p class="empty-state">Aucune page à optimiser détectée.<br>Les pages avec position 5-20, impressions > 20 et CTR < 3% apparaîtront ici.</p>';
      return;
    }

    // Afficher statistiques
    let html = `
      <div class="optimize-stats">
        <div class="stat-item">
          <span class="stat-value">${stats.total}</span>
          <span class="stat-label">Pages</span>
        </div>
        <div class="stat-item priority-high">
          <span class="stat-value">${stats.high}</span>
          <span class="stat-label">Priorité haute</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">+${stats.total_potential_gain}</span>
          <span class="stat-label">Clics potentiels</span>
        </div>
      </div>
    `;

    // Tableau des pages
    html += `
      <table class="data-table optimize-table">
        <thead>
          <tr>
            <th>Mot-clé</th>
            <th>Position</th>
            <th>Impressions</th>
            <th>CTR</th>
            <th>Priorité</th>
            <th>Gain</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
    `;

    const priorityLabels = {
      'high': '🔴 Haute',
      'medium': '🟠 Moyenne',
      'low': '🟢 Basse'
    };

    for (const page of pages) {
      const priorityLabel = priorityLabels[page.priority] || page.priority;
      const keywordEscaped = escapeHtml(page.keyword).replace(/'/g, "\\'");
      
      html += `
        <tr class="priority-row-${page.priority}">
          <td class="query-cell">${escapeHtml(page.keyword)}</td>
          <td class="num-cell">${page.position}</td>
          <td class="num-cell">${page.impressions}</td>
          <td class="num-cell ctr-low">${page.ctr}%</td>
          <td>${priorityLabel}</td>
          <td class="num-cell potential-gain">+${page.potential_gain}</td>
          <td>
            <button class="btn-small" onclick="generateOptimizationBrief('${keywordEscaped}')">📄 Brief</button>
          </td>
        </tr>
      `;
    }

    html += '</tbody></table>';
    
    // Zone pour afficher le brief d'optimisation
    html += '<div id="optimization-brief-output" class="optimization-brief-output hidden"></div>';
    
    container.innerHTML = html;

  } catch (err) {
    container.innerHTML = '<p class="error">Erreur de connexion</p>';
    console.error('loadPagesToOptimize error:', err);
  }
}

/**
 * Générer et afficher un brief d'optimisation
 */
async function generateOptimizationBrief(keyword) {
  const output = document.getElementById('optimization-brief-output');
  
  if (!output) return;
  
  output.classList.remove('hidden');
  output.innerHTML = '<p class="loading">Génération du brief d\'optimisation...</p>';
  
  try {
    const response = await fetch(`${API_BASE}/api/briefs/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword })
    });

    const result = await response.json();

    if (result.status !== 'ok') {
      output.innerHTML = `<p class="error">Erreur : ${result.message}</p>`;
      return;
    }

    const data = result.data;

    output.innerHTML = `
      <div class="optimization-brief-header">
        <h4>📄 Brief Optimisation : ${escapeHtml(data.keyword)}</h4>
        <div class="brief-actions">
          <button class="btn-small" onclick="copyOptimizationBrief()">📋 Copier</button>
          <button class="btn-small" onclick="closeOptimizationBrief()">✕ Fermer</button>
        </div>
      </div>
      <div class="optimization-brief-stats">
        <span class="stat">📍 Position: ${data.data.position}</span>
        <span class="stat">👁️ Impressions: ${data.data.impressions}</span>
        <span class="stat">📈 CTR: ${data.data.ctr}%</span>
        <span class="stat potential">🎯 Gain: +${data.data.potential_gain} clics</span>
      </div>
      <pre class="optimization-brief-markdown" id="optimization-brief-content">${escapeHtml(data.instructions)}</pre>
    `;

  } catch (err) {
    output.innerHTML = '<p class="error">Erreur de connexion</p>';
    console.error('generateOptimizationBrief error:', err);
  }
}

/**
 * Copier le brief d'optimisation dans le presse-papier
 */
function copyOptimizationBrief() {
  const content = document.getElementById('optimization-brief-content');
  if (content) {
    navigator.clipboard.writeText(content.textContent).then(() => {
      alert('Brief copié dans le presse-papier !');
    }).catch(err => {
      console.error('Erreur copie:', err);
      alert('Erreur lors de la copie');
    });
  }
}

/**
 * Fermer le brief d'optimisation
 */
function closeOptimizationBrief() {
  const output = document.getElementById('optimization-brief-output');
  if (output) {
    output.classList.add('hidden');
  }
}

// =====================================================
// PAGES SEO
// =====================================================

/**
 * Charger et afficher l'analyse des pages
 */
async function loadPagesAnalysis() {
  const summaryContainer = document.getElementById('pages-summary');
  const topPagesContainer = document.getElementById('top-pages-container');
  const lowCtrContainer = document.getElementById('low-ctr-pages-container');
  const quickWinsContainer = document.getElementById('quick-wins-pages-container');
  const allPagesContainer = document.getElementById('all-pages-container');

  try {
    const response = await fetch(`${API_BASE}/api/pages/analysis`);
    const result = await response.json();

    if (result.status !== 'ok') {
      summaryContainer.innerHTML = '<p class="error">Erreur de chargement</p>';
      return;
    }

    const data = result.data;

    // Afficher le résumé
    summaryContainer.innerHTML = `
      <div class="stat-card">
        <span class="stat-value">${data.summary.totalPages}</span>
        <span class="stat-label">Pages analysées</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${data.summary.totalClicks}</span>
        <span class="stat-label">Clics total</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${data.summary.totalImpressions}</span>
        <span class="stat-label">Impressions</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${data.summary.avgPosition}</span>
        <span class="stat-label">Position moyenne</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${data.summary.avgCtr}%</span>
        <span class="stat-label">CTR moyen</span>
      </div>
    `;

    // Afficher le Top 10
    if (data.topPages && data.topPages.length > 0) {
      topPagesContainer.innerHTML = renderPagesTable(data.topPages, 'top');
    } else {
      topPagesContainer.innerHTML = '<p class="empty-state">Aucune donnée de page disponible. Importez les données GSC.</p>';
    }

    // Pages CTR faible
    if (data.pagesToOptimize.lowCtr && data.pagesToOptimize.lowCtr.length > 0) {
      lowCtrContainer.innerHTML = renderPagesTable(data.pagesToOptimize.lowCtr, 'lowCtr');
    } else {
      lowCtrContainer.innerHTML = '<p class="empty-state">Aucune page avec CTR faible détectée.</p>';
    }

    // Quick Wins
    if (data.pagesToOptimize.quickWins && data.pagesToOptimize.quickWins.length > 0) {
      quickWinsContainer.innerHTML = renderPagesTable(data.pagesToOptimize.quickWins, 'quickWins');
    } else {
      quickWinsContainer.innerHTML = '<p class="empty-state">Aucun quick win détecté.</p>';
    }

    // Toutes les pages
    if (data.allPages && data.allPages.length > 0) {
      allPagesContainer.innerHTML = renderPagesTable(data.allPages, 'all');
    } else {
      allPagesContainer.innerHTML = '<p class="empty-state">Aucune page analysée.</p>';
    }

  } catch (err) {
    summaryContainer.innerHTML = '<p class="error">Erreur de connexion</p>';
    console.error('loadPagesAnalysis error:', err);
  }
}

/**
 * Générer le tableau des pages
 */
function renderPagesTable(pages, type) {
  let html = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Page</th>
          <th>Clics</th>
          <th>Impressions</th>
          <th>CTR</th>
          <th>Position</th>
          ${type === 'lowCtr' || type === 'quickWins' ? '<th>Priorité</th><th>Action</th>' : '<th>Statut</th>'}
        </tr>
      </thead>
      <tbody>
  `;

  for (const page of pages) {
    const priorityClass = page.priority === 'high' ? 'priority-high' : 
                          page.priority === 'medium' ? 'priority-medium' : 'priority-low';
    const statusClass = page.status === 'excellent' ? 'status-excellent' :
                        page.status === 'good' ? 'status-good' :
                        page.status === 'improve' ? 'status-improve' : 'status-poor';
    
    html += `
      <tr>
        <td class="page-url" title="${escapeHtml(page.url)}">${escapeHtml(page.path)}</td>
        <td>${page.clicks}</td>
        <td>${page.impressions}</td>
        <td>${page.ctr}%</td>
        <td>${page.position}</td>
    `;

    if (type === 'lowCtr' || type === 'quickWins') {
      html += `
        <td><span class="priority-badge ${priorityClass}">${page.priority}</span></td>
        <td class="action-text">${escapeHtml(page.action || '')}</td>
      `;
    } else {
      html += `
        <td><span class="status-badge ${statusClass}">${page.status}</span></td>
      `;
    }

    html += '</tr>';
  }

  html += '</tbody></table>';
  return html;
}

/**
 * Rafraîchir l'analyse des pages
 */
async function refreshPagesAnalysis() {
  // D'abord importer les données GSC pour s'assurer d'avoir les données par page
  const statusDiv = document.getElementById('pages-summary');
  statusDiv.innerHTML = '<p class="loading">Import des données GSC en cours...</p>';

  try {
    const importResponse = await fetch(`${API_BASE}/api/gsc/fetch`);
    const importResult = await importResponse.json();

    if (importResult.status !== 'ok') {
      statusDiv.innerHTML = `<p class="error">Erreur import: ${importResult.message}</p>`;
      return;
    }

    // Recharger l'analyse
    await loadPagesAnalysis();

  } catch (err) {
    statusDiv.innerHTML = '<p class="error">Erreur de connexion</p>';
    console.error('refreshPagesAnalysis error:', err);
  }
}

// =====================================================
// PLAN DE CONTENU SEO
// =====================================================

/**
 * Charger et afficher les idées de contenu
 */
async function loadContentIdeas() {
  const summaryContainer = document.getElementById('content-ideas-summary');
  const contentGapsContainer = document.getElementById('content-gaps-container');
  const highPotentialContainer = document.getElementById('high-potential-container');
  const lowPerformersContainer = document.getElementById('low-performers-container');

  // Afficher loading
  summaryContainer.innerHTML = '<p class="loading">Chargement en cours...</p>';

  try {
    const response = await fetch(`${API_BASE}/api/content/ideas`);
    
    if (!response.ok) {
      summaryContainer.innerHTML = `<p class="error">Erreur HTTP: ${response.status}</p>`;
      return;
    }
    
    const result = await response.json();

    if (result.status !== 'ok') {
      summaryContainer.innerHTML = '<p class="error">Erreur API</p>';
      return;
    }

    const { summary, ideas } = result;

    // Afficher le résumé
    summaryContainer.innerHTML = `
      <div class="stat-card">
        <span class="stat-value">${summary.total}</span>
        <span class="stat-label">Idées total</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${summary.contentGaps}</span>
        <span class="stat-label">Content Gaps</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${summary.highPotential}</span>
        <span class="stat-label">Fort potentiel</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${summary.lowPerformers}</span>
        <span class="stat-label">À améliorer</span>
      </div>
    `;

    // Afficher Content Gaps
    if (ideas.contentGaps && ideas.contentGaps.length > 0) {
      contentGapsContainer.innerHTML = renderContentIdeasTable(ideas.contentGaps, 'contentGaps');
    } else {
      contentGapsContainer.innerHTML = '<p class="empty-state">Aucun content gap détecté.</p>';
    }

    // Afficher High Potential
    if (ideas.highPotential && ideas.highPotential.length > 0) {
      highPotentialContainer.innerHTML = renderContentIdeasTable(ideas.highPotential, 'highPotential');
    } else {
      highPotentialContainer.innerHTML = '<p class="empty-state">Aucune requête à fort potentiel.</p>';
    }

    // Afficher Low Performers
    if (ideas.lowPerformers && ideas.lowPerformers.length > 0) {
      lowPerformersContainer.innerHTML = renderContentIdeasTable(ideas.lowPerformers, 'lowPerformers');
    } else {
      lowPerformersContainer.innerHTML = '<p class="empty-state">Aucune requête à améliorer.</p>';
    }

  } catch (err) {
    summaryContainer.innerHTML = `<p class="error">Erreur: ${err.message}</p>`;
    contentGapsContainer.innerHTML = '';
    highPotentialContainer.innerHTML = '';
    lowPerformersContainer.innerHTML = '';
  }
}

/**
 * Générer le tableau des idées de contenu
 */
function renderContentIdeasTable(ideas, category) {
  // Stocker les idées globalement pour le onclick
  if (!window.contentIdeasData) {
    window.contentIdeasData = {};
  }
  window.contentIdeasData[category] = ideas;

  let html = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Requête</th>
          <th>Imp.</th>
          <th>Pos.</th>
          <th>Type</th>
          <th>Priorité</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
  `;

  for (let i = 0; i < ideas.length; i++) {
    const idea = ideas[i];
    const priorityClass = idea.priority === 'high' ? 'priority-high' : 
                          idea.priority === 'medium' ? 'priority-medium' : 'priority-low';
    
    const typeLabel = getContentTypeLabel(idea.contentType);
    
    html += `
      <tr>
        <td class="query-cell" title="${escapeHtml(idea.query)}">${escapeHtml(idea.query)}</td>
        <td>${idea.impressions}</td>
        <td>${idea.position}</td>
        <td><span class="type-badge">${typeLabel}</span></td>
        <td><span class="priority-badge ${priorityClass}">${idea.priority}</span></td>
        <td>
          <button class="btn-small btn-save-idea" onclick="saveContentIdeaByIndex('${category}', ${i})">
            💾 Créer
          </button>
        </td>
      </tr>
    `;
  }

  html += '</tbody></table>';
  return html;
}

/**
 * Obtenir le label du type de contenu
 */
function getContentTypeLabel(type) {
  const labels = {
    'article': '📝 Article',
    'service': '🏠 Service',
    'faq': '❓ FAQ',
    'guide': '📚 Guide'
  };
  return labels[type] || type;
}

/**
 * Sauvegarder une idée par son index
 */
async function saveContentIdeaByIndex(category, index) {
  const idea = window.contentIdeasData[category][index];
  if (!idea) {
    alert('Erreur: idée non trouvée');
    return;
  }
  await saveContentIdea(idea);
}

/**
 * Sauvegarder une idée comme contenu
 */
async function saveContentIdea(idea) {
  try {
    const response = await fetch(`${API_BASE}/api/content/ideas/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(idea)
    });

    const result = await response.json();

    if (result.status === 'ok') {
      alert(`✅ Contenu créé avec succès !\nID: ${result.id}\nTitre: ${idea.titleSuggestion}`);
      // Recharger les idées (pour enlever celle qui a été sauvegardée)
      loadContentIdeas();
    } else {
      alert(`❌ Erreur: ${result.message}`);
    }

  } catch (err) {
    alert('❌ Erreur de connexion');
    console.error('saveContentIdea error:', err);
  }
}

/**
 * Rafraîchir les idées de contenu
 */
async function refreshContentIdeas() {
  const summaryContainer = document.getElementById('content-ideas-summary');
  summaryContainer.innerHTML = '<p class="loading">Analyse en cours...</p>';
  await loadContentIdeas();
}
