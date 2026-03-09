# ANALYSE TECHNIQUE — Facebook Ads Dashboard

**Document d'analyse**  
**Date :** 10 mars 2026  
**Auteur :** Claude (Ingénieur technique)  
**Objectif :** Comprendre l'architecture pour la transposer au SEO Dashboard

---

## 1. ORGANISATION DES MODULES

### 1.1 Structure des fichiers

```
/facebook-ads-frontend/
├── js/
│   ├── cockpit.js          (18K)  ← Vue synthèse + KPIs + Alertes
│   ├── ai-recommendations.js (39K)  ← Analyse IA + Actions exécutables
│   ├── ai-creation.js      (69K)  ← Studio Pub (génération contenu + image)
│   ├── publish.js          (39K)  ← Publication Facebook + Preview live
│   ├── ads-manager.js      (64K)  ← Gestion campagnes/ads
│   ├── conversions.js      (106K) ← Suivi conversions
│   ├── api.js              (14K)  ← Appels backend
│   └── config.js / state.js / init.js
```

### 1.2 Séparation fonctionnelle

| Module | Rôle | Données entrantes | Données sortantes |
|--------|------|-------------------|-------------------|
| **Cockpit** | Vue synthèse | Insights Facebook API | KPIs, Score global, Alertes |
| **IA Recommendations** | Analyse + Décision | Insights + Config | Audit final, Actions recommandées |
| **AI Creation (Studio Pub)** | Génération IA | Paramètres utilisateur | Contenu pub (texte + image) |
| **Publish** | Publication | Contenu généré | Pub live sur Facebook |

---

## 2. LOGIQUE DU PIPELINE STUDIO PUB

### 2.1 Chaîne complète

```
┌─────────────────────────────────────────────────────────────────┐
│                    PARAMÈTRES UTILISATEUR                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Thème    │ │ Ton      │ │ Audience │ │ Style    │           │
│  │ ▼        │ │ ▼        │ │ ▼        │ │ ▼        │           │
│  │ Cuisine  │ │ Pro      │ │ Proprio  │ │ Direct   │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                  │
│  Options avancées : Type projet, Offre, Saison                  │
│                         │                                        │
│                         ▼                                        │
│              [✨ Générer le contenu]                             │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                 GÉNÉRATION TEXTE (Claude API)                    │
│                                                                  │
│  POST /api/ai/generate-content                                  │
│  Body: { theme, tone, style, targetAudience, ... }              │
│                         │                                        │
│                         ▼                                        │
│  Response: {                                                     │
│    headline: "Rénovez votre cuisine dès maintenant",            │
│    primary_text: "Mistral Pro Reno transforme...",              │
│    description: "Cuisine rénovée en 3 semaines",                │
│    cta: "GET_QUOTE",                                            │
│    variantes: [ {...}, {...} ],                                 │
│    hashtags: ["#RenovationCuisine", ...]                        │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SÉLECTION VARIANTE                             │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Version         │  │ Variante 1      │  │ Variante 2      │  │
│  │ principale      │  │                 │  │                 │  │
│  │ ☑ Sélectionner  │  │ ☐ Sélectionner  │  │ ☐ Sélectionner  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                         │                                        │
│          selectVariant(index) → selectedVariantData             │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   OPTIONS IMAGE                                  │
│                                                                  │
│  Type pièce : [Cuisine ▼]                                       │
│  Style :      [Moderne ▼]                                       │
│  Ambiance :   [Lumineuse ▼]                                     │
│                         │                                        │
│              [🎨 Générer l'image IA]                            │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                 GÉNÉRATION IMAGE (DALL-E)                        │
│                                                                  │
│  POST /api/ai/generate-image                                    │
│  Body: { roomType, style, ambiance, prompt }                    │
│                         │                                        │
│                         ▼                                        │
│  Response: { url: "https://..." }                               │
│  → cachedGeneratedImage = result                                │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PRÉVISUALISATION                               │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  📱 Mockup Facebook                                      │    │
│  │  ┌─────────────────────────────────────────────────────┐│    │
│  │  │  [IMAGE GÉNÉRÉE]                                    ││    │
│  │  │                                                      ││    │
│  │  │  Mistral Pro Reno                                   ││    │
│  │  │  "Rénovez votre cuisine dès maintenant"             ││    │
│  │  │  [Obtenir un devis]                                 ││    │
│  │  └─────────────────────────────────────────────────────┘│    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  [🔄 Régénérer] [💾 Télécharger] [📋 Copier] [🚀 Publier]       │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PUBLICATION                                 │
│                                                                  │
│  Formulaire :                                                    │
│  - Page Facebook : [ID]                                          │
│  - Campagne : [Nouvelle ▼] ou [Existante]                       │
│  - Budget : [10€/jour]                                           │
│  - Objectif : [Leads ▼]                                          │
│                         │                                        │
│              [🚀 Confirmer la publication]                       │
│                         │                                        │
│                         ▼                                        │
│  POST /api/ai/publish                                           │
│  → Upload image → Create creative → Create campaign             │
│  → Create ad set → Create ad                                    │
│                         │                                        │
│                         ▼                                        │
│  ✅ PUBLICITÉ EN LIGNE (status: PAUSED)                         │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Variables clés du pipeline

```javascript
// Cache données générées
var cachedGeneratedContent = null;   // Texte généré par Claude
var cachedGeneratedImage = null;     // Image générée par DALL-E
var selectedVariantData = null;      // Variante sélectionnée
var imageGallery = [];               // Galerie d'images générées
var selectedGalleryIndex = 0;        // Index image sélectionnée

// Flux de données
generateContent() → cachedGeneratedContent
    ↓
selectVariant(idx) → selectedVariantData
    ↓
generateImage() → cachedGeneratedImage
    ↓
goToPublish() → publishData (combine texte + image)
    ↓
publishToFacebook() → API Facebook
```

---

## 3. STRUCTURE UI / UX

### 3.1 Organisation en blocs verticaux

Le Studio Pub utilise une **progression verticale** où chaque bloc apparaît après validation du précédent :

```
┌─────────────────────────────────────────────────────────────────┐
│ BLOC 1 — PARAMÈTRES                                             │
│ ─────────────────────────────────────────────────────────────── │
│ Visible dès le départ                                           │
│ Formulaire avec sélecteurs + champ libre                        │
│ Bouton [Générer le contenu]                                     │
└─────────────────────────────────────────────────────────────────┘
                          │ Clic génération
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ BLOC 2 — RÉSULTATS TEXTE (apparaît après génération)            │
│ ─────────────────────────────────────────────────────────────── │
│ Barre paramètres utilisés (tags colorés)                        │
│ Cards cliquables : Version principale + Variantes               │
│ Boutons : [Copier] [Sélectionner]                               │
└─────────────────────────────────────────────────────────────────┘
                          │ Clic sélection
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ BLOC 3 — OPTIONS IMAGE (apparaît après sélection)               │
│ ─────────────────────────────────────────────────────────────── │
│ Affiche la version sélectionnée                                 │
│ Sélecteurs : Type pièce, Style, Ambiance                        │
│ Bouton [Générer l'image IA]                                     │
└─────────────────────────────────────────────────────────────────┘
                          │ Clic génération image
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ BLOC 4 — PRÉVISUALISATION (apparaît après génération image)     │
│ ─────────────────────────────────────────────────────────────── │
│ Mockup Facebook (mobile + desktop)                              │
│ Image + Texte combinés                                          │
│ Boutons : [Régénérer] [Télécharger] [Publier]                   │
└─────────────────────────────────────────────────────────────────┘
                          │ Clic publier
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ BLOC 5 — PUBLICATION (modal ou section)                         │
│ ─────────────────────────────────────────────────────────────── │
│ Formulaire : Page ID, Budget, Objectif, Campagne                │
│ Bouton [Confirmer la publication]                               │
│ → Résultat : IDs créés + lien Ads Manager                       │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Pourquoi cette organisation ?

| Principe | Raison |
|----------|--------|
| **Progression guidée** | L'utilisateur ne voit que les options pertinentes à chaque étape |
| **Pas de surcharge** | Évite un formulaire géant avec 20+ champs visibles |
| **Feedback immédiat** | Chaque action produit un résultat visible |
| **Point de décision clair** | Un seul bouton d'action principal par bloc |
| **Possibilité de retour** | L'utilisateur peut modifier et régénérer à chaque étape |

---

## 4. FLUX DE DONNÉES

### 4.1 Schéma global

```
┌──────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                    │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  [Paramètres UI]                                                      │
│       │                                                               │
│       ▼                                                               │
│  fetch('/api/ai/generate-content', { theme, tone, ... })             │
│       │                                                               │
│       │◄─────────────────────────────────────────────────────────────│
│       │                                                               │
│       ▼                                                               │
│  cachedGeneratedContent = response.data                              │
│  renderGeneratedContent(data, params)                                │
│       │                                                               │
│       ▼                                                               │
│  [Sélection variante]                                                │
│  selectVariant(idx) → selectedVariantData = variantes[idx]          │
│       │                                                               │
│       ▼                                                               │
│  fetch('/api/ai/generate-image', { roomType, style, ... })           │
│       │                                                               │
│       │◄─────────────────────────────────────────────────────────────│
│       │                                                               │
│       ▼                                                               │
│  cachedGeneratedImage = response.data                                │
│  renderImageResult()                                                 │
│       │                                                               │
│       ▼                                                               │
│  [Prêt à publier]                                                    │
│  publishData = {                                                     │
│    headline: selectedVariantData.headline,                           │
│    primaryText: selectedVariantData.primary_text,                    │
│    imageUrl: cachedGeneratedImage.url,                               │
│    ...                                                               │
│  }                                                                    │
│       │                                                               │
│       ▼                                                               │
│  fetch('/api/ai/publish', publishData)                               │
│       │                                                               │
│       │◄─────────────────────────────────────────────────────────────│
│       │                                                               │
│       ▼                                                               │
│  renderPublishResult(response)                                       │
│  → Campaign ID, Ad Set ID, Ad ID                                     │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                           BACKEND                                     │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  /api/ai/generate-content                                            │
│       │                                                               │
│       ▼                                                               │
│  Claude API → génère texte publicitaire                              │
│       │                                                               │
│  /api/ai/generate-image                                              │
│       │                                                               │
│       ▼                                                               │
│  DALL-E API → génère image                                           │
│       │                                                               │
│  /api/ai/publish                                                     │
│       │                                                               │
│       ▼                                                               │
│  Facebook Marketing API                                              │
│  → Upload image                                                      │
│  → Create creative                                                   │
│  → Create campaign (si nouvelle)                                     │
│  → Create ad set                                                     │
│  → Create ad                                                         │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.2 Points clés du flux

1. **Cache local** : Les données générées sont stockées dans des variables globales (`cachedGeneratedContent`, `cachedGeneratedImage`) pour éviter de re-fetch
2. **Données combinées** : `publishData` combine texte sélectionné + image générée + paramètres publication
3. **Pas de brief** : Le système génère directement du contenu final, pas d'intermédiaire "brief"
4. **Feedback visuel** : Chaque appel API affiche un loader puis le résultat

---

## 5. ENSEIGNEMENTS POUR LE SEO DASHBOARD

### 5.1 Principes à transposer

| Principe Facebook Ads | Application SEO Dashboard |
|-----------------------|---------------------------|
| Cockpit = Vue synthèse | Cockpit SEO = Score global + KPIs + Alertes |
| IA Recommandations = Audit | Audit IA = Analyse fusionnée + Actions |
| Studio Pub = Génération contenu | Studio SEO = Génération article complet |
| Publish = Publication Facebook | Publication = Push GitHub → OVH |

### 5.2 Pipeline cible SEO Dashboard

```
COCKPIT SEO
    │ Agrège : GSC, Pages, Opportunités, Audit technique
    │ Produit : Score global, Alertes, Top actions
    ▼
AUDIT IA
    │ Claude analyse les données du Cockpit
    │ Produit : Audit final + Actions recommandées
    │   → "Créer article X"
    │   → "Optimiser page Y"
    │   → "Corriger problème Z"
    ▼
STUDIO SEO IA
    │ Reçoit action sélectionnée
    │ Paramètres pré-remplis (keyword, type, ton)
    │ Claude génère : H1, meta, intro, H2s, contenu complet
    │ DALL-E génère : image (optionnel)
    │ Prévisualisation article
    ▼
PUBLICATION
    │ Génère le fichier HTML
    │ Push sur GitHub
    │ Déploiement automatique OVH
    │ Vérifie HTTP 200
    ▼
PAGE LIVE
```

---

## 6. CONCLUSION

Le Facebook Ads Dashboard utilise une architecture **modulaire et progressive** :

1. **Séparation claire** entre analyse (Cockpit), recommandation (IA), création (Studio), action (Publish)
2. **Pipeline linéaire** : Input → Génération IA → Sélection → Preview → Publication
3. **UI en blocs** : Chaque étape apparaît après validation de la précédente
4. **Pas de brief** : Le système produit directement du contenu final exploitable

Cette architecture est **directement transposable** au SEO Dashboard avec le pipeline :
- Cockpit SEO → Audit IA → Studio SEO IA → Publication → Page live

---

*Document créé le 10 mars 2026 — Analyse technique Facebook Ads Dashboard*
