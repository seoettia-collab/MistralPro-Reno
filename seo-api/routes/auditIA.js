/**
 * Audit IA Routes - Analyse SEO avec Claude
 * POST /api/audit-ia/analyze
 */

const express = require('express');
const router = express.Router();

// Clé API Anthropic depuis variables d'environnement
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * POST /api/audit-ia/analyze
 * Analyse les données cockpit avec Claude et retourne des recommandations
 */
router.post('/audit-ia/analyze', async (req, res) => {
  try {
    const { cockpitData } = req.body;
    
    if (!cockpitData) {
      return res.status(400).json({
        status: 'error',
        message: 'cockpitData requis'
      });
    }
    
    // Vérifier la clé API
    if (!ANTHROPIC_API_KEY) {
      console.warn('[Audit IA] ANTHROPIC_API_KEY non configurée, mode simulation');
      return res.json({
        status: 'ok',
        data: generateSimulatedAudit(cockpitData),
        simulated: true
      });
    }
    
    // Construire le prompt pour Claude
    const systemPrompt = `Tu es un expert SEO senior spécialisé dans les sites de rénovation et BTP en France.
Tu analyses les données d'un dashboard SEO et tu fournis des recommandations actionnables.

RÈGLES IMPORTANTES :
- Réponds UNIQUEMENT en JSON valide, sans markdown ni texte avant/après
- Sois concis et actionnable
- Priorise les actions par impact potentiel
- Adapte tes recommandations au secteur de la rénovation à Paris
- Analyse les concurrents suivis pour contextualiser tes recommandations

FORMAT DE RÉPONSE OBLIGATOIRE (JSON) :
{
  "summary": "Résumé de 200 caractères max de l'état SEO",
  "strengths": ["Force 1", "Force 2", "Force 3"],
  "weaknesses": ["Faiblesse 1", "Faiblesse 2", "Faiblesse 3"],
  "competition": {
    "analysis": "Analyse concurrentielle en 1-2 phrases",
    "competitors": [
      {
        "domain": "domaine.com",
        "threat_level": "HIGH|MEDIUM|LOW",
        "positioning": "Type de positionnement observé"
      }
    ],
    "opportunities": ["Opportunité face aux concurrents 1", "Opportunité 2"]
  },
  "actions": [
    {
      "type": "create_content|optimize_page|fix_technical",
      "target": "Mot-clé ou page cible",
      "priority": "HIGH|MEDIUM|LOW",
      "impact": "Description de l'impact attendu",
      "reason": "Pourquoi cette action est recommandée",
      "impactScore": 0-100,
      "vs_competitor": "Domaine concurrent ciblé (optionnel)"
    }
  ]
}`;

    const userPrompt = `Analyse ces données SEO du site mistralpro-reno.fr (entreprise de rénovation à Paris) et fournis tes recommandations :

DONNÉES COCKPIT :
${JSON.stringify(cockpitData, null, 2)}

CONCURRENTS SUIVIS :
${cockpitData.concurrents && cockpitData.concurrents.length > 0 
  ? cockpitData.concurrents.map(c => `- ${c.domaine}`).join('\n')
  : 'Aucun concurrent suivi'}

Fournis ton analyse en JSON selon le format spécifié. Inclus une analyse concurrentielle basée sur les domaines suivis.`;

    // Appel API Claude
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Audit IA] Erreur API Claude:', response.status, errorText);
      
      // Fallback simulation si erreur API
      return res.json({
        status: 'ok',
        data: generateSimulatedAudit(cockpitData),
        simulated: true,
        error: `API error: ${response.status}`
      });
    }
    
    const result = await response.json();
    
    // Extraire le contenu de la réponse Claude
    const content = result.content?.[0]?.text;
    
    if (!content) {
      throw new Error('Réponse Claude vide');
    }
    
    // Parser le JSON de la réponse
    let auditData;
    try {
      // Nettoyer le contenu (enlever éventuels backticks markdown)
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      auditData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('[Audit IA] Erreur parsing JSON:', parseError.message);
      console.error('[Audit IA] Contenu brut:', content);
      
      // Fallback simulation si parsing échoue
      return res.json({
        status: 'ok',
        data: generateSimulatedAudit(cockpitData),
        simulated: true,
        error: 'JSON parse error'
      });
    }
    
    // Ajouter les actionId aux actions
    const timestamp = Date.now();
    if (auditData.actions) {
      auditData.actions = auditData.actions.map((action, index) => ({
        ...action,
        actionId: `action_${timestamp}_${index}`
      }));
    }
    
    res.json({
      status: 'ok',
      data: auditData,
      simulated: false
    });
    
  } catch (error) {
    console.error('[Audit IA] Erreur:', error.message);
    
    // Fallback simulation en cas d'erreur
    res.json({
      status: 'ok',
      data: generateSimulatedAudit(req.body?.cockpitData || {}),
      simulated: true,
      error: error.message
    });
  }
});

/**
 * Génère un audit simulé basé sur les données cockpit
 */
function generateSimulatedAudit(cockpitData) {
  const { 
    score_global = 0, 
    search_console = {}, 
    opportunites = [], 
    alertes = [],
    concurrents = []
  } = cockpitData;
  
  const timestamp = Date.now();
  let actionCounter = 0;
  
  // Analyser les données pour générer des recommandations pertinentes
  const actions = [];
  
  // Actions basées sur les opportunités (avec référence concurrents)
  if (opportunites.length > 0) {
    opportunites.slice(0, 3).forEach((opp, idx) => {
      const competitor = concurrents[idx % concurrents.length];
      actions.push({
        actionId: `action_${timestamp}_${actionCounter++}`,
        type: 'create_content',
        target: opp.keyword || 'mot-clé opportunité',
        priority: opp.priority === 'high' ? 'HIGH' : 'MEDIUM',
        impact: `+${Math.floor(Math.random() * 30 + 10)} clics/mois estimés`,
        reason: `Position ${opp.position || 'améliorable'} avec ${opp.impressions || 'N'} impressions`,
        impactScore: Math.floor(Math.random() * 30 + 60),
        vs_competitor: competitor ? competitor.domaine : null
      });
    });
  }
  
  // Actions basées sur le score
  if (score_global < 50) {
    actions.push({
      actionId: `action_${timestamp}_${actionCounter++}`,
      type: 'fix_technical',
      target: 'Optimisation technique globale',
      priority: 'HIGH',
      impact: 'Amélioration score SEO +15-20 points',
      reason: `Score actuel ${score_global}/100 - amélioration technique prioritaire`,
      impactScore: 85
    });
  }
  
  // Actions basées sur les alertes
  if (alertes.length > 0) {
    const criticalAlert = alertes.find(a => a.includes && (a.includes('critique') || a.includes('faible')));
    if (criticalAlert) {
      actions.push({
        actionId: `action_${timestamp}_${actionCounter++}`,
        type: 'fix_technical',
        target: criticalAlert,
        priority: 'HIGH',
        impact: 'Correction problème bloquant SEO',
        reason: 'Alerte critique détectée',
        impactScore: 90
      });
    }
  }
  
  // Action par défaut si aucune autre
  if (actions.length === 0) {
    actions.push({
      actionId: `action_${timestamp}_${actionCounter++}`,
      type: 'create_content',
      target: 'rénovation appartement paris',
      priority: 'MEDIUM',
      impact: '+20 clics/mois estimés',
      reason: 'Mot-clé principal à renforcer',
      impactScore: 65,
      vs_competitor: concurrents[0] ? concurrents[0].domaine : null
    });
  }
  
  // Trier par impactScore décroissant
  actions.sort((a, b) => b.impactScore - a.impactScore);
  
  // Générer l'analyse concurrentielle
  const competition = {
    analysis: concurrents.length > 0 
      ? `${concurrents.length} concurrent(s) suivi(s). Positionnement sur le marché de la rénovation Paris à renforcer.`
      : 'Aucun concurrent suivi. Recommandation : ajouter 3-5 concurrents directs pour benchmark.',
    competitors: concurrents.slice(0, 4).map((c, idx) => ({
      domain: c.domaine,
      threat_level: idx === 0 ? 'HIGH' : idx < 2 ? 'MEDIUM' : 'LOW',
      positioning: 'Rénovation généraliste Paris/IDF'
    })),
    opportunities: concurrents.length > 0 
      ? [
          'Se différencier par le contenu expert (guides détaillés)',
          'Cibler des mots-clés longue traîne moins concurrentiels',
          'Renforcer la présence locale (Paris 17, arrondissements)'
        ]
      : [
          'Identifier les concurrents directs sur Google',
          'Analyser leurs stratégies de contenu',
          'Définir un positionnement différenciant'
        ]
  };
  
  return {
    summary: `Score SEO ${score_global}/100. ${search_console.clics || 0} clics, ${search_console.impressions || 0} impressions. ${concurrents.length} concurrent(s) suivi(s).`,
    strengths: [
      'Site techniquement fonctionnel',
      'Présence locale Paris établie',
      'Structure de pages cohérente'
    ],
    weaknesses: [
      score_global < 50 ? 'Score SEO faible nécessitant optimisation' : 'Contenu à enrichir',
      'Volume de clics à améliorer',
      'Opportunités de mots-clés non exploitées'
    ],
    competition,
    actions: actions.slice(0, 5)
  };
}

module.exports = router;
