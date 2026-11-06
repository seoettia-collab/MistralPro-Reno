# EST-PROGRESSIF-20261106 — parcours frontend progressif

## État du lot

Correctif frontend préparé et contrôlé localement, sans commit, push ou publication par le codeur. Revue indépendante validée par le pilote. Aucun appel modèle, vrai lead, génération PDF de production ou événement publicitaire n’a été déclenché pour cette recette.

Le pilote a vérifié en lecture seule un GET readiness du service : HTTP 200, disponible et configuré, sans appel modèle. Ce constat vérifie la disponibilité déclarée du service, pas une estimation réelle, un enregistrement Conversions ou une génération PDF de production.

## Parcours retenu

- Les sept champs d’identité obligatoires, le consentement, le honeypot et l’attribution autorisée sont conservés.
- Après les coordonnées, les quatre cases Salle de bain / Cuisine / Rénovation générale / Autre projet sont toutes décochées. Le premier choix affiche immédiatement la question de description contextualisée. Les cases restent disponibles pour une multisélection avant l’envoi. Décocher la dernière case masque la description, ses pièces et son bouton d’envoi.
- Les pièces JPEG/PNG/PDF sont facultatives, dans une section repliable disponible après sélection. La préparation des originaux/pages, les limites de fichiers/pages et le retrait individuel utilisent les protections existantes.
- Seul le bouton explicite de préparation envoie catégories exactes et description dans `project`. Aucun endpoint ou appel modèle supplémentaire.
- Un retour `state: questions` est accepté uniquement avec une à quatre questions textuelles non vides. Chaque question exacte est affichée via `textContent`, une par écran. Aucune interprétation HTML. Précédent garde les réponses, « Je ne sais pas » remplit une réponse explicite. Une revue précède l’envoi groupé de toutes les réponses avec leurs questions exactes. La navigation locale ne consomme aucun tour serveur ; la limite de six générations par session reste appliquée côté serveur.
- « Préciser mon projet » après une estimation ouvre les nouvelles questions une par une avec des réponses vierges. Sans nouvelles questions, il ouvre une nouvelle description contextualisée.
- Après un échange, changer de catégories exige une confirmation annonçant le remplacement du questionnaire et de l’estimation. La même session, les coordonnées et les fichiers sont conservés ; description, file de questions, réponses, historique et résultat locaux sont vidés. Aucune seconde session/lead n’est créée pour ce changement. Le nouveau `project` annonce explicitement la nouvelle orientation et demande d’ignorer catégories, réponses, questionnaires et estimations antérieurs conservés dans le contexte serveur. Il ne prétend pas effacer ces tours du backend.

## Protection des opérations incertaines

Le snapshot envoyé contient `project` et les fichiers préparés ; son UUID et son contenu sont conservés en mémoire jusqu’à une réponse cohérente. Une erreur réseau, un JSON invalide ou un retour inattendu suspend toute modification des catégories, description, réponses, coordonnées et fichiers. Le bouton de vérification réémet exactement le même snapshot et le même UUID, uniquement sur action du visiteur. Aucun rejeu automatique et aucun nouvel UUID sur ce chemin. Le verrou `busy` empêche double clic/Enter ou navigation pendant un appel ; une réponse tardive doit correspondre à la requête en cours.

Un reçu n’annonce un enregistrement que si `stored === true` et si son identifiant correspond exactement à la session. Le reçu exact reste affichable même si le service IA échoue. Le téléchargement utilise toujours l’endpoint PDF existant et n’appelle pas de génération frontend supplémentaire. Les données et le token restent en mémoire, sans localStorage. Une expiration propose de contacter l’équipe et conserve la saisie ; elle ne contourne pas l’expiration par une nouvelle session.

## Validation locale exécutée

- `node --check js/estimation-projet.js` : valide.
- `node --test tests/estimation-projet.test.js` : 18 tests simulés passent.
- `node --test tests/*.test.js` : 70 tests passent.
- `git diff --check` : aucun défaut.
- Revue indépendante : sélection immédiate sans appel, multisélection, questions exactes, réponses conservées, envoi groupé, snapshot gelé et redémarrage sans ancien contexte validés sur scénarios simulés distincts. Audit SEO/IndexNow confirmé par le contrôleur.

Les tests exécutent le vrai script frontend dans un DOM simulé, avec fetch entièrement remplacé : aucune donnée n’a été envoyée au service réel. Ils couvrent également aperçu local sans appel, reçu discordant, PDF sans nouvel appel de génération et fichiers préservés après une erreur incertaine. Ils ne prouvent pas la réalisation d’un parcours de production Conversions/PDF.

HTML, CSS et JavaScript portent les versions de cache CSS/JS `v=2`. Les contrôles tactiles sont d’au moins 44 px ; les champs de saisie restent à 16 px et les questions/revues reçoivent le focus lors des transitions. Le champ de description cesse d’être obligatoire lorsqu’il est masqué afin de ne pas bloquer la validation native des écrans questions/revue.

## Contrôles de publication confiés au pilote

Après publication : vérifier par GET la présence du HTML progressif et des URL CSS/JS `v=2`, leur disponibilité et le rendu mobile/ordinateur du parcours. Vérifier que les quatre cases ne sont pas précochées, que le choix affiche immédiatement la question contextualisée et que le dernier décochage la masque. Les vérifications publiques ne doivent pas créer un vrai lead ou appeler le modèle sans recette autorisée. Toute preuve d’enregistrement Conversions ou de PDF réel doit être qualifiée séparément ; aucune n’est revendiquée pour ce correctif.

Le backend, la persistance du contexte, le CRM, les limites de session et la génération du PDF ne sont pas modifiés. Le reclassement interne générique « Rénovation » peut rester en place ; les catégories exactes font partie du texte de projet transmis à l’API existante.
