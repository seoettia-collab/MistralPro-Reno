# 🔄 SESSION HANDOFF — Passation vers nouvelle conversation

**Date :** 18 avril 2026
**Auteur :** Claude (Ingénieur technique)
**Destination :** Nouvelle conversation Claude
**Priorité :** GSC-PIPELINE-01 puis AUDIT-COUNT-01

---

## 0. INSTRUCTIONS POUR LA NOUVELLE CONVERSATION

### 0.1 Démarrage obligatoire

```bash
# 1. Clone du repo (token dans SKILL projet)
cd /home/claude
git clone https://[TOKEN]@github.com/seoettia-collab/MistralPro-Reno.git
cd MistralPro-Reno

# 2. Git config
git config --global user.name "Ricardo ETTIA"
git config --global user.email "ricardoettiadocuments@gmail.com"
```

### 0.2 Lecture obligatoire (dans cet ordre)

1. `/docs/GOUVERNANCE.md` — Règles communication + identifiants [MODULE]-[CODE]-[N°]
2. `/docs/SESSION_HANDOFF.md` — **Ce document**
3. `/docs/FICHE_TECHNIQUE.md` — Infos clés projet
4. `/docs/SEO_DASHBOARD_FICHE_TECHNIQUE.md` — Infos dashboard

### 0.3 Format communication

Toujours respecter :
- **Bloc unique markdown** (\`\`\`)
- **Adressé** à GPT et Ricardo
- **Intitulé** : RAPPORT / FIX / DIRECTIVE / DEMANDE / CLÔTURE
- **Identifiant** : `[MODULE]-[CODE]-[NUMÉRO]`
- **Signé** : `— Claude`

---

## 1. ÉTAT ACTUEL DU PROJET (18 avril 2026)

### 1.1 Composants

| Composant | État | URL |
|-----------|------|-----|
| Site vitrine | ✅ Production | https://www.mistralpro-reno.fr |
| SEO Dashboard | ✅ Fonctionnel (protégé) | https://www.mistralpro-reno.fr/seo-dashboard/ |
| Backend API Vercel | ✅ Fonctionnel | https://mistral-pro-reno.vercel.app |
| Base Turso/LibSQL | ✅ Connectée | (via DATABASE_URL) |

### 1.2 Articles blog

6 articles publiés dans `/blog/` (hors TEMPLATE.html) :

1. `cout-renovation-appartement-paris.html` (pilier)
2. `degat-des-eaux-5-etapes.html`
3. `prix-renovation-appartement-paris-2026.html`
4. `prix-renovation-de-habitation-ile-de-france.html`
5. `prix-renovation-salle-de-bain-paris-2026.html`
6. `renovation-salle-de-bain-guide-prix.html`

### 1.3 Dernier commit

```
0597b77 feat(blog): Ajout article "Prix Rénovation Appartement Paris 2026..."
```

---

## 2. TRAVAUX RÉCENTS COMPLÉTÉS

### 2.1 Blog + Dashboard (session précédente)

- ✅ Bug apostrophes JS corrigé (`escapeHtml()`)
- ✅ Erreur 413 compression image (seuil 300Ko)
- ✅ Conflit `publishContent()` → renommé `publishContentById()`
- ✅ Doublons blog.html nettoyés + vérification active dans `blogIndex.js`
- ✅ Image article centrée (`.article-image` dans `blog.css`)
- ✅ Section "Mes Articles" ajoutée au Cockpit
- ✅ Fallback `parseArticlesFromBlogHtml()` fonctionnel

### 2.2 GSC Service Account (session courante)

- ✅ Service GSC réécrit pour Service Account (`seo-api/services/gsc.js`)
- ✅ Route `/api/gsc/test` ajoutée (`seo-api/routes/gsc.js`)
- ✅ Variable env : `google_service_account_json` (lowercase, Vercel rejette uppercase)
- ⏳ **EN ATTENTE** : Variable à configurer dans Vercel Settings → Environment Variables
- ⏳ **EN ATTENTE** : Test `/api/gsc/test` après redéploiement

---

## 3. PRIORITÉ #1 — GSC-PIPELINE-01 (À FINALISER)

### 3.1 Contexte

Directive GPT reçue le 18 avril :
> Brancher le SEO Dashboard sur Google Search Console pour remplacer les données fictives.

### 3.2 Ce qui est fait

✅ Google Cloud Console — projet `cool-furnace-480422-a5` ("Mistral Google Ads API")
✅ API Search Console activée
✅ Service Account créé : `seo-dashboard-gsc@cool-furnace-480422-a5.iam.gserviceaccount.com`
✅ Clé JSON téléchargée par Ricardo
✅ Service Account ajouté dans GSC avec accès "Intégral"
✅ Code backend modifié (Service Account au lieu de OAuth)
✅ Route `/api/gsc/test` créée
✅ Code poussé sur main (commit `f0bf7b3`)

### 3.3 Ce qui reste à faire

1. **Configurer variable Vercel** (Ricardo doit le faire)
   - Settings → Environment Variables → Add
   - Key : `google_service_account_json` (MINUSCULES OBLIGATOIRES)
   - Value : le JSON complet du Service Account
   - Environments : Production + Preview + Development
   - **IMPORTANT** : Faire un Redeploy après (Deployments → ... → Redeploy)

2. **Tester la connexion**
   ```bash
   curl "https://mistral-pro-reno.vercel.app/api/gsc/test" \
     -H "X-API-Key: mpr-seo-2026-secure-key"
   ```
   Résultat attendu : `{"status":"ok", "sites":[...]}`

3. **Tester le fetch des données**
   ```bash
   curl "https://mistral-pro-reno.vercel.app/api/gsc/fetch" \
     -H "X-API-Key: mpr-seo-2026-secure-key"
   ```

4. **Vérifier stockage Turso** :
   - Table `queries` (données agrégées)
   - Table `gsc_pages` (par page)
   - Table `page_queries` (croisement)
   - Table `query_daily` (historique journalier)

5. **Intégration Dashboard** :
   - Remplacer dans le Cockpit les données `localStorage` par l'API réelle
   - Modules impactés : Cockpit, Opportunités SEO, Recommandations IA
   - Vérifier que le scoring SEO utilise les vraies données

6. **Livrable final** (format gouvernance) :
   ```
   GSC-PIPELINE-01
   CLÔTURE — GSC connecté
   [Preuve données réelles + QA checklist]
   — Claude
   ```

### 3.4 Fichiers concernés

- `seo-api/services/gsc.js` — Service authentification + fetch
- `seo-api/routes/gsc.js` — Routes `/api/gsc/*`
- `seo-api/services/db.js` — Accès Turso
- `seo-dashboard/dashboard.js` — Intégration frontend

---

## 4. PRIORITÉ #2 — AUDIT-COUNT-01 (BUG À CORRIGER)

### 4.1 Problème

Dans `seo-dashboard/dashboard.js`, fonction `prepareCockpitDataForAudit()` lignes **1035-1098** :

Le comptage de `contenu.live` utilise **3 sources en cascade**, ce qui rend le résultat fragile :

```javascript
liveContentsCount =
  scannedBlogPages.length > 0            // Source 1 : siteScanData (peut être vide/périmé)
    ? scannedBlogPages.length
    : blogLinks.length > 0                // Source 2 : DOM actuel (dashboard n'a pas les liens blog !)
      ? blogLinks.length
      : contents.filter(c => ['deployed', 'published', 'live'].includes(c.status)).length; // Source 3 : DB
```

**Résultat :** L'audit IA affiche souvent `0 article` même quand des articles existent réellement.

### 4.2 Solution proposée

**Une seule source fiable** : `blog.html` en production (même méthode que "Mes Articles").

```javascript
async function prepareCockpitDataForAudit() {
  // ...

  // UNE SEULE SOURCE : blog.html live (vérité terrain)
  const articles = await parseArticlesFromBlogHtml();
  const liveContentsCount = articles.length;

  // contents = brouillons encore non publiés
  const draftsCount = contents.filter(c =>
    !['deployed', 'published', 'live'].includes(c.status)
  ).length;

  return {
    contenu: {
      total: liveContentsCount + draftsCount,
      live: liveContentsCount,
      en_attente: draftsCount
    },
    // ...
  };
}
```

### 4.3 Impact à vérifier

- `prepareCockpitDataForAudit()` devient **async**
- Vérifier tous les appels : doivent utiliser `await`
- Chercher : `grep -n "prepareCockpitDataForAudit" seo-dashboard/dashboard.js`

### 4.4 Livrable

```
AUDIT-COUNT-01
CLÔTURE — Simplification comptage articles
[Avant/après + preuve fonctionnement]
— Claude
```

---

## 5. DOCUMENTS DE RÉFÉRENCE

| Document | Chemin | Description |
|----------|--------|-------------|
| GOUVERNANCE | `/docs/GOUVERNANCE.md` | Règles communication |
| FICHE_TECHNIQUE | `/docs/FICHE_TECHNIQUE.md` | Infos site vitrine |
| ARCHITECTURE | `/docs/ARCHITECTURE.md` | Structure technique |
| DASHBOARD_ARCHI | `/docs/SEO_DASHBOARD_ARCHITECTURE.md` | Architecture dashboard |
| DASHBOARD_TECH | `/docs/SEO_DASHBOARD_FICHE_TECHNIQUE.md` | Détails dashboard |
| DASHBOARD_CHECK | `/docs/SEO_DASHBOARD_CHECKLIST.md` | Phases LOT 1-4 |
| SIMULATEUR | `/docs/SIMULATEUR.md` | Simulateur devis v10.8 |
| ARCHITECTURE_V2 | `/docs/ARCHITECTURE_SEO_V2.md` | Cible 3 onglets (Cockpit / Audit / Studio) |

---

## 6. INFOS TECHNIQUES CLÉS

### 6.1 Identifiants

| Élément | Valeur |
|---------|--------|
| Repo GitHub | `seoettia-collab/MistralPro-Reno` |
| Branche | `main` |
| Backend Vercel | `https://mistral-pro-reno.vercel.app` |
| API Key | `X-API-Key: mpr-seo-2026-secure-key` |
| GCP Project | `cool-furnace-480422-a5` |
| GSC Service Account | `seo-dashboard-gsc@cool-furnace-480422-a5.iam.gserviceaccount.com` |

### 6.2 Variables d'environnement Vercel

⚠️ **TOUTES EN MINUSCULES** (Vercel rejette majuscules)

| Variable | Statut |
|----------|--------|
| `google_service_account_json` | ⏳ À configurer (Priorité #1) |
| `github_token` | ✅ Configuré |
| `anthropic_api_key` | ✅ Configuré |
| `turso_database_url` | ✅ Configuré |
| `turso_auth_token` | ✅ Configuré |

### 6.3 Règles de travail

1. **Toujours attendre la validation Ricardo** avant exécution
2. **Proposer** la correction en premier, **expliquer** les impacts
3. **Format rapport** : bloc markdown, adressé, identifiant, signé
4. **Node --check** avant chaque commit
5. **Commit descriptif** avec référence `[MODULE]-[CODE]-[N°]`
6. **Push automatique** déclenche redéploiement Vercel (~45s)

---

## 7. CHECKLIST DÉMARRAGE NOUVELLE CONVERSATION

Dès que la nouvelle conversation s'ouvre :

```
[ ] Lire SESSION_HANDOFF.md (ce document)
[ ] Lire GOUVERNANCE.md
[ ] git clone du repo
[ ] Vérifier dernier commit sur main
[ ] Envoyer accusé de réception format gouvernance à GPT et Ricardo
[ ] Proposer plan d'action GSC-PIPELINE-01 (Priorité #1)
[ ] Attendre validation Ricardo avant toute exécution
```

---

## 8. MESSAGE D'OUVERTURE SUGGÉRÉ (pour nouvelle conversation)

Ricardo peut copier-coller ceci pour démarrer :

```
Claude, nouvelle session de travail MistralPro-Reno.

Lis d'abord /docs/SESSION_HANDOFF.md pour la passation complète.
Puis /docs/GOUVERNANCE.md pour les règles.

Priorité #1 : finaliser GSC-PIPELINE-01
Priorité #2 : corriger AUDIT-COUNT-01

Confirme réception au format gouvernance.
— Ricardo
```

---

*Document généré le 18 avril 2026 par Claude — Session de passation*
