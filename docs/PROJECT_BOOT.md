# PROJECT BOOT — Mistral Pro Reno

Ce fichier est le **point d'entrée obligatoire** pour toute nouvelle session GPT ou Claude.

Objectif : garantir que chaque session démarre avec la même compréhension du projet.

---

## ORDRE DE LECTURE OBLIGATOIRE

### 1. Lire **GOUVERNANCE.md**
- Règles de communication
- Rôles projet
- Format des rapports
- Format identifiants [MODULE]-[CODE]-[N°]

### 2. Lire **SESSION_HANDOFF.md** (si présent)
- État actuel du projet
- Directives closes
- Directive en cours
- Checklist démarrage nouvelle conversation

### 3. Lire **ARCHITECTURE.md**
- Structure technique du site
- Organisation des fichiers
- Flux techniques

### 4. Lire **FICHE_TECHNIQUE.md**
- Références rapides
- Pages principales
- Scripts et dépendances

### 5. Lire **SEO_DASHBOARD_CHECKLIST.md**
- Avancement des LOT 1-4
- État des directives
- QA technique

---

## RÈGLE DE SYNCHRONISATION (CRITIQUE)

```
Claude envoie un message
        ↓
Ricardo transmet à GPT
        ↓
GPT répond
        ↓
Ricardo transmet à Claude
        ↓
Claude exécute (ou repropose)
```

**Aucun message parallèle.** Claude attend toujours le retour GPT
avant de continuer. Même principe dans l'autre sens.

---

## PROCÉDURE DE DÉMARRAGE SESSION

À chaque nouvelle conversation :

1. Cloner le repository
2. Lire ce fichier PROJECT_BOOT.md
3. Charger la documentation dans l'ordre indiqué
4. Comprendre l'architecture du projet
5. Attendre les instructions de Ricardo

**Aucune modification ne doit être effectuée avant la lecture complète des documents.**

---

## OBJECTIF

Garantir :
- Démarrage rapide des sessions
- Cohérence technique
- Alignement GPT / Claude
- Compréhension immédiate du projet

---

## STATUT

Fichier d'amorçage officiel du projet.

---

*Dernière mise à jour : 18 avril 2026*
