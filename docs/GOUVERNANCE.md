# 📋 GOUVERNANCE PROJET — Site Vitrine Mistral Pro Reno

**Projet :** Mistral Pro Reno  
**Version :** 1.0  
**Date :** 8 mars 2026  
**Auteur :** Ricardo ETTIA (Décideur projet)

---

## 0. INSTRUCTIONS DÉMARRAGE CLAUDE

**À exécuter au début de chaque nouvelle conversation.**

### 0.1 Clonage du repo

```bash
# Configuration Git
git config --global user.name "Ricardo ETTIA"
git config --global user.email "ricardoettiadocuments@gmail.com"

# Clone du site (token fourni dans les fichiers projet Claude)
cd /home/claude
git clone https://[TOKEN]@github.com/seoettia-collab/MistralPro-Reno.git
cd MistralPro-Reno
```

> ⚠️ Le token GitHub est stocké dans le fichier SKILL des projets Claude, pas dans ce document public.

### 0.2 Informations projet

| Élément | Valeur |
|---------|--------|
| Projet | Site vitrine Mistral Pro Reno |
| Organisation GitHub | seoettia-collab |
| Repo | MistralPro-Reno |
| Branche | main |
| URL Production | https://www.mistralpro-reno.fr |
| Hébergement | OVH (FTP auto-deploy via GitHub Actions) |
| Chemin local Windows | C:\Mistral Logiciel\site-mistralpro-reno |

### 0.3 Déploiement

Le déploiement est **automatique** :
1. Push sur `main`
2. GitHub Actions déclenche `deploy.yml`
3. FTP Deploy vers OVH `/www/`

### 0.4 Structure du site

```
/MistralPro-Reno/
├── index.html              # Page d'accueil
├── services.html           # Page services
├── projets.html            # Page réalisations
├── blog.html               # Liste des articles
├── cost_calculator.html    # Simulateur de devis
├── degat-des-eaux.html     # Landing page urgence
├── mentions-legales.html   # Mentions légales
├── merci.html              # Page de remerciement
├── 404.html                # Page erreur
├── sitemap.xml             # Sitemap SEO
├── robots.txt              # Robots SEO
│
├── /blog/                  # Articles de blog
│   ├── cout-renovation-appartement-paris.html
│   ├── degat-des-eaux-5-etapes.html
│   └── renovation-salle-de-bain-guide-prix.html
│
├── /css/                   # Styles (11 fichiers)
├── /js/                    # Scripts (16 fichiers)
├── /images/                # Images WebP optimisées
├── /fonts/                 # Polices Raleway
│
├── /docs/                  # Documentation
│   └── GOUVERNANCE.md      # Ce document
│
└── /.github/workflows/     # CI/CD
    └── deploy.yml          # FTP Deploy vers OVH
```

### 0.5 Structure documentation

```
/docs/
├── GOUVERNANCE.md      # Ce document (règles + démarrage)
├── FICHE_TECHNIQUE.md  # Référentiel rapide (pages, CSS, JS, images)
├── ARCHITECTURE.md     # Architecture technique du système
└── SIMULATEUR.md       # Documentation simulateur de devis (page complexe)
```

### 0.6 Après clonage

1. Lire `GOUVERNANCE.md` (ce fichier)
2. Consulter `FICHE_TECHNIQUE.md` pour retrouver les infos clés
3. Consulter `ARCHITECTURE.md` pour comprendre la structure
4. Attendre les instructions de Ricardo
5. Faire les modifications demandées
6. Commit + Push pour déployer

---

## 1. FORMAT COMMUNICATION OBLIGATOIRE

Toute validation, rapport, confirmation, demande technique, clôture de session ou décision structurelle devra obligatoirement respecter les règles suivantes :

### 1.1 Adressage explicite

Chaque communication doit être adressée explicitement :

```
À l'attention de GPT et Claude,
```

Ou ciblée si nécessaire :

```
À l'attention de GPT,
À l'attention de Claude,
```

### 1.2 Format bloc unique

- Le message doit être fourni **intégralement dans un bloc unique** prêt à copier
- **Aucun texte hors bloc** n'est autorisé pour les communications structurantes
- Format : bloc de code markdown (```)

### 1.3 Intitulé clair

Chaque communication doit inclure un intitulé explicite parmi :

| Intitulé | Usage |
|----------|-------|
| `VALIDATION` | Approbation d'une implémentation |
| `RAPPORT` | Compte-rendu de session ou d'opération |
| `FIX` | Correction de bug ou problème |
| `DIRECTIVE` | Instruction de gouvernance |
| `CLÔTURE` | Fin de session ou de sujet |
| `DEMANDE` | Requête technique ou fonctionnelle |
| `CONFIRMATION` | Accusé réception |

### 1.4 Protocole gouvernance

Chaque communication structurante doit inclure les sections pertinentes :

| Section | Description |
|---------|-------------|
| Fichiers modifiés | Liste des fichiers impactés |
| Documentation | Fichiers doc à mettre à jour |
| Impact SEO | Conséquences sur le référencement |
| Impact performance | Conséquences GTmetrix/PageSpeed |
| Statut | État final (Production-ready, En cours, etc.) |

---

## 2. EXEMPLE DE COMMUNICATION CONFORME

```
À l'attention de GPT et Claude,

RAPPORT — Correction images blog.html

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FICHIERS MODIFIÉS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- blog.html : Images WebP ajoutées aux cartes
- css/blog.css : Règle object-fit ajoutée

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPACT SEO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Alt text optimisés pour chaque image
- Attributs width/height explicites (CLS)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPACT PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Format WebP (gain ~30% vs PNG)
- Lazy loading activé

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STATUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Production-ready — Push effectué

CLÔTURE — Correction images blog.html

— Claude
```

---

## 3. RÔLES ET RESPONSABILITÉS

| Rôle | Responsable | Responsabilités |
|------|-------------|-----------------|
| Décideur projet | Ricardo ETTIA | Validation finale, gouvernance, arbitrage |
| Architecte système | GPT | Architecture, cohérence, validation technique |
| Ingénieur technique | Claude | Implémentation, documentation, déploiement |

---

## 4. TRACKING & ANALYTICS

| Élément | Valeur |
|---------|--------|
| GTM | GTM-5MZSVPL |
| GA4 | G-S4F06V2C5C |
| Google Ads | 792-943-0550 |

---

## 5. EMAIL PROFESSIONNEL

| Élément | Valeur |
|---------|--------|
| Adresse | contact@mistralpro-reno.fr |
| Hébergement | OVH Zimbra Pro (50 Go) |
| Webmail | https://zimbra1.mail.ovh.net |
| POP3 | ssl0.ovh.net:995 (SSL) |
| SMTP | ssl0.ovh.net:465 (SSL) |

---

## 6. MÉTHODE QA — CHECKLIST INTERACTIVE

### 6.1 Principe

À chaque phase de vérification (fin de lot, déploiement, correction), Claude utilise la **méthode QA interactive** pour valider le fonctionnement avec Ricardo.

### 6.2 Format

1. **Questionnaires interactifs** : Cases à cocher Oui/Non dans l'interface Claude
2. **Test par onglet/module** : Chaque section testée séparément
3. **Rapport synthétique** : Généré automatiquement après les tests

### 6.3 Structure des questions

Pour chaque test :
- **Manipulation** : Action à effectuer
- **Question** : Ce que Ricardo doit vérifier (Oui/Non)
- **Utilité** : Pourquoi cette fonction existe

### 6.4 Format rapport QA

```
RAPPORT QA — [Nom du module/lot]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RÉSUMÉ DES TESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Module 1 ............... OK
❌ Module 2 ............... PROBLÈME
✅ Module 3 ............... OK

SCORE : X/Y modules OK (XX%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BUGS DÉTECTÉS — PRIORITÉ HAUTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. [Description bug]
2. [Description bug]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AMÉLIORATIONS — PRIORITÉ MOYENNE/BASSE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. [Description amélioration]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROCHAINES ACTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Corriger bugs prioritaires
2. Améliorer UX si temps disponible

— Claude
```

### 6.5 Application

Cette méthode QA est **obligatoire** pour :
- Validation de fin de lot
- Déploiement majeur
- Correction de bugs critiques
- Nouvelle fonctionnalité

---

## 7. IDENTIFICATION DES MESSAGES PAR MODULE

### 7.1 Objectif

Maintenir une synchronisation claire entre GPT et Claude et éviter toute confusion entre les directives en cours. Chaque sujet actif est identifié par un identifiant basé sur le module concerné.

### 7.2 Codes modules

| Module | Code |
|--------|------|
| Cockpit | CK |
| Audit IA | AU |
| Studio SEO | SS |
| Publication | PB |
| Image IA | IM |
| Gouvernance | GOV |
| Architecture | ARCH |
| Bug/Fix | FX |

### 7.3 Format identifiant

```
[CODE]-[THÈME]-[NUMÉRO]
```

**Exemples :**
- `CK-CONC-01` : Cockpit, Concurrence, message 1
- `AU-PROMPT-03` : Audit IA, Prompt, message 3
- `SS-GEN-02` : Studio SEO, Génération, message 2

### 7.4 Numérotation continue

Tant que le sujet n'est pas terminé, le même identifiant racine est conservé :

```
CK-CONC-01
CK-CONC-02
CK-CONC-03
CK-CONC-04
```

### 7.5 Clôture

Quand le sujet est terminé :

```
CK-CONC-FINAL
```

Après clôture, un nouveau sujet utilisera une nouvelle numérotation.

### 7.6 Accusé de réception

Après chaque directive GPT, Claude répond avec le même identifiant :

```
CK-CONC-02
ACCUSÉ DE RÉCEPTION

Directive comprise.
Implémentation en cours.

— Claude
```

---

## 8. APPLICATION

Cette directive de gouvernance est **effective immédiatement** et s'applique à toutes les communications techniques structurantes du projet.

---

*Document créé le 8 mars 2026 — Gouvernance v1.1*
*Mise à jour 9 mars 2026 — Ajout méthode QA*
*Mise à jour 10 mars 2026 — Ajout protocole identification messages*
