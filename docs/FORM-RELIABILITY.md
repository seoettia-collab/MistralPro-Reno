# Formulaire de devis : reprise sans stockage navigateur

Date : 30 octobre 2026.

## Comportement corrigé

Un navigateur qui refuse la lecture ou l’écriture de sessionStorage peut envoyer la demande. Le formulaire garde l’UUID et son empreinte en mémoire pour la durée de la page ; les reprises après timeout, résultat ambigu ou limitation temporaire conservent ce même UUID. Un ancien reçu lisible dans sessionStorage ne remplace jamais le reçu courant en mémoire.

Après échec de lecture, écriture ou suppression, le stockage persistant est ignoré jusqu’au rechargement. Cette règle évite qu’une demande explicite nouvelle ou une correction après rejet avant stockage ressuscite un ancien reçu. L’action « Faire une autre demande » crée un nouvel UUID seulement après confirmation de la précédente.

La confirmation exige toujours une réponse HTTP réussie avec success=true, stored=true et le reçu identique à l’UUID transmis. L’absence de capacité UUID sécurisée interdit l’envoi et propose le téléphone. Les champs, les six travaux, la validation, le hash du payload, la provenance et l’endpoint existants restent inchangés.

## Limite de reprise

Quand sessionStorage est refusé, la reprise est garantie seulement tant que la page reste ouverte. En cas de résultat incertain, le message invite à réessayer avec les mêmes informations sans fermer ni recharger la page. Aucun stockage alternatif de coordonnées ou autre pisteur n’est ajouté. La conservation transversale aux rechargements reste inchangée lorsque sessionStorage fonctionne.

Le suivi OpenAI n’est pas ajouté par ce correctif. Aucun pixel, envoi de données à OpenAI, consentement publicitaire, changement de campagne ou de budget n’est inclus. Un événement de conversion devra être intégré uniquement sur contrat officiel confirmé, après le reçu de stockage et dans un lot distinct.

## Validation

- 12/12 tests du site officiel PASS Node24.22.1, incluant les fixtures publiques et les parcours navigateur.
- 8/8 cas client de la suite backend PASS Node24.22.1, exécutés à partir des cas exacts de tests/gpt-ads-form.test.js dans un runner temporaire sans les dépendances SQLite.
- La suite backend complète de13tests, dont5serveur/SQLite inchangés, n’a pas été rejouée dans cet environnement : exécutable Node20 absent et dépendance SQLite installée pour son ABI. Aucun code de stockage serveur n’a changé.
- Cas couverts : stockage refusé, lecture refusée, ancien reçu lisible mais écriture refusée, suppression refusée, timeout après acceptation possible,429, doubleclic, modification après résultat ambigu, stored=false, reçu discordant et UUID sécurisé indisponible.
- Le client officiel diffère du client backend uniquement par l’URL absolue d’intake approuvée ; hash blob canonique f43c2e3017057326602cf16346eb560a1528d215.
- Aucun formulaire de production envoyé ni SMS, appel ou notification de test déclenché.

## Mise en production et retour arrière

Fusion et déploiement restent sous contrôle du Pilote. Après livraison, vérifier les fichiers servis et le rendu sans soumettre de fausse demande. Les tests de refus de stockage restent isolés en VM.

Pour revenir en arrière, restaurer le script et le test de la branche main antérieure au correctif ; les tables, reçus et données en base n’ont pas été migrés.

