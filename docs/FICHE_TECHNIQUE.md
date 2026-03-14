# 📋 FICHE TECHNIQUE — Site Mistral Pro Reno

> **Référentiel rapide** — Consulter ce document au début de chaque conversation pour retrouver les infos clés.

---

## 🔗 ACCÈS RAPIDES

| Élément | Valeur |
|---------|--------|
| **URL Production** | https://www.mistralpro-reno.fr |
| **Repo GitHub** | seoettia-collab/MistralPro-Reno |
| **Branche** | main |
| **Hébergement** | OVH (FTP auto-deploy) |

---

## 📄 PAGES HTML (10 fichiers)

| Fichier | Description | Taille |
|---------|-------------|--------|
| `index.html` | Page d'accueil | 34K |
| `services.html` | Liste des services | 32K |
| `projets.html` | Réalisations / Portfolio | 27K |
| `blog.html` | Liste des articles | 18K |
| `cost_calculator.html` | Simulateur de devis (v7.7) | ~70K |
| `degat-des-eaux.html` | Landing page urgence | 34K |
| `mentions-legales.html` | Mentions légales | 14K |
| `merci.html` | Page de remerciement | 5.5K |
| `404.html` | Page erreur | 17K |
| `googled215df2191151168.html` | Vérification Google | 512B |

### Articles de blog (`/blog/`)

| Fichier | Sujet |
|---------|-------|
| `cout-renovation-appartement-paris.html` | Coût rénovation appartement Paris (PILIER) |
| `renovation-appartement-paris-prix-m2.html` | Prix rénovation au m² Paris |
| `combien-coutent-travaux-renovation-maison.html` | Coût travaux rénovation maison |
| `renovation-salle-de-bain-guide-prix.html` | Guide prix rénovation salle de bain |
| `degat-des-eaux-5-etapes.html` | 5 étapes après un dégât des eaux |
| `prix-renovation-cuisine-paris.html` | Prix rénovation cuisine Paris |
| `prix-renovation-salle-de-bain-paris.html` | Prix rénovation salle de bain Paris |
| `prix-travaux-electricite-appartement.html` | Prix travaux électricité |
| `prix-travaux-peinture-appartement.html` | Prix travaux peinture |
| `prix-travaux-isolation-appartement.html` | Prix travaux isolation |

---

## 🎨 FICHIERS CSS (9 fichiers)

| Fichier | Rôle | Taille |
|---------|------|--------|
| `style.css` | Styles principaux du site | 20K |
| `cost_calculator.css` | Simulateur de devis (CCTP + animations) | ~15K |
| `blog.css` | Styles page blog | 5.5K |
| `modals.css` | Fenêtres modales | 4K |
| `lecture.css` | Vue lecture | 3K |
| `toast.css` | Notifications | 1K |
| `variables.css` | Variables CSS (couleurs) | 512B |
| `base.css` | Reset / base | 512B |
| `responsive.css` | Media queries | 512B |

---

## ⚡ FICHIERS JS (15 fichiers)

### Site vitrine

| Fichier | Rôle | Taille |
|---------|------|--------|
| `main.js` | Script principal du site | 5K |
| `cost_calculator.js` | Simulateur de devis v7.7 (voir `/docs/SIMULATEUR.md`) | ~20K |

### Dashboard Google Ads (intégré)

| Fichier | Rôle | Taille |
|---------|------|--------|
| `config.js` | Configuration | 1K |
| `state.js` | Variables d'état | 512B |
| `api.js` | Appels API | 5.5K |
| `analyse.js` | Vue analyse | 10K |
| `cockpit.js` | Vue cockpit | 21K |
| `searchterms.js` | Search terms | 17K |
| `history.js` | Historique | 5.5K |
| `navigation.js` | Navigation onglets | 3K |
| `modals.js` | Fenêtres modales | 6K |
| `toast.js` | Notifications | 1K |
| `init.js` | Initialisation | 1.5K |
| `storage-recos.js` | LocalStorage recos | 1.5K |
| `storage-searchterms.js` | LocalStorage search terms | 1.5K |
| `classification.js` | Règles métier BTP | 3.5K |

---

## 🖼️ IMAGES

### Format standard
- **Format** : WebP (optimisé performance)
- **Dossier** : `/images/`

### Liste des images

| Fichier | Usage | Taille |
|---------|-------|--------|
| `logo.webp` | Logo principal | 42K |
| `logo.png` | Logo (fallback) | 343K |
| `renovation_general_(9).webp` | Carte blog rénovation | 118K |
| `plomberie.webp` | Carte blog plomberie | 131K |
| `salle_de_bain.webp` | Carte blog salle de bain | 1.9M ⚠️ |
| `peinture.webp` | Service peinture | 228K |
| `peinture_interieur.webp` | Peinture intérieure | 76K |
| `peinture_exterieur.webp` | Peinture extérieure | 228K |
| `electrique.webp` | Service électricité | 106K |
| `plomberie.webp` | Service plomberie | 131K |
| `menuiserie.webp` | Service menuiserie | 241K |
| `parquet.webp` | Service parquet | 88K |
| `charpante.webp` | Service charpente | 260K |
| `construction.webp` | Service construction | 161K |
| `toiture_et_construction.webp` | Toiture | 227K |
| `extention_et_toiture.webp` | Extension | 376K |
| `foto_avant_apres_platrerie.webp` | Avant/après | 72K |

### Favicons

| Fichier | Taille |
|---------|--------|
| `favicon.ico` | 16K |
| `favicon-16x16.png` | 1K |
| `favicon-32x32.png` | 3K |
| `apple-touch-icon.png` | 31K |
| `android-chrome-192x192.png` | 32K |
| `android-chrome-512x512.png` | 142K |

---

## 📊 TRACKING & ANALYTICS

| Service | ID |
|---------|-----|
| **GTM** | `GTM-5MZSVPL` |
| **GA4** | `G-S4F06V2C5C` |
| **Google Ads** | `792-943-0550` |

---

## 🔧 RÈGLES TECHNIQUES

### Dimensions SVG (GTmetrix CLS)

| Zone | Dimensions |
|------|------------|
| `top-bar` | `14×14` |
| `contact-bar` | `24×24` |
| `card-icon` | `60×60` |
| `footer` | `18×18` |

### Standards images

| Règle | Valeur |
|-------|--------|
| Format | WebP uniquement |
| Nommage | minuscules, underscores, pas d'espaces |
| Alt text | Obligatoire, optimisé SEO |
| Lazy loading | `loading="lazy"` sur images non-critiques |
| Dimensions | `width` et `height` explicites |

### Standards code

| Règle | Valeur |
|-------|--------|
| Indentation | 2 espaces |
| Encodage | UTF-8 |
| Doctype | HTML5 |

---

## 📁 FICHIERS SEO

| Fichier | Rôle |
|---------|------|
| `sitemap.xml` | Plan du site pour Google (10 articles) |
| `robots.txt` | Directives crawlers |
| `site.webmanifest` | PWA manifest |
| `googled215df2191151168.html` | Vérification Search Console |

---

## 🎯 SEO ENGINE

### Cluster SEO "Rénovation Paris"

| Catégorie | Articles |
|-----------|----------|
| Article pilier | `cout-renovation-appartement-paris.html` |
| Prix au m² | `renovation-appartement-paris-prix-m2.html` |
| Maison | `combien-coutent-travaux-renovation-maison.html` |
| Salle de bain | `renovation-salle-de-bain-guide-prix.html`, `prix-renovation-salle-de-bain-paris.html` |
| Cuisine | `prix-renovation-cuisine-paris.html` |
| Électricité | `prix-travaux-electricite-appartement.html` |
| Peinture | `prix-travaux-peinture-appartement.html` |
| Isolation | `prix-travaux-isolation-appartement.html` |
| Urgences | `degat-des-eaux-5-etapes.html` |

### Schema.org implémentés

| Type | Pages |
|------|-------|
| HomeAndConstructionBusiness | `index.html` |
| Service | `services.html`, `degat-des-eaux.html` |
| FAQPage | `services.html`, articles blog |
| Blog | `blog.html` |
| Article | Tous les articles `/blog/*.html` |
| BreadcrumbList | Toutes les pages principales |
| CollectionPage | `projets.html` |
| WebApplication | `cost_calculator.html` |

### Maillage interne

| Lien | Objectif |
|------|----------|
| → `services.html` | Découverte services |
| → `cost_calculator.html` | Conversion (simulateur) |
| → `degat-des-eaux.html` | Urgences plomberie |
| → Autres articles | Autorité thématique |

---

## 🚀 DÉPLOIEMENT

### Workflow automatique

```
Push main → GitHub Actions → FTP Deploy → OVH /www/
```

### Fichier workflow
- **Chemin** : `.github/workflows/deploy.yml`
- **Trigger** : Push sur `main`
- **Action** : FTP-Deploy-Action v4.3.5
- **Destination** : `/www/`

### Secrets GitHub requis
- `FTP_SERVER`
- `FTP_USERNAME`
- `FTP_PASSWORD`

---

## ⚠️ POINTS D'ATTENTION

### Documentation spécifique
- **Simulateur de devis** : Voir `/docs/SIMULATEUR.md` pour la documentation complète (v7.7)

### À corriger
- [ ] `salle_de_bain.webp` : 1.9M — trop lourd, à compresser
- [ ] `image-3.png` : 0 bytes — fichier vide à supprimer
- [ ] CSS blog : ajouter `.blog-card-img img { object-fit: cover }`
- [ ] PDF Simulateur : désignations CCTP à intégrer complètement

### Checklist blog en cours
- [x] Point 1 : Images WebP sur cartes blog
- [ ] Point 2 : Effet hover cartes
- [ ] Point 3 : Article mis en avant
- [ ] Point 4 : Filtrage par tags
- [ ] Point 5 : Section CTA
- [ ] Point 6 : SEO intro
- [ ] Point 7 : Pagination

---

## 🆕 NOUVELLES FONCTIONNALITÉS (Mars 2026)

### Simulateur de Devis v7.7

| Fonctionnalité | Description |
|----------------|-------------|
| **Panneau récapitulatif CCTP** | Tableau professionnel avec LOT, numérotation (1.1, 1.2...), sous-totaux |
| **Désignations CCTP + DTU** | Descriptions techniques complètes (matériaux, dimensions, normes) |
| **Clignotement onglets** | Animation jaune sur onglets non utilisés, arrêt automatique après sélection |
| **Structure Plomberie étendue** | WC, Lavabo, Douche, Baignoire, Dépose, Équipements, Tuyauterie, Pack SDB, Diagnostic |
| **Électricité CCTP** | Installation, Chauffage, Climatisation, VMC avec normes NF C15-100 et DTU |

### Commits récents

| Code | Description |
|------|-------------|
| SIM-CCTP-01 à 08 | Migration désignations CCTP Plomberie + Électricité |
| SIM-UX-05 | Clignotement tous les onglets non utilisés |
| SIM-PREVIEW-04 | Format CCTP professionnel tableau récapitulatif |

---

## 📧 EMAIL PROFESSIONNEL

| Élément | Valeur |
|---------|--------|
| Adresse | `contact@mistralpro-reno.fr` |
| Hébergement | OVH Zimbra Pro (50 Go) |
| Webmail | https://zimbra1.mail.ovh.net |
| POP3 | `ssl0.ovh.net:995` (SSL) |
| SMTP | `ssl0.ovh.net:465` (SSL) |

---

## 🔌 BACKEND API

### Mistral Pro Reno Backend

| Élément | Valeur |
|---------|--------|
| **Repo GitHub** | `seoettia-collab/mistralpro-reno-backend` |
| **Hébergement** | Render.com (Free tier) |
| **URL** | `https://mistralpro-reno-backend.onrender.com` |
| **Endpoint devis** | `POST /api/send-devis` |

### Fonctionnalités

| Route | Description |
|-------|-------------|
| `GET /` | Santé + infos service |
| `GET /health` | Health check |
| `POST /api/send-devis` | Envoi email devis via SMTP OVH |

### Variables d'environnement (Render)

| Variable | Valeur |
|----------|--------|
| `SMTP_HOST` | `ssl0.ovh.net` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `contact@mistralpro-reno.fr` |
| `SMTP_PASS` | `[mot de passe]` |

---

*Dernière mise à jour : 14 mars 2026*
