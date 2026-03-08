# 📋 FICHE TECHNIQUE — Mistral SEO Dashboard

> **Référentiel rapide** — Consulter ce document pour retrouver les infos clés du dashboard SEO.

---

## 🔗 ACCÈS RAPIDES

| Élément | Valeur |
|---------|--------|
| **URL Dashboard** | https://www.mistralpro-reno.fr/seo-dashboard/ |
| **URL API** | https://www.mistralpro-reno.fr/seo-api/ |
| **Site pilote** | https://www.mistralpro-reno.fr |
| **Repo GitHub** | seoettia-collab/MistralPro-Reno |
| **Branche** | main |
| **Hébergement** | OVH (même serveur que site public) |

---

## 🛠️ ENVIRONNEMENT

| Élément | Valeur |
|---------|--------|
| **Frontend** | HTML/CSS/JS vanilla |
| **Backend** | Node.js + Express |
| **Base de données** | SQLite (seo.db) |
| **Source SEO** | Google Search Console API |
| **Protection** | .htaccess + API key |

---

## 📊 MODULES DASHBOARD (7 ONGLETS)

| # | Module | Fonction | Données |
|---|--------|----------|---------|
| 1 | **Cockpit SEO** | Vue synthétique | Score global, alertes, KPIs |
| 2 | **Search Console** | Données GSC | Requêtes, clics, positions |
| 3 | **Opportunités** | Actions détectées | Priorité, type, impact |
| 4 | **Contenu** | Gestion articles | Idées → brouillons → publiés |
| 5 | **Audit technique** | Santé SEO | Title, meta, H1, schema |
| 6 | **Conversions** | Suivi conversions | Simulateur, formulaires |
| 7 | **Brief Claude** | Génération briefs | Actions à exécuter |

---

## 🔌 ROUTES API

### Search Console

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/gsc/queries` | Liste requêtes |
| GET | `/api/gsc/pages` | Liste pages |
| GET | `/api/gsc/positions` | Positions par requête |
| POST | `/api/gsc/sync` | Synchronisation GSC |

### Audit

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/audit/pages` | Liste pages auditées |
| GET | `/api/audit/page/:url` | Audit page spécifique |
| POST | `/api/audit/run` | Lancer audit complet |
| GET | `/api/audit/score` | Score SEO global |

### Opportunités

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/opportunities` | Liste opportunités |
| GET | `/api/opportunities/:id` | Détail opportunité |
| PATCH | `/api/opportunities/:id` | Màj statut |

### Contenu

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/content` | Liste contenus |
| POST | `/api/content` | Créer contenu |
| PATCH | `/api/content/:id` | Màj contenu |
| DELETE | `/api/content/:id` | Supprimer contenu |
| POST | `/api/content/generate` | Générer idée IA |

### Briefs

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/briefs` | Liste briefs |
| POST | `/api/briefs` | Créer brief |
| GET | `/api/briefs/:id` | Détail brief |
| PATCH | `/api/briefs/:id/status` | Màj statut |

### Conversions

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/conversions` | Stats conversions |
| GET | `/api/conversions/history` | Historique |

---

## 🗄️ STRUCTURE TABLES SQLITE

### Table: sites

```sql
CREATE TABLE sites (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,
  gsc_property TEXT,
  github_repo TEXT,
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Table: pages

```sql
CREATE TABLE pages (
  id INTEGER PRIMARY KEY,
  site_id INTEGER REFERENCES sites(id),
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  h1 TEXT,
  word_count INTEGER,
  has_schema BOOLEAN,
  score INTEGER,
  last_crawl DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(site_id, url)
);
```

### Table: queries

```sql
CREATE TABLE queries (
  id INTEGER PRIMARY KEY,
  site_id INTEGER REFERENCES sites(id),
  query TEXT NOT NULL,
  clicks INTEGER,
  impressions INTEGER,
  ctr REAL,
  position REAL,
  date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Table: audits

```sql
CREATE TABLE audits (
  id INTEGER PRIMARY KEY,
  page_id INTEGER REFERENCES pages(id),
  score INTEGER,
  issues TEXT,          -- JSON
  suggestions TEXT,     -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Table: opportunities

```sql
CREATE TABLE opportunities (
  id INTEGER PRIMARY KEY,
  site_id INTEGER REFERENCES sites(id),
  type TEXT,            -- creation_article, optimisation_page, etc.
  priority TEXT,        -- fort, moyen, faible
  title TEXT,
  description TEXT,
  target_url TEXT,
  target_keyword TEXT,
  status TEXT DEFAULT 'pending',  -- pending, in_progress, done, rejected
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Table: contents

```sql
CREATE TABLE contents (
  id INTEGER PRIMARY KEY,
  site_id INTEGER REFERENCES sites(id),
  opportunity_id INTEGER REFERENCES opportunities(id),
  type TEXT,            -- article, page_service, optimisation
  title TEXT,
  slug TEXT,
  status TEXT DEFAULT 'idea',  -- idea, draft, validated, published
  content TEXT,         -- JSON structure
  target_keywords TEXT, -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  published_at DATETIME
);
```

### Table: competitors

```sql
CREATE TABLE competitors (
  id INTEGER PRIMARY KEY,
  site_id INTEGER REFERENCES sites(id),
  name TEXT,
  url TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Table: briefs

```sql
CREATE TABLE briefs (
  id INTEGER PRIMARY KEY,
  site_id INTEGER REFERENCES sites(id),
  content_id INTEGER REFERENCES contents(id),
  opportunity_id INTEGER REFERENCES opportunities(id),
  type TEXT,            -- creation, optimisation
  title TEXT,
  instructions TEXT,    -- Markdown
  files_to_modify TEXT, -- JSON array
  status TEXT DEFAULT 'draft',  -- draft, validated, executed, cancelled
  validated_by TEXT,
  validated_at DATETIME,
  executed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Table: alerts

```sql
CREATE TABLE alerts (
  id INTEGER PRIMARY KEY,
  site_id INTEGER REFERENCES sites(id),
  page_id INTEGER REFERENCES pages(id),
  type TEXT,            -- critical, warning, info
  message TEXT,
  resolved BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME
);
```

### Table: publications

```sql
CREATE TABLE publications (
  id INTEGER PRIMARY KEY,
  site_id INTEGER REFERENCES sites(id),
  brief_id INTEGER REFERENCES briefs(id),
  commit_hash TEXT,
  files_modified TEXT,  -- JSON array
  deployed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📦 OBJETS DE DONNÉES

### Site

```json
{
  "id": 1,
  "name": "Mistral Pro Reno",
  "url": "https://www.mistralpro-reno.fr",
  "gsc_property": "sc-domain:mistralpro-reno.fr",
  "github_repo": "seoettia-collab/MistralPro-Reno",
  "active": true
}
```

### Page

```json
{
  "id": 1,
  "url": "/blog/cout-renovation-appartement-paris.html",
  "title": "Combien coûte une rénovation...",
  "description": "De 400€ à 2000€ le m²...",
  "h1": "Combien coûte une rénovation...",
  "word_count": 1250,
  "has_schema": true,
  "score": 85
}
```

### Requête GSC

```json
{
  "query": "prix rénovation appartement paris",
  "clicks": 45,
  "impressions": 1200,
  "ctr": 3.75,
  "position": 8.2,
  "date": "2026-03-08"
}
```

### Opportunité

```json
{
  "id": 1,
  "type": "creation_article",
  "priority": "fort",
  "title": "Article sur prix carrelage Paris",
  "target_keyword": "prix carrelage paris",
  "status": "pending"
}
```

### Contenu

```json
{
  "id": 1,
  "type": "article",
  "title": "Prix Carrelage Paris",
  "slug": "prix-carrelage-paris",
  "status": "draft",
  "target_keywords": ["prix carrelage paris", "carreleur paris"]
}
```

### Brief

```json
{
  "id": 1,
  "type": "creation",
  "title": "Créer article prix carrelage",
  "instructions": "## Objectif\nCréer un nouvel article...",
  "files_to_modify": ["blog/prix-carrelage-paris.html", "blog.html", "sitemap.xml"],
  "status": "validated"
}
```

---

## 🏷️ STATUTS CONTENU

| Statut | Description | Action suivante |
|--------|-------------|-----------------|
| `idea` | Idée générée ou proposée | Développer en brouillon |
| `draft` | Brouillon en cours | Valider |
| `validated` | Validé par Ricardo | Générer brief |
| `published` | Publié sur le site | Suivi performance |

---

## 🎯 TYPES D'ACTIONS

| Type | Description | Fichiers impactés |
|------|-------------|-------------------|
| `creation_article` | Nouvel article blog | blog/*.html, blog.html, sitemap.xml |
| `creation_page` | Nouvelle page service | *.html, sitemap.xml |
| `optimisation_page` | Améliorer page existante | *.html |
| `optimisation_article` | Améliorer article existant | blog/*.html |

---

## 📈 LOGIQUE SCORE SEO

### Calcul score global (0-100)

| Composante | Poids | Critères |
|------------|-------|----------|
| **Technique** | 30% | Title, meta, H1, schema, canonical, vitesse |
| **Contenu** | 40% | Longueur, mots-clés, maillage, images |
| **Autorité** | 30% | Positions GSC, clics, indexation |

### Scoring par critère

| Critère | OK | Warning | Erreur |
|---------|-----|---------|--------|
| Title | 50-60 chars | <50 ou >60 | Absent |
| Description | 150-160 chars | <150 ou >160 | Absent |
| H1 | 1 unique | >1 | Absent |
| Contenu | >800 mots | 400-800 | <400 |
| Images | Toutes avec alt | >50% avec alt | <50% |

---

## 🚨 LOGIQUE PRIORITÉ

| Priorité | Critères | Exemples |
|----------|----------|----------|
| 🔴 **Fort** | Impact immédiat, quick win | Mot-clé position 11-20, page désindexée |
| 🟠 **Moyen** | Impact moyen terme | Contenu ancien, maillage faible |
| 🟢 **Faible** | Nice to have | Optimisation mineure, veille |

---

## 💰 CONVERSIONS SUIVIES

| Conversion | Source | Tracking |
|------------|--------|----------|
| **Simulateur** | cost_calculator.html | Soumission formulaire |
| **Formulaire contact** | Popup devis | Soumission formulaire |
| **Page merci** | merci.html | Page vue |
| **Clic téléphone** | Lien tel: | Event GTM (si disponible) |

---

## 📦 DÉPENDANCES NPM

### Backend

```json
{
  "express": "^4.18.x",
  "better-sqlite3": "^9.x",
  "googleapis": "^130.x",
  "node-fetch": "^3.x",
  "cheerio": "^1.0.x",
  "cors": "^2.8.x",
  "dotenv": "^16.x",
  "helmet": "^7.x",
  "express-rate-limit": "^7.x"
}
```

### Frontend

```
Aucune dépendance npm (vanilla JS)
CDN uniquement : Chart.js
```

---

## 🔒 SÉCURITÉ MINIMUM

| Mesure | Implémentation |
|--------|----------------|
| noindex | Meta + Header |
| robots.txt | Disallow /seo-dashboard/ |
| .htaccess | Basic auth |
| API key | Header X-API-Key |
| Secrets | .env (jamais commité) |
| Rate limiting | 100 req/min |
| CORS | Origine spécifique |

---

## ⚠️ POINTS D'ATTENTION MVP

| Point | Description |
|-------|-------------|
| **GSC quota** | 25 000 requêtes/jour max |
| **SQLite limites** | Pas de concurrent writes |
| **Crawl** | Respecter robots.txt externe |
| **Brief execution** | Manuel via Claude (pas automatisé) |
| **Multi-sites** | Structure prête, pas implémenté |

---

## 🚫 LIMITES MVP

| Limite | Raison | Évolution future |
|--------|--------|------------------|
| 1 site | MVP | Multi-sites V2 |
| Pas d'IA native | Coût | Intégration Claude API |
| Pas de notifs | Complexité | Email/Slack V2 |
| SQLite | Simple | PostgreSQL si scale |
| Crawl basique | MVP | Playwright pour JS |

---

*Dernière mise à jour : 8 mars 2026*
