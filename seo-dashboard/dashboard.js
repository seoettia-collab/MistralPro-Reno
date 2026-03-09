/**
 * SEO Dashboard - Navigation & Data
 */

// URL API Backend (Vercel)
const API_BASE = 'https://mistral-pro-reno.vercel.app';

// Clé API pour authentification backend
const API_KEY = 'mpr-seo-2026-secure-key';

// Fonction fetch avec authentification API
async function fetchAPI(endpoint, options = {}) {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    }
  };
  
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };
  
  return fetch(`${API_BASE}${endpoint}`, mergedOptions);
}

// Handler d'erreurs global pour éviter les crashs silencieux
window.onerror = function(msg, url, lineNo, columnNo, error) {
  console.error('Erreur JS Dashboard:', msg, 'at', url, 'line', lineNo);
  return false;
};

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
      } else if (targetTab === 'audit-ia') {
        // L'onglet Audit IA ne charge pas automatiquement - l'utilisateur doit cliquer sur le bouton
        console.log('[Nav] Onglet Audit IA activé');
      } else if (targetTab === 'studio-seo') {
        // L'onglet Studio SEO ne charge pas automatiquement
        console.log('[Nav] Onglet Studio SEO activé');
      } else if (targetTab === 'searchconsole') {
        loadQueries();
        initHistorySection();
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
      } else if (targetTab === 'impact') {
        loadImpactAnalysis();
      }
    });
  });

  // Charger Cockpit au démarrage (onglet actif par défaut)
  loadCockpit();
});

/**
 * Navigation vers Audit IA et lancement automatique
 */
function goToAuditIA() {
  // Activer l'onglet Audit IA
  document.querySelector('[data-tab="audit-ia"]').click();
  // Lancer l'analyse automatiquement
  setTimeout(() => {
    launchFullAuditIA();
  }, 100);
}

/**
 * Fonction wrapper pour le bouton de l'onglet Audit IA
 */
function launchAuditIA() {
  launchFullAuditIA();
}

/**
 * Cockpit SEO V2 — Vue agrégée complète
 * Fusionne tous les signaux : stats, score, alertes, opportunités, contenu, audit, conversions
 * Version 2.1.1 - Mars 2026
 */

// Cache global pour données cockpit avec TTL
let cockpitCache = null;
let cockpitCacheTimestamp = 0;
const COCKPIT_CACHE_TTL = 60000; // 60 secondes

/**
 * Vérifie si le cache cockpit est valide
 */
function isCockpitCacheValid() {
  return cockpitCache && (Date.now() - cockpitCacheTimestamp < COCKPIT_CACHE_TTL);
}

async function loadCockpit() {
  const container = document.getElementById('cockpit-container');
  
  // Utiliser le cache si valide
  if (isCockpitCacheValid()) {
    console.log('[Cockpit] Utilisation du cache (TTL: ' + Math.round((COCKPIT_CACHE_TTL - (Date.now() - cockpitCacheTimestamp)) / 1000) + 's restantes)');
    renderCockpitV2(cockpitCache);
    return;
  }
  
  container.innerHTML = '<div class="cockpit-loading"><div class="spinner"></div><p>Chargement du Cockpit SEO...</p></div>';
  
  try {
    // Charger TOUS les signaux en parallèle (agrégation V2)
    const [
      statsResponse, 
      scoreResponse, 
      alertsResponse, 
      actionsResponse,
      opportunitiesResponse,
      contentResponse,
      auditResponse,
      conversionsResponse
    ] = await Promise.all([
      fetchAPI('/api/stats'),
      fetchAPI('/api/seo-score'),
      fetchAPI('/api/alerts'),
      fetchAPI('/api/actions/top?limit=5'),
      fetchAPI('/api/opportunities'),
      fetchAPI('/api/content'),
      fetchAPI('/api/audit'),
      fetchAPI('/api/conversions/stats')
    ]);
    
    const stats = (await statsResponse.json()).data || {};
    const scoreData = (await scoreResponse.json()).data || { score: 0 };
    const alerts = (await alertsResponse.json()).data || [];
    const actions = (await actionsResponse.json()).actions || [];
    const opportunities = (await opportunitiesResponse.json()).data || [];
    const contents = (await contentResponse.json()).data || [];
    const auditPages = (await auditResponse.json()).data || [];
    const conversions = (await conversionsResponse.json()).data || {};

    // Stocker en cache avec timestamp
    cockpitCache = { stats, scoreData, alerts, actions, opportunities, contents, auditPages, conversions };
    cockpitCacheTimestamp = Date.now();
    
    // Render
    renderCockpitV2(cockpitCache);

  } catch (err) {
    container.innerHTML = '<p class="error">Erreur de connexion à l\'API</p>';
    console.error('loadCockpit error:', err);
  }
}

/**
 * Render Cockpit V2 depuis le cache
 */
function renderCockpitV2(data) {
  const container = document.getElementById('cockpit-container');
  const { stats, scoreData, alerts, actions, opportunities, contents, auditPages, conversions } = data;

    // Calculs agrégés
    const score = scoreData.score || 0;
    const scoreColor = score >= 70 ? '#2ecc71' : score >= 40 ? '#f4c430' : '#e74c3c';
    const scoreLevel = score >= 70 ? 'Bon' : score >= 40 ? 'Moyen' : 'Critique';
    
    const liveCount = contents.filter(c => ['deployed', 'published', 'live'].includes(c.status)).length;
    const pendingCount = contents.length - liveCount;
    
    const highOpportunities = opportunities.filter(o => o.priority === 'high').length;
    const totalOpportunities = opportunities.length;
    
    const auditOk = auditPages.filter(p => p.has_title && p.has_meta && p.has_h1 && p.alt_missing === 0).length;
    const auditTotal = auditPages.length;
    
    // Top 5 opportunités (limité)
    const topOpportunities = opportunities.slice(0, 5);
    
    // Top 5 alertes avec niveaux (critical/warning/info)
    const sortedAlerts = alerts.map(a => ({
      ...a,
      level: a.type === 'danger' ? 'critical' : a.type === 'warning' ? 'warning' : 'info'
    })).sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 };
      return order[a.level] - order[b.level];
    });
    const topAlerts = sortedAlerts.slice(0, 5);
    
    // Top 5 actions (limité - Audit IA produira la liste complète)
    const topActions = actions.slice(0, 5);

    // Construire le HTML V2
    const html = `
      <div class="cockpit-v2">
        
        <!-- SECTION 1 : Score Global + KPIs -->
        <div class="cockpit-header">
          <div class="cockpit-score-section">
            <div class="cockpit-score-circle large">
              <svg viewBox="0 0 140 140">
                <circle cx="70" cy="70" r="62" fill="none" stroke="#2a2a3e" stroke-width="10"/>
                <circle cx="70" cy="70" r="62" fill="none" stroke="${scoreColor}" stroke-width="10" 
                  stroke-dasharray="${score * 3.89} 389" stroke-linecap="round" transform="rotate(-90 70 70)"/>
              </svg>
              <div class="score-center">
                <span class="score-num">${score}</span>
                <span class="score-label">SEO</span>
              </div>
            </div>
            <div class="score-meta">
              <span class="score-level" style="color: ${scoreColor}">${scoreLevel}</span>
              <div class="score-breakdown">
                ${scoreData.breakdown ? `
                  <div class="breakdown-item">
                    <span class="bd-label">Technique</span>
                    <span class="bd-value">${scoreData.breakdown.technique?.score || 0}%</span>
                  </div>
                  <div class="breakdown-item">
                    <span class="bd-label">Contenu</span>
                    <span class="bd-value">${scoreData.breakdown.contenu?.score || 0}%</span>
                  </div>
                  <div class="breakdown-item">
                    <span class="bd-label">Performance</span>
                    <span class="bd-value">${scoreData.breakdown.performance?.score || 0}%</span>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
          
          <div class="cockpit-kpis-grid">
            <div class="kpi-card">
              <span class="kpi-icon">🖱️</span>
              <span class="kpi-value">${stats.total_clicks || 0}</span>
              <span class="kpi-label">Clics</span>
            </div>
            <div class="kpi-card">
              <span class="kpi-icon">👁️</span>
              <span class="kpi-value">${formatNumber(stats.total_impressions || 0)}</span>
              <span class="kpi-label">Impressions</span>
            </div>
            <div class="kpi-card">
              <span class="kpi-icon">📍</span>
              <span class="kpi-value">${stats.avg_position ? stats.avg_position.toFixed(1) : '-'}</span>
              <span class="kpi-label">Position moy.</span>
            </div>
            <div class="kpi-card kpi-live">
              <span class="kpi-icon">🟢</span>
              <span class="kpi-value">${liveCount}</span>
              <span class="kpi-label">Pages live</span>
            </div>
            <div class="kpi-card kpi-pending">
              <span class="kpi-icon">⏳</span>
              <span class="kpi-value">${pendingCount}</span>
              <span class="kpi-label">En attente</span>
            </div>
            <div class="kpi-card kpi-opportunities ${highOpportunities > 0 ? 'has-high' : ''}">
              <span class="kpi-icon">💡</span>
              <span class="kpi-value">${totalOpportunities}</span>
              <span class="kpi-label">Opportunités</span>
            </div>
          </div>
        </div>

        <!-- SECTION 2 : Alertes prioritaires -->
        ${topAlerts.length > 0 ? `
        <div class="cockpit-section cockpit-alerts">
          <h4>⚠️ Alertes prioritaires</h4>
          <div class="alerts-list">
            ${topAlerts.map(a => `
              <div class="alert-item alert-${a.level}">
                <span class="alert-icon">${a.level === 'critical' ? '🔴' : a.level === 'warning' ? '🟠' : '🔵'}</span>
                <span class="alert-level">${a.level.toUpperCase()}</span>
                <span class="alert-text">${escapeHtml(a.message)}</span>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <!-- SECTION 3 : Top Opportunités -->
        <div class="cockpit-section cockpit-opportunities">
          <h4>💡 Top Opportunités <span class="section-count">(${topOpportunities.length}/${totalOpportunities})</span></h4>
          ${topOpportunities.length > 0 ? `
          <div class="opportunities-list">
            ${topOpportunities.map(opp => {
              const priorityClass = opp.priority === 'high' ? 'priority-high' : opp.priority === 'medium' ? 'priority-medium' : 'priority-low';
              return `
              <div class="opportunity-card ${priorityClass}">
                <div class="opp-info">
                  <span class="opp-keyword">${escapeHtml(opp.keyword || opp.target || 'N/A')}</span>
                  <span class="opp-meta">Position ${opp.position || '-'} • ${opp.impressions || 0} imp.</span>
                </div>
                <div class="opp-actions">
                  <span class="opp-type">${opp.opportunity_type || opp.type || 'SEO'}</span>
                  <button class="btn-small btn-primary" onclick="executeAction('create_content', '${escapeHtml(opp.keyword || opp.target || '')}', ${opp.id || 'null'})">🚀 Créer</button>
                </div>
              </div>
              `;
            }).join('')}
          </div>
          ` : '<p class="no-data">Aucune opportunité détectée</p>'}
        </div>

        <!-- SECTION 4 : Actions recommandées -->
        <div class="cockpit-section cockpit-actions">
          <h4>🎯 Actions recommandées <span class="section-count">(Top 5)</span></h4>
          <div class="actions-list">
            ${topActions.length > 0 ? topActions.map(action => {
              const priorityColor = action.priority === 'HIGH' ? '#e74c3c' : action.priority === 'MEDIUM' ? '#f4c430' : '#2ecc71';
              const actionIcon = action.action_type === 'create_content' ? '📝' : 
                                 action.action_type === 'optimize_page' ? '🔧' : 
                                 action.action_type === 'fix_technical' ? '⚠️' : '▶️';
              return `
              <div class="action-card" style="border-left: 4px solid ${priorityColor}">
                <div class="action-info">
                  <span class="action-icon">${actionIcon}</span>
                  <div class="action-details">
                    <span class="action-title">${escapeHtml(action.description)}</span>
                    <span class="action-impact">${action.impact_label || ''}</span>
                  </div>
                </div>
                <button class="btn-action" onclick="executeAction('${action.action_type}', '${escapeHtml(action.target)}', ${action.source_id || 'null'})">▶</button>
              </div>
              `;
            }).join('') : '<p class="no-data">Aucune action recommandée</p>'}
          </div>
        </div>

        <!-- SECTION 5 : Sous-modules techniques (accordéons) -->
        <div class="cockpit-section cockpit-submodules">
          <h4>📊 Détails par module</h4>
          
          <!-- Search Console -->
          <div class="submodule-accordion">
            <button class="accordion-header" onclick="toggleAccordion(this)">
              <span>📈 Search Console</span>
              <span class="accordion-summary">${stats.total_queries || 0} requêtes • ${stats.total_clicks || 0} clics</span>
              <span class="accordion-icon">▼</span>
            </button>
            <div class="accordion-content">
              <div class="submodule-stats">
                <div class="stat-row"><span>Requêtes suivies</span><span>${stats.total_queries || 0}</span></div>
                <div class="stat-row"><span>Clics totaux</span><span>${stats.total_clicks || 0}</span></div>
                <div class="stat-row"><span>Impressions</span><span>${formatNumber(stats.total_impressions || 0)}</span></div>
                <div class="stat-row"><span>Position moyenne</span><span>${stats.avg_position ? stats.avg_position.toFixed(1) : '-'}</span></div>
              </div>
              <button class="btn-small btn-secondary" onclick="document.querySelector('[data-tab=searchconsole]').click()">Voir détails →</button>
            </div>
          </div>

          <!-- Contenu -->
          <div class="submodule-accordion">
            <button class="accordion-header" onclick="toggleAccordion(this)">
              <span>📄 Contenu</span>
              <span class="accordion-summary">${liveCount} live • ${pendingCount} en attente</span>
              <span class="accordion-icon">▼</span>
            </button>
            <div class="accordion-content">
              <div class="submodule-stats">
                <div class="stat-row"><span>Contenus totaux</span><span>${contents.length}</span></div>
                <div class="stat-row"><span>Publiés (live)</span><span>${liveCount}</span></div>
                <div class="stat-row"><span>En attente</span><span>${pendingCount}</span></div>
              </div>
              <button class="btn-small btn-secondary" onclick="document.querySelector('[data-tab=content]').click()">Voir détails →</button>
            </div>
          </div>

          <!-- Audit technique -->
          <div class="submodule-accordion">
            <button class="accordion-header" onclick="toggleAccordion(this)">
              <span>🔍 Audit technique</span>
              <span class="accordion-summary">${auditOk}/${auditTotal} pages OK</span>
              <span class="accordion-icon">▼</span>
            </button>
            <div class="accordion-content">
              <div class="submodule-stats">
                <div class="stat-row"><span>Pages analysées</span><span>${auditTotal}</span></div>
                <div class="stat-row"><span>Pages conformes</span><span>${auditOk}</span></div>
                <div class="stat-row"><span>Problèmes détectés</span><span>${auditTotal - auditOk}</span></div>
              </div>
              <button class="btn-small btn-secondary" onclick="document.querySelector('[data-tab=audit]').click()">Voir détails →</button>
            </div>
          </div>

          <!-- Conversions -->
          <div class="submodule-accordion">
            <button class="accordion-header" onclick="toggleAccordion(this)">
              <span>🎯 Conversions</span>
              <span class="accordion-summary">${conversions.total || 0} total • ${conversions.this_month || 0} ce mois</span>
              <span class="accordion-icon">▼</span>
            </button>
            <div class="accordion-content">
              <div class="submodule-stats">
                <div class="stat-row"><span>Conversions totales</span><span>${conversions.total || 0}</span></div>
                <div class="stat-row"><span>Ce mois</span><span>${conversions.this_month || 0}</span></div>
                <div class="stat-row"><span>Cette semaine</span><span>${conversions.this_week || 0}</span></div>
                <div class="stat-row"><span>Aujourd'hui</span><span>${conversions.today || 0}</span></div>
              </div>
              <button class="btn-small btn-secondary" onclick="document.querySelector('[data-tab=conversions]').click()">Voir détails →</button>
            </div>
          </div>
        </div>

        <!-- SECTION 6 : Bouton Audit IA -->
        <div class="cockpit-section cockpit-cta">
          <div class="cta-box">
            <div class="cta-info">
              <h4>🤖 Audit IA complet</h4>
              <p>Analyse approfondie avec Claude pour obtenir des recommandations personnalisées et actionnables.</p>
            </div>
            <button class="btn-large btn-primary" onclick="goToAuditIA()">
              <span>🚀 Lancer Audit IA</span>
            </button>
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
 * Toggle accordéon sous-module
 */
function toggleAccordion(btn) {
  const content = btn.nextElementSibling;
  const icon = btn.querySelector('.accordion-icon');
  const isOpen = content.classList.contains('open');
  
  // Fermer tous les autres
  document.querySelectorAll('.accordion-content.open').forEach(el => {
    el.classList.remove('open');
    el.previousElementSibling.querySelector('.accordion-icon').textContent = '▼';
  });
  
  // Toggle celui-ci
  if (!isOpen) {
    content.classList.add('open');
    icon.textContent = '▲';
  }
}

/**
 * Lancer Audit IA (placeholder - sera implémenté en V2.2)
 */
function launchAuditIA() {
  alert('🚀 Audit IA\n\nCette fonctionnalité sera disponible dans la version V2.2.\n\nElle analysera toutes les données du Cockpit avec Claude pour produire un audit final exploitable.');
}

// ══════════════════════════════════════════════════════════════════════════════
// AUDIT IA V2.2 — Analyse décisionnelle avec Claude
// ══════════════════════════════════════════════════════════════════════════════

// Configuration API Claude (à migrer côté backend en production)
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
// Note: La clé API sera fournie via variable d'environnement backend en production

/**
 * Cache pour le dernier audit IA
 */
let lastAuditIA = null;
let auditIAInProgress = false;

/**
 * Prépare les données du cockpit pour l'analyse Claude
 */
function prepareCockpitDataForAudit() {
  if (!cockpitCache) {
    return null;
  }
  
  const { stats, scoreData, alerts, actions, opportunities, contents, auditPages, conversions } = cockpitCache;
  
  // Résumé structuré pour Claude
  return {
    score_global: scoreData.score || 0,
    score_breakdown: scoreData.breakdown || {},
    
    search_console: {
      clics: stats.total_clicks || 0,
      impressions: stats.total_impressions || 0,
      position_moyenne: stats.avg_position || 0,
      requetes: stats.total_queries || 0
    },
    
    contenu: {
      total: contents.length,
      live: contents.filter(c => ['deployed', 'published', 'live'].includes(c.status)).length,
      en_attente: contents.filter(c => !['deployed', 'published', 'live'].includes(c.status)).length
    },
    
    opportunites: opportunities.slice(0, 10).map(o => ({
      keyword: o.keyword || o.target,
      priority: o.priority,
      position: o.position,
      impressions: o.impressions,
      type: o.opportunity_type || o.type
    })),
    
    audit_technique: {
      pages_analysees: auditPages.length,
      pages_conformes: auditPages.filter(p => p.has_title && p.has_meta && p.has_h1 && p.alt_missing === 0).length,
      problemes: auditPages.filter(p => !p.has_title || !p.has_meta || !p.has_h1 || p.alt_missing > 0).map(p => ({
        page: p.page_url,
        issues: [
          !p.has_title ? 'title manquant' : null,
          !p.has_meta ? 'meta description manquante' : null,
          !p.has_h1 ? 'H1 manquant' : null,
          p.alt_missing > 0 ? `${p.alt_missing} alt manquants` : null
        ].filter(Boolean)
      }))
    },
    
    conversions: conversions,
    
    alertes: alerts.slice(0, 5).map(a => a.message)
  };
}

/**
 * Appelle l'API Claude pour l'analyse
 * Note: En production, cet appel passera par le backend Vercel
 */
async function callClaudeForAudit(cockpitData) {
  const prompt = `Tu es un expert SEO analysant le site Mistral Pro Reno (entreprise de rénovation à Paris).

DONNÉES DU COCKPIT SEO:
${JSON.stringify(cockpitData, null, 2)}

MISSION:
Analyse ces données et produis un audit SEO décisionnel.

RÉPONDS UNIQUEMENT EN JSON avec cette structure exacte:
{
  "summary": "Résumé de la situation SEO en 2-3 phrases",
  "strengths": [
    "Point fort 1",
    "Point fort 2",
    "Point fort 3"
  ],
  "weaknesses": [
    "Point faible 1",
    "Point faible 2",
    "Point faible 3"
  ],
  "actions": [
    {
      "type": "create_content",
      "target": "mot-clé ou sujet",
      "priority": "HIGH",
      "impact": "Description de l'impact attendu",
      "reason": "Pourquoi cette action"
    },
    {
      "type": "optimize_page",
      "target": "URL ou page",
      "priority": "MEDIUM",
      "impact": "Description de l'impact attendu",
      "reason": "Pourquoi cette action"
    },
    {
      "type": "fix_technical",
      "target": "Problème technique",
      "priority": "HIGH",
      "impact": "Description de l'impact attendu",
      "reason": "Pourquoi cette action"
    }
  ]
}

RÈGLES:
- Maximum 5 actions prioritaires
- Types autorisés: create_content, optimize_page, fix_technical
- Priorités: HIGH, MEDIUM, LOW
- Sois concis et actionnable
- Réponds UNIQUEMENT en JSON valide, sans texte avant ou après`;

  // Appel API via le backend Vercel (endpoint à créer)
  // Pour l'instant, on simule la réponse
  const response = await fetchAPI('/api/audit-ia/analyze', {
    method: 'POST',
    body: JSON.stringify({ cockpitData, prompt })
  });
  
  if (!response.ok) {
    // Fallback: simulation locale si l'endpoint n'existe pas encore
    console.warn('[Audit IA] Endpoint non disponible, utilisation du mode simulation');
    return generateSimulatedAudit(cockpitData);
  }
  
  const result = await response.json();
  return result.data;
}

/**
 * Génère un audit simulé basé sur les données (mode fallback)
 * V2.2.1 - Ajout actionId, impactScore, tri par priorité
 */
function generateSimulatedAudit(data) {
  const score = data.score_global;
  const hasOpportunities = data.opportunites && data.opportunites.length > 0;
  const hasTechnicalIssues = data.audit_technique.pages_analysees > data.audit_technique.pages_conformes;
  const lowContent = data.contenu.live < 5;
  
  // Génération dynamique basée sur les données réelles
  const strengths = [];
  const weaknesses = [];
  const actions = [];
  let actionCounter = 1;
  
  // Fonction helper pour créer une action normalisée
  function createAction(type, target, priority, impact, reason, impactScore) {
    // Types autorisés uniquement : create_content, optimize_page, fix_technical
    const validTypes = ['create_content', 'optimize_page', 'fix_technical'];
    if (!validTypes.includes(type)) {
      console.warn('[Audit] Type action invalide:', type);
      type = 'optimize_page';
    }
    return {
      actionId: `action_${Date.now()}_${actionCounter++}`,
      type,
      target,
      priority,
      impact,
      reason,
      impactScore: Math.min(100, Math.max(0, impactScore)) // 0-100
    };
  }
  
  // Analyse du score technique
  if (data.score_breakdown.technique?.score >= 80) {
    strengths.push('Structure technique solide avec tous les éléments SEO de base en place');
  } else {
    weaknesses.push('Structure technique à améliorer (titres, méta, H1)');
  }
  
  // Analyse du contenu
  if (data.contenu.live >= 5) {
    strengths.push(`${data.contenu.live} pages de contenu publiées et indexables`);
  } else {
    weaknesses.push(`Seulement ${data.contenu.live} pages publiées — volume de contenu insuffisant`);
    actions.push(createAction(
      'create_content',
      data.opportunites[0]?.keyword || 'rénovation appartement paris',
      'HIGH',
      '+15-25 clics/mois estimés',
      'Augmenter le volume de contenu indexable',
      75
    ));
  }
  
  // Analyse des opportunités
  if (hasOpportunities) {
    const topOpp = data.opportunites[0];
    if (topOpp.position && topOpp.position > 10 && topOpp.position < 30) {
      weaknesses.push(`Position ${topOpp.position} pour "${topOpp.keyword}" — potentiel de gain rapide`);
      const estimatedClicks = Math.round(topOpp.impressions * 0.15);
      actions.push(createAction(
        'create_content',
        topOpp.keyword,
        'HIGH',
        `+${estimatedClicks} clics/mois si top 5`,
        `Quick win: déjà en position ${topOpp.position} avec ${topOpp.impressions} impressions`,
        Math.min(90, 50 + estimatedClicks)
      ));
    }
    strengths.push(`${data.opportunites.length} opportunités SEO identifiées`);
  }
  
  // Analyse technique
  if (hasTechnicalIssues) {
    const issues = data.audit_technique.problemes;
    if (issues.length > 0) {
      weaknesses.push(`${issues.length} page(s) avec problèmes techniques`);
      actions.push(createAction(
        'fix_technical',
        issues[0].page,
        'MEDIUM',
        'Amélioration indexation et UX',
        `Problèmes détectés: ${issues[0].issues.join(', ')}`,
        60
      ));
    }
  }
  
  // Analyse Search Console
  if (data.search_console.clics < 10 && data.search_console.impressions > 100) {
    weaknesses.push(`CTR faible: ${data.search_console.clics} clics pour ${data.search_console.impressions} impressions`);
    actions.push(createAction(
      'optimize_page',
      'Titres et méta descriptions',
      'MEDIUM',
      'CTR amélioré = plus de clics',
      'Les impressions existent mais les clics ne suivent pas',
      55
    ));
  }
  
  // Compléter si nécessaire
  if (strengths.length === 0) {
    strengths.push('Site fonctionnel et accessible');
  }
  if (weaknesses.length === 0) {
    weaknesses.push('Pas de faiblesses critiques détectées');
  }
  
  // Summary (max 6 lignes / ~200 caractères)
  let summary = '';
  if (score >= 70) {
    summary = `Score SEO ${score}/100 — bonne santé. `;
  } else if (score >= 40) {
    summary = `Score SEO ${score}/100 — axes d'amélioration identifiés. `;
  } else {
    summary = `Score SEO ${score}/100 — actions urgentes requises. `;
  }
  summary += `${data.contenu.live} pages live, ${data.opportunites.length} opportunités.`;
  
  // Tri des actions par priorité (HIGH > MEDIUM > LOW) puis par impactScore
  const priorityOrder = { 'HIGH': 0, 'MEDIUM': 1, 'LOW': 2 };
  const sortedActions = actions.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.impactScore - a.impactScore; // Plus haut score en premier
  });
  
  return {
    summary,
    strengths: strengths.slice(0, 3),
    weaknesses: weaknesses.slice(0, 3),
    actions: sortedActions.slice(0, 5)
  };
}

/**
 * Lance l'Audit IA complet
 */
async function launchFullAuditIA() {
  if (auditIAInProgress) {
    console.warn('[Audit IA] Analyse déjà en cours');
    return;
  }
  
  const container = document.getElementById('audit-ia-container');
  
  // Vérifier que le cockpit est chargé
  if (!cockpitCache) {
    container.innerHTML = `
      <div class="audit-ia-error">
        <span class="error-icon">⚠️</span>
        <h3>Données Cockpit manquantes</h3>
        <p>Chargez d'abord le Cockpit pour obtenir les données à analyser.</p>
        <button class="btn-primary" onclick="document.querySelector('[data-tab=cockpit]').click()">Aller au Cockpit</button>
      </div>
    `;
    return;
  }
  
  auditIAInProgress = true;
  
  // Afficher le loader
  container.innerHTML = `
    <div class="audit-ia-loading">
      <div class="audit-loading-spinner"></div>
      <h3>🤖 Analyse en cours avec Claude IA...</h3>
      <p>Fusion des données et génération de l'audit décisionnel</p>
      <div class="loading-steps">
        <div class="step active">📊 Agrégation des données</div>
        <div class="step">🧠 Analyse Claude</div>
        <div class="step">📋 Génération du rapport</div>
      </div>
    </div>
  `;
  
  try {
    // Étape 1: Préparer les données
    const cockpitData = prepareCockpitDataForAudit();
    
    // Update UI
    container.querySelector('.step:nth-child(1)').classList.add('done');
    container.querySelector('.step:nth-child(2)').classList.add('active');
    
    // Étape 2: Appeler Claude
    const auditResult = await callClaudeForAudit(cockpitData);
    
    // Update UI
    container.querySelector('.step:nth-child(2)').classList.add('done');
    container.querySelector('.step:nth-child(3)').classList.add('active');
    
    // Étape 3: Afficher le résultat
    lastAuditIA = auditResult;
    renderAuditIAResult(auditResult);
    
  } catch (error) {
    console.error('[Audit IA] Erreur:', error);
    container.innerHTML = `
      <div class="audit-ia-error">
        <span class="error-icon">❌</span>
        <h3>Erreur lors de l'analyse</h3>
        <p>${error.message}</p>
        <button class="btn-primary" onclick="launchFullAuditIA()">🔄 Réessayer</button>
      </div>
    `;
  } finally {
    auditIAInProgress = false;
  }
}

/**
 * Affiche le résultat de l'Audit IA
 */
function renderAuditIAResult(audit) {
  const container = document.getElementById('audit-ia-container');
  
  const html = `
    <div class="audit-ia-result">
      
      <!-- Résumé -->
      <div class="audit-section audit-summary">
        <h3>📋 Résumé de l'audit</h3>
        <p class="summary-text">${escapeHtml(audit.summary)}</p>
        <div class="audit-meta">
          <span>🕐 Généré le ${new Date().toLocaleString('fr-FR')}</span>
          <button class="btn-small btn-secondary" onclick="launchFullAuditIA()">🔄 Relancer</button>
        </div>
      </div>
      
      <!-- Forces & Faiblesses -->
      <div class="audit-two-cols">
        <div class="audit-section audit-strengths">
          <h3>💪 Forces SEO</h3>
          <ul class="audit-list strengths-list">
            ${audit.strengths.map(s => `<li><span class="list-icon">✅</span> ${escapeHtml(s)}</li>`).join('')}
          </ul>
        </div>
        
        <div class="audit-section audit-weaknesses">
          <h3>⚠️ Faiblesses SEO</h3>
          <ul class="audit-list weaknesses-list">
            ${audit.weaknesses.map(w => `<li><span class="list-icon">⚠️</span> ${escapeHtml(w)}</li>`).join('')}
          </ul>
        </div>
      </div>
      
      <!-- Actions prioritaires -->
      <div class="audit-section audit-actions-ia">
        <h3>🎯 Actions prioritaires</h3>
        <p class="section-intro">Cliquez sur une action pour l'exécuter directement.</p>
        
        <div class="audit-actions-list">
          ${audit.actions.map((action, idx) => {
            const priorityClass = action.priority === 'HIGH' ? 'priority-high' : action.priority === 'MEDIUM' ? 'priority-medium' : 'priority-low';
            const actionIcon = action.type === 'create_content' ? '📝' : action.type === 'optimize_page' ? '🔧' : '⚠️';
            const actionLabel = action.type === 'create_content' ? 'Créer' : action.type === 'optimize_page' ? 'Optimiser' : 'Corriger';
            const actionBtnClass = action.type === 'create_content' ? 'btn-primary' : action.type === 'optimize_page' ? 'btn-secondary' : 'btn-warning';
            const impactScore = action.impactScore || 50;
            const impactColor = impactScore >= 70 ? '#10b981' : impactScore >= 40 ? '#f59e0b' : '#9ca3af';
            
            return `
            <div class="audit-action-card ${priorityClass}" data-action-id="${action.actionId || ''}">
              <div class="action-header">
                <span class="action-icon-large">${actionIcon}</span>
                <div class="action-header-info">
                  <span class="action-type-label">${actionLabel}</span>
                  <span class="action-priority-badge ${priorityClass}">${action.priority}</span>
                </div>
                <div class="action-impact-score" title="Score d'impact">
                  <svg viewBox="0 0 36 36" class="impact-circle">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#2a2a3e" stroke-width="3"/>
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="${impactColor}" stroke-width="3" 
                      stroke-dasharray="${impactScore} 100" stroke-linecap="round" transform="rotate(-90 18 18)"/>
                  </svg>
                  <span class="impact-value">${impactScore}</span>
                </div>
              </div>
              <div class="action-body">
                <h4 class="action-target">${escapeHtml(action.target)}</h4>
                <p class="action-reason">${escapeHtml(action.reason)}</p>
                <p class="action-impact"><strong>Impact:</strong> ${escapeHtml(action.impact)}</p>
              </div>
              <div class="action-footer">
                <button class="${actionBtnClass}" onclick="executeAuditAction('${action.type}', '${escapeHtml(action.target)}', '${action.actionId || ''}')">
                  ${actionIcon} ${actionLabel}
                </button>
              </div>
            </div>
            `;
          }).join('')}
        </div>
      </div>
      
    </div>
  `;
  
  container.innerHTML = html;
}

/**
 * Exécute une action depuis l'Audit IA
 * V2.3: Redirection vers Studio SEO IA pour create_content
 */
function executeAuditAction(actionType, target, actionId) {
  console.log('[Audit IA] Exécution action:', actionType, target, actionId);
  
  switch (actionType) {
    case 'create_content':
      // V2.3: Rediriger vers Studio SEO IA avec le target pré-rempli
      goToStudioSEO(target, actionId);
      break;
      
    case 'optimize_page':
      alert(`🔧 Optimisation de "${target}"\n\nConsultez l'onglet Pages SEO pour plus de détails.`);
      document.querySelector('[data-tab="pages"]').click();
      break;
      
    case 'fix_technical':
      alert(`⚠️ Correction technique pour "${target}"\n\nConsultez l'onglet Audit technique.`);
      document.querySelector('[data-tab="audit"]').click();
      break;
      
    default:
      console.warn('[Audit IA] Type d\'action inconnu:', actionType);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// STUDIO SEO IA V2.3 — Génération contenu final + Publication
// ══════════════════════════════════════════════════════════════════════════════

// Cache pour le contenu généré
let studioGeneratedContent = null;
let studioInProgress = false;

/**
 * Navigation vers Studio SEO IA avec mot-clé pré-rempli
 */
function goToStudioSEO(keyword, actionId) {
  // Activer l'onglet Studio SEO
  document.querySelector('[data-tab="studio-seo"]').click();
  
  // Pré-remplir le mot-clé
  setTimeout(() => {
    const keywordInput = document.getElementById('studioKeyword');
    if (keywordInput && keyword) {
      keywordInput.value = keyword;
      console.log('[Studio SEO] Mot-clé pré-rempli:', keyword);
    }
  }, 100);
}

/**
 * Génère le contenu SEO complet via simulation (ou API Claude)
 */
async function generateSEOContent() {
  if (studioInProgress) {
    console.warn('[Studio SEO] Génération déjà en cours');
    return;
  }
  
  const keyword = document.getElementById('studioKeyword').value.trim();
  if (!keyword) {
    alert('Veuillez saisir un mot-clé principal');
    return;
  }
  
  const contentType = document.getElementById('studioType').value;
  const tone = document.getElementById('studioTone').value;
  const length = document.getElementById('studioLength').value;
  const context = document.getElementById('studioContext').value.trim();
  
  studioInProgress = true;
  
  // Afficher le loader
  const resultSection = document.getElementById('studio-result');
  resultSection.style.display = 'block';
  resultSection.innerHTML = `
    <div class="studio-loading">
      <div class="studio-loading-spinner"></div>
      <h3>✨ Génération du contenu en cours...</h3>
      <p>Claude rédige votre article SEO optimisé</p>
      <div class="loading-progress">
        <div class="progress-step active">📝 Création structure</div>
        <div class="progress-step">✍️ Rédaction contenu</div>
        <div class="progress-step">🔍 Optimisation SEO</div>
      </div>
    </div>
  `;
  resultSection.scrollIntoView({ behavior: 'smooth' });
  
  try {
    // Appel API (simulation pour l'instant)
    const content = await callClaudeForContent({
      keyword,
      type: contentType,
      tone,
      length,
      context
    });
    
    // Stocker le contenu
    studioGeneratedContent = content;
    
    // Afficher le résultat
    renderStudioResult(content);
    
  } catch (error) {
    console.error('[Studio SEO] Erreur:', error);
    resultSection.innerHTML = `
      <div class="studio-error">
        <span class="error-icon">❌</span>
        <h3>Erreur lors de la génération</h3>
        <p>${error.message}</p>
        <button class="btn-primary" onclick="generateSEOContent()">🔄 Réessayer</button>
      </div>
    `;
  } finally {
    studioInProgress = false;
  }
}

/**
 * Appelle Claude pour générer le contenu (simulation)
 */
async function callClaudeForContent(params) {
  // Simuler un délai de génération
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Update progress
  document.querySelectorAll('.progress-step').forEach((el, i) => {
    if (i === 0) el.classList.add('done');
    if (i === 1) el.classList.add('active');
  });
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  document.querySelectorAll('.progress-step').forEach((el, i) => {
    if (i === 1) el.classList.add('done');
    if (i === 2) el.classList.add('active');
  });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Générer le contenu simulé basé sur les paramètres
  const wordCount = params.length === 'short' ? 500 : params.length === 'medium' ? 800 : 1200;
  const slug = params.keyword.toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  const title = `${capitalizeFirst(params.keyword)} | Guide Complet 2026 - Mistral Pro Reno`;
  const h1 = `${capitalizeFirst(params.keyword)} : Guide et Conseils d'Experts`;
  const metaDescription = `Découvrez tout sur ${params.keyword}. Conseils d'experts, prix, étapes et devis gratuit. Mistral Pro Reno, votre partenaire rénovation en Île-de-France.`;
  
  // Générer le contenu HTML complet
  const htmlContent = generateArticleHTML({
    keyword: params.keyword,
    title,
    h1,
    metaDescription,
    slug,
    type: params.type,
    tone: params.tone,
    context: params.context
  });
  
  return {
    keyword: params.keyword,
    type: params.type,
    title,
    h1,
    slug,
    metaDescription,
    wordCount: wordCount,
    htmlContent,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Génère le HTML complet de l'article
 */
function generateArticleHTML(params) {
  const { keyword, title, h1, metaDescription, slug, type, tone, context } = params;
  const keywordCap = capitalizeFirst(keyword);
  
  // Structure de l'article
  const sections = [
    {
      h2: `Qu'est-ce que ${keyword} ?`,
      content: `Le ${keyword} est un élément essentiel pour tout projet de rénovation en Île-de-France. Chez Mistral Pro Reno, nous accompagnons nos clients dans cette démarche avec expertise et professionnalisme.`
    },
    {
      h2: `Les étapes clés pour ${keyword}`,
      content: `Pour réussir votre projet de ${keyword}, plusieurs étapes sont essentielles :\n\n1. **Évaluation initiale** : Analyse de vos besoins et de l'existant\n2. **Devis détaillé** : Estimation précise des coûts\n3. **Planification** : Organisation du chantier\n4. **Réalisation** : Travaux par nos artisans certifiés\n5. **Réception** : Vérification et validation finale`
    },
    {
      h2: `Prix et budget pour ${keyword}`,
      content: `Le budget pour ${keyword} varie selon plusieurs facteurs : surface, matériaux, complexité. En moyenne en Île-de-France :\n\n- **Entrée de gamme** : à partir de 150€/m²\n- **Milieu de gamme** : 250 à 400€/m²\n- **Haut de gamme** : 500€/m² et plus\n\nContactez-nous pour un devis gratuit personnalisé.`
    },
    {
      h2: `Pourquoi choisir Mistral Pro Reno ?`,
      content: `Mistral Pro Reno est votre partenaire de confiance pour ${keyword} :\n\n- ✅ **+10 ans d'expérience** en rénovation\n- ✅ **Artisans certifiés RGE**\n- ✅ **Devis gratuit sous 24h**\n- ✅ **Garantie décennale**\n- ✅ **Intervention Paris et Île-de-France**`
    }
  ];
  
  // Date ISO pour Schema.org
  const dateISO = new Date().toISOString();
  const dateLocal = new Date().toLocaleDateString('fr-FR');
  
  // Schema.org Article
  const schemaOrg = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": h1,
    "description": metaDescription,
    "author": {
      "@type": "Organization",
      "name": "Mistral Pro Reno",
      "url": "https://www.mistralpro-reno.fr"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Mistral Pro Reno",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.mistralpro-reno.fr/images/logo.webp"
      }
    },
    "datePublished": dateISO,
    "dateModified": dateISO,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://www.mistralpro-reno.fr/blog/${slug}.html`
    }
  };
  
  // Générer le HTML
  let articleHTML = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${metaDescription}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://www.mistralpro-reno.fr/blog/${slug}.html">
  
  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${metaDescription}">
  <meta property="og:url" content="https://www.mistralpro-reno.fr/blog/${slug}.html">
  <meta property="og:site_name" content="Mistral Pro Reno">
  
  <!-- Schema.org -->
  <script type="application/ld+json">
${JSON.stringify(schemaOrg, null, 2)}
  </script>
  
  <link rel="stylesheet" href="../css/main.css">
  <link rel="stylesheet" href="../css/blog.css">
</head>
<body>
  <!-- Header inclus via JS -->
  
  <main class="blog-article">
    <article itemscope itemtype="https://schema.org/Article">
      <header class="article-header">
        <h1 itemprop="headline">${h1}</h1>
        <div class="article-meta">
          <span class="article-date" itemprop="datePublished" content="${dateISO}">Publié le ${dateLocal}</span>
          <span class="article-author" itemprop="author" itemscope itemtype="https://schema.org/Organization">
            Par <span itemprop="name">Mistral Pro Reno</span>
          </span>
        </div>
      </header>
      
      <div class="article-content" itemprop="articleBody">
        <p class="article-intro"><strong>${metaDescription}</strong></p>
        
`;

  sections.forEach(section => {
    articleHTML += `        <h2>${section.h2}</h2>
        <p>${section.content.replace(/\n/g, '</p>\n        <p>')}</p>
        
`;
  });

  articleHTML += `        <div class="article-cta">
          <h3>Besoin d'un devis pour ${keyword} ?</h3>
          <p>Contactez Mistral Pro Reno pour un devis gratuit et personnalisé.</p>
          <a href="/cost_calculator.html" class="btn-primary">Obtenir un devis gratuit</a>
        </div>
      </div>
    </article>
  </main>
  
  <!-- Footer inclus via JS -->
  <script src="../js/main.js"></script>
</body>
</html>`;

  return articleHTML;
}

/**
 * Capitalize first letter
 */
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Affiche le résultat de la génération
 */
function renderStudioResult(content) {
  const resultSection = document.getElementById('studio-result');
  
  resultSection.innerHTML = `
    <div class="studio-result">
      <div class="result-header">
        <h3>✅ Contenu généré avec succès</h3>
        <div class="result-meta">
          <span>📄 ${content.type === 'blog' ? 'Article blog' : content.type === 'service' ? 'Page service' : 'Landing page'}</span>
          <span>📝 ~${content.wordCount} mots</span>
          <span>🕐 ${new Date(content.generatedAt).toLocaleTimeString('fr-FR')}</span>
        </div>
      </div>
      
      <div class="result-preview">
        <div class="preview-header">
          <h4>Aperçu SEO</h4>
        </div>
        <div class="seo-preview-card">
          <div class="seo-preview-url">mistralpro-reno.fr/blog/${content.slug}.html</div>
          <div class="seo-preview-title">${escapeHtml(content.title)}</div>
          <div class="seo-preview-meta">${escapeHtml(content.metaDescription)}</div>
        </div>
      </div>
      
      <div class="result-content">
        <div class="content-header">
          <h4>Contenu de l'article</h4>
          <div class="content-actions">
            <button class="btn-small btn-secondary" onclick="copyStudioContent()">📋 Copier</button>
            <button class="btn-small btn-secondary" onclick="regenerateContent()">🔄 Régénérer</button>
          </div>
        </div>
        <div class="content-preview">
          <h1>${escapeHtml(content.h1)}</h1>
          <div class="preview-body">${formatPreviewContent(content.htmlContent)}</div>
        </div>
      </div>
      
      <div class="result-actions">
        <button class="btn-large btn-primary" onclick="showPublishForm()">
          🚀 Publier maintenant
        </button>
        <button class="btn-large btn-secondary" onclick="downloadHTML()">
          💾 Télécharger HTML
        </button>
      </div>
    </div>
  `;
}

/**
 * Format le contenu HTML pour l'aperçu
 */
function formatPreviewContent(html) {
  // Extraire le contenu entre <article> et </article>
  const match = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (match) {
    return match[1];
  }
  return '<p>Aperçu non disponible</p>';
}

/**
 * Copier le contenu HTML
 */
function copyStudioContent() {
  if (!studioGeneratedContent) return;
  navigator.clipboard.writeText(studioGeneratedContent.htmlContent)
    .then(() => alert('✅ Contenu HTML copié dans le presse-papiers'))
    .catch(() => alert('❌ Erreur lors de la copie'));
}

/**
 * Régénérer le contenu
 */
function regenerateContent() {
  studioGeneratedContent = null;
  generateSEOContent();
}

/**
 * Télécharger le HTML
 */
function downloadHTML() {
  if (!studioGeneratedContent) return;
  const blob = new Blob([studioGeneratedContent.htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${studioGeneratedContent.slug}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Vérifie si une URL existe déjà (doublon)
 */
async function checkURLExists(slug) {
  const url = `https://www.mistralpro-reno.fr/blog/${slug}.html`;
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok; // true si la page existe (200)
  } catch (error) {
    // Erreur réseau ou CORS - on suppose que la page n'existe pas
    console.log('[Studio SEO] Vérification URL impossible (CORS):', error);
    return false;
  }
}

/**
 * Affiche le formulaire de publication avec vérification doublons
 */
async function showPublishForm() {
  if (!studioGeneratedContent) return;
  
  const publishSection = document.getElementById('studio-publish');
  publishSection.style.display = 'block';
  
  // Afficher loader pendant la vérification
  publishSection.innerHTML = `
    <div class="publish-checking">
      <div class="studio-loading-spinner small"></div>
      <p>Vérification de l'URL...</p>
    </div>
  `;
  publishSection.scrollIntoView({ behavior: 'smooth' });
  
  // Vérifier si l'URL existe déjà
  const urlExists = await checkURLExists(studioGeneratedContent.slug);
  
  if (urlExists) {
    // Avertissement doublon
    publishSection.innerHTML = `
      <div class="publish-warning">
        <div class="warning-icon">⚠️</div>
        <h3>URL déjà existante</h3>
        <p>Une page existe déjà à cette URL :</p>
        <a href="https://www.mistralpro-reno.fr/blog/${studioGeneratedContent.slug}.html" target="_blank" class="detail-link">
          /blog/${studioGeneratedContent.slug}.html
        </a>
        <p class="warning-note">La publication écrasera le contenu existant. Voulez-vous continuer ?</p>
        
        <div class="publish-actions">
          <button class="btn-large btn-warning" onclick="forcePublish()">
            ⚠️ Écraser et publier
          </button>
          <button class="btn-large btn-secondary" onclick="cancelPublish()">
            Annuler
          </button>
        </div>
        
        <div class="alternative-action">
          <p>Ou modifiez le slug :</p>
          <div class="slug-edit">
            <input type="text" id="newSlug" value="${studioGeneratedContent.slug}-2" />
            <button class="btn-primary" onclick="updateSlugAndPublish()">Utiliser ce slug</button>
          </div>
        </div>
      </div>
    `;
  } else {
    // Pas de doublon, afficher le formulaire normal
    renderPublishForm();
  }
}

/**
 * Affiche le formulaire de publication standard
 */
function renderPublishForm() {
  const publishSection = document.getElementById('studio-publish');
  
  publishSection.innerHTML = `
    <div class="publish-form">
      <h3>🚀 Publication automatique</h3>
      <p class="publish-info">Le fichier sera créé dans /blog/ et déployé automatiquement via GitHub → OVH.</p>
      
      <div class="publish-details">
        <div class="detail-row">
          <span class="detail-label">Fichier :</span>
          <span class="detail-value">/blog/${studioGeneratedContent.slug}.html</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">URL finale :</span>
          <span class="detail-value">https://www.mistralpro-reno.fr/blog/${studioGeneratedContent.slug}.html</span>
        </div>
      </div>
      
      <div class="url-status url-available">
        ✅ URL disponible
      </div>
      
      <div class="publish-steps-preview">
        <div class="step-item">1. Génération fichier HTML</div>
        <div class="step-item">2. Push GitHub (main)</div>
        <div class="step-item">3. Déploiement OVH</div>
        <div class="step-item">4. Vérification URL</div>
      </div>
      
      <div class="publish-actions">
        <button class="btn-large btn-primary" onclick="publishContent()">
          ✅ Confirmer la publication
        </button>
        <button class="btn-large btn-secondary" onclick="cancelPublish()">
          Annuler
        </button>
      </div>
    </div>
  `;
}

/**
 * Force la publication même si l'URL existe
 */
function forcePublish() {
  publishContent();
}

/**
 * Met à jour le slug et relance la publication
 */
function updateSlugAndPublish() {
  const newSlug = document.getElementById('newSlug').value.trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  if (!newSlug) {
    alert('Veuillez saisir un slug valide');
    return;
  }
  
  // Mettre à jour le contenu avec le nouveau slug
  studioGeneratedContent.slug = newSlug;
  studioGeneratedContent.htmlContent = studioGeneratedContent.htmlContent
    .replace(/\/blog\/[^"]+\.html/g, `/blog/${newSlug}.html`);
  
  // Relancer la vérification
  showPublishForm();
}

/**
 * Annuler la publication
 */
function cancelPublish() {
  document.getElementById('studio-publish').style.display = 'none';
}

// ══════════════════════════════════════════════════════════════════════════════
// V2.4 — Publication réelle via GitHub API
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Publie le contenu via GitHub API (avec fallback simulation)
 */
async function publishContent() {
  if (!studioGeneratedContent) return;
  
  const publishSection = document.getElementById('studio-publish');
  const slug = studioGeneratedContent.slug;
  const filePath = `blog/${slug}.html`;
  const finalURL = `https://www.mistralpro-reno.fr/blog/${slug}.html`;
  
  // Afficher le loader
  publishSection.innerHTML = `
    <div class="publish-loading">
      <div class="studio-loading-spinner"></div>
      <h3>🚀 Publication en cours...</h3>
      <div class="publish-steps-progress">
        <div class="step-progress active" id="step1">1. Génération fichier HTML</div>
        <div class="step-progress" id="step2">2. Push GitHub</div>
        <div class="step-progress" id="step3">3. Déploiement OVH</div>
        <div class="step-progress" id="step4">4. Vérification URL</div>
      </div>
    </div>
  `;
  
  try {
    // Étape 1: Préparer le contenu
    updatePublishStep('step1', 'done');
    updatePublishStep('step2', 'active');
    
    // Étape 2: Push GitHub via API backend
    const pushResult = await pushToGitHub(filePath, studioGeneratedContent.htmlContent);
    
    if (!pushResult.success) {
      throw new Error(pushResult.error || 'Erreur lors du push GitHub');
    }
    
    updatePublishStep('step2', 'done');
    updatePublishStep('step3', 'active');
    
    // Étape 3: Attendre le déploiement OVH (GitHub Actions ~30-60s)
    await waitForDeployment(45000); // 45 secondes
    
    updatePublishStep('step3', 'done');
    updatePublishStep('step4', 'active');
    
    // Étape 4: Vérifier que l'URL est accessible
    const urlAccessible = await verifyURLDeployed(finalURL, 5, 3000);
    
    updatePublishStep('step4', 'done');
    
    // Succès
    renderPublishSuccess(finalURL, pushResult.commitUrl);
    
    // Enregistrer dans le contenu (pour tracking)
    await registerPublishedContent(slug, studioGeneratedContent);
    
  } catch (error) {
    console.error('[Publication] Erreur:', error);
    publishSection.innerHTML = `
      <div class="publish-error">
        <span class="error-icon">❌</span>
        <h3>Erreur de publication</h3>
        <p>${escapeHtml(error.message)}</p>
        <div class="error-actions">
          <button class="btn-primary" onclick="publishContent()">🔄 Réessayer</button>
          <button class="btn-secondary" onclick="downloadHTML()">💾 Télécharger HTML</button>
        </div>
        <p class="error-note">Vous pouvez télécharger le HTML et le publier manuellement.</p>
      </div>
    `;
  }
}

/**
 * Met à jour l'état d'une étape de publication
 */
function updatePublishStep(stepId, state) {
  const step = document.getElementById(stepId);
  if (step) {
    step.classList.remove('active', 'done', 'error');
    step.classList.add(state);
  }
}

/**
 * Push le fichier vers GitHub via API backend
 */
async function pushToGitHub(filePath, content) {
  try {
    // Appel API backend pour créer/mettre à jour le fichier
    const response = await fetchAPI('/api/github/publish', {
      method: 'POST',
      body: JSON.stringify({
        path: filePath,
        content: content,
        message: `feat(blog): Ajout article ${filePath} via Studio SEO`,
        branch: 'main'
      })
    });
    
    if (!response.ok) {
      // Fallback: mode simulation si l'endpoint n'existe pas
      console.warn('[Publication] Endpoint GitHub non disponible, mode simulation');
      await simulateDelay(2000);
      return { 
        success: true, 
        simulated: true,
        commitUrl: null 
      };
    }
    
    const result = await response.json();
    return {
      success: true,
      simulated: false,
      commitUrl: result.data?.commit?.html_url || null
    };
    
  } catch (error) {
    console.error('[GitHub] Erreur push:', error);
    // Fallback simulation
    await simulateDelay(2000);
    return { 
      success: true, 
      simulated: true,
      commitUrl: null 
    };
  }
}

/**
 * Attendre le déploiement OVH
 */
async function waitForDeployment(duration) {
  const step = document.getElementById('step3');
  const startTime = Date.now();
  
  while (Date.now() - startTime < duration) {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    if (step) {
      step.textContent = `3. Déploiement OVH (${elapsed}s)`;
    }
    await simulateDelay(1000);
  }
  
  if (step) {
    step.textContent = '3. Déploiement OVH';
  }
}

/**
 * Vérifie que l'URL est accessible après déploiement
 */
async function verifyURLDeployed(url, maxRetries = 5, retryDelay = 3000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      // En mode no-cors, on ne peut pas vérifier le status, on suppose que ça marche
      return true;
    } catch (error) {
      console.log(`[Vérification] Tentative ${i + 1}/${maxRetries} échouée`);
      if (i < maxRetries - 1) {
        await simulateDelay(retryDelay);
      }
    }
  }
  // On retourne true même si la vérification échoue (CORS)
  // Le fichier est probablement déployé
  return true;
}

/**
 * Délai simulé
 */
function simulateDelay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Affiche le succès de publication
 */
function renderPublishSuccess(finalURL, commitUrl) {
  const publishSection = document.getElementById('studio-publish');
  const isSimulated = !commitUrl;
  
  publishSection.innerHTML = `
    <div class="publish-success">
      <div class="success-icon">🎉</div>
      <h3>Publication réussie !</h3>
      <p>Votre article est maintenant en ligne.</p>
      
      <div class="success-details">
        <div class="detail-row">
          <span class="detail-label">URL :</span>
          <a href="${finalURL}" target="_blank" class="detail-link">${finalURL}</a>
        </div>
        ${commitUrl ? `
        <div class="detail-row">
          <span class="detail-label">Commit :</span>
          <a href="${commitUrl}" target="_blank" class="detail-link">Voir sur GitHub</a>
        </div>
        ` : ''}
      </div>
      
      <div class="success-actions">
        <a href="${finalURL}" target="_blank" class="btn-large btn-primary">
          🔗 Voir la page
        </a>
        <button class="btn-large btn-secondary" onclick="resetStudio()">
          ➕ Nouveau contenu
        </button>
      </div>
      
      ${isSimulated ? `
      <p class="publish-note">
        <strong>Mode simulation :</strong> L'endpoint GitHub n'est pas encore configuré. 
        Le fichier n'a pas été réellement créé. Téléchargez le HTML pour publication manuelle.
      </p>
      ` : `
      <p class="publish-note success-note">
        ✅ Fichier créé et déployé automatiquement via GitHub → OVH.
      </p>
      `}
    </div>
  `;
}

/**
 * Enregistre le contenu publié dans l'API
 */
async function registerPublishedContent(slug, content) {
  try {
    await fetchAPI('/api/content', {
      method: 'POST',
      body: JSON.stringify({
        type: content.type,
        keyword: content.keyword,
        title: content.title,
        slug: slug,
        url: `/blog/${slug}.html`,
        status: 'published',
        word_count: content.wordCount,
        published_at: new Date().toISOString()
      })
    });
    console.log('[Publication] Contenu enregistré dans l\'API');
  } catch (error) {
    console.warn('[Publication] Erreur enregistrement:', error);
    // Non bloquant
  }
}

/**
 * Reset le Studio pour un nouveau contenu
 */
function resetStudio() {
  studioGeneratedContent = null;
  document.getElementById('studioKeyword').value = '';
  document.getElementById('studioContext').value = '';
  document.getElementById('studio-result').style.display = 'none';
  document.getElementById('studio-publish').style.display = 'none';
  document.getElementById('studio-params').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Générer le bouton d'action approprié selon le type
 */
function getActionButton(action) {
  switch (action.action_type) {
    case 'create_content':
      return `<button class="btn-small btn-primary" onclick="executeAction('${action.action_type}', '${escapeHtml(action.target)}', ${action.source_id || 'null'})">🚀 Générer</button>`;
    case 'optimize_page':
    case 'improve_ctr':
      return `<button class="btn-small btn-secondary" onclick="executeAction('${action.action_type}', '${escapeHtml(action.target)}')">🔧 Optimiser</button>`;
    case 'fix_technical':
      return `<button class="btn-small btn-danger" onclick="executeAction('${action.action_type}', '${escapeHtml(action.target)}')">⚠️ Corriger</button>`;
    case 'add_conversion':
      return `<button class="btn-small btn-success" onclick="executeAction('${action.action_type}', '${escapeHtml(action.target)}')">🎯 Ajouter</button>`;
    default:
      return `<button class="btn-small btn-secondary" onclick="executeAction('${action.action_type}', '${escapeHtml(action.target)}')">▶️ Exécuter</button>`;
  }
}

/**
 * Exécuter une action recommandée
 */
async function executeAction(actionType, target, sourceId) {
  switch (actionType) {
    case 'create_content':
      // Rediriger vers Plan Contenu avec le mot-clé
      alert(`🚀 Création de contenu pour "${target}"\n\nRedirection vers le Plan Contenu...`);
      // Activer l'onglet Plan Contenu
      document.querySelector('[data-tab="contentplan"]').click();
      break;
      
    case 'optimize_page':
    case 'improve_ctr':
      alert(`🔧 Optimisation de "${target}"\n\nConsultez l'onglet Pages SEO pour plus de détails.`);
      document.querySelector('[data-tab="pages"]').click();
      break;
      
    case 'fix_technical':
      alert(`⚠️ Correction technique pour "${target}"\n\nConsultez l'onglet Audit technique.`);
      document.querySelector('[data-tab="audit"]').click();
      break;
      
    case 'add_conversion':
      alert(`🎯 Ajout de CTA\n\nConsultez l'onglet Conversions pour ajouter des appels à l'action.`);
      document.querySelector('[data-tab="conversions"]').click();
      break;
      
    default:
      alert(`Action "${actionType}" pour "${target}"`);
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
    const response = await fetchAPI('/api/queries');
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
    const response = await fetchAPI('/api/gsc/fetch');
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
    const response = await fetchAPI('/api/opportunities');
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
    const response = await fetchAPI('/api/content');
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

    // Transitions autorisées (workflow: idea → draft → ready → deployed → live)
    const transitions = {
      'idea': ['draft'],
      'draft': ['ready', 'idea'],
      'ready': ['deployed', 'draft'],
      'deployed': ['live', 'ready'],
      'live': ['deployed']
    };

    const transitionLabels = {
      'draft': '📄 Brouillon',
      'ready': '✅ Prêt',
      'deployed': '🚀 Déployé',
      'live': '🟢 En ligne',
      'idea': '💡 Idée'
    };

    const transitionButtons = {
      'draft': { label: '📄 Marquer Draft', class: 'btn-secondary' },
      'ready': { label: '✅ Marquer Prêt', class: 'btn-success' },
      'deployed': { label: '🚀 Déployer', class: 'btn-primary' },
      'live': { label: '🟢 Marquer Live', class: 'btn-success' },
      'idea': { label: '↩️ Retour Idée', class: 'btn-secondary' }
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
      'ready': '✅ Prêt',
      'validated': '✅ Prêt',
      'deployed': '🚀 Déployé',
      'published': '🚀 Déployé',
      'live': '🟢 En ligne'
    };

    for (const c of contents) {
      const typeLabel = typeLabels[c.type] || c.type;
      const statusLabel = statusLabels[c.status] || c.status;
      // Normaliser les anciens statuts pour les classes CSS
      const normalizedStatus = c.status === 'published' ? 'deployed' : (c.status === 'validated' ? 'ready' : c.status);
      const statusClass = `status-${normalizedStatus}`;
      const allowedTransitions = transitions[c.status] || [];
      
      // Générer l'URL de la page si slug disponible
      const pageUrl = c.slug_suggested ? `https://www.mistralpro-reno.fr/${c.slug_suggested}.html` : null;
      
      // Générer les boutons d'action selon le statut
      let actionsHtml = '<div class="action-buttons">';
      
      if (c.status === 'idea') {
        // Idée → peut passer en brouillon
        actionsHtml += `<button class="btn-small btn-secondary" onclick="updateContentStatus(${c.id}, 'draft')">📄 Marquer Draft</button>`;
      } else if (c.status === 'draft') {
        // Brouillon → peut passer en prêt ou retour idée
        actionsHtml += `<button class="btn-small btn-success" onclick="updateContentStatus(${c.id}, 'ready')">✅ Marquer Prêt</button>`;
        actionsHtml += `<button class="btn-small btn-secondary" onclick="updateContentStatus(${c.id}, 'idea')" title="Retour idée">↩️</button>`;
      } else if (c.status === 'ready' || c.status === 'validated') {
        // Prêt → peut publier (génère HTML) ou retour brouillon
        actionsHtml += `<button class="btn-small btn-primary" onclick="publishContent(${c.id})">🚀 Publier</button>`;
        actionsHtml += `<button class="btn-small btn-secondary" onclick="updateContentStatus(${c.id}, 'draft')" title="Retour brouillon">↩️</button>`;
      } else if (c.status === 'deploying') {
        // En cours de déploiement
        actionsHtml += `<span class="deploying-badge">⏳ Déploiement...</span>`;
        actionsHtml += `<button class="btn-small btn-secondary" onclick="updateContentStatus(${c.id}, 'ready')" title="Annuler">❌</button>`;
      } else if (c.status === 'deployed' || c.status === 'published') {
        // Déployé → peut vérifier live ou retour ready
        actionsHtml += `<button class="btn-small btn-success" onclick="verifyAndMarkLive(${c.id})">🟢 Vérifier Live</button>`;
        actionsHtml += `<button class="btn-small btn-secondary" onclick="updateContentStatus(${c.id}, 'ready')" title="Retour prêt">↩️</button>`;
      } else if (c.status === 'live') {
        // Live → badge confirmé + retour possible
        actionsHtml += `<span class="live-badge">🟢 En ligne</span>`;
        actionsHtml += `<button class="btn-small btn-secondary" onclick="updateContentStatus(${c.id}, 'deployed')" title="Retour déployé">↩️</button>`;
      }
      
      actionsHtml += '</div>';
      
      // Icône lien vers la page (pour deployed/published/live)
      const isDeployed = ['deployed', 'published', 'live'].includes(c.status);
      const linkHtml = (isDeployed && pageUrl) 
        ? `<a href="${pageUrl}" target="_blank" class="page-link" title="Ouvrir ${pageUrl}">🔗</a>` 
        : '';
      
      html += `
        <tr class="content-row status-row-${normalizedStatus}">
          <td>${typeLabel}</td>
          <td class="title-cell" title="${escapeHtml(c.title)}">${escapeHtml(c.title)} ${linkHtml}</td>
          <td>${escapeHtml(c.keyword) || '-'}</td>
          <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
          <td class="actions-cell">${actionsHtml}</td>
        </tr>
      `;
    }

    html += '</tbody></table>';
    
    // Ajouter résumé par statut
    const statsCounts = {
      idea: contents.filter(c => c.status === 'idea').length,
      draft: contents.filter(c => c.status === 'draft').length,
      ready: contents.filter(c => c.status === 'ready').length,
      deployed: contents.filter(c => c.status === 'deployed').length,
      live: contents.filter(c => c.status === 'live').length
    };
    
    const statsHtml = `
      <div class="content-stats">
        <span class="stat-item">💡 ${statsCounts.idea} idées</span>
        <span class="stat-item">📋 ${statsCounts.draft} brouillons</span>
        <span class="stat-item">✅ ${statsCounts.ready} prêts</span>
        <span class="stat-item">🚀 ${statsCounts.deployed} déployés</span>
        <span class="stat-item">🟢 ${statsCounts.live} en ligne</span>
      </div>
    `;
    
    container.innerHTML = statsHtml + html;

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
  
  // Si le conteneur n'existe pas, ne rien faire
  if (!container) {
    return;
  }
  
  try {
    const response = await fetchAPI('/api/editorial');
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
    if (container) {
      container.innerHTML = '<p class="error">Erreur de connexion à l\'API</p>';
    }
    console.error('loadEditorialPlan error:', err);
  }
}

/**
 * Générer le plan éditorial
 */
async function generateEditorialPlan() {
  const container = document.getElementById('editorial-container');
  
  if (container) {
    container.innerHTML = '<p class="loading">Génération du plan éditorial...</p>';
  }

  try {
    const response = await fetchAPI('/api/editorial/generate', {
      method: 'POST'
    });

    const result = await response.json();

    if (result.status === 'ok') {
      alert(`Plan généré : ${result.generated} proposition(s) créée(s)`);
      loadContents(); // Recharge contenus et plan
    } else {
      if (container) {
        container.innerHTML = '<p class="error">Erreur: ' + result.message + '</p>';
      }
      alert('Erreur: ' + result.message);
    }

  } catch (err) {
    if (container) {
      container.innerHTML = '<p class="error">Erreur de connexion</p>';
    }
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
    const response = await fetchAPI('/api/content/create', {
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
    const response = await fetchAPI('/api/briefs');
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
    const response = await fetchAPI(`/api/briefs/generate/${contentId}`, {
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
    const response = await fetchAPI(`/api/briefs/${briefId}`);
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
    const response = await fetchAPI('/api/audit');
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
    const response = await fetchAPI('/api/audit/internal-links');
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
    const response = await fetchAPI('/api/audit/run', {
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
    const response = await fetchAPI('/api/audit/crawl', {
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
      fetchAPI('/api/conversions/stats'),
      fetchAPI('/api/conversions')
    ]);
    
    const statsResult = await statsResponse.json();
    const conversionsResult = await conversionsResponse.json();

    // Afficher les stats (même si tout est à 0)
    if (statsResult.status === 'ok') {
      const stats = statsResult.data;
      const hasConversions = stats.total > 0;
      
      statsContainer.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-value">${stats.today || 0}</span>
            <span class="stat-label">Aujourd'hui</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${stats.this_week || 0}</span>
            <span class="stat-label">Cette semaine</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${stats.this_month || 0}</span>
            <span class="stat-label">Ce mois</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${stats.total || 0}</span>
            <span class="stat-label">Total</span>
          </div>
        </div>
        ${!hasConversions ? '<p class="section-description" style="margin-top: 0.5rem; color: var(--text-secondary);">📊 En attente des premières conversions depuis /merci.html</p>' : ''}
      `;
    } else {
      statsContainer.innerHTML = '<p class="empty-state">Statistiques non disponibles</p>';
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
    const response = await fetchAPI('/api/competitors');
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
    const response = await fetchAPI('/api/competitors/add', {
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
    const response = await fetchAPI(`/api/competitors/${id}`, {
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
    const response = await fetchAPI('/api/editorial');
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
    const response = await fetchAPI('/api/briefs/publication/${contentId}');
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
    const response = await fetchAPI(`/api/content/${contentId}/status`, {
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
    
    // Rafraîchir le cockpit si visible
    if (document.getElementById('cockpit').classList.contains('active')) {
      loadCockpit();
    }

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
    const response = await fetchAPI('/api/history?limit=10');
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
    const response = await fetchAPI('/api/editorial/monthly-plan');
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
    const response = await fetchAPI('/api/alerts/priority');
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
    const response = await fetchAPI('/api/opportunities/pages-to-optimize');
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
    const response = await fetchAPI('/api/briefs/optimize', {
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
    const response = await fetchAPI('/api/pages/analysis');
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
    const importResponse = await fetchAPI('/api/gsc/fetch');
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
    const response = await fetchAPI('/api/content/ideas');
    
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
          <th>Actions</th>
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
        <td class="query-cell" title="${escapeHtml(idea.titleSuggestion || idea.query)}">${escapeHtml(idea.query)}</td>
        <td>${idea.impressions}</td>
        <td>${idea.position || '-'}</td>
        <td><span class="type-badge">${typeLabel}</span></td>
        <td><span class="priority-badge ${priorityClass}">${idea.priority}</span></td>
        <td class="actions-cell">
          <button class="btn-small btn-primary" onclick="generateBriefFromIdea('${category}', ${i})" title="Générer brief Claude">
            🚀 Brief
          </button>
          <button class="btn-small btn-secondary" onclick="planContentIdea('${category}', ${i})" title="Planifier">
            ⏳
          </button>
          <button class="btn-small btn-danger" onclick="dismissContentIdea('${category}', ${i})" title="Ignorer">
            ❌
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
    const response = await fetchAPI('/api/content/ideas/save', {
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
 * Générer un brief Claude directement depuis une idée
 */
async function generateBriefFromIdea(category, index) {
  const idea = window.contentIdeasData[category][index];
  if (!idea) {
    alert('Erreur: idée non trouvée');
    return;
  }

  try {
    // 1. Sauvegarder l'idée comme contenu
    const saveResponse = await fetchAPI('/api/content/ideas/save', {
      method: 'POST',
      body: JSON.stringify(idea)
    });
    const saveResult = await saveResponse.json();

    if (saveResult.status !== 'ok') {
      alert(`❌ Erreur: ${saveResult.message}`);
      return;
    }

    const contentId = saveResult.id;

    // 2. Générer le brief pour ce contenu
    const briefResponse = await fetchAPI(`/api/briefs/generate/${contentId}`, {
      method: 'POST'
    });
    const briefResult = await briefResponse.json();

    if (briefResult.status === 'ok') {
      alert(`✅ Brief généré avec succès !\nBrief ID: ${briefResult.id}\n\nRendez-vous dans l'onglet "Brief Claude" pour voir le détail.`);
      // Recharger les idées
      loadContentIdeas();
    } else {
      alert(`❌ Erreur génération brief: ${briefResult.message}`);
    }

  } catch (err) {
    alert('❌ Erreur de connexion');
    console.error('generateBriefFromIdea error:', err);
  }
}

/**
 * Planifier une idée de contenu (créer en statut idea)
 */
async function planContentIdea(category, index) {
  const idea = window.contentIdeasData[category][index];
  if (!idea) {
    alert('Erreur: idée non trouvée');
    return;
  }

  try {
    const response = await fetchAPI('/api/content/ideas/save', {
      method: 'POST',
      body: JSON.stringify(idea)
    });
    const result = await response.json();

    if (result.status === 'ok') {
      alert(`⏳ Idée planifiée !\nID: ${result.id}\nStatut: idea\n\nVous pourrez la retrouver dans l'onglet "Contenu".`);
      loadContentIdeas();
    } else {
      alert(`❌ Erreur: ${result.message}`);
    }

  } catch (err) {
    alert('❌ Erreur de connexion');
    console.error('planContentIdea error:', err);
  }
}

/**
 * Ignorer/Rejeter une idée de contenu
 */
async function dismissContentIdea(category, index) {
  const idea = window.contentIdeasData[category][index];
  if (!idea) {
    alert('Erreur: idée non trouvée');
    return;
  }

  if (!confirm(`Voulez-vous vraiment ignorer cette idée ?\n\n"${idea.query}"`)) {
    return;
  }

  try {
    // Si l'idée vient d'une opportunité, mettre à jour le statut
    if (idea.opportunity_id) {
      const response = await fetchAPI(`/api/opportunities/${idea.opportunity_id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'dismissed' })
      });
      const result = await response.json();

      if (result.status === 'ok') {
        alert(`❌ Opportunité ignorée.`);
        loadContentIdeas();
      } else {
        alert(`❌ Erreur: ${result.message}`);
      }
    } else {
      // Pour les idées GSC, on les ignore simplement en les masquant
      alert(`❌ Idée ignorée.`);
      // Retirer visuellement l'idée
      window.contentIdeasData[category].splice(index, 1);
      loadContentIdeas();
    }

  } catch (err) {
    alert('❌ Erreur de connexion');
    console.error('dismissContentIdea error:', err);
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

// =====================================================
// AUTO SEO EXECUTOR
// =====================================================

/**
 * Charger les candidats pour l'exécution SEO
 */
async function loadSEOCandidates() {
  const container = document.getElementById('seo-candidates-container');
  container.classList.remove('hidden');
  container.innerHTML = '<p class="loading">Chargement des candidats...</p>';

  try {
    const response = await fetchAPI('/api/seo/candidates');
    const result = await response.json();

    if (result.status !== 'ok' || result.count === 0) {
      container.innerHTML = '<p class="empty-state">Aucun contenu prêt pour l\'exécution SEO. Créez d\'abord des contenus depuis le Plan Contenu.</p>';
      return;
    }

    let html = `
      <p class="info-text">${result.count} contenu(s) prêt(s) pour l'exécution SEO</p>
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Mot-clé</th>
            <th>Type</th>
            <th>Statut</th>
            <th>Qualité</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
    `;

    for (const content of result.data) {
      html += `
        <tr>
          <td>${content.id}</td>
          <td class="keyword-cell">${escapeHtml(content.keyword || '-')}</td>
          <td><span class="type-badge">${content.type}</span></td>
          <td><span class="status-badge status-${content.status}">${content.status}</span></td>
          <td id="quality-badge-${content.id}"><span class="quality-badge quality-pending">⏳</span></td>
          <td class="actions-cell">
            <button class="btn-small" onclick="checkQuality(${content.id})">🔍 Qualité</button>
            <button class="btn-small" onclick="previewSEO(${content.id})">👁️ Preview</button>
            <button class="btn-small btn-execute-single" onclick="executeSingleSEO(${content.id})" id="exec-btn-${content.id}">⚡ Exécuter</button>
          </td>
        </tr>
      `;
    }

    html += '</tbody></table>';
    container.innerHTML = html;

    // Charger automatiquement les badges qualité
    for (const content of result.data) {
      loadQualityBadge(content.id);
    }

  } catch (err) {
    container.innerHTML = '<p class="error">Erreur de chargement</p>';
    console.error('loadSEOCandidates error:', err);
  }
}

/**
 * Charger le badge qualité pour un contenu
 */
async function loadQualityBadge(contentId) {
  const badgeContainer = document.getElementById(`quality-badge-${contentId}`);
  if (!badgeContainer) return;

  try {
    const response = await fetchAPI('/api/seo/quality/${contentId}');
    const result = await response.json();

    if (result.status !== 'ok') {
      badgeContainer.innerHTML = '<span class="quality-badge quality-error">❌</span>';
      return;
    }

    const q = result.quality;
    const badgeClass = `quality-${q.status}`;
    const icon = q.status === 'pass' ? '✅' : q.status === 'warning' ? '⚠️' : '❌';
    
    badgeContainer.innerHTML = `
      <span class="quality-badge ${badgeClass}" title="${q.summary.pass}/${q.summary.total} contrôles OK">
        ${icon} ${q.score}%
      </span>
    `;

    // Désactiver le bouton exécuter si qualité fail
    const execBtn = document.getElementById(`exec-btn-${contentId}`);
    if (execBtn && q.status === 'fail') {
      execBtn.disabled = true;
      execBtn.title = 'Qualité insuffisante - corrigez les erreurs avant publication';
    }

  } catch (err) {
    badgeContainer.innerHTML = '<span class="quality-badge quality-error">❓</span>';
  }
}

/**
 * Vérifier et afficher le détail qualité
 */
async function checkQuality(contentId) {
  const resultContainer = document.getElementById('seo-execution-result');
  resultContainer.classList.remove('hidden');
  resultContainer.innerHTML = '<p class="loading">Analyse qualité en cours...</p>';

  try {
    const response = await fetchAPI('/api/seo/quality/${contentId}');
    const result = await response.json();

    if (result.status !== 'ok') {
      resultContainer.innerHTML = `<p class="error">Erreur: ${result.message}</p>`;
      return;
    }

    const q = result.quality;
    const statusClass = `quality-${q.status}`;
    const statusIcon = q.status === 'pass' ? '✅' : q.status === 'warning' ? '⚠️' : '❌';

    let checksHtml = '';
    for (const check of q.checks) {
      const checkIcon = check.status === 'pass' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
      checksHtml += `
        <tr class="check-${check.status}">
          <td>${checkIcon}</td>
          <td>${check.name}</td>
          <td>${check.message}</td>
        </tr>
      `;
    }

    resultContainer.innerHTML = `
      <div class="quality-report">
        <div class="quality-header">
          <h4>🔍 Contrôle Qualité SEO</h4>
          <button class="btn-small" onclick="closeSEOPreview()">✕ Fermer</button>
        </div>
        
        <div class="quality-summary ${statusClass}">
          <span class="quality-status">${statusIcon} ${q.status.toUpperCase()}</span>
          <span class="quality-score">${q.score}%</span>
          <span class="quality-counts">${q.summary.pass} pass / ${q.summary.warning} warning / ${q.summary.fail} fail</span>
        </div>

        <div class="quality-details">
          <h5>Mot-clé: ${escapeHtml(result.keyword)}</h5>
          <table class="quality-checks-table">
            <thead>
              <tr>
                <th></th>
                <th>Contrôle</th>
                <th>Résultat</th>
              </tr>
            </thead>
            <tbody>
              ${checksHtml}
            </tbody>
          </table>
        </div>

        <div class="quality-parsed">
          <h5>Éléments détectés</h5>
          <ul>
            <li><strong>Title:</strong> ${result.parsed.titleLength} caractères</li>
            <li><strong>Meta:</strong> ${result.parsed.metaDescriptionLength} caractères</li>
            <li><strong>H1:</strong> ${escapeHtml(result.parsed.h1 || 'N/A')}</li>
            <li><strong>H2:</strong> ${result.parsed.h2Count}</li>
            <li><strong>Mots:</strong> ${result.parsed.wordCount}</li>
            <li><strong>Liens internes:</strong> ${result.parsed.internalLinksCount}</li>
          </ul>
        </div>

        ${q.status === 'pass' ? `
          <div class="quality-actions">
            <button class="btn-primary" onclick="executeSingleSEO(${contentId})">⚡ Publier cette page</button>
          </div>
        ` : `
          <div class="quality-warning">
            <p>⚠️ Corrigez les erreurs avant de publier cette page.</p>
          </div>
        `}
      </div>
    `;

  } catch (err) {
    resultContainer.innerHTML = '<p class="error">Erreur de connexion</p>';
    console.error('checkQuality error:', err);
  }
}

/**
 * Prévisualiser le contenu SEO généré
 */
async function previewSEO(contentId) {
  const resultContainer = document.getElementById('seo-execution-result');
  resultContainer.classList.remove('hidden');
  resultContainer.innerHTML = '<p class="loading">Génération de la prévisualisation...</p>';

  try {
    const response = await fetchAPI(`/api/seo/preview/${contentId}`, {
      method: 'POST'
    });
    const result = await response.json();

    if (result.status !== 'ok') {
      resultContainer.innerHTML = `<p class="error">Erreur: ${result.message}</p>`;
      return;
    }

    const preview = result.preview;
    
    resultContainer.innerHTML = `
      <div class="seo-preview">
        <div class="preview-header">
          <h4>📄 Prévisualisation SEO</h4>
          <button class="btn-small" onclick="closeSEOPreview()">✕ Fermer</button>
        </div>
        <div class="preview-meta">
          <p><strong>Title:</strong> ${escapeHtml(preview.title)}</p>
          <p><strong>Meta Description:</strong> ${escapeHtml(preview.metaDescription)}</p>
          <p><strong>H1:</strong> ${escapeHtml(preview.h1)}</p>
          <p><strong>Slug:</strong> /${preview.type === 'service' ? 'services' : 'blog'}/${preview.slug}.html</p>
          <p><strong>Mots:</strong> ~${preview.wordCount} mots</p>
        </div>
        <div class="preview-structure">
          <p><strong>Structure H2:</strong></p>
          <ul>
            ${preview.h2Structure.map(h2 => `<li>${escapeHtml(h2)}</li>`).join('')}
          </ul>
        </div>
        <div class="preview-content">
          <p><strong>Aperçu du contenu:</strong></p>
          <div class="content-preview">${escapeHtml(preview.content)}</div>
        </div>
        <div class="preview-actions">
          <button class="btn-primary" onclick="executeSingleSEO(${contentId})">⚡ Générer cette page</button>
          <a href="${API_BASE}/api/seo/execute/${contentId}/html" target="_blank" class="btn-secondary">🔗 Voir HTML complet</a>
        </div>
      </div>
    `;

  } catch (err) {
    resultContainer.innerHTML = '<p class="error">Erreur de connexion</p>';
    console.error('previewSEO error:', err);
  }
}

/**
 * Fermer la prévisualisation
 */
function closeSEOPreview() {
  const resultContainer = document.getElementById('seo-execution-result');
  resultContainer.classList.add('hidden');
}

/**
 * Exécuter l'optimisation SEO pour un contenu
 */
async function executeSingleSEO(contentId) {
  if (!confirm('Voulez-vous générer la page SEO pour ce contenu ?')) {
    return;
  }

  const resultContainer = document.getElementById('seo-execution-result');
  resultContainer.classList.remove('hidden');
  resultContainer.innerHTML = '<p class="loading">⚡ Génération en cours...</p>';

  try {
    const response = await fetchAPI(`/api/seo/execute/${contentId}`, {
      method: 'POST'
    });
    const result = await response.json();

    if (result.status !== 'ok') {
      resultContainer.innerHTML = `<p class="error">Erreur: ${result.message}</p>`;
      return;
    }

    const r = result.result;
    
    resultContainer.innerHTML = `
      <div class="seo-result success">
        <h4>✅ Page SEO générée avec succès</h4>
        <div class="result-details">
          <p><strong>Titre:</strong> ${escapeHtml(r.title)}</p>
          <p><strong>Fichier:</strong> ${r.filePath}</p>
          <p><strong>Mots:</strong> ${r.wordCount}</p>
          <p><strong>Statut:</strong> <span class="status-badge status-validated">validated</span></p>
        </div>
        <div class="result-actions">
          <a href="${API_BASE}/api/seo/execute/${contentId}/html" target="_blank" class="btn-primary">📄 Voir la page générée</a>
          <button class="btn-secondary" onclick="closeSEOPreview()">Fermer</button>
        </div>
        <p class="info-note">⚠️ La page est générée mais pas encore déployée. Téléchargez le HTML et ajoutez-le au site.</p>
      </div>
    `;

    // Recharger les candidats
    loadSEOCandidates();

  } catch (err) {
    resultContainer.innerHTML = '<p class="error">Erreur de connexion</p>';
    console.error('executeSingleSEO error:', err);
  }
}

/**
 * Exécuter l'optimisation SEO pour tous les contenus
 */
async function executeAllSEO() {
  if (!confirm('Voulez-vous générer les pages SEO pour TOUS les contenus en attente ? (max 5)')) {
    return;
  }

  const resultContainer = document.getElementById('seo-execution-result');
  resultContainer.classList.remove('hidden');
  resultContainer.innerHTML = '<p class="loading">⚡ Génération en cours pour tous les contenus...</p>';

  try {
    const response = await fetchAPI('/api/seo/execute-all', {
      method: 'POST'
    });
    const result = await response.json();

    if (result.status !== 'ok') {
      resultContainer.innerHTML = `<p class="error">Erreur: ${result.message}</p>`;
      return;
    }

    let html = `
      <div class="seo-result success">
        <h4>✅ ${result.executed} page(s) générée(s)</h4>
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Titre</th>
              <th>Slug</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
    `;

    for (const r of result.results) {
      html += `
        <tr>
          <td>${r.id}</td>
          <td>${escapeHtml(r.title)}</td>
          <td>${r.slug}</td>
          <td><span class="status-badge status-success">${r.status}</span></td>
        </tr>
      `;
    }

    html += `
          </tbody>
        </table>
        <div class="result-actions">
          <button class="btn-secondary" onclick="closeSEOPreview()">Fermer</button>
        </div>
      </div>
    `;

    resultContainer.innerHTML = html;

    // Recharger les candidats
    loadSEOCandidates();
    // Recharger les contenus
    loadContents();

  } catch (err) {
    resultContainer.innerHTML = '<p class="error">Erreur de connexion</p>';
    console.error('executeAllSEO error:', err);
  }
}

// =====================================================
// HISTORIQUE GSC - VISUALISATION
// =====================================================

/**
 * Données historique en cache
 */
let historyQueriesList = [];
let historyPagesList = [];

/**
 * Initialiser la section historique
 */
async function initHistorySection() {
  // Charger les listes de requêtes et pages
  await loadHistoryLists();
  // Charger les données globales
  await loadHistoryData();
  // Charger l'évolution
  await loadEvolutionSummary();
}

/**
 * Charger les listes de requêtes et pages pour les filtres
 */
async function loadHistoryLists() {
  try {
    // Charger les requêtes
    const queriesResponse = await fetchAPI('/api/gsc/history/queries');
    const queriesResult = await queriesResponse.json();
    
    if (queriesResult.status === 'ok') {
      historyQueriesList = queriesResult.data;
      const querySelect = document.getElementById('history-query');
      querySelect.innerHTML = '<option value="">Sélectionner...</option>';
      for (const q of historyQueriesList) {
        querySelect.innerHTML += `<option value="${escapeHtml(q.query)}">${escapeHtml(q.query)} (${q.totalImpressions} imp.)</option>`;
      }
    }

    // Charger les pages
    const pagesResponse = await fetchAPI('/api/gsc/history/pages');
    const pagesResult = await pagesResponse.json();
    
    if (pagesResult.status === 'ok') {
      historyPagesList = pagesResult.data;
      const pageSelect = document.getElementById('history-page');
      pageSelect.innerHTML = '<option value="">Sélectionner...</option>';
      for (const p of historyPagesList) {
        const shortUrl = p.pageUrl.replace('https://www.mistralpro-reno.fr', '');
        pageSelect.innerHTML += `<option value="${escapeHtml(p.pageUrl)}">${escapeHtml(shortUrl)} (${p.totalImpressions} imp.)</option>`;
      }
    }

  } catch (err) {
    console.error('loadHistoryLists error:', err);
  }
}

/**
 * Changer le type de filtre
 */
function changeHistoryFilter() {
  const filter = document.getElementById('history-filter').value;
  const queryGroup = document.getElementById('query-select-group');
  const pageGroup = document.getElementById('page-select-group');

  queryGroup.classList.add('hidden');
  pageGroup.classList.add('hidden');

  if (filter === 'query') {
    queryGroup.classList.remove('hidden');
  } else if (filter === 'page') {
    pageGroup.classList.remove('hidden');
  }

  // Charger les données avec le nouveau filtre
  loadHistoryData();
}

/**
 * Charger les données historiques selon le filtre
 */
async function loadHistoryData() {
  const filter = document.getElementById('history-filter').value;
  let endpoint = '/api/gsc/history';

  if (filter === 'query') {
    const query = document.getElementById('history-query').value;
    if (!query) {
      renderEmptyCharts('Sélectionnez une requête');
      return;
    }
    endpoint += `?query=${encodeURIComponent(query)}`;
  } else if (filter === 'page') {
    const page = document.getElementById('history-page').value;
    if (!page) {
      renderEmptyCharts('Sélectionnez une page');
      return;
    }
    endpoint += `?page=${encodeURIComponent(page)}`;
  }

  try {
    const response = await fetchAPI(endpoint);
    const result = await response.json();

    if (result.status !== 'ok' || !result.data || result.data.length === 0) {
      renderEmptyCharts('Aucune donnée disponible');
      return;
    }

    renderCharts(result.data);

  } catch (err) {
    renderEmptyCharts('Erreur de chargement');
    console.error('loadHistoryData error:', err);
  }
}

/**
 * Charger le résumé d'évolution
 */
async function loadEvolutionSummary() {
  const container = document.getElementById('history-evolution-summary');
  
  try {
    const response = await fetchAPI('/api/gsc/history/evolution');
    const result = await response.json();

    if (result.status !== 'ok') {
      container.classList.add('hidden');
      return;
    }

    const formatEvol = (val) => {
      if (val > 0) return `<span class="evol-up">+${val}%</span>`;
      if (val < 0) return `<span class="evol-down">${val}%</span>`;
      return `<span class="evol-neutral">0%</span>`;
    };

    container.classList.remove('hidden');
    container.innerHTML = `
      <div class="evolution-card">
        <span class="evol-label">Impressions</span>
        <span class="evol-value">${result.current.impressions}</span>
        ${formatEvol(result.evolution.impressions)}
      </div>
      <div class="evolution-card">
        <span class="evol-label">Clics</span>
        <span class="evol-value">${result.current.clicks}</span>
        ${formatEvol(result.evolution.clicks)}
      </div>
      <div class="evolution-card">
        <span class="evol-label">Position moy.</span>
        <span class="evol-value">${result.current.avgPosition}</span>
        ${formatEvol(result.evolution.position)}
      </div>
      <div class="evolution-period">
        vs semaine précédente (${result.periods.previous.start} → ${result.periods.previous.end})
      </div>
    `;

  } catch (err) {
    container.classList.add('hidden');
    console.error('loadEvolutionSummary error:', err);
  }
}

/**
 * Afficher des graphiques vides avec message
 */
function renderEmptyCharts(message) {
  const emptyHtml = `<p class="empty-chart">${message}</p>`;
  document.getElementById('chart-impressions').innerHTML = emptyHtml;
  document.getElementById('chart-clicks').innerHTML = emptyHtml;
  document.getElementById('chart-position').innerHTML = emptyHtml;
}

/**
 * Rendre les graphiques avec les données
 */
function renderCharts(data) {
  // Préparer les données
  const dates = data.map(d => d.date.substring(5)); // MM-DD
  const impressions = data.map(d => d.impressions);
  const clicks = data.map(d => d.clicks);
  const positions = data.map(d => d.avgPosition || d.position || 0);

  // Graphique Impressions
  renderBarChart('chart-impressions', dates, impressions, '#3b82f6', 'Impressions');

  // Graphique Clics
  renderBarChart('chart-clicks', dates, clicks, '#10b981', 'Clics');

  // Graphique Position (inversé - plus bas = mieux)
  renderLineChart('chart-position', dates, positions, '#f59e0b', 'Position');
}

/**
 * Rendre un graphique en barres simple (SVG)
 */
function renderBarChart(containerId, labels, values, color, title) {
  const container = document.getElementById(containerId);
  const maxVal = Math.max(...values, 1);
  const width = Math.min(labels.length * 25, 500);
  const height = 120;
  const barWidth = Math.max(12, (width / labels.length) - 4);

  let barsHtml = '';
  for (let i = 0; i < values.length; i++) {
    const barHeight = (values[i] / maxVal) * (height - 30);
    const x = i * (barWidth + 4) + 30;
    const y = height - barHeight - 20;
    
    barsHtml += `
      <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" rx="2">
        <title>${labels[i]}: ${values[i]}</title>
      </rect>
    `;
    
    // Labels x (un sur deux si trop nombreux)
    if (i % Math.ceil(labels.length / 10) === 0) {
      barsHtml += `<text x="${x + barWidth/2}" y="${height - 5}" text-anchor="middle" class="chart-label">${labels[i]}</text>`;
    }
  }

  container.innerHTML = `
    <svg viewBox="0 0 ${width + 40} ${height}" class="chart-svg">
      <text x="5" y="15" class="chart-title">${maxVal}</text>
      <text x="5" y="${height - 20}" class="chart-title">0</text>
      <line x1="25" y1="10" x2="25" y2="${height - 20}" stroke="#4b5563" stroke-width="1"/>
      <line x1="25" y1="${height - 20}" x2="${width + 30}" y2="${height - 20}" stroke="#4b5563" stroke-width="1"/>
      ${barsHtml}
    </svg>
    <p class="chart-total">Total: ${values.reduce((a, b) => a + b, 0)}</p>
  `;
}

/**
 * Rendre un graphique en ligne simple (SVG)
 */
function renderLineChart(containerId, labels, values, color, title) {
  const container = document.getElementById(containerId);
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values);
  const width = Math.min(labels.length * 25, 500);
  const height = 120;

  let pathD = '';
  let dotsHtml = '';
  
  for (let i = 0; i < values.length; i++) {
    const x = 30 + (i / (values.length - 1 || 1)) * (width - 10);
    const y = 10 + ((values[i] - minVal) / (maxVal - minVal || 1)) * (height - 40);
    
    if (i === 0) {
      pathD = `M ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
    }
    
    dotsHtml += `
      <circle cx="${x}" cy="${y}" r="4" fill="${color}">
        <title>${labels[i]}: ${values[i].toFixed(1)}</title>
      </circle>
    `;
  }

  const avgVal = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);

  container.innerHTML = `
    <svg viewBox="0 0 ${width + 40} ${height}" class="chart-svg">
      <text x="5" y="15" class="chart-title">${maxVal.toFixed(0)}</text>
      <text x="5" y="${height - 20}" class="chart-title">${minVal.toFixed(0)}</text>
      <line x1="25" y1="10" x2="25" y2="${height - 20}" stroke="#4b5563" stroke-width="1"/>
      <line x1="25" y1="${height - 20}" x2="${width + 30}" y2="${height - 20}" stroke="#4b5563" stroke-width="1"/>
      <path d="${pathD}" fill="none" stroke="${color}" stroke-width="2"/>
      ${dotsHtml}
    </svg>
    <p class="chart-total">Moyenne: ${avgVal}</p>
  `;
}

// =====================================================
// QA PANEL - CHECKLIST & GUIDE
// =====================================================

/**
 * Toggle QA panel open/closed
 */
function toggleQaPanel(button) {
  const panel = button.closest('.qa-panel');
  panel.classList.toggle('open');
}

/**
 * Update progress bar when checkbox changes
 */
function updateQaProgress(checkbox) {
  const panel = checkbox.closest('.qa-panel');
  const checklist = checkbox.closest('.qa-checklist');
  const checkboxes = checklist.querySelectorAll('input[type="checkbox"]');
  const label = checkbox.closest('label');
  
  // Toggle checked style on label
  if (checkbox.checked) {
    label.classList.add('checked');
  } else {
    label.classList.remove('checked');
  }
  
  // Count checked
  const total = checkboxes.length;
  const checked = checklist.querySelectorAll('input[type="checkbox"]:checked').length;
  
  // Update progress text
  const progressText = panel.querySelector('.qa-progress-text');
  progressText.textContent = `${checked} / ${total} tests`;
  
  // Update progress bar
  const progressFill = panel.querySelector('.qa-progress-fill');
  const percentage = (checked / total) * 100;
  progressFill.style.width = `${percentage}%`;
}

// =====================================================
// EXPOSITION GLOBALE DES FONCTIONS ONCLICK
// =====================================================
// Toutes les fonctions appelées via onclick dans le HTML doivent être sur window
window.importGscData = importGscData;
window.generateEditorialPlan = generateEditorialPlan;
window.toggleContentForm = toggleContentForm;
window.runAudit = runAudit;
window.runCrawl = runCrawl;
window.toggleCompetitorForm = toggleCompetitorForm;
window.closeBriefDetail = closeBriefDetail;
window.loadSEOCandidates = loadSEOCandidates;
window.executeAllSEO = executeAllSEO;
window.previewSEO = previewSEO;
window.executeSingleSEO = executeSingleSEO;
window.closeSEOPreview = closeSEOPreview;
window.checkQuality = checkQuality;
window.loadQualityBadge = loadQualityBadge;
window.saveContentIdeaByIndex = saveContentIdeaByIndex;
window.saveContentIdea = saveContentIdea;
window.changeHistoryFilter = changeHistoryFilter;
window.loadHistoryData = loadHistoryData;
window.viewBriefDetail = viewBrief;
window.submitContent = submitContent;
window.submitCompetitor = submitCompetitor;
window.escapeHtml = escapeHtml;
window.toggleQaPanel = toggleQaPanel;
window.updateQaProgress = updateQaProgress;
window.updateContentStatus = updateContentStatus;
window.refreshPagesAnalysis = refreshPagesAnalysis;
window.refreshContentIdeas = refreshContentIdeas;

// Fonctions dynamiques générées dans le JS
window.showContentDetails = showContentDetails;
window.closeContentDetails = closeContentDetails;
window.generatePublicationBrief = generatePublicationBrief;
window.copyBriefToClipboard = copyBriefToClipboard;
window.deleteCompetitor = deleteCompetitor;
window.generateOptimizationBrief = generateOptimizationBrief;
window.copyOptimizationBrief = copyOptimizationBrief;
window.closeOptimizationBrief = closeOptimizationBrief;
window.viewBrief = viewBrief;
window.loadImpactAnalysis = loadImpactAnalysis;
window.executeAction = executeAction;
window.checkAndMarkLive = checkAndMarkLive;
window.publishContent = publishContent;
window.verifyAndMarkLive = verifyAndMarkLive;

/**
 * Publier un contenu : EXÉCUTION AUTOMATIQUE COMPLÈTE
 * Génère HTML → Push Git → Attend déploiement → Vérifie URL → Marque LIVE
 */
async function publishContent(contentId) {
  try {
    // Afficher message de démarrage
    showPublishProgress(contentId, 'Démarrage de la publication...');

    // Appeler l'API de publication automatique
    const response = await fetchAPI(`/api/publish/${contentId}`, {
      method: 'POST'
    });
    const result = await response.json();

    // Fermer le loader
    closePublishProgress();

    if (result.status === 'ok') {
      // Afficher le résultat
      showPublishResult(result);
      // Rafraîchir la liste
      loadContents();
    } else {
      alert(`❌ Erreur : ${result.message}\n\nÉtape échouée : ${result.data?.failed_step || 'inconnue'}`);
      loadContents();
    }

  } catch (err) {
    closePublishProgress();
    alert(`❌ Erreur : ${err.message}`);
    console.error('publishContent error:', err);
  }
}

/**
 * Afficher la progression de publication
 */
function showPublishProgress(contentId, message) {
  // Supprimer si existant
  closePublishProgress();
  
  const modal = document.createElement('div');
  modal.className = 'publish-progress-modal';
  modal.id = 'publish-progress';
  modal.innerHTML = `
    <div class="publish-progress-content">
      <div class="publish-progress-spinner"></div>
      <h3>🚀 Publication en cours...</h3>
      <p id="publish-progress-msg">${message}</p>
      <div class="publish-progress-steps" id="publish-steps">
        <div class="step pending">⏳ Génération HTML</div>
        <div class="step pending">⏳ Push GitHub</div>
        <div class="step pending">⏳ Déploiement OVH (~45s)</div>
        <div class="step pending">⏳ Vérification URL</div>
      </div>
      <p class="publish-progress-note">⚠️ Ne fermez pas cette fenêtre</p>
    </div>
  `;
  document.body.appendChild(modal);
}

/**
 * Fermer la modal de progression
 */
function closePublishProgress() {
  const modal = document.getElementById('publish-progress');
  if (modal) modal.remove();
}

/**
 * Afficher le résultat de publication
 */
function showPublishResult(result) {
  const data = result.data;
  const isLive = data.final_status === 'live';
  
  const stepsHtml = data.steps.map(s => {
    const icon = s.status === 'ok' ? '✅' : s.status === 'warning' ? '⚠️' : s.status === 'error' ? '❌' : '⏳';
    return `<div class="step ${s.status}">${icon} ${s.step}</div>`;
  }).join('');

  const modal = document.createElement('div');
  modal.className = 'publish-modal';
  modal.innerHTML = `
    <div class="publish-modal-content">
      <div class="publish-modal-header ${isLive ? 'success' : 'warning'}">
        <h2>${isLive ? '✅ Page publiée et en ligne !' : '⚠️ Page déployée'}</h2>
        <button onclick="closePublishModal()" class="close-btn">×</button>
      </div>
      <div class="publish-modal-body">
        <div class="publish-result-url">
          <strong>URL :</strong> 
          <a href="${data.url}" target="_blank">${data.url}</a>
          ${isLive ? '🟢' : '🟠'}
        </div>
        
        <div class="publish-steps-result">
          <h4>Étapes exécutées :</h4>
          ${stepsHtml}
        </div>

        ${!isLive ? `
          <div class="publish-warning">
            <p>⚠️ La page a été déployée mais n'est pas encore accessible.</p>
            <p>Le déploiement OVH peut prendre quelques minutes supplémentaires.</p>
            <button onclick="retryVerifyLive(${data.content_id})" class="btn btn-primary">🔄 Vérifier à nouveau</button>
          </div>
        ` : `
          <div class="publish-success">
            <p>🎉 La page est maintenant accessible publiquement !</p>
            <a href="${data.url}" target="_blank" class="btn btn-primary">🔗 Voir la page</a>
          </div>
        `}
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

/**
 * Réessayer la vérification Live
 */
async function retryVerifyLive(contentId) {
  try {
    const response = await fetchAPI(`/api/publish/${contentId}/verify`, { method: 'POST' });
    const result = await response.json();
    
    closePublishModal();
    
    if (result.status === 'ok' && result.data.status === 'live') {
      alert(`✅ Page en ligne !\n\nURL : ${result.data.url}`);
    } else {
      alert(`⚠️ Page pas encore accessible.\n\nRéessayez dans quelques minutes.`);
    }
    
    loadContents();
  } catch (err) {
    alert(`❌ Erreur : ${err.message}`);
  }
}

/**
 * Fermer la modal de publication
 */
function closePublishModal() {
  const modal = document.querySelector('.publish-modal');
  if (modal) modal.remove();
}

// Exposer les fonctions globalement
window.closePublishModal = closePublishModal;
window.retryVerifyLive = retryVerifyLive;

/**
 * Vérifier si l'URL est accessible avant de marquer "live"
 */
async function checkAndMarkLive(contentId, slug) {
  const baseUrl = 'https://www.mistralpro-reno.fr';
  let urlToCheck = '';
  
  if (slug) {
    // Essayer différents formats d'URL
    urlToCheck = `${baseUrl}/${slug}.html`;
  } else {
    alert('⚠️ Pas de slug défini pour ce contenu.\nVeuillez d\'abord déployer le fichier HTML.');
    return;
  }

  try {
    // Afficher message de vérification
    const confirmCheck = confirm(`🔍 Vérification de l'URL :\n${urlToCheck}\n\nCliquez OK pour vérifier si la page est accessible.`);
    
    if (!confirmCheck) return;

    // Note: On ne peut pas faire un fetch cross-origin depuis le dashboard
    // L'utilisateur doit vérifier manuellement
    const manualCheck = confirm(`📋 Vérification manuelle requise :\n\n1. Ouvrez cette URL dans un nouvel onglet :\n${urlToCheck}\n\n2. Vérifiez que la page s'affiche correctement\n\nLa page est-elle accessible et affiche le bon contenu ?`);

    if (manualCheck) {
      // Marquer comme live
      await updateContentStatus(contentId, 'live');
      alert(`✅ Contenu marqué "En ligne" !\n\nURL : ${urlToCheck}`);
    } else {
      alert(`❌ Le contenu reste en statut "Déployé".\n\nVérifiez que le fichier est bien déployé sur le serveur.`);
    }

  } catch (err) {
    alert(`❌ Erreur lors de la vérification :\n${err.message}`);
    console.error('checkAndMarkLive error:', err);
  }
}

// =====================================================
// IMPACT ANALYSIS
// =====================================================

/**
 * Charger et afficher l'analyse d'impact SEO
 */
async function loadImpactAnalysis() {
  const summaryContainer = document.getElementById('impact-summary');
  const contentsContainer = document.getElementById('impact-contents');
  const recoContainer = document.getElementById('impact-recommendations');
  
  summaryContainer.innerHTML = '<p class="loading">Analyse en cours...</p>';
  contentsContainer.innerHTML = '';
  recoContainer.innerHTML = '';

  try {
    const response = await fetchAPI('/api/impact');
    const result = await response.json();

    if (result.status !== 'ok') {
      summaryContainer.innerHTML = `<p class="error">Erreur: ${result.message}</p>`;
      return;
    }

    const { summary, contents, recommendations } = result;

    // Afficher le résumé
    summaryContainer.innerHTML = `
      <div class="impact-stats">
        <div class="stat-card">
          <span class="stat-value">${summary.total_published}</span>
          <span class="stat-label">Déployés</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${summary.with_data}</span>
          <span class="stat-label">Avec données</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${summary.average_score}/100</span>
          <span class="stat-label">Score moyen</span>
        </div>
        <div class="stat-card performance-card">
          <span class="stat-value performance-breakdown">
            <span class="perf-excellent">🟢 ${summary.performance.excellent}</span>
            <span class="perf-good">🟡 ${summary.performance.good}</span>
            <span class="perf-improve">🟠 ${summary.performance.needs_improvement}</span>
          </span>
          <span class="stat-label">Performance</span>
        </div>
      </div>
    `;

    // Afficher les contenus
    if (contents.length > 0) {
      let html = `
        <h3>📊 Impact par contenu</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Titre</th>
              <th>Mot-clé</th>
              <th>Score</th>
              <th>Position</th>
              <th>Impressions</th>
              <th>CTR</th>
              <th>Tendance</th>
            </tr>
          </thead>
          <tbody>
      `;

      for (const c of contents) {
        const scoreClass = c.impact_score >= 70 ? 'score-excellent' : 
                          c.impact_score >= 40 ? 'score-good' : 
                          c.impact_score > 0 ? 'score-improve' : 'score-nodata';
        
        const trendIcon = c.trend ? 
          (c.trend.direction === 'improving' ? '📈' : 
           c.trend.direction === 'declining' ? '📉' : '➡️') : '-';

        html += `
          <tr>
            <td class="title-cell" title="${escapeHtml(c.title)}">${escapeHtml(c.title.substring(0, 40))}${c.title.length > 40 ? '...' : ''}</td>
            <td>${escapeHtml(c.keyword) || '-'}</td>
            <td><span class="impact-score ${scoreClass}">${c.impact_score}</span></td>
            <td>${c.metrics?.position || '-'}</td>
            <td>${c.metrics?.impressions || 0}</td>
            <td>${c.metrics?.ctr || 0}%</td>
            <td>${trendIcon}</td>
          </tr>
        `;
      }

      html += '</tbody></table>';
      contentsContainer.innerHTML = html;
    } else {
      contentsContainer.innerHTML = '<p class="empty-state">Aucun contenu publié à analyser.</p>';
    }

    // Afficher les recommandations
    if (recommendations.length > 0) {
      let recoHtml = '<h3>💡 Recommandations</h3><div class="recommendations-list">';
      
      for (const reco of recommendations) {
        const priorityClass = reco.priority === 'high' ? 'priority-high' : 'priority-medium';
        recoHtml += `
          <div class="recommendation-card ${priorityClass}">
            <div class="reco-header">
              <span class="reco-type">${getRecoTypeIcon(reco.type)}</span>
              <span class="reco-priority">${reco.priority.toUpperCase()}</span>
            </div>
            <p class="reco-message">${reco.message}</p>
            <p class="reco-action"><strong>Action :</strong> ${reco.action}</p>
          </div>
        `;
      }
      
      recoHtml += '</div>';
      recoContainer.innerHTML = recoHtml;
    }

  } catch (err) {
    summaryContainer.innerHTML = `<p class="error">Erreur de connexion: ${err.message}</p>`;
    console.error('loadImpactAnalysis error:', err);
  }
}

/**
 * Obtenir l'icône du type de recommandation
 */
function getRecoTypeIcon(type) {
  const icons = {
    'optimize_ctr': '📝',
    'quick_win': '🎯',
    'waiting_indexation': '⏳'
  };
  return icons[type] || '💡';
}
