# 🏗️ ARCHITECTURE — Site Mistral Pro Reno

---

## 1. VUE D'ENSEMBLE

```
┌─────────────────────────────────────────────────────────────────┐
│                        UTILISATEUR                               │
│                    (navigateur web)                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      OVH HOSTING                                 │
│                   mistralpro-reno.fr                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    /www/                                   │  │
│  │  ├── index.html, services.html, projets.html, etc.        │  │
│  │  ├── /css/                                                 │  │
│  │  ├── /js/                                                  │  │
│  │  ├── /images/                                              │  │
│  │  ├── /fonts/                                               │  │
│  │  └── /blog/                                                │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ FTP Deploy
                              │
┌─────────────────────────────────────────────────────────────────┐
│                     GITHUB ACTIONS                               │
│                    (deploy.yml)                                  │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ Push main
                              │
┌─────────────────────────────────────────────────────────────────┐
│                       GITHUB                                     │
│              seoettia-collab/MistralPro-Reno                    │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ Git push
                              │
┌─────────────────────────────────────────────────────────────────┐
│                   DÉVELOPPEMENT                                  │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │   Claude        │    │   Local         │                     │
│  │   (clone repo)  │    │   Windows       │                     │
│  │   /home/claude/ │    │   C:\Mistral    │                     │
│  └─────────────────┘    └─────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. FLUX DE DÉPLOIEMENT

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Code    │────▶│  GitHub  │────▶│  Actions │────▶│   OVH    │
│  modifié │     │  Push    │     │  FTP     │     │  /www/   │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                                                   │
     │              Automatique (~2 min)                 │
     └───────────────────────────────────────────────────┘
```

### Étapes détaillées

1. **Modification code** (Claude ou local)
2. **Git commit** avec message descriptif
3. **Git push origin main**
4. **GitHub Actions** déclenche `deploy.yml`
5. **FTP Deploy** vers OVH `/www/`
6. **Site en ligne** mis à jour

---

## 3. STRUCTURE DES PAGES

### Navigation commune

```
┌─────────────────────────────────────────────────────────────────┐
│  TOP-BAR (téléphone, email, horaires)                           │
├─────────────────────────────────────────────────────────────────┤
│  HEADER (logo, navigation principale)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                       CONTENU PAGE                               │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  FOOTER (infos contact, liens, réseaux)                         │
└─────────────────────────────────────────────────────────────────┘
```

### Hiérarchie des pages

```
index.html (Accueil)
├── services.html (Services)
├── projets.html (Réalisations)
├── blog.html (Blog — liste des articles)
│   ├── blog/cout-renovation-appartement-paris.html (PILIER)
│   ├── blog/degat-des-eaux-5-etapes.html
│   ├── blog/prix-renovation-appartement-paris-2026.html
│   ├── blog/prix-renovation-de-habitation-ile-de-france.html
│   ├── blog/prix-renovation-salle-de-bain-paris-2026.html
│   └── blog/renovation-salle-de-bain-guide-prix.html
├── cost_calculator.html (Simulateur devis)
├── degat-des-eaux.html (Landing urgence)
├── mentions-legales.html (Légal)
├── merci.html (Confirmation formulaire)
└── 404.html (Erreur)
```

**Dashboard SEO interne** (non indexé, protégé) :

```
seo-dashboard/ (OVH, protégé par .htaccess)
└── Backend API Vercel : mistral-pro-reno.vercel.app
```

---

## 4. INTÉGRATIONS EXTERNES

### Google Tag Manager (GTM)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   GTM       │────▶│    GA4      │────▶│  Analytics  │
│GTM-5MZSVPL  │     │G-S4F06V2C5C │     │  Dashboard  │
└─────────────┘     └─────────────┘     └─────────────┘
       │
       ▼
┌─────────────┐
│ Google Ads  │
│ 792-943-0550│
└─────────────┘
```

### Implémentation GTM

```html
<!-- HEAD -->
<script>(function(w,d,s,l,i){...})(window,document,'script','dataLayer','GTM-5MZSVPL');</script>

<!-- BODY (début) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5MZSVPL"...></iframe></noscript>
```

---

## 5. ARCHITECTURE CSS

```
css/
├── variables.css      ◀── Variables (couleurs, fonts) — charger EN PREMIER
├── base.css           ◀── Reset, styles de base
├── style.css          ◀── Styles principaux du site
├── blog.css           ◀── Styles page blog
├── cost_calculator.css ◀── Simulateur de devis
├── modals.css         ◀── Fenêtres modales
├── toast.css          ◀── Notifications
├── lecture.css        ◀── Vue lecture
└── responsive.css     ◀── Media queries — charger EN DERNIER
```

### Ordre de chargement recommandé

```html
<link rel="stylesheet" href="css/variables.css">
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/style.css">
<link rel="stylesheet" href="css/[page-specific].css">
<link rel="stylesheet" href="css/responsive.css">
```

---

## 6. ARCHITECTURE JS

### Site vitrine

```
js/
├── main.js             ◀── Script principal (navigation, animations)
└── cost_calculator.js  ◀── Logique simulateur de devis + envoi backend
```

### Dashboard Google Ads (intégré)

```
js/
├── config.js           ◀── Configuration API
├── state.js            ◀── État global
├── init.js             ◀── Initialisation
├── api.js              ◀── Appels API backend
├── navigation.js       ◀── Navigation onglets
├── analyse.js          ◀── Vue analyse
├── cockpit.js          ◀── Vue cockpit
├── searchterms.js      ◀── Search terms
├── history.js          ◀── Historique
├── modals.js           ◀── Modales
├── toast.js            ◀── Notifications
├── classification.js   ◀── Règles métier BTP
├── storage-recos.js    ◀── LocalStorage recos
└── storage-searchterms.js ◀── LocalStorage search terms
```

---

## 7. FLUX SIMULATEUR DEVIS & EMAIL

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Simulateur   │────▶│ JS fetch()   │────▶│ Backend      │────▶│ SMTP OVH     │
│ cost_calc.   │     │ POST JSON    │     │ Render.com   │     │ ssl0.ovh.net │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                       │
                                                                       ▼
                                                              ┌──────────────┐
                                                              │ contact@     │
                                                              │ mistralpro-  │
                                                              │ reno.fr      │
                                                              └──────────────┘
```

### Backend API — Mistral Pro Reno

| Élément | Valeur |
|---------|--------|
| Repo GitHub | `seoettia-collab/mistralpro-reno-backend` |
| Hébergement | Render.com (Free tier) |
| URL | `https://mistralpro-reno-backend.onrender.com` |
| Endpoint | `POST /api/send-devis` |
| SMTP | OVH Zimbra (`ssl0.ovh.net:465`) |
| Email | `contact@mistralpro-reno.fr` |

### Payload envoyé

```json
{
  "nom": "Jean Dupont",
  "telephone": "06 12 34 56 78",
  "email": "client@exemple.fr",
  "adresse": "12 rue Example",
  "code_postal": "75017",
  "ville": "Paris",
  "numero_devis": "DEV-20260308-1234",
  "date_devis": "08/03/2026",
  "total_ht": 5000,
  "tva": 1000,
  "total_ttc": 6000,
  "prestations_texte": "Détail des prestations...",
  "form_name": "simulateur-devis",
  "form_location": "cost_calculator",
  "page_url": "https://www.mistralpro-reno.fr/cost_calculator.html"
}
```

---

## 8. PERFORMANCE

### Optimisations en place

| Technique | Statut |
|-----------|--------|
| Images WebP | ✅ |
| Lazy loading | ✅ |
| Fonts WOFF2 | ✅ |
| GTM async | ✅ |
| Minification CSS/JS | ❌ À faire |
| Compression GZIP | ✅ (OVH) |

### Métriques cibles (GTmetrix)

| Métrique | Cible |
|----------|-------|
| Performance | > 90% |
| Structure | > 90% |
| LCP | < 2.5s |
| CLS | < 0.1 |
| TBT | < 200ms |

---

## 9. SÉCURITÉ

### Headers recommandés (.htaccess)

```apache
# Sécurité
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "SAMEORIGIN"
Header set X-XSS-Protection "1; mode=block"

# Cache
<FilesMatch "\.(ico|jpg|jpeg|png|gif|webp|woff2)$">
  Header set Cache-Control "max-age=31536000, public"
</FilesMatch>
```

---

## 10. ENVIRONNEMENTS

| Environnement | URL | Usage |
|---------------|-----|-------|
| Production | https://www.mistralpro-reno.fr | Site public |
| Local Windows | C:\Mistral Logiciel\site-mistralpro-reno | Dev Ricardo |
| Claude | /home/claude/MistralPro-Reno | Dev Claude |

---

## 11. SEO ENGINE — SITE WEB

### Structure du blog

```
blog.html (Liste des articles)
└── /blog/
    ├── cout-renovation-appartement-paris.html (PILIER)
    ├── degat-des-eaux-5-etapes.html
    ├── prix-renovation-appartement-paris-2026.html
    ├── prix-renovation-de-habitation-ile-de-france.html
    ├── prix-renovation-salle-de-bain-paris-2026.html
    ├── renovation-salle-de-bain-guide-prix.html
    └── TEMPLATE.html (modèle pour Studio SEO)
```

**6 articles publiés** (au 18 avril 2026).
Les articles sont générés automatiquement par le Studio SEO
du Dashboard (voir section 12).

### Cluster SEO "Coût des Travaux"

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLUSTER "RÉNOVATION PARIS"                    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              ARTICLE PILIER                               │   │
│  │     cout-renovation-appartement-paris.html               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│        ┌─────────────────────┼─────────────────────┐            │
│        ▼                     ▼                     ▼            │
│  ┌──────────┐         ┌──────────┐         ┌──────────┐        │
│  │ Prix m²  │         │ Cuisine  │         │ SdB      │        │
│  └──────────┘         └──────────┘         └──────────┘        │
│        │                     │                     │            │
│        ▼                     ▼                     ▼            │
│  ┌──────────┐         ┌──────────┐         ┌──────────┐        │
│  │ Électric.│         │ Peinture │         │ Isolation│        │
│  └──────────┘         └──────────┘         └──────────┘        │
│                                                                  │
│                    ┌──────────────────┐                         │
│                    │  CONVERSIONS     │                         │
│                    │  ───────────────│                         │
│                    │  services.html   │                         │
│                    │  cost_calculator │                         │
│                    │  degat-des-eaux  │                         │
│                    └──────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

### Logique de maillage interne

| Depuis | Vers | Objectif |
|--------|------|----------|
| Chaque article | `services.html` | Découverte services |
| Chaque article | `cost_calculator.html` | Conversion |
| Articles pertinents | `degat-des-eaux.html` | Urgences |
| Articles liés | Autres articles du cluster | Autorité thématique |

### Point de conversion

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│   Article      │────▶│  Simulateur    │────▶│  Email devis   │
│   Blog SEO     │     │  cost_calc.    │     │  + Notification│
└────────────────┘     └────────────────┘     └────────────────┘
```

### Schema.org implémentés

| Page | Type Schema | Données |
|------|-------------|---------|
| `index.html` | HomeAndConstructionBusiness | Nom, adresse, téléphone, horaires |
| `services.html` | Service + FAQPage | Services, areaServed: Paris, 3 FAQ |
| `blog.html` | Blog | Liste articles |
| `blog/*.html` | Article + BreadcrumbList | Titre, date, auteur, fil d'Ariane |
| `cost_calculator.html` | WebApplication | Application gratuite |
| `degat-des-eaux.html` | Service | Service urgence |
| `projets.html` | CollectionPage | Portfolio réalisations |

### Fichiers SEO

| Fichier | Contenu | Articles |
|---------|---------|----------|
| `sitemap.xml` | Plan du site | 6 articles blog publiés |
| `robots.txt` | Directives crawlers | Sitemap déclaré, seo-dashboard disallowed |

---

## 12. SEO DASHBOARD — APPLICATION OPÉRATIONNELLE

### Statut : LOT 1 ✅ TERMINÉ — LOT 2 🔵 EN COURS

Le SEO Dashboard est une application interne opérationnelle permettant
l'analyse et l'optimisation SEO automatisée du site.

```
┌─────────────────────────────────────────────────────────────────┐
│                    SEO DASHBOARD (LOT 1 ✅)                      │
│                                                                  │
│  Frontend : /seo-dashboard/ (OVH, protégé)                      │
│  Backend  : https://mistral-pro-reno.vercel.app (API)           │
│  DB       : Turso/LibSQL                                        │
│  Source   : Google Search Console API (Service Account)         │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ 🏠 Cockpit   │  │ 🤖 Audit IA  │  │ 🚀 Studio    │          │
│  │ SEO          │  │ Décisionnel  │  │ SEO IA       │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  + Scan SEO automatique                                         │
│  + Analyse concurrentielle                                      │
│  + Génération articles via Claude                               │
│  + Publication GitHub API → blog.html                           │
└─────────────────────────────────────────────────────────────────┘
```

### Architecture réelle

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Frontend       │────▶│  Backend API    │────▶│  Google Search  │
│  dashboard.js   │     │  Node.js        │     │  Console API    │
│  (HTML/CSS/JS)  │     │  Express        │     │  (Service Acc.) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ├──────────▶ Anthropic Claude API
                               │            (Audit IA + génération)
                               │
                               ├──────────▶ GitHub API
                               │            (publication articles)
                               │
                               ▼
                        ┌─────────────────┐
                        │  Base Turso     │
                        │  (LibSQL)       │
                        └─────────────────┘
```

### Modules opérationnels

| Module | Statut | Fonction |
|--------|--------|----------|
| **Cockpit SEO** | ✅ | Vue synthétique, KPIs, alertes, score global |
| **Audit IA** | ✅ | Diagnostic Claude, forces/faiblesses, décisions |
| **Studio SEO** | ✅ | Génération + publication articles |
| **Scan SEO** | ✅ | Audit technique automatique du site |
| **GSC Pipeline** | ✅ | Import réel Google Search Console |
| **Opportunités** | ✅ | Détection automatique mots-clés |
| **Concurrents** | ✅ | Suivi 4 concurrents directs |
| **Publication** | 🟡 | Fonctionne mais INSERT DB manquant (PUBLISHER-IMG-01) |

### Directives et historique

| Identifiant | Sujet | Statut |
|-------------|-------|--------|
| `GSC-PIPELINE-01` | Intégration GSC Service Account | ✅ 18/04/2026 |
| `AUDIT-COUNT-01` | Stabilisation compteur articles | ✅ 18/04/2026 |
| `PUBLISHER-IMG-01` | Injection image + INSERT contents DB | 🔵 En cours |

### Documentation dédiée

Pour les détails du Dashboard, consulter :
- `/docs/SEO_DASHBOARD_ARCHITECTURE.md` — Architecture technique
- `/docs/SEO_DASHBOARD_FICHE_TECHNIQUE.md` — Routes API, modules
- `/docs/SEO_DASHBOARD_CHECKLIST.md` — Avancement LOT 1-4
- `/docs/ARCHITECTURE_SEO_V2.md` — Cible 3 onglets
- `/docs/SESSION_HANDOFF.md` — Passation entre sessions

---

## 13. GESTION DES HANDLERS UI — SEO DASHBOARD

### Principe

Le SEO Dashboard utilise des fonctions JavaScript appelées via `onclick` dans le HTML statique ou généré dynamiquement. Pour fonctionner correctement, ces fonctions doivent être exposées sur l'objet global `window`.

### Exposition sur window

```javascript
// Fin de dashboard.js
window.maFonction = maFonction;
```

**Règle** : Toute fonction appelée via `onclick="nomFonction()"` doit être exposée sur `window`.

### Liste des fonctions exposées (v1.0 stable)

| Catégorie | Fonctions |
|-----------|-----------|
| **Navigation** | `toggleContentForm`, `toggleCompetitorForm`, `toggleQaPanel` |
| **GSC** | `importGscData`, `changeHistoryFilter`, `loadHistoryData` |
| **Contenu** | `submitContent`, `updateContentStatus`, `loadSEOCandidates`, `refreshContentIdeas` |
| **Éditorial** | `generateEditorialPlan`, `showContentDetails`, `closeContentDetails` |
| **Briefs** | `viewBrief`, `viewBriefDetail`, `closeBriefDetail`, `generatePublicationBrief`, `copyBriefToClipboard` |
| **SEO Executor** | `previewSEO`, `executeSingleSEO`, `executeAllSEO`, `closeSEOPreview`, `checkQuality`, `loadQualityBadge` |
| **Optimisation** | `generateOptimizationBrief`, `copyOptimizationBrief`, `closeOptimizationBrief` |
| **Pages** | `refreshPagesAnalysis` |
| **Audit** | `runAudit`, `runCrawl` |
| **Concurrents** | `submitCompetitor`, `deleteCompetitor` |
| **Idées** | `saveContentIdea`, `saveContentIdeaByIndex` |
| **QA** | `updateQaProgress` |
| **Utilitaires** | `escapeHtml` |

### Audit et maintenance

Avant chaque déploiement majeur, vérifier :

```bash
# Lister fonctions onclick dans HTML
grep -o "onclick=\"[a-zA-Z]*(" index.html | sort -u

# Lister fonctions onclick générées dans JS
grep -o "onclick=\"[a-zA-Z]*(" dashboard.js | sort -u

# Vérifier exposition window
grep "window\." dashboard.js | grep -v "//"
```

**Erreur typique** : `ReferenceError: nomFonction is not defined`
**Solution** : Ajouter `window.nomFonction = nomFonction;` en fin de fichier.

---

*Dernière mise à jour : 18 avril 2026 — SEO Dashboard opérationnel, 6 articles publiés*
