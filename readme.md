# DASHBOARD GOOGLE ADS AUTO — Structure Modulaire

**Projet :** MistralRenov  
**Version source :** DASHBOARD_v11_OPTIMISTIC.html  
**Date de découpage :** 11 janvier 2026  

---

## 📁 ARBORESCENCE

```
/dashboard/
├── index.html              # Page principale
├── README.md               # Ce fichier
│
├── /css/                   # Styles (9 fichiers)
│   ├── variables.css       # Variables CSS (couleurs, etc.)
│   ├── base.css            # Reset et styles de base
│   ├── navigation.css      # Navigation principale et sous-onglets
│   ├── cards.css           # Cartes, badges, diagnostics, boutons
│   ├── tables.css          # Tableaux (keywords, history, search terms)
│   ├── modals.css          # Modals de confirmation
│   ├── toast.css           # Notifications toast
│   ├── lecture.css         # Vue Lecture
│   └── responsive.css      # Media queries
│
└── /js/                    # Scripts (14 fichiers)
    ├── config.js           # Configuration et constantes
    ├── state.js            # Variables globales d'état
    ├── storage-recos.js    # localStorage recommandations
    ├── storage-searchterms.js  # localStorage search terms
    ├── classification.js   # Règles métier BTP (EXCLUDE_WORDS, PERTINENT_WORDS)
    ├── toast.js            # Notifications toast
    ├── navigation.js       # Gestion des onglets
    ├── api.js              # Appels API (refreshAll, launchAnalysis, syncGoogleAds)
    ├── analyse.js          # Vue Analyse / Lecture
    ├── cockpit.js          # Vue Cockpit Exécution
    ├── searchterms.js      # Vue Search Terms (avec optimistic update)
    ├── history.js          # Vue Historique
    ├── modals.js           # Gestion des modals (pause, bid, enable, rollback)
    └── init.js             # Initialisation de l'application
```

---

## 🔗 DÉPENDANCES BACKEND

| Endpoint | Méthode | Fichier |
|----------|---------|---------|
| `/api/wf1/latest` | GET | api.js |
| `/api/wf2/latest` | GET | api.js |
| `/api/wf3/last-execution` | GET | api.js |
| `/api/wf3/history?limit=50` | GET | api.js |

**Base URL :** `https://google-ads-auto-backend.onrender.com`

---

## 🔗 WEBHOOKS N8N

| Webhook | URL | Fichier |
|---------|-----|---------|
| WF1 | `https://ettia.app.n8n.cloud/webhook/wf1-trigger` | api.js |
| WF2 | `https://ettia.app.n8n.cloud/webhook/wf2-trigger` | api.js |
| WF3 | `https://ettia.app.n8n.cloud/webhook/wf3-trigger` | api.js, modals.js, searchterms.js |

---

## 💾 LOCALSTORAGE

| Clé | Expiration | Fichier |
|-----|------------|---------|
| `google_ads_auto_consumed_recos` | 7 jours | storage-recos.js |
| `google_ads_auto_validated_search_terms` | Aucune | storage-searchterms.js |

---

## 📋 FONCTIONS PRINCIPALES (52 au total)

### Core
- `init()` — Initialisation
- `refreshAll()` — Chargement données
- `showToast()` — Notifications

### Navigation
- `switchMainTab(tab)` — Onglet principal
- `switchSubTab(sub)` — Sous-onglet
- `changePeriod()` — Sélection période
- `updatePeriodLabels()` — Labels dynamiques
- `updateTime()` — Horloge

### Analyse
- `renderAnalyseData()` — Affichage données
- `displayRecommendationsV2(recos)` — Recommandations
- `downloadCSV()` — Export CSV
- `renderLectureView()` — Vue lecture
- `updateLectureView(data)` — Mise à jour lecture

### Cockpit
- `loadCockpitData()` — Chargement données
- `renderCockpitTable()` — Affichage tableau
- `toggleBidMenu(idx)` — Menu enchères
- `syncGoogleAds()` — Synchronisation

### Search Terms
- `processSearchTerms(rawSearchTerms)` — Traitement
- `renderSearchTermsTable()` — Affichage
- `updateDecisionStyle(selectId)` — Style décision
- `validateSearchTermDecision(index, selectId)` — Validation (optimistic update)
- `classifySearchTerm(st)` — Classification
- `checkExcludeWords(searchTerm)` — Détection exclusion
- `checkPertinentWords(searchTerm)` — Détection pertinence

### History
- `loadHistoryFromBackend()` — Chargement historique
- `renderHistoryTable()` — Affichage tableau
- `filterHistory()` — Filtrage
- `exportHistoryCSV()` — Export CSV

### Modals (sans PIN)
- `openPauseModal(idx)` — Modal pause
- `openEnableModal(idx)` — Modal activation
- `selectBid(idx, percent)` — Modal enchère
- `openRollbackModal(keyword)` — Modal rollback
- `closeModal(id)` — Fermeture
- `confirmPause()` — Confirmation pause → executeAction()
- `confirmBid()` — Confirmation enchère → executeAction()
- `confirmEnable()` — Confirmation activation → executeAction()
- `confirmRollback()` — Confirmation rollback → executeAction()
- `executeAction()` — Exécution action

### Storage
- `loadConsumedRecos()`, `saveConsumedRecos()`, `markRecoAsConsumed()`, `isRecoConsumed()`, `purgeExpiredRecos()`, `clearConsumedRecos()`
- `loadValidatedSearchTerms()`, `saveValidatedSearchTerms()`, `markSearchTermValidated()`, `isSearchTermValidated()`, `clearValidatedSearchTerms()`, `rollbackSearchTermValidation()`

---

## ⚠️ RÈGLES IMMUABLES

1. **Aucune modification de budget** — Interdit par le protocole
2. **Aucune pause de campagne entière** — Interdit
3. **Actions atomiques uniquement** — 1 action = 1 mot-clé
4. **Quotas journaliers** — max 10 pauses, 15 enchères, 20 négatifs
5. **Pas de PIN** — Actions directes avec confirmation simple

---

## 🚀 UTILISATION

1. Ouvrir `index.html` dans un navigateur
2. Vérifier que le backend Render.com est actif
3. Vérifier que les workflows n8n sont actifs
4. Le dashboard se charge automatiquement

---

## 📝 NOTES

- Comportement **100% identique** à la version monolithique
- Aucun refactoring fonctionnel
- Aucune modification des règles métier
- Optimistic update préservé pour Search Terms
- Modals sans validation PIN (confirmation directe)
