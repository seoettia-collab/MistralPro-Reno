# ARCHITECTURE SEO DASHBOARD V2

**Document d'analyse et proposition**  
**Date :** 9 mars 2026  
**Auteur :** Claude (Ingénieur technique)

---

## 1. ANALYSE DU FACEBOOK ADS DASHBOARD

### 1.1 Organisation des modules

Le Facebook Ads Dashboard sépare clairement :

| Module | Fichier | Rôle |
|--------|---------|------|
| **Cockpit** | `cockpit.js` | Vue synthétique avec KPIs, alertes, score global |
| **IA Recommandations** | `ai-recommendations.js` | Analyse IA des performances → actions exécutables |
| **Studio Pub** | `ai-creation.js` | Génération IA (texte + image) + prévisualisation |
| **Publication** | `publish.js` | Prévisualisation live + publication Facebook |

### 1.2 Logique du pipeline Studio Pub

```
PARAMÈTRES (thème, ton, audience, style)
    ↓
GÉNÉRATION TEXTE (Claude)
    → headline, primary_text, description, variantes, hashtags
    ↓
SÉLECTION VARIANTE
    → affichage "Version finale sélectionnée"
    ↓
OPTIONS IMAGE (type pièce, style, ambiance...)
    ↓
GÉNÉRATION IMAGE (DALL-E)
    → aperçu pub complète (mockup Facebook)
    ↓
PUBLICATION
    → preview live + envoi Facebook API
```

### 1.3 Structure UI/UX

Le Studio Pub utilise une interface en **workflow vertical** :

1. **Bloc Paramètres** (en haut)
   - Formulaire avec sélecteurs (thème, ton, audience...)
   - Boutons "Générer texte" / "Générer tout"

2. **Bloc Résultats générés**
   - Cards cliquables pour sélectionner une variante
   - Bouton "Sélectionner" sur chaque variante

3. **Bloc Version finale**
   - Aperçu de la variante sélectionnée
   - Options image (type de visuel, catégorie, style...)
   - Bouton "Générer l'image"

4. **Bloc Publicité complète**
   - Mockup Facebook (aperçu réaliste)
   - Boutons : Régénérer / Télécharger / Copier / Publier

### 1.4 Flux de données

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                 │
├─────────────────────────────────────────────────────────────────┤
│  Formulaire → fetch('/api/ai/generate-content')                │
│       ↓                                                         │
│  cachedGeneratedContent = result.data                          │
│       ↓                                                         │
│  renderGeneratedContent(data, params)                          │
│       ↓                                                         │
│  selectVariant(index) → selectedVariantData                    │
│       ↓                                                         │
│  goToNextStep() → fetch('/api/ai/generate-image')              │
│       ↓                                                         │
│  cachedGeneratedImage = result.data                            │
│       ↓                                                         │
│  renderImageResult() → Mockup Facebook                         │
│       ↓                                                         │
│  goToPublish() → switchToView('publish')                       │
│       ↓                                                         │
│  publishToFacebook() → POST API Facebook                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. NOUVELLE ARCHITECTURE SEO DASHBOARD

### 2.1 Structure cible : 3 onglets

```
┌────────────────────────────────────────────────────────────────┐
│  🏠 COCKPIT SEO  │  📋 AUDIT IA  │  🚀 STUDIO SEO IA          │
└────────────────────────────────────────────────────────────────┘
```

### 2.2 ONGLET 1 — COCKPIT SEO

**Rôle :** Centraliser toutes les analyses et produire un score global.

**Sous-modules techniques (accordéons ou sections) :**

| Section | Source actuelle | Données |
|---------|-----------------|---------|
| Search Console | `/api/gsc/*` | Clics, impressions, position, CTR |
| Pages SEO | `/api/pages` | État des pages, temps chargement |
| Opportunités | `/api/opportunities` | Keywords non couverts |
| Contenu | `/api/content` | Statut des contenus (idea→live) |
| Audit technique | `/api/audit` | PageSpeed, erreurs, problèmes |
| Conversions | Tracking GTM/GA4 | Formulaires, devis, appels |

**Sorties du Cockpit :**

1. **Score SEO global** (0-100) avec breakdown
2. **Alertes prioritaires** (problèmes urgents)
3. **Opportunités détectées** (potentiel de croissance)
4. **Bouton "Lancer Audit IA"** → passe les données à l'onglet 2

### 2.3 ONGLET 2 — AUDIT IA

**Rôle :** Recevoir les données du Cockpit, fusionner les analyses, produire un audit final exploitable.

**Input :** Toutes les données agrégées du Cockpit

**Process IA (Claude) :**
```
{
  gsc_data: {...},
  opportunities: [...],
  pages: [...],
  audit: {...},
  conversions: {...}
}
    ↓
Claude analyse et fusionne
    ↓
{
  score_global: 72,
  resume: "Le site est bien optimisé techniquement mais manque de contenu ciblé...",
  points_forts: [...],
  points_faibles: [...],
  actions_recommandees: [
    {
      type: "create_article",
      priorite: "haute",
      keyword: "prix renovation cuisine paris",
      impact_estime: "+23 clics/mois",
      action_data: { keyword, slug_suggested, h1_suggested }
    },
    {
      type: "optimize_page",
      priorite: "moyenne",
      target: "services.html",
      impact_estime: "+15% CTR",
      action_data: { meta_title, meta_description }
    },
    {
      type: "fix_technical",
      priorite: "basse",
      target: "blog.html",
      impact_estime: "Performance",
      action_data: { issue, solution }
    }
  ]
}
```

**UI :**
- Score global avec badge (Bon/Moyen/Faible)
- Résumé IA en prose
- Points forts / Points faibles
- Tableau des actions recommandées avec boutons :
  - "Créer" → ouvre Studio SEO IA
  - "Optimiser" → ouvre modal d'édition
  - "Corriger" → applique le fix automatiquement

### 2.4 ONGLET 3 — STUDIO SEO IA

**Rôle :** Recevoir l'audit final et générer directement le contenu SEO prêt à publier.

**Pipeline complet :**

```
ACTION SÉLECTIONNÉE (depuis Audit IA)
    ↓
┌─────────────────────────────────────────────────────────────┐
│  PARAMÈTRES PRÉ-REMPLIS                                    │
│  - Keyword : "prix renovation cuisine paris"               │
│  - Type : Article blog                                      │
│  - Ton : Professionnel                                      │
│  - Longueur : 800-1200 mots                                │
└─────────────────────────────────────────────────────────────┘
    ↓
GÉNÉRATION CONTENU (Claude)
    → Titre H1
    → Meta description
    → Introduction
    → Sections H2 avec paragraphes
    → Conclusion
    → CTA
    ↓
PRÉVISUALISATION ARTICLE
    → Aperçu visuel de la page
    → Compteurs mots / caractères
    → Boutons : Régénérer / Éditer / Valider
    ↓
GÉNÉRATION IMAGE (DALL-E - optionnel)
    → Image d'illustration pour l'article
    ↓
PRÉVISUALISATION PAGE COMPLÈTE
    → Mockup de la page finale
    → URL preview : /blog/prix-renovation-cuisine-paris.html
    ↓
PUBLICATION AUTOMATIQUE
    → Génère HTML
    → Push GitHub
    → Attend déploiement OVH
    → Vérifie HTTP 200
    → Marque LIVE
```

**UI Studio SEO IA :**

```
┌─────────────────────────────────────────────────────────────┐
│  🎯 Paramètres                                              │
├─────────────────────────────────────────────────────────────┤
│  Keyword : [prix renovation cuisine paris    ]              │
│  Type : [Article blog ▼]  Ton : [Professionnel ▼]          │
│  Longueur : [800-1200 mots ▼]                              │
│                                                             │
│  [✨ Générer le contenu]                                    │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│  📝 Contenu généré                                          │
├─────────────────────────────────────────────────────────────┤
│  H1: Prix rénovation cuisine Paris - Devis gratuit          │
│  ─────────────────────────────────────────────────────────  │
│  Meta: Découvrez les prix de rénovation cuisine à Paris...  │
│  ─────────────────────────────────────────────────────────  │
│  Introduction:                                               │
│  Vous souhaitez rénover votre cuisine à Paris ? Les prix... │
│                                                             │
│  ## Combien coûte une rénovation de cuisine ?               │
│  Les tarifs varient selon plusieurs facteurs...             │
│                                                             │
│  ## Nos services de rénovation cuisine                      │
│  Mistral Pro Reno vous accompagne...                        │
│                                                             │
│  [🔄 Régénérer] [✏️ Éditer] [🖼️ Ajouter image]             │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│  👁️ Prévisualisation                                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │  MISTRAL PRO RENO         ACCUEIL SERVICES BLOG     │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  Accueil > Blog > Prix rénovation cuisine           │   │
│  │                                                      │   │
│  │  Prix rénovation cuisine Paris                      │   │
│  │  Devis gratuit                                       │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  [IMAGE CUISINE RÉNOVÉE]                            │   │
│  │                                                      │   │
│  │  Vous souhaitez rénover votre cuisine...            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  URL : /blog/prix-renovation-cuisine-paris.html             │
│  Mots : 892 | Caractères : 5,234                           │
│                                                             │
│  [🚀 Publier maintenant]                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. FICHIERS À MODIFIER / CRÉER

### 3.1 Fichiers API (seo-api/)

| Fichier | Action | Description |
|---------|--------|-------------|
| `services/cockpitAggregator.js` | CRÉER | Agrège toutes les données pour le Cockpit |
| `services/auditIA.js` | CRÉER | Génère l'audit IA via Claude |
| `services/contentWriter.js` | CRÉER | Rédige le contenu SEO via Claude |
| `routes/cockpit.js` | MODIFIER | `/api/cockpit/full` - données complètes |
| `routes/audit.js` | CRÉER | `/api/audit/ia` - lancer audit IA |
| `routes/studio.js` | CRÉER | `/api/studio/generate` - générer contenu |

### 3.2 Fichiers Frontend (seo-dashboard/)

| Fichier | Action | Description |
|---------|--------|-------------|
| `index.html` | MODIFIER | Réduire à 3 onglets |
| `dashboard.js` | REFACTORER | Séparer en modules |
| `js/cockpit.js` | CRÉER | Logique Cockpit unifié |
| `js/audit-ia.js` | CRÉER | Logique Audit IA |
| `js/studio-seo.js` | CRÉER | Logique Studio SEO IA |
| `css/cockpit.css` | CRÉER | Styles Cockpit |
| `css/audit-ia.css` | CRÉER | Styles Audit IA |
| `css/studio-seo.css` | CRÉER | Styles Studio SEO |

### 3.3 Variables d'environnement Vercel

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Clé API Claude pour génération contenu |
| `OPENAI_API_KEY` | Clé API DALL-E pour génération image (optionnel) |

---

## 4. FLUX DE DONNÉES COMPLET

```
┌────────────────────────────────────────────────────────────────┐
│                      ONGLET 1 : COCKPIT                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  GSC Data ─┐                                                   │
│            │                                                   │
│  Pages ────┼──→ cockpitAggregator.js ──→ Score + Alertes      │
│            │         │                                         │
│  Opport. ──┤         ↓                                         │
│            │    cockpitData = {                                │
│  Audit ────┤      score: 72,                                   │
│            │      alerts: [...],                               │
│  Content ──┘      opportunities: [...],                        │
│                   pages: [...],                                │
│                   gsc: {...}                                   │
│                 }                                              │
│                         │                                      │
│                         ↓                                      │
│                 [Lancer Audit IA]                              │
│                         │                                      │
└─────────────────────────┼──────────────────────────────────────┘
                          │
                          ↓
┌────────────────────────────────────────────────────────────────┐
│                      ONGLET 2 : AUDIT IA                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  cockpitData ──→ auditIA.js ──→ Claude API                    │
│                       │                                        │
│                       ↓                                        │
│                 auditResult = {                                │
│                   score_global: 72,                            │
│                   resume: "...",                               │
│                   actions: [                                   │
│                     { type: "create_article", ... },          │
│                     { type: "optimize_page", ... }            │
│                   ]                                            │
│                 }                                              │
│                         │                                      │
│                         ↓                                      │
│                 [Créer article] → selectedAction              │
│                         │                                      │
└─────────────────────────┼──────────────────────────────────────┘
                          │
                          ↓
┌────────────────────────────────────────────────────────────────┐
│                    ONGLET 3 : STUDIO SEO IA                    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  selectedAction ──→ Formulaire pré-rempli                     │
│                           │                                    │
│                           ↓                                    │
│                    [Générer contenu]                           │
│                           │                                    │
│  contentWriter.js ──→ Claude API ──→ articleContent           │
│                           │                                    │
│                           ↓                                    │
│                    Prévisualisation                            │
│                           │                                    │
│                           ↓                                    │
│                    [Publier]                                   │
│                           │                                    │
│  publisher.js ──→ GitHub API ──→ OVH Deploy ──→ LIVE         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 5. RÉCAPITULATIF

### 5.1 Principe clé

> **Le système ne publie plus de briefs bruts.**
> **Il publie uniquement du contenu final rédigé par Claude.**

### 5.2 Avantages

1. **Pipeline unifié** : Cockpit → Audit IA → Studio → Publication
2. **Automatisation complète** : 1 clic = page en ligne
3. **Qualité contenu** : Article rédigé par IA, pas un template
4. **Décision assistée** : Ricardo choisit, le système exécute

### 5.3 Prochaines étapes

1. ✅ Validation de l'architecture par Ricardo
2. ⏳ Implémentation Cockpit V2 (agrégation + score)
3. ⏳ Implémentation Audit IA (analyse + actions)
4. ⏳ Implémentation Studio SEO IA (génération + publication)
5. ⏳ Tests et ajustements

---

**En attente de validation avant implémentation.**

— Claude
