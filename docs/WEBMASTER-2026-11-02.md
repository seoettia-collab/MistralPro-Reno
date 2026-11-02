# Corrections du site — 2 novembre 2026

## Mandat

Ricardo confie au Webmaster les corrections ordinaires des incohérences vérifiées
sur le site, sans demande de confirmation à chaque étape. Préparer les correctifs,
les tester, publier et vérifier le domaine public. Ce mandat ne transforme pas un
résultat non vérifié en résultat acquis et ne couvre pas des envois fictifs de
prospects en production. Le pilote coordonne la conception, le code et le contrôle.

## Lot livré

- Normalisation HTTPS et www, y compris les liens HTTP avec www. Les requêtes
  explicites vers `index.html`, à la racine ou dans un dossier, convergent vers
  leur URL de dossier. `THE_REQUEST` distingue la requête du visiteur de la
  résolution interne du fichier index. Les paramètres sont conservés.
- La page `merci.html` ne charge plus GTM, son iframe ou `main.js` : une simple
  visite ou un rechargement ne déclenche plus la conversion Google Ads liée à
  cette page. Suppression de l'ancien événement `lead_form` au chargement de
  cette page dans `main.js`. Les autres parcours conservent leurs signaux.
- La page ne prétend plus qu'une demande a été reçue ou un PDF généré à partir
  de sa seule visite. Elle oriente vers le formulaire, le simulateur et le
  téléphone. Le délai affiché est de 48 h après réception d'une demande.
- Le simulateur exige une réponse JSON avec `success === true`, le numéro exact
  du devis envoyé et un `messageId` non vide avant de confirmer la transmission.
  HTTP 200 seul, HTML, JSON invalide, refus applicatif et reçu discordant ne
  confirment pas l'envoi. Aucun nouvel essai automatique n'est introduit.
- La réponse a été confrontée au vrai contrat de
  `seoettia-collab/mistralpro-reno-backend/server.js` : le backend attend la réponse
  SMTP puis renvoie `success`, `messageId` et `numero_devis`. Cette preuve porte
  sur la transmission par email, pas sur un stockage durable en base ou une
  lecture par un conseiller. Le backend lui-même n'est pas modifié dans ce lot.
- La mention non justifiée « artisans certifiés RGE » du simulateur est remplacée
  par « nos équipes », sans inventer de certification. Zone d'intervention
  formulée comme Paris et les autres départements d'Île-de-France.
- Script du simulateur versionné `11.5` pour renouveler son cache. Le workflow
  déploie uniquement après réussite de toutes les suites Node et des contrôles
  SEO/IndexNow existants.

## Validation avant publication

- 49/49 tests Node réussis, dont visite/rechargement sans conversion, conservation
  des événements des autres parcours et réponses email incorrectes ou ambiguës.
- 6/6 tests IndexNow réussis ; aucune soumission réelle pendant les tests locaux.
- Syntaxe des deux scripts modifiés validée.
- Audit SEO : 36 pages publiques contrôlées, 29 URL canoniques indexables,
  11 articles ; sitemap, JSON-LD, liens et ressources valides.
- Contrôle indépendant du diff effectué. Aucun formulaire, email ou appel de
  test déclenché en production. Les transports des tests sont simulés.
- La tentative d'aperçu Apache local est indisponible dans cet environnement
  (changement d'identité du processus refusé). Ne pas déclarer de test Apache
  local réussi. Contrôler les redirections réelles immédiatement après publication
  et restaurer le lot par un nouveau commit en cas de boucle ou d'erreur.

## Mesure : limites à conserver

Le lot supprime des signaux de conversion non fiables. Il ne prétend pas avoir
installé un nouveau comptage complet Google Ads ni consolidé les demandes
organiques en base. Aucun tag publicitaire supplémentaire ni coordonnées client
ne sont envoyés. Le formulaire `/devis-travaux/` conserve son reçu durable et sa
mesure OpenAI facultative existante. Ne pas confondre ses reçus, une transmission
SMTP du simulateur, un clic téléphone et une conversion publicitaire reçue.

Google Search Console, période du 4 au 31 octobre : 694 impressions, 4 clics,
CTR 0,58 %, position moyenne 46,83. Période antérieure à la refonte. Lecture du
1er novembre sans lignes au moment du contrôle ; ne pas assimiler à zéro trafic.
Le dernier état du sitemap exposé date du 24 octobre : 0 erreur, 2 avertissements
sans détail. Bing est connecté mais la récupération des statistiques est
temporairement limitée par l'IP du connecteur. Pas de resoumission répétée.

## Reprise et retour arrière

Après publication, vérifier les statuts et destinations des variantes HTTP,
non-www, `index.html`, les pages canoniques, le script `11.5` et l'absence de GTM
dans la page merci. Vérifier le résultat de l'étape IndexNow après déploiement.
Consigner le résultat réel dans la conversation de livraison et l'historique
GitHub Actions, sans présumer qu'une réception IndexNow démontre l'indexation.

Les prochaines améliorations du comptage doivent partir de reçus dédupliqués et
de sources d'attribution vérifiables. Toute reprise des balises publicitaires doit
préserver le consentement et distinguer transmission email et stockage durable.

Retour arrière : nouveau commit restaurant les fichiers du parent du lot.
Restaurer ensemble le script du simulateur, sa version HTML et son assertion de
test. Aucune migration de base ni modification de configuration publicitaire.

Références techniques :
- https://httpd.apache.org/docs/2.4/mod/mod_rewrite.html
- https://httpd.apache.org/docs/2.4/rewrite/remapping.html
