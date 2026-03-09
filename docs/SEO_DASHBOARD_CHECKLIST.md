# ✅ CHECKLIST — Mistral SEO Dashboard

> **Checklist d'exécution** — Procédures pour construire et publier le dashboard SEO.

---

## 📋 PHASES DU PROJET

| Phase | Nom | Statut |
|-------|-----|--------|
| **LOT 1** | Infrastructure & Dashboard | ✅ TERMINÉ |
| **LOT 2** | Production & Automatisation SEO | 🔵 PHASE ACTIVE |
| **LOT 3** | Stabilisation & Sécurité | ⚪ À venir |
| **LOT 4** | Expansion marketing (Facebook, etc.) | ⚪ À venir |

### LOT 1 — Infrastructure & Dashboard ✅

```
✅ Structure frontend (HTML/CSS/JS)
✅ Backend API (Node.js + Express)
✅ Base de données (Turso/LibSQL)
✅ Intégration Google Search Console
✅ Déploiement Vercel (backend)
✅ Déploiement OVH (frontend)
✅ 11/11 onglets fonctionnels
✅ Documentation technique synchronisée
✅ QA Console JS validé
```

### LOT 2 — Production & Automatisation SEO 🔵

**Objectif** : Exploiter le dashboard pour produire du contenu SEO et optimiser le site.

```
□ Exploitation données Google Search Console
□ Détection opportunités SEO
□ Génération idées contenus
□ Génération briefs Claude
□ Optimisation pages existantes
□ Suivi conversions
□ Création articles via Auto SEO Executor
□ Publication et déploiement automatisé
```

### LOT 3 — Stabilisation & Sécurité

```
□ Sécurisation appels API (fallback si erreur)
□ Optimisation chargement modules
□ Rate limiting avancé
□ Monitoring erreurs
□ Backup automatique base de données
```

### LOT 4 — Expansion marketing

```
□ Module Facebook Visibility
□ Module IA Conversations (leads formulaire)
□ Monitoring SEO automatisé
□ Alertes email/Slack
```

---

## A. CHECKLIST DÉMARRAGE PROJET

### Environnement

```
□ Clone repo MistralPro-Reno
□ Lecture docs/SEO_DASHBOARD_ARCHITECTURE.md
□ Lecture docs/SEO_DASHBOARD_FICHE_TECHNIQUE.md
□ Lecture docs/GOUVERNANCE.md
□ Vérification Node.js installé (v18+)
□ Vérification npm installé
```

### Gouvernance

```
□ Confirmation rôles :
  - Ricardo = Décideur / Validation
  - GPT = Architecture / Cadrage
  - Claude = Implémentation / Git push
□ Format rapport validé
□ Circuit validation brief compris
```

### Accès externes

```
□ Accès Google Search Console vérifié
□ Property GSC : sc-domain:mistralpro-reno.fr
□ OAuth 2.0 configuré (credentials.json)
□ Accès GitHub repo vérifié
□ Token GitHub disponible
```

### Variables serveur

```
□ .env préparé avec :
  - GSC_CLIENT_ID
  - GSC_CLIENT_SECRET
  - GSC_REFRESH_TOKEN
  - API_KEY
  - HTPASSWD_USER
  - HTPASSWD_PASS
□ Secrets non commités (.gitignore)
```

---

## B. CHECKLIST BUILD MVP

### B.1 Structure frontend

```
□ Créer dossier /seo-dashboard/
□ Créer index.html (structure 7 onglets)
□ Créer css/variables.css
□ Créer css/style.css
□ Créer css/responsive.css
□ Créer js/config.js
□ Créer js/state.js
□ Créer js/api.js
□ Créer js/navigation.js
□ Créer js/cockpit.js
□ Créer js/searchconsole.js
□ Créer js/opportunities.js
□ Créer js/content.js
□ Créer js/audit.js
□ Créer js/conversions.js
□ Créer js/brief.js
□ Créer robots.txt (Disallow: /)
□ Ajouter meta noindex
```

### B.2 Structure backend

```
□ Créer dossier /seo-api/
□ Initialiser package.json
□ Installer dépendances (express, better-sqlite3, etc.)
□ Créer server.js
□ Créer .env.example
□ Créer routes/gsc.routes.js
□ Créer routes/audit.routes.js
□ Créer routes/content.routes.js
□ Créer routes/opportunities.routes.js
□ Créer routes/brief.routes.js
□ Créer routes/conversions.routes.js
□ Créer services/gsc.service.js
□ Créer services/crawler.service.js
□ Créer services/analyzer.service.js
□ Créer services/scorer.service.js
□ Créer services/brief.service.js
□ Créer models/database.js
□ Créer utils/auth.js
□ Créer utils/helpers.js
```

### B.3 Base SQLite

```
□ Créer dossier /data/
□ Initialiser seo.db
□ Créer table sites
□ Créer table pages
□ Créer table queries
□ Créer table audits
□ Créer table opportunities
□ Créer table contents
□ Créer table competitors
□ Créer table briefs
□ Créer table alerts
□ Créer table publications
□ Insérer site pilote (MPR)
```

### B.4 Routes API

```
□ GET /api/health
□ Routes GSC :
  - GET /api/gsc/queries
  - GET /api/gsc/pages
  - POST /api/gsc/sync
□ Routes audit :
  - GET /api/audit/pages
  - GET /api/audit/page/:url
  - POST /api/audit/run
  - GET /api/audit/score
□ Routes opportunités :
  - GET /api/opportunities
  - PATCH /api/opportunities/:id
□ Routes contenu :
  - GET /api/content
  - POST /api/content
  - PATCH /api/content/:id
□ Routes briefs :
  - GET /api/briefs
  - POST /api/briefs
  - PATCH /api/briefs/:id/status
□ Routes conversions :
  - GET /api/conversions
```

### B.5 Intégration GSC

```
□ OAuth 2.0 flow implémenté
□ Récupération token refresh
□ Appel searchAnalytics.query
□ Parsing réponse GSC
□ Stockage SQLite
□ Sync journalier (cron ou manuel)
```

### B.6 Crawl site

```
□ Service crawler fonctionnel
□ Récupération HTML pages
□ Extraction title
□ Extraction meta description
□ Extraction H1
□ Extraction liens internes
□ Extraction images
□ Comptage mots
□ Détection schema.org
□ Stockage résultats
```

### B.7 Calcul score SEO

```
□ Score technique (30%)
□ Score contenu (40%)
□ Score autorité (30%)
□ Score global calculé
□ Score par page calculé
□ Historique scores
```

### B.8 Opportunités

```
□ Détection automatique opportunités
□ Classification par priorité
□ Association mot-clé cible
□ Gestion statuts
□ Filtrage par type/priorité
```

### B.9 Contenu

```
□ Liste contenus (idées → publiés)
□ Création contenu manuel
□ Génération structure article
□ Gestion statuts workflow
□ Association opportunité
```

### B.10 Briefs Claude

```
□ Génération brief automatique
□ Format markdown
□ Liste fichiers à modifier
□ Statuts workflow
□ Historique briefs
```

### B.11 Historique

```
□ Historique audits
□ Historique positions GSC
□ Historique publications
□ Graphiques évolution
```

### B.12 Alertes

```
□ Création alertes automatiques
□ Types : critical, warning, info
□ Affichage cockpit
□ Marquage résolu
```

---

## C. CHECKLIST SÉCURITÉ

### Protection accès

```
□ Meta noindex sur toutes les pages
□ Header X-Robots-Tag: noindex
□ robots.txt : Disallow: /seo-dashboard/
□ robots.txt : Disallow: /seo-api/
□ .htaccess protection mot de passe
□ .htpasswd généré (hors repo)
```

### Secrets

```
□ .env créé avec tous les secrets
□ .env dans .gitignore
□ .env.example sans valeurs sensibles
□ Aucun secret côté frontend
□ API key validée côté serveur
```

### API

```
□ Middleware auth sur toutes les routes
□ Header X-API-Key requis
□ Rate limiting activé (100 req/min)
□ CORS configuré (origine spécifique)
□ Helmet activé (headers sécurité)
```

### Git

```
□ Pas de secrets dans les commits
□ Pas de .env commité
□ Pas de credentials.json commité
□ Revue code avant push
```

---

## D. CHECKLIST TESTS

### Tests frontend

```
□ Navigation entre onglets
□ Affichage cockpit
□ Affichage données GSC
□ Affichage opportunités
□ Affichage contenus
□ Affichage audits
□ Affichage conversions
□ Génération brief
□ Responsive mobile
```

### Tests API

```
□ GET /api/health → 200
□ Routes sans auth → 401
□ Routes avec auth → 200
□ Toutes les routes GET
□ Toutes les routes POST
□ Toutes les routes PATCH
□ Gestion erreurs 404
□ Gestion erreurs 500
```

### Tests base de données

```
□ Connexion SQLite OK
□ INSERT fonctionne
□ SELECT fonctionne
□ UPDATE fonctionne
□ DELETE fonctionne
□ Contraintes FK respectées
□ Index performants
```

### Tests intégration GSC

```
□ Auth OAuth OK
□ Récupération données OK
□ Parsing données OK
□ Stockage données OK
□ Gestion erreurs quota
□ Gestion token expiré
```

### Tests crawl

```
□ Crawl page unique OK
□ Crawl site complet OK
□ Extraction données OK
□ Respect robots.txt
□ Gestion erreurs 404
□ Gestion timeout
```

### Tests scoring

```
□ Score technique calculé
□ Score contenu calculé
□ Score autorité calculé
□ Score global cohérent
□ Historique enregistré
```

### Tests brief

```
□ Génération brief OK
□ Format markdown OK
□ Fichiers listés OK
□ Statuts fonctionnels
```

### Tests alertes

```
□ Création alerte OK
□ Affichage alerte OK
□ Résolution alerte OK
□ Types corrects
```

### Tests flux git

```
□ Brief validé → instructions claires
□ Instructions exécutables par Claude
□ Commit message format OK
□ Push déclenche Actions
```

---

## E. CHECKLIST PRÉ-PRODUCTION

### Revue UX

```
□ Navigation intuitive
□ Données lisibles
□ Actions claires
□ Feedback utilisateur
□ Temps de chargement OK
□ Mobile fonctionnel
```

### Cohérence données

```
□ Données GSC récentes
□ Données audit à jour
□ Opportunités pertinentes
□ Scores cohérents
□ Alertes justifiées
```

### Cohérence scoring

```
□ Score global réaliste
□ Évolution logique
□ Comparaison pages OK
□ Priorités pertinentes
```

### Contrôle sécurité

```
□ Pas de fuite secrets
□ Auth fonctionne
□ Rate limiting actif
□ Headers sécurité OK
```

### Test site pilote

```
□ Données MPR correctes
□ Audit MPR OK
□ Opportunités MPR détectées
□ Score MPR cohérent
```

### Validation Ricardo

```
□ Présentation dashboard
□ Explication fonctionnalités
□ Validation workflow brief
□ Accord déploiement
```

---

## F. CHECKLIST PUBLICATION

### Préparation

```
□ Code reviewé
□ Tests passés
□ Documentation à jour
□ .env production prêt
□ Backup base si existante
```

### Déploiement

```
□ Upload /seo-dashboard/
□ Upload /seo-api/
□ Upload /data/seo.db (vide ou seed)
□ Configuration .htaccess
□ Configuration .htpasswd
□ Variables env serveur
□ Démarrage backend
```

### Vérification

```
□ URL dashboard accessible
□ Auth fonctionne
□ API répond
□ Données affichées
□ Pas d'erreurs console
```

### Rapport final (format gouvernance)

```
À l'attention de GPT et Claude,

RAPPORT — [Description]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FICHIERS MODIFIÉS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- fichier1 : Description
- fichier2 : Description

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPACT TECHNIQUE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Point 1
- Point 2

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STATUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Production-ready — Push effectué

CLÔTURE — [Description]

— Claude
```

---

## G. CHECKLIST MAINTENANCE

### Quotidien (automatisé)

```
□ Sync données GSC
□ Vérification alertes
□ Backup base
```

### Hebdomadaire

```
□ Revue opportunités
□ Audit nouvelles pages
□ Mise à jour scores
```

### Mensuel

```
□ Revue performances
□ Nettoyage données anciennes
□ Mise à jour dépendances
□ Revue sécurité
```

---

## H. CHECKLIST QA — SCAN CONSOLE JS

> **Objectif** : Vérifier l'absence d'erreurs JavaScript avant chaque déploiement majeur.

### H.1 Vérification syntaxe JS

```bash
# Depuis le dossier seo-dashboard/
node --check dashboard.js
```

**Résultat attendu** : Aucune erreur

### H.2 Vérification fonctions onclick HTML

```bash
# Lister fonctions onclick dans index.html
grep -o "onclick=\"[a-zA-Z]*(" index.html | sed 's/onclick="\([a-zA-Z]*\)(/\1/' | sort -u

# Vérifier chaque fonction est exposée sur window
grep "window.nomFonction" dashboard.js
```

**Critère** : Toutes les fonctions onclick doivent être exposées sur `window`.

### H.3 Vérification fonctions onclick dynamiques

```bash
# Lister fonctions onclick générées dans dashboard.js
grep -o "onclick=\"[a-zA-Z]*(" dashboard.js | sed 's/onclick="\([a-zA-Z]*\)(/\1/' | sort -u

# Vérifier exposition
grep "window.nomFonction" dashboard.js
```

**Critère** : Toutes les fonctions générées dynamiquement doivent être sur `window`.

### H.4 Vérification endpoints API

```bash
# Tester endpoints principaux
curl -s -o /dev/null -w "%{http_code}" "https://mistral-pro-reno.vercel.app/api/health"
curl -s -o /dev/null -w "%{http_code}" "https://mistral-pro-reno.vercel.app/api/stats"
# etc.
```

**Critère** : Tous les endpoints doivent retourner 200.

### H.5 Vérification console navigateur

```
□ Ouvrir le dashboard dans Chrome/Firefox
□ Ouvrir DevTools (F12) → Console
□ Naviguer sur tous les onglets
□ Cliquer sur tous les boutons d'action
□ Aucune erreur ReferenceError
□ Aucune erreur TypeError
□ Aucune erreur réseau (sauf 404 favicon)
```

### H.6 Rapport QA Console JS

Format de rapport :

```
=== AUDIT CONSOLE JS ===
Date : [date]
Version : [commit hash]

SYNTAXE JS : ✅ OK / ❌ Erreur
FONCTIONS HTML : ✅ X/X exposées / ❌ Manquantes: [liste]
FONCTIONS DYNAMIQUES : ✅ X/X exposées / ❌ Manquantes: [liste]
ENDPOINTS API : ✅ X/X répondent 200 / ❌ Erreurs: [liste]
CONSOLE NAVIGATEUR : ✅ Aucune erreur / ❌ Erreurs: [liste]

STATUT FINAL : ✅ VALIDÉ / ❌ À CORRIGER
```

### H.7 Quand effectuer ce scan

```
□ Fin de chaque lot de développement
□ Avant déploiement majeur
□ Après correction de bugs critiques
□ Après ajout de nouvelles fonctionnalités
□ Lors de la phase de stabilisation
```

---

*Dernière mise à jour : 9 mars 2026*
