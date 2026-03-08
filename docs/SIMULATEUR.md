# 📋 FICHE TECHNIQUE — Simulateur de Devis

> **Page :** `cost_calculator.html`  
> **URL :** https://www.mistralpro-reno.fr/cost_calculator.html

---

## 🔗 ACCÈS RAPIDES

| Élément | Valeur |
|---------|--------|
| Page HTML | `cost_calculator.html` (63K) |
| CSS | `css/cost_calculator.css` (13K) |
| JS | `js/cost_calculator.js` (15K) |
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
│  │  │ - Email*  │  │    │  │ Sous-onglets par catégorie  │   │ │
│  │  │ - Adresse │  │    │  └─────────────────────────────┘   │ │
│  │  │ - CP*     │  │    │                                     │ │
│  │  │ - Ville   │  │    │  ┌─────────────────────────────┐   │ │
│  │  └───────────┘  │    │  │ Options (checkbox/slider)   │   │ │
│  │                 │    │  └─────────────────────────────┘   │ │
│  │  ┌───────────┐  │    │                                     │ │
│  │  │ TOTAL BOX │  │    └─────────────────────────────────────┘ │
│  │  │           │  │                                            │
│  │  │ HT:   €   │  │    ┌─────────────────────────────────────┐ │
│  │  │ TVA:  €   │  │    │ MOBILE TOTAL BOX (visible mobile)   │ │
│  │  │ TTC:  €   │  │    └─────────────────────────────────────┘ │
│  │  │           │  │                                            │
│  │  │ [Téléch.] │  │                                            │
│  │  │ [Reset]   │  │                                            │
│  │  └───────────┘  │                                            │
│  └─────────────────┘                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📂 CATÉGORIES & PRESTATIONS

### 1. 🚿 Plomberie & SDB

| Sous-onglet | Type d'input | Prestations |
|-------------|--------------|-------------|
| Sanitaires | Checkbox | WC suspendu (400€), Lavabo (350€), Douche italienne (1200€), Baignoire (1500€) |
| Équipements | Checkbox | Ballon 200L (800€), Adoucisseur (1200€) |
| Robinetterie | Slider | Robinets (150€/u), Tuyauterie (35€/ml) |
| Pack SDB | Select + Slider | Packs (4500-15000€), Carrelage SDB (55€/m²) |

### 2. ⚡ Électricité

| Sous-onglet | Type d'input | Prestations |
|-------------|--------------|-------------|
| Points lumineux | Slider | Points lumineux (80€/u) |
| Prises | Slider | Prises (60€/u), Interrupteurs (50€/u) |
| Chauffage | Slider | Radiateurs (300€/u) |

### 3. 🎨 Peinture & Sols

| Sous-onglet | Type d'input | Prestations |
|-------------|--------------|-------------|
| Murs | Slider + Select gamme | Peinture murs (prix selon gamme) |
| Plafonds | Slider + Select gamme | Peinture plafonds (prix selon gamme) |
| Parquet | Slider + Select gamme | Parquet massif (prix selon gamme) |
| Carrelage | Slider + Select gamme | Carrelage sol (prix selon gamme) |
| Autres sols | Slider | Lino, Faïence, Crédence |

### 4. 🧱 Gros Œuvre

| Sous-onglet | Type d'input | Prestations |
|-------------|--------------|-------------|
| Démolition | Slider | Démolition (80€/m³) |
| Maçonnerie | Slider | Cloisons (45€/m²), Dalle béton (70€/m²) |
| Isolation | Slider | Murs (45€/m²), Combles (35€/m²), ITE (120€/m²) |
| Plâtrerie | Slider | Faux-plafond (45€/m²), Placo murs (35€/m²) |
| Extension | Slider | Extension (1800€/m²), Terrassement (50€/m³), Fondations (200€/ml) |

### 5. 🏠 Menuiserie

| Sous-onglet | Type d'input | Prestations |
|-------------|--------------|-------------|
| Portes int. | Slider | Portes (350€/u), Plinthes (12€/ml) |
| Fenêtres | Slider | Fenêtres (450€/u), Porte entrée (1800€/u), Volets (500€/u) |
| Toiture | Slider | Toiture (120€/m²), Velux (800€/u), Zinguerie (80€/ml) |
| Rangements | Checkbox | Placards (500€/ml), Dressing (2500€), Bibliothèque (1800€) |

---

## 🔄 FLUX DE DONNÉES

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Sélection   │────▶│  Calcul JS   │────▶│  Affichage   │
│  prestations │     │  temps réel  │     │  totaux      │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                                                 ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Webhook     │◀────│  Génération  │◀────│  Clic        │
│  n8n         │     │  PDF jsPDF   │     │  Télécharger │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

## 📊 CALCULS

### Formules

```javascript
// Sous-total HT
subtotal = Σ (checkbox.price) + Σ (slider.value × slider.price)

// TVA
vat = subtotal × 0.20

// Total TTC
total = subtotal + vat

// Acompte (30%)
acompte = total × 0.30

// Solde
solde = total - acompte
```

### Prix unitaires (référence rapide)

| Prestation | Prix | Unité |
|------------|------|-------|
| WC suspendu | 400 € | u |
| Douche italienne | 1 200 € | u |
| Robinets | 150 € | u |
| Tuyauterie | 35 € | ml |
| Points lumineux | 80 € | u |
| Prises | 60 € | u |
| Carrelage SDB | 55 € | m² |
| Cloisons | 45 € | m² |
| Isolation murs | 45 € | m² |
| Extension | 1 800 € | m² |
| Portes int. | 350 € | u |
| Fenêtres | 450 € | u |

---

## 📄 GÉNÉRATION PDF

### Structure du PDF

```
┌─────────────────────────────────────────────────────────┐
│  [LOGO]                              Devis              │
│  Mistral Pro Reno                    N° DEV-YYYYMMDD-XXXX│
│                                      Date: XX/XX/XXXX   │
│                                      Valable jusqu'au   │
├─────────────────────────────────────────────────────────┤
│  ÉMETTEUR              │  DESTINATAIRE                  │
│  Mistral Pro Reno      │  [Nom client]                  │
│  9 rue Anatole de la   │  [Adresse]                     │
│  Forge, 75017 Paris    │  [CP Ville]                    │
│  TVA: FR74851558882    │  [Téléphone]                   │
│  Tél: 07 55 18 89 37   │  [Email]                       │
├─────────────────────────────────────────────────────────┤
│  N° │ DÉSIGNATION          │ QTÉ │ P.U. │ TVA │ TOTAL  │
├─────────────────────────────────────────────────────────┤
│  1  │ PLOMBERIE            │     │      │     │        │
│  1.1│ WC Suspendu          │ 1 u │ 400€ │ 20% │ 400€   │
│  ...│ ...                  │     │      │     │        │
├─────────────────────────────────────────────────────────┤
│                              Total HT    │   XXXX €    │
│                              TVA 20%     │   XXXX €    │
│                              Total TTC   │   XXXX €    │
│                              ─────────────────────────  │
│                              NET À PAYER │   XXXX €    │
├─────────────────────────────────────────────────────────┤
│  Conditions de paiement                                 │
│  Acompte 30% à la signature: XXXX € TTC                │
│  Solde à la fin des travaux: XXXX € TTC                │
├─────────────────────────────────────────────────────────┤
│  Capital 1000€ - RCS Paris - APE: 4120A                │
│  Garantie décennale HOKEN ASSURANCE                    │
└─────────────────────────────────────────────────────────┘
```

### Numérotation devis

```
Format: DEV-YYYYMMDD-XXXX
Exemple: DEV-20260308-4521
```

---

## 🔗 INTÉGRATION BACKEND

### Endpoint API

```
POST https://mistralpro-reno-backend.onrender.com/api/send-devis
```

### Backend

| Élément | Valeur |
|---------|--------|
| Repo | `seoettia-collab/mistralpro-reno-backend` |
| Hébergement | Render.com (Free tier) |
| Fonction | Envoi email via SMTP OVH |
| Email destination | `contact@mistralpro-reno.fr` |

### Payload JSON

```json
{
  "nom": "Jean Dupont",
  "telephone": "06 12 34 56 78",
  "email": "jean@exemple.fr",
  "adresse": "12 rue Example",
  "code_postal": "75017",
  "ville": "Paris",
  "numero_devis": "DEV-20260308-4521",
  "date_devis": "08/03/2026",
  "total_ht": 5000,
  "tva": 1000,
  "total_ttc": 6000,
  "prestations_texte": "[détail formaté]",
  "form_name": "simulateur-devis",
  "form_location": "cost_calculator",
  "submitted_at": "2026-03-08T12:00:00.000Z",
  "page_url": "https://www.mistralpro-reno.fr/cost_calculator.html"
}
```

### Flux d'envoi

```
Client → Simulateur → fetch() POST → Backend Render → SMTP OVH → contact@mistralpro-reno.fr
```

---

## 📱 RESPONSIVE

### Breakpoints

| Largeur | Comportement |
|---------|--------------|
| > 1024px | 2 colonnes (sidebar 420px + prestations) |
| 768-1024px | 2 colonnes (sidebar 260px + prestations) |
| < 768px | 1 colonne, prestations en premier, formulaire en bas, total mobile visible |

### Éléments mobile

- `.mobile-total-box` : Box totaux visible uniquement sur mobile
- `.mobile-menu-btn` : Bouton hamburger navigation
- Synchronisation automatique des totaux desktop ↔ mobile

---

## ⚠️ POINTS D'ATTENTION

### Maintenance

| Élément | Attention |
|---------|-----------|
| JS minifié | Pas de version source disponible — difficile à modifier |
| Prix hardcodés | Dans le HTML (`data-price`) ET dans le JS (objet `o`) |
| Webhook URL | Hardcodée dans le JS |
| Logo | Chargé depuis `images/logo.png` |

### Pour modifier un prix

1. Modifier `data-price` dans `cost_calculator.html`
2. Modifier l'objet des prix dans `js/cost_calculator.js` (ligne minifiée)
3. Tester le calcul complet

### Pour ajouter une prestation

1. Ajouter le HTML dans la catégorie appropriée
2. Si slider : ajouter le prix dans l'objet JS
3. Tester la génération PDF

---

## 🔧 DÉPENDANCES EXTERNES

| Librairie | Version | CDN | Usage |
|-----------|---------|-----|-------|
| jQuery | 3.6.0 | code.jquery.com | DOM, événements |
| jsPDF | 2.5.1 | unpkg.com | Génération PDF |

### Scripts chargés

```html
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script src="https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script src="js/main.js?v=2.0"></script>
<script src="js/cost_calculator.js?v=2.0"></script>
```

---

## 📋 CHECKLIST MODIFICATION

Avant toute modification du simulateur :

- [ ] Sauvegarder `cost_calculator.html`
- [ ] Sauvegarder `js/cost_calculator.js`
- [ ] Sauvegarder `css/cost_calculator.css`
- [ ] Tester sur desktop ET mobile
- [ ] Tester génération PDF
- [ ] Vérifier envoi webhook (logs n8n)
- [ ] Vérifier calculs (HT, TVA, TTC)

---

*Dernière mise à jour : 8 mars 2026*
