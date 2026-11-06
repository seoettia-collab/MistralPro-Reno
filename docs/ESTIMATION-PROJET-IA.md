# Estimation de projet — fiche de référence

La page publique est `/estimation-projet.html`. La bascule depuis l’ancien simulateur a déjà été publiée ; le parcours progressif `v2` est publié dans `cc2c9287d6ff8a51aad99e13cc67ae6ce53a4741`. Les fichiers du simulateur historique sont conservés pour retour arrière.

L’évolution courante préparée est **AUTO-20261106, frontend v3** : une entrée unique projet/catégories + sept coordonnées et accord, puis un questionnaire métier local qui apparaît automatiquement sans submit ni appel réseau. Le premier appel au service intervient seulement après revue complète et choix explicite « Obtenir mon estimation ». Si le service demande des précisions, ses questions exactes sont ensuite traitées une par une et envoyées ensemble.

La fiche actuelle détaillée est [ESTIMATION-PROGRESSIVE-2026-11-06.md](ESTIMATION-PROGRESSIVE-2026-11-06.md) : parcours, moteur métier, détection corrigeable, embranchements, fichiers, reçus, snapshots/UUID, création de session incertaine, aperçu local, tests simulés et contrôle public par le pilote. Elle distingue le lot préparé de sa publication et de toute preuve de Conversions/PDF réel.

L’API et le bridge existants restent inchangés. Le client ne crée pas de devis officiel : pas de signature, paiement ou email client nouveau dans ce parcours. La fourchette ±20 % reste un ordre de grandeur de préparation, pas une garantie statistique ou contractuelle. Le PDF définitif et les règles métier restent côté service. La détection et les questions de préparation locales n’utilisent aucun modèle.

Charte : `premium.css?v=1.1`, Raleway locale, fond crème, surfaces claires, encre sombre et accent jaune ponctuel. Champs 16 px, contrôles d’au moins 44 px, un seul questionnaire visible et aucun focus forcé pendant la frappe/autofill initiale. Originaux/pages PDF.js et protections documentaires existantes conservés. Source technique PDF.js : https://mozilla.github.io/pdf.js/examples/ ; version fixée 4.10.38.

La portée de la bascule initiale et le retour arrière des liens/alias restent documentés dans [ESTIMATION-CUTOVER.md](ESTIMATION-CUTOVER.md). Le codeur du correctif v3 ne réalise pas de commit/push/déploiement ni d’appel de production ; ces contrôles relèvent du pilote.
