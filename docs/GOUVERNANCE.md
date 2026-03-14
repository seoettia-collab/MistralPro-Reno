# 📋 GOUVERNANCE PROJET — Site Vitrine Mistral Pro Reno

**Projet :** Mistral Pro Reno  
**Date :** 14 mars 2026  
**Auteur :** Ricardo ETTIA (Décideur projet)

---

## 0. INSTRUCTIONS DÉMARRAGE CLAUDE

**À exécuter au début de chaque nouvelle conversation.**

1. Lire GOUVERNANCE.md (ce fichier)
2. Consulter FICHE_TECHNIQUE.md pour retrouver les infos clés
3. Consulter ARCHITECTURE.md pour comprendre la structure
4. Attendre les instructions de Ricardo
5. Faire les modifications demandées
6. Commit + Push pour déployer

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
| Hébergement | OVH (auto-deploy via GitHub Actions) |

### 0.3 Structure documentation

```
/docs/
├── ARCHITECTURE.md      # Architecture technique
├── FICHE_TECHNIQUE.md   # Documentation détaillée
├── GOUVERNANCE.md       # Ce document (règles + démarrage)
└── SIMULATEUR.md        # Documentation simulateur de devis
```

### 0.4 Après clonage

1. Lire ce fichier GOUVERNANCE.md
2. Consulter FICHE_TECHNIQUE.md pour les détails techniques
3. Consulter SIMULATEUR.md pour la page cost_calculator
4. Attendre les instructions de Ricardo ou GPT

---

## 1. FORMAT COMMUNICATION OBLIGATOIRE

Toute validation, rapport, confirmation, demande technique, clôture de session ou décision structurelle devra obligatoirement respecter les règles suivantes :

### 1.1 Adressage explicite

Chaque communication doit être adressée explicitement :

```
GPT → À l'attention de Claude
Claude → À l'attention de GPT
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
| Architecture | Impact sur l'architecture système |
| Documentation | Fichiers à mettre à jour |
| Logs | Format des logs ajoutés/modifiés |
| Impact système | Conséquences sur le fonctionnement |
| Statut | État final (Production-ready, En cours, etc.) |

---

## 2. EXEMPLE DE COMMUNICATION CONFORME

```
RAPPORT — Implémentation fonctionnalité X

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ARCHITECTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Route ajoutée : POST /api/xxx
- Service modifié : xxx-service.js

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOCUMENTATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- FICHE_TECHNIQUE.md : Section ajoutée

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LOGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- [XXX_START] début opération
- [XXX_OK] succès
- [XXX_ERROR] échec

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPACT SYSTÈME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Aucun breaking change
- Backward compatible

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STATUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Production-ready

CLÔTURE — Implémentation fonctionnalité X

— Claude / GPT
```

---

## 3. RÔLES ET RESPONSABILITÉS

| Rôle | Responsable | Responsabilités |
|------|-------------|-----------------|
| Décideur projet | Ricardo ETTIA | Validation finale, gouvernance, arbitrage |
| Architecte système | GPT | Architecture, cohérence, validation technique |
| Ingénieur technique | Claude | Implémentation, documentation, déploiement |

---

## 4. DOCUMENTS DE RÉFÉRENCE

| Document | Emplacement | Description |
|----------|-------------|-------------|
| ARCHITECTURE.md | /docs/ | Architecture technique du système |
| FICHE_TECHNIQUE.md | /docs/ | Documentation technique détaillée |
| GOUVERNANCE.md | /docs/ | Règles + instructions démarrage (ce document) |
| SIMULATEUR.md | /docs/ | Documentation simulateur de devis |

---

## 5. APPLICATION

Cette directive de gouvernance est **effective immédiatement** et s'applique à toutes les communications techniques structurantes du projet.

---

## 6. IDENTIFICATION DES MESSAGES PAR MODULE

### 6.1 Objectif

Maintenir une synchronisation claire entre GPT et Claude et éviter toute confusion entre les directives en cours. Chaque sujet actif est identifié par un identifiant basé sur le module concerné.

### 6.2 Format identifiant

```
[MODULE]-[CODE]-[NUMÉRO]
```

Exemples :
- `SEO-OPT-01` → SEO Optimisation, directive #01
- `SIM-PDF-03` → Simulateur PDF, directive #03
- `BLOG-ART-02` → Blog Articles, directive #02

### 6.3 Modules disponibles

| Code | Module |
|------|--------|
| SEO | SEO / Référencement |
| SIM | Simulateur de devis |
| BLOG | Blog / Articles |
| PAGE | Pages HTML |
| CSS | Styles |
| JS | Scripts |
| IMG | Images |
| GTM | Google Tag Manager |

### 6.4 Suivi des directives

Chaque directive GPT → Claude doit inclure son identifiant :

```
SEO-OPT-02
DIRECTIVE — Optimisation meta descriptions

[Contenu de la directive]

— GPT
```

### 6.5 Clôture

Quand le sujet est terminé :

```
SEO-OPT-FINAL
CLÔTURE — Optimisation meta descriptions

[Résumé]

— Claude
```

### 6.6 Accusé de réception

Après chaque directive GPT, Claude répond avec le même identifiant :

```
SEO-OPT-02
ACCUSÉ DE RÉCEPTION

Directive comprise.
Implémentation en cours.

— Claude
```

---

*Document mis à jour le 14 mars 2026 — Gouvernance v2.0*
