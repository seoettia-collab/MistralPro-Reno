# Habillage du formulaire d’estimation — 14 novembre 2026

La proposition visuelle validée est intégrée au parcours actuel à trois étapes : projet, précisions, coordonnées. Le moteur du 14 novembre reste inchangé.

## Présentation

- Titre principal serif sur ordinateur, formulaire en Manrope local.
- Panneau blanc, progression numérotée, choix de travaux illustrés par six pictogrammes décoratifs et lisibles : trois colonnes sur ordinateur, deux sur téléphone.
- Surfaces en segments : trois colonnes sur ordinateur, deux sur téléphone.
- Photo de chantier existante conservée ; aucune photo de maquette générée n’est publiée.
- Bouton principal anthracite, texte blanc, contour laiton et halo discret. Reflet léger toutes les cinq secondes ; flèche déplacée de quatre pixels au survol ou au focus.
- Boutons désactivés sans animation. Le réglage système de réduction des animations supprime reflet, transitions et déplacement de flèche.
- À la dernière étape, le rappel est l’action principale ; l’estimation indicative et le retour restent secondaires.

## Périmètre technique

`css/estimation-refonte.css` est chargé uniquement par `estimation-projet.html`. La cascade historique du CTA est remplacée, sans modification des autres pages. La feuille versionnée `20261114a` vient après les styles intégrés pour rendre la présentation déterministe.

Aucun fichier JavaScript, identifiant, attribut de données, nom de champ, validation, contrat API, traitement de pièces jointes, calcul, PDF ou suivi publicitaire n’est modifié. Les scripts de la page sont identiques au main. Aucun formulaire de production n’a été envoyé.

## Contrôles

- Suite Node existante : 84 tests réussis, aucun échec.
- Comparaison du balisage : identifiants, attributs de données, formulaires et validations inchangés ; scripts identiques.
- `git diff --check` : conforme.
- Revue de cascade : focus des boutons secondaires sur fond clair ; déplacement de flèche supprimé même au survol avec réduction des animations.

La recette visuelle dans un navigateur reste à effectuer. Chromium local était indisponible dans cet environnement ; les tests et la revue du code ne remplacent pas cette vérification sur ordinateur et téléphone.
