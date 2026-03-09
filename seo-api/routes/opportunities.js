/**
 * SEO Dashboard - Routes Opportunités
 */

const express = require('express');
const router = express.Router();
const { dbAll, dbGet, dbRun } = require('../services/db');
const { 
  runOpportunityDetection,
  getAllOpportunities,
  updateOpportunityStatus,
  getOpportunityStats,
  OPPORTUNITY_TYPES
} = require('../services/opportunityDetection');

// GET /api/opportunities/detect - Lancer la détection automatique
router.get('/opportunities/detect', async (req, res) => {
  try {
    const site = await dbGet('SELECT * FROM sites WHERE id = 1');
    
    if (!site) {
      return res.status(404).json({ status: 'error', message: 'Site not found' });
    }

    const result = await runOpportunityDetection(site.id);

    res.json({ 
      status: 'ok', 
      message: `${result.saved} nouvelles opportunités détectées`,
      data: result
    });

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/opportunities/stats - Statistiques des opportunités
router.get('/opportunities/stats', async (req, res) => {
  try {
    const stats = await getOpportunityStats();
    res.json({ status: 'ok', data: stats });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /api/opportunities - Liste des opportunités
router.get('/opportunities', async (req, res) => {
  try {
    const { status, priority, type } = req.query;
    
    const opportunities = await getAllOpportunities({
      status,
      priority,
      opportunity_type: type
    });

    // Enrichir avec données formatées
    const enriched = opportunities.map(o => ({
      ...o,
      ctr_percent: o.ctr ? Math.round(o.ctr * 10000) / 100 : 0,
      position_rounded: o.position ? Math.round(o.position * 10) / 10 : null,
      type_label: getTypeLabel(o.opportunity_type),
      priority_label: getPriorityLabel(o.priority),
      status_label: getStatusLabel(o.status)
    }));

    // Statistiques
    const stats = {
      total: enriched.length,
      byType: {
        quick_win: enriched.filter(o => o.opportunity_type === 'quick_win').length,
        low_ctr: enriched.filter(o => o.opportunity_type === 'low_ctr').length,
        position: enriched.filter(o => o.opportunity_type === 'position').length
      },
      byPriority: {
        high: enriched.filter(o => o.priority === 'high').length,
        medium: enriched.filter(o => o.priority === 'medium').length,
        low: enriched.filter(o => o.priority === 'low').length
      },
      byStatus: {
        pending: enriched.filter(o => o.status === 'pending').length,
        in_progress: enriched.filter(o => o.status === 'in_progress').length,
        completed: enriched.filter(o => o.status === 'completed').length
      },
      total_potential_gain: enriched.reduce((sum, o) => sum + (o.potential_gain || 0), 0)
    };

    res.json({ status: 'ok', data: enriched, stats });

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// PATCH /api/opportunities/:id/status - Mettre à jour le statut
router.patch('/opportunities/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await updateOpportunityStatus(id, status);
    
    res.json({ status: 'ok', changes: result.changes });

  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// DELETE /api/opportunities/:id - Supprimer une opportunité
router.delete('/opportunities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await dbRun('DELETE FROM opportunities WHERE id = ?', [id]);
    
    res.json({ status: 'ok', changes: result.changes });

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Helpers pour les labels
function getTypeLabel(type) {
  const labels = {
    'quick_win': '🎯 Quick Win',
    'low_ctr': '📉 CTR Faible',
    'position': '📈 Amélioration Position',
    'new_content': '📝 Nouveau Contenu',
    'cannibalization': '⚠️ Cannibalisation'
  };
  return labels[type] || type;
}

function getPriorityLabel(priority) {
  const labels = {
    'high': '🔴 Haute',
    'medium': '🟡 Moyenne',
    'low': '🟢 Basse'
  };
  return labels[priority] || priority;
}

function getStatusLabel(status) {
  const labels = {
    'pending': '⏳ En attente',
    'in_progress': '🔄 En cours',
    'completed': '✅ Terminé',
    'dismissed': '❌ Ignoré'
  };
  return labels[status] || status;
}

module.exports = router;
