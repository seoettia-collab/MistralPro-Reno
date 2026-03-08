# 🎯 ARCHITECTURE — Mistral SEO Dashboard

> **Application interne** — Dashboard SEO pour le pilotage du référencement naturel de mistralpro-reno.fr

---

## 1. VUE D'ENSEMBLE

```
┌─────────────────────────────────────────────────────────────────┐
│                     UTILISATEUR (Ricardo/Équipe)                 │
│                         Navigateur web                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      OVH HOSTING                                 │
│                   mistralpro-reno.fr                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    /www/                                   │  │
│  │                                                            │  │
│  │  ┌─────────────────────┐    ┌─────────────────────┐       │  │
│  │  │   SITE PUBLIC       │    │   SEO DASHBOARD     │       │  │
│  │  │   /                 │    │   /seo-dashboard/   │       │  │
│  │  │   (indexé Google)   │    │   (noindex, protégé)│       │  │
│  │  └─────────────────────┘    └─────────────────────┘       │  │
│  │                                      │                     │  │
│  │                                      ▼                     │  │
│  │                             ┌─────────────────┐            │  │
│  │                             │  BACKEND API    │            │  │
│  │                             │  /seo-api/      │            │  │
│  │                             └─────────────────┘            │  │
│  │                                      │                     │  │
│  │                                      ▼                     │  │
│  │                             ┌─────────────────┐            │  │
│  │                             │  SQLite DB      │            │  │
│  │                             │  seo.db         │            │  │
│  │                             └─────────────────┘            │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. SÉPARATION LOGIQUE

### Composants distincts

| Composant | Chemin | Rôle | Accès |
|-----------|--------|------|-------|
| **Site public** | `/` | Site vitrine Mistral Pro Reno | Public, indexé |
| **SEO Dashboard** | `/seo-dashboard/` | Interface pilotage SEO | Privé, protégé |
| **Backend API** | `/seo-api/` | API REST du dashboard | Protégé, API key |
| **Base SQLite** | `seo.db` | Stockage données SEO | Serveur uniquement |

### Principe d'isolation

```
┌─────────────────────────────────────────────────────────────────┐
│                         MÊME SERVEUR OVH                         │
│                                                                  │
│  ┌──────────────────────┐       ┌──────────────────────┐        │
│  │    SITE PUBLIC       │       │    SEO DASHBOARD     │        │
│  │                      │       │                      │        │
│  │  index.html          │       │  index.html          │        │
│  │  services.html       │       │  dashboard.js        │        │
│  │  blog/               │       │  style.css           │        │
│  │  css/                │       │                      │        │
│  │  js/                 │       │  robots.txt (Disallow)│       │
│  │  images/             │       │  noindex meta        │        │
│  │                      │       │                      │        │
│  │  ✅ INDEXÉ GOOGLE    │       │  🔒 NON INDEXÉ       │        │
│  └──────────────────────┘       └──────────────────────┘        │
│                                                                  │
│              AUCUNE INTERFÉRENCE — DOCUMENTATION SÉPARÉE         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. FLUX GLOBAL

### Pipeline SEO complet

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   GOOGLE     │────▶│   BACKEND    │────▶│   SQLITE     │
│   SEARCH     │     │   API        │     │   STOCKAGE   │
│   CONSOLE    │     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   SCORING    │────▶│ OPPORTUNITÉS │────▶│   CONTENU    │
│   SEO        │     │   DÉTECTÉES  │     │   PROPOSÉ    │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   BRIEF      │────▶│   CLAUDE     │────▶│   GIT PUSH   │
│   GÉNÉRÉ     │     │   EXÉCUTE    │     │   main       │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
┌──────────────┐     ┌──────────────┐
│   GITHUB     │────▶│   OVH        │
│   ACTIONS    │     │   DÉPLOYÉ    │
└──────────────┘     └──────────────┘
```

### Détail du flux

1. **Import GSC** → Récupération données Search Console (requêtes, pages, clics, impressions)
2. **Stockage** → Enregistrement SQLite avec historique
3. **Scoring** → Calcul score SEO global et par page
4. **Opportunités** → Détection automatique des actions à mener
5. **Contenu** → Génération idées articles et optimisations
6. **Brief Claude** → Création brief technique exécutable
7. **Exécution** → Claude modifie le repo et push
8. **Déploiement** → GitHub Actions → OVH

---

## 4. STRUCTURE DES 7 ONGLETS

### Navigation principale

```
┌─────────────────────────────────────────────────────────────────┐
│  [1.Cockpit] [2.Search Console] [3.Opportunités] [4.Contenu]    │
│  [5.Audit] [6.Conversions] [7.Brief Claude]                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                       CONTENU ONGLET                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Détail des onglets

| # | Onglet | Fonction | Données principales |
|---|--------|----------|---------------------|
| 1 | **Cockpit SEO** | Vue synthétique | Score global, alertes, KPIs |
| 2 | **Search Console Data** | Données GSC | Requêtes, pages, positions |
| 3 | **Opportunités SEO** | Actions détectées | Priorité, type, impact estimé |
| 4 | **Contenu** | Gestion articles | Idées, brouillons, publiés |
| 5 | **Audit technique** | Santé technique | Title, meta, H1, schema, vitesse |
| 6 | **Conversions SEO** | Suivi conversions | Simulateur, formulaires, appels |
| 7 | **Brief Claude** | Génération briefs | Actions à exécuter, validation |

---

## 5. MOTEURS INTERNES

### 5.1 Moteur de score SEO global

```
SCORE SEO GLOBAL (0-100)
│
├── Score technique (30%)
│   ├── Title présent et optimisé
│   ├── Meta description présente
│   ├── H1 unique
│   ├── Schema.org présent
│   ├── Canonical correct
│   └── Performance (Core Web Vitals)
│
├── Score contenu (40%)
│   ├── Longueur contenu
│   ├── Densité mots-clés
│   ├── Maillage interne
│   ├── Images avec alt
│   └── Fraîcheur contenu
│
└── Score autorité (30%)
    ├── Positions moyennes GSC
    ├── Clics organiques
    ├── Pages indexées
    └── Évolution positions
```

### 5.2 Moteur d'alertes automatiques

| Type | Déclencheur | Priorité |
|------|-------------|----------|
| **Critique** | Page désindexée, erreur 404 | 🔴 Fort |
| **Warning** | Chute position >5, meta manquante | 🟠 Moyen |
| **Info** | Nouvelle opportunité, contenu ancien | 🟢 Faible |

### 5.3 Moteur concurrentiel (5 concurrents)

```
CONCURRENTS SUIVIS
│
├── Concurrent 1: [URL]
│   ├── Pages indexées estimées
│   ├── Mots-clés communs
│   └── Positions comparées
│
├── Concurrent 2: [URL]
│   └── ...
│
└── Concurrent 5: [URL]
    └── ...
```

**Note MVP** : Analyse concurrentielle basique (crawl public uniquement).

---

## 6. INTÉGRATIONS EXTERNES

### Google Search Console API

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   GSC API       │────▶│   Backend       │────▶│   SQLite        │
│   OAuth 2.0     │     │   /seo-api/     │     │   tables        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

| Endpoint GSC | Données récupérées |
|--------------|-------------------|
| `searchAnalytics.query` | Requêtes, clics, impressions, positions |
| `sitemaps.list` | État sitemap |
| `urlInspection` | Statut indexation (si disponible) |

### Lecture repo Git

```
┌─────────────────┐     ┌─────────────────┐
│   GitHub API    │────▶│   Backend       │
│   (lecture)     │     │   Métadonnées   │
└─────────────────┘     └─────────────────┘
```

- Liste des fichiers HTML
- Dernière modification
- Historique commits

### Flux Claude git push

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Brief validé  │────▶│   Claude        │────▶│   Git push      │
│   (Dashboard)   │     │   (Exécution)   │     │   main          │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Important** : Le dashboard génère le brief, Claude l'exécute manuellement ou via commande.

---

## 7. STRUCTURE FUTURE MULTI-SITES

### Architecture MVP → Multi-sites

```
MVP (actuel)                          FUTUR
─────────────                         ──────
1 site (MPR)                          N sites
1 compte GSC                          N comptes GSC
1 base SQLite                         1 base + table sites

┌─────────────┐                       ┌─────────────┐
│   Site 1    │                       │   Site 1    │
│   MPR       │                       │   MPR       │
└─────────────┘                       ├─────────────┤
                                      │   Site 2    │
                                      │   (futur)   │
                                      ├─────────────┤
                                      │   Site N    │
                                      │   (futur)   │
                                      └─────────────┘
```

### Table sites (prête pour multi-sites)

```sql
CREATE TABLE sites (
  id INTEGER PRIMARY KEY,
  name TEXT,
  url TEXT UNIQUE,
  gsc_property TEXT,
  github_repo TEXT,
  active BOOLEAN DEFAULT 1,
  created_at DATETIME
);
```

---

## 8. SÉCURITÉ

### Principes appliqués

| Mesure | Implémentation |
|--------|----------------|
| **noindex** | `<meta name="robots" content="noindex, nofollow">` |
| **robots.txt** | `Disallow: /seo-dashboard/` |
| **Protection accès** | Mot de passe serveur (.htaccess) |
| **API key** | Header `X-API-Key` requis |
| **Secrets serveur** | Variables env, jamais côté frontend |
| **Rate limiting** | Max 100 req/min par IP |

### Fichier .htaccess (seo-dashboard)

```apache
# Protection par mot de passe
AuthType Basic
AuthName "SEO Dashboard - Accès restreint"
AuthUserFile /path/to/.htpasswd
Require valid-user

# Pas d'indexation
Header set X-Robots-Tag "noindex, nofollow"
```

---

## 9. STACK TECHNIQUE

### Frontend

| Technologie | Usage |
|-------------|-------|
| HTML5 | Structure |
| CSS3 | Styles (variables.css) |
| JavaScript vanilla | Logique modulaire |
| Chart.js | Graphiques |

### Backend

| Technologie | Usage |
|-------------|-------|
| Node.js | Runtime |
| Express | Framework API |
| better-sqlite3 | Base de données |
| node-fetch | Requêtes HTTP |
| googleapis | API GSC |

### Base de données

| Technologie | Usage |
|-------------|-------|
| SQLite | Stockage local |
| Fichier unique | `seo.db` |

---

## 10. CONVENTIONS DOSSIERS

### Structure projet

```
/seo-dashboard/
│
├── index.html                  # Page principale
├── robots.txt                  # Disallow
│
├── css/
│   ├── variables.css           # Couleurs, fonts
│   ├── style.css               # Styles principaux
│   └── responsive.css          # Media queries
│
├── js/
│   ├── config.js               # Configuration
│   ├── state.js                # État global
│   ├── api.js                  # Appels API
│   ├── navigation.js           # Navigation onglets
│   ├── cockpit.js              # Onglet 1
│   ├── searchconsole.js        # Onglet 2
│   ├── opportunities.js        # Onglet 3
│   ├── content.js              # Onglet 4
│   ├── audit.js                # Onglet 5
│   ├── conversions.js          # Onglet 6
│   └── brief.js                # Onglet 7
│
└── assets/
    └── logo.webp

/seo-api/
│
├── server.js                   # Point d'entrée
├── .env                        # Variables (secrets)
│
├── routes/
│   ├── gsc.routes.js           # Routes Search Console
│   ├── audit.routes.js         # Routes audit
│   ├── content.routes.js       # Routes contenu
│   ├── opportunities.routes.js # Routes opportunités
│   └── brief.routes.js         # Routes briefs
│
├── services/
│   ├── gsc.service.js          # Service GSC
│   ├── crawler.service.js      # Crawl site
│   ├── analyzer.service.js     # Analyse SEO
│   ├── scorer.service.js       # Calcul scores
│   └── brief.service.js        # Génération briefs
│
├── models/
│   └── database.js             # Modèles SQLite
│
└── utils/
    ├── auth.js                 # Vérification API key
    └── helpers.js              # Fonctions utilitaires

/data/
└── seo.db                      # Base SQLite
```

---

## 11. GOUVERNANCE

| Rôle | Responsable | Actions |
|------|-------------|---------|
| **Décideur** | Ricardo ETTIA | Validation briefs, arbitrage |
| **Architecte** | GPT | Cadrage technique, cohérence |
| **Ingénieur** | Claude | Implémentation, git push |

### Workflow validation

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Dashboard │────▶│   Ricardo   │────▶│   Claude    │
│   génère    │     │   valide    │     │   exécute   │
│   brief     │     │   brief     │     │   git push  │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

*Dernière mise à jour : 8 mars 2026*
