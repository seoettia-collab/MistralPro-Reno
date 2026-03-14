# 📋 FICHE TECHNIQUE — Simulateur de Devis

> **Page :** `cost_calculator.html`  
> **URL :** https://www.mistralpro-reno.fr/cost_calculator.html  
> **Version JS :** 10.8 / CCTP v41

---

## 🔗 ACCÈS RAPIDES

| Élément | Valeur |
|---------|--------|
| Page HTML | `cost_calculator.html` (~70K) |
| CSS | `css/cost_calculator.css` (~15K) |
| JS | `js/cost_calculator.js` (~25K) |
| Dépendances | jQuery 3.6.0, jsPDF 2.5.1 |

---

## 🏗️ ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                      SIMULATEUR DE DEVIS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐    ┌─────────────────────────────────────┐ │
│  │  SIDEBAR        │    │  ZONE PRESTATIONS                   │ │
│  │  (420px)        │    │  (reste)                            │ │
│  │                 │    │                                     │ │
│  │  ┌───────────┐  │    │  ┌─────────────────────────────┐   │ │
│  │  │ Formulaire│  │    │  │ 5 Catégories principales    │   │ │
│  │  │ Client    │  │    │  │ 🚿 ⚡ 🎨 🧱 🏠              │   │ │
│  │  │           │  │    │  └─────────────────────────────┘   │ │
│  │  │ - Nom*    │  │    │                                     │ │
│  │  │ - Tél*    │  │    │  ┌─────────────────────────────┐   │ │
│  │  │ - Email*  │  │    │  │ Sous-onglets (clignotants)  │   │ │
│  │  │ - Adresse │  │    │  └─────────────────────────────┘   │ │
│  │  │ - CP*     │  │    │                                     │ │
│  │  │ - Ville   │  │    │  ┌─────────────────────────────┐   │ │
│  │  └───────────┘  │    │  │ Options (select/checkbox)   │   │ │
│  │                 │    │  └─────────────────────────────┘   │ │
│  │  ┌───────────┐  │    │                                     │ │
│  │  │ TOTAL BOX │  │    └─────────────────────────────────────┘ │
│  │  │           │  │                                            │
│  │  │ HT:   €   │  │    ┌─────────────────────────────────────┐ │
│  │  │ TVA:  €   │  │    │ PANNEAU RÉCAPITULATIF CCTP          │ │
│  │  │ TTC:  €   │  │    │ N° | Désignation | Qté | P.U. | TTC │ │
│  │  │           │  │    │ LOT 1 - PLOMBERIE          1 500 €  │ │
│  │  │ [Téléch.] │  │    │ 1.1 WC suspendu...    1 u  650 € ...│ │
│  │  │ [Reset]   │  │    └─────────────────────────────────────┘ │
│  │  └───────────┘  │                                            │
│  └─────────────────┘                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🆕 NOUVELLES FONCTIONNALITÉS (v10.8)

### Panneau Récapitulatif CCTP
- Format tableau professionnel : N° | Désignation | Qté | Unité | P.U. HT | Total HT
- Numérotation par LOT (1.1, 1.2, 2.1...)
- Sous-total par catégorie
- Footer avec Total HT | TVA 20% | Total TTC

### Désignations CCTP + DTU
Toutes les prestations incluent maintenant des désignations techniques complètes :
- Matériaux et dimensions
- Caractéristiques techniques
- Accessoires et raccordements inclus
- Référence DTU applicable

### Clignotement des onglets
- Tous les sub-tabs clignotent en jaune tant qu'ils sont vides
- Animation `.blink-tab` arrêtée via `.has-selection` quand une prestation est sélectionnée
- Fonction `updateAllTabs()` gère tous les onglets

### PDF Optimisé (v10.8)
- Désignations multi-lignes complètes (plus de troncature)
- Bande LOT bleu pâle uniforme
- Tableau totaux élégant avec lignes fines
- Acompte 40% à la signature
- Pied de page 3 lignes (capital, contact, garantie)
- 3 lignes horizontales (en-tête, après désignations, pied de page)

### Gamme + Superficie manuelle
- Peinture : gamme (Rafraîchissement/Standard/Général) × m²
- Sols : gamme (Entrée/Confort/Premium) × m²
- Revêtements murs : gamme × m²
- Préparation, Extérieur, Gros Œuvre : saisie m²/ml/m³

---

## 📂 CATÉGORIES & PRESTATIONS

### 1. 🚿 Plomberie & SDB

| Sous-onglet | Contenu |
|-------------|---------|
| **Sanitaires** | WC (suspendu/à poser), Lavabo (simple/double + robinets), Douche (receveur/porte/colonne/mitigeur), Baignoire, Dépose |
| **Équipements** | Chauffe-eau (instantané à thermodynamique 270L), Adoucisseur |
| **Tuyauterie** | PVC Ø32-100, Multicouche Ø16-20, Cuivre Ø10-18 |
| **Pack SDB** | Standard 4500€ / Confort 8000€ / Premium 15000€ (tout compris) |
| **Diagnostic** | Recherche fuite, Création point d'eau |

### 2. ⚡ Électricité

| Sous-onglet | Contenu |
|-------------|---------|
| **Installation** | Tableau (T1 à T5+), Points lumineux, Prises 2P+T, Interrupteurs |
| **Chauffage** | Radiateurs inertie 500W/1500W/2000W, Sèche-serviettes |
| **Climatisation** | Mono-split, Multi-split 3 unités, Gainable |
| **VMC** | Simple flux (auto/hygro B/silence), Double flux (standard/HR/thermo), Aérateurs |

### 3. 🎨 Peinture & Sols

| Sous-onglet | Contenu |
|-------------|---------|
| **Peinture** | Murs, Plafonds (surfaces 30-100m²) |
| **Sols** | Parquet, Carrelage, Lino/PVC |
| **Murs** | Faïence, Crédence |
| **Préparation** | Dépose, Ragréage, Chape |
| **Extérieur** | Ravalement, Façade |

### 4. 🧱 Gros Œuvre

| Sous-onglet | Contenu |
|-------------|---------|
| **Maçonnerie** | Mur porteur, Cloisons, Dalle, Démolition |
| **Isolation** | Murs, Combles, ITE |
| **Plâtrerie** | Faux-plafond, Doublage |
| **Construction** | Extension, Terrassement, Fondations |

### 5. 🏠 Menuiserie

| Sous-onglet | Contenu |
|-------------|---------|
| **Intérieure** | Portes, Plinthes |
| **Extérieure** | Fenêtres, Porte entrée, Volets |
| **Toiture** | Couverture, Velux, Zinguerie |
| **Agencement** | Cuisine, Placards, Rangements |

---

## 📋 FORMAT DÉSIGNATIONS CCTP

### Structure
```
Fourniture et pose de [PRODUIT] [DIMENSIONS] [MATIÈRE] [CARACTÉRISTIQUES] [ACCESSOIRES INCLUS]. [RACCORDEMENTS]. [DTU]
```

### Exemples

**WC Suspendu (650€) :**
> "Fourniture et pose de WC suspendu céramique blanc brillant, cuvette sans bride rimless, bâti-support autoportant acier galvanisé, réservoir encastré double chasse 3/6L, plaque de commande chromée, abattant frein de chute déclipsable. Raccordement PVC Ø100. Pose selon DTU 60.1"

**Tableau T3 (1200€) :**
> "Fourniture et pose de tableau électrique pré-équipé logement T3, coffret 3 rangées, disjoncteur abonné, 2 interrupteurs différentiels 40A type A et AC, disjoncteurs divisionnaires, parafoudre, borniers, repérage circuits, mise en conformité NF C15-100"

**Pack SDB Standard (4500€) :**
> "Pack rénovation salle de bain complet STANDARD comprenant : dépose et évacuation anciens sanitaires (WC, lavabo, douche ou baignoire) et carrelage sol/mur avec transport déchetterie agréée. Fourniture et pose carrelage grès cérame 20x20 antidérapant sol et faïence murale blanc brillant (base 20€/m² fourni). WC à poser céramique blanc sortie horizontale avec réservoir et abattant. Lavabo vasque céramique sur meuble sous-vasque mélaminé 60cm 2 tiroirs..."

---

## 🔧 STRUCTURE JS (v10.8)

### allSelects (mapping catégorie → IDs)

```javascript
const allSelects = {
  plomberie: [
    "select-receveur", "select-porte-douche", "select-barre-douche", 
    "select-mitigeur-douche", "select-baignoire", "select-robinet-baignoire",
    "select-cumulus", "select-adoucisseur", "select-diagnostic",
    "select-tuyauterie-pvc", "select-tuyauterie-multi", "select-tuyauterie-cuivre",
    "select-pack-sdb", "select-depose-mural", "select-depose-sol"
  ],
  electricite: [
    "select-tableau", "select-points-lum", "select-prises", "select-inter",
    "select-rad-500", "select-rad-1500", "select-rad-2000", "select-seche-serv",
    "select-clim", "select-vmc-simple", "select-vmc-double", "select-aerateur"
  ],
  peinture: [
    "select-peinture-murs-gamme", "select-peinture-plaf-gamme",
    "select-parquet-gamme", "select-carrelage-gamme", "select-lino-gamme",
    "select-faience-gamme", "select-credence-gamme"
  ],
  "gros-oeuvre": ["select-mur-porteur"],
  menuiserie: [
    "select-portes-int-gamme", "select-plinthes-gamme",
    "select-porte-entree", "select-volets",
    "select-charpente", "select-couverture", "select-velux", "select-zinguerie",
    "select-cuisine", "select-placards", "select-rangements"
  ]
};
```

### Fonctions principales

| Fonction | Rôle |
|----------|------|
| `r()` | Recalcul total temps réel |
| `updatePreview()` | Génère le panneau récapitulatif CCTP |
| `updateAllTabs()` | Gère le clignotement de tous les onglets |
| `c()` | Génération et téléchargement PDF |
| `formatPrice()` | Formatage prix avec espaces (1 000 €) |
| `getCatName()` | Conversion clé → nom catégorie |
| `u()` | Formatage prix PDF |
| `m()` | Dessin logo fallback PDF |

---

## 📄 GÉNÉRATION PDF (v10.8)

### Colonnes

| N° | DÉSIGNATION | QTÉ | P.U. TTC | TTC |
|----|-------------|-----|----------|-----|

- **Désignations multi-lignes** (plus de troncature, texte complet)
- **Bande LOT bleu pâle** (209,225,247) avec texte bleu foncé
- **Prix en TTC** (plus clair pour le client)

### Structure du PDF

```
┌─────────────────────────────────────────────────────────┐
│  [LOGO]                              Devis              │
│  Mistral Pro Reno                    N° DEV-YYYYMMDD-XXXX│
├────────────────── LIGNE HORIZONTALE ────────────────────┤
│  N° │ DÉSIGNATION                    │ QTÉ │ P.U. │ TTC │
├─────────────────────────────────────────────────────────┤
│  1  │ PLOMBERIE & SANITAIRES (bleu pâle)     │ XXX€│
│  1.1│ Fourniture et pose de WC...    │ 1 u │ 780€ │ 780€│
│     │ (texte complet multi-lignes)   │     │      │     │
├────────────────── LIGNE HORIZONTALE ────────────────────┤
│  Conditions de paiement      │  Total net HT │  XXXX € │
│  Acompte 40% soit XXX € TTC  │  TVA 20,00 %  │  XXXX € │
│  Reste à facturer : XXX € TTC│  Total TTC    │  XXXX € │
│                              │  NET À PAYER  │  XXXX € │
├────────────────── LIGNE HORIZONTALE ────────────────────┤
│  capital 1000€ - RCS Paris - APE 4120A                  │
│  Tél - Email - URL                                      │
│  Garantie décennale HOKEN - Couverture France           │
└─────────────────────────────────────────────────────────┘
```

### Éléments PDF

| Élément | Détail |
|---------|--------|
| **3 lignes horizontales** | En-tête, après désignations, pied de page |
| **Bande LOT** | Bleu pâle uniforme (209,225,247) |
| **Acompte** | 40% à la signature |
| **Footer 3 lignes** | Capital/RCS, Contact, Garantie |
| **Saut de page auto** | Bloc totaux reste groupé |

---

## 🔔 ANIMATIONS CSS

### Clignotement onglets

```css
@keyframes tab-blink {
  0%, 100% { background: var(--yellow); transform: scale(1); }
  50% { background: #ffeb3b; transform: scale(1.05); box-shadow: 0 0 15px rgba(244,196,48,.8); }
}

.sub-tab.blink-tab { animation: tab-blink 1.5s ease-in-out infinite; }
.sub-tab.blink-tab.active,
.sub-tab.blink-tab.has-selection { animation: none; }
```

---

## 🔗 INTÉGRATION BACKEND

### Endpoint API

```
POST https://mistralpro-reno-backend.onrender.com/api/send-devis
```

### Payload inclut désormais les désignations CCTP complètes

---

## 📱 RESPONSIVE

| Largeur | Comportement |
|---------|--------------|
| > 1024px | 2 colonnes (sidebar 420px + prestations) |
| 768-1024px | 2 colonnes (sidebar 260px + prestations) |
| < 768px | 1 colonne, prestations en premier, formulaire en bas |

---

*Dernière mise à jour : 14 mars 2026 — v10.8 / CCTP v41*
