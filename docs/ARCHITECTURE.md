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
├── blog.html (Blog)
│   ├── blog/cout-renovation-appartement-paris.html
│   ├── blog/degat-des-eaux-5-etapes.html
│   └── blog/renovation-salle-de-bain-guide-prix.html
├── cost_calculator.html (Simulateur devis)
├── degat-des-eaux.html (Landing urgence)
├── mentions-legales.html (Légal)
└── merci.html (Confirmation formulaire)
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

*Dernière mise à jour : 8 mars 2026*
