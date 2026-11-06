# EST-20261106-01 — page d’estimation par conversation

La page `/estimation-projet.html` et la bascule des liens/alias depuis l’ancien simulateur ont déjà été publiées dans la version `0a77a297066990faecbc0db0aba4fdc81ac1683d`. Le fichier du simulateur historique reste conservé pour retour arrière. Le présent document décrit aussi le correctif progressif EST-PROGRESSIF-20261106 préparé sur cette base : testé et prêt pour publication par le pilote, sans publication par le codeur. Sa recette et ses vérifications publiques restantes figurent dans `ESTIMATION-PROGRESSIVE-2026-11-06.md`.

## Parcours

1. Prénom, nom, adresse complète du projet, CP/ville en Île-de-France, téléphone et email obligatoires. Accord de traitement et information sur l’analyse des documents. Les coordonnées sont saisies une fois puis conservées dans la session de la page.
2. Après validation des coordonnées, quatre catégories non présélectionnées : Salle de bain, Cuisine, Rénovation générale et Autre projet. Dès la première case cochée, une question de description contextualisée apparaît, sans clic supplémentaire ni appel IA. La multisélection reste possible avant le premier envoi. Les photos/plans sont facultatifs et proposés dans une zone repliable après sélection. Ajout cumulatif de plusieurs photos/plans PDF et retrait individuel. JPEG/PNG/PDF, 5 fichiers/8 Mo originaux, 5 pages par PDF et au plus 12 images d’analyse. Les PDF sont rendus en images, y compris scans, via PDF.js 4.10.38 fixé ; un document illisible ou au-delà des limites est signalé et bloque la génération jusqu’à retrait/remplacement. Aucun fichier n’est considéré analysé sur sa seule sélection.
3. Envoi explicite des catégories et de la description dans le champ `project` de l’API existante. Si le serveur retourne des questions (au plus quatre), une seule question exacte apparaît à la fois. Les réponses restent locales pendant la navigation Précédent/Suivant et « Je ne sais pas », puis sont récapitulées et envoyées ensemble après confirmation. Aucun appel modèle par catégorie ou réponse individuelle. Sinon, affichage de l’estimation préliminaire avec lots, quantités, totaux recalculés et hypothèses. Téléchargement PDF après réponse confirmée du serveur. Le contrat serveur reste : demande enregistrée dans Conversions avant l’appel IA, reçu exact requis pour annoncer cet enregistrement ; ce correctif frontend ne constitue pas une nouvelle preuve d’enregistrement en production.

Le client ne crée pas de devis officiel et ne voit aucun coût interne ni marge. Aucun mécanisme de signature, paiement ou email client n’est déclenché. La fourchette ±20 % est un ordre de grandeur de préparation, pas une garantie statistique ou contractuelle.

## Design

Charte actuelle `premium.css?v=1.1` : Raleway locale, fond crème, surfaces claires, encre sombre, accent jaune ponctuel. Le formulaire et la discussion sont dans un panneau unique. Mobile une colonne, sans double zone de défilement, champs 16 px et boutons 50 px. Photo chantier et logo existants du site. Les trois étapes restent courtes ; aucun délai artificiel annoncé.

## Contrat technique

Gateway fixe `https://facebook-ads-backend-s20a.onrender.com/public/site-estimates`. Pas de clé administrative, clé IA, secret bridge ou coordonnées dans l’URL. Token de session uniquement en mémoire, transmis en header. Aucune conversation n’est conservée en localStorage.

Les originaux et pages d’analyse sont stockés côté gateway en privé, accessibles pendant 24 heures au projet correspondant ; les documents sont disponibles en interne par route authentifiée. La génération ne relance pas automatiquement les erreurs réseau ou réponses ambiguës. Le même UUID et le même contenu sont conservés pour un réessai explicite de confirmation. Pendant une issue incertaine, catégories, description, réponses, coordonnées et fichiers sont verrouillés ; seul un renvoi identique peut être demandé. Aucun réessai automatique. Saisie et fichiers restent sur la page en cas d’erreur. Voir la recette du parcours progressif dans `ESTIMATION-PROGRESSIVE-2026-11-06.md`.

La route du backend et le bridge Mistral Devis doivent être configurés et activés pour servir le parcours. Les flags restent une protection côté serveur ; si le service est indisponible, l’interface ne prétend pas avoir créé une estimation. Pour le correctif progressif du 6 novembre, le pilote a vérifié un GET readiness HTTP 200 déclarant le service disponible et configuré, sans appel modèle ni preuve de génération réelle.

`?preview=depart` / `?preview=conversation` sont des modes de conception explicitement signalés, uniquement sur localhost/127.0.0.1/file. Ils n’effectuent aucun appel IA, stockage de demande ou PDF. Ne jamais activer ce mode sur le domaine public pour présenter un faux service.

## Historique de la validation initiale, avant la bascule déjà publiée

Les paragraphes ci-dessous retracent la préparation initiale et ses contrôles ; ils ne décrivent pas des blocages actuels du correctif progressif. La validation actuelle est consignée dans `ESTIMATION-PROGRESSIVE-2026-11-06.md` (18 tests dédiés, 70 tests Node au total).

Syntaxe JS contrôlée et 5 tests Node simulés : aperçu sans appel, conservation de saisie en panne, refus de session invalide, UUID identique après résultat incertain, reçu discordant ne confirmant pas une réception. Aucune donnée réelle ou génération payante utilisée.

Captures navigateur réel réalisées en mode aperçu sur 360/390/768/1440, départ et conversation, avec logo/photo/fontes réels chargés et sans débordement horizontal. Le choix de fichiers est personnalisé en français et accessible au clavier. Revue visuelle indépendante designer validée sur départ/conversation, mobile/tablette/desktop après corrections (breakpoint 900 px, introduction masquée pendant discussion mobile). Restent avant fusion : test de sélection/retrait de fichiers, PDF normal et scanné, erreurs de parsing, tests Express et chaîne de bout en bout isolée. PDFKit multipage testé séparément côté Devis ; le rendu typographique doit être confirmé dans un lecteur standard.

La bascule initialement prévue consistait à rediriger `cost_calculator.html` vers cette page en conservant les paramètres, puis à remplacer les liens menus/CTA dans les sources courantes. Cette bascule est désormais publiée dans `0a77a29`. Le retour arrière conserve le simulateur d’origine et retire la nouvelle orientation, sans toucher aux demandes reçues.

Sources techniques : https://mozilla.github.io/pdf.js/examples/ ; version vérifiée https://github.com/mozilla/pdf.js/releases/tag/v4.10.38 .

Recette finale : 57 tests Node du site et 6 tests Python IndexNow passent, check-seo.py --write valide 37 pages/29 URL indexables avec inventaire partiel du dépôt (tous HTML publics téléchargés, actifs vérifiés dans arbre Git). Nouvelle page temporairement noindex pendant activation, sans changement de navigation ; suppression du noindex et redirection legacy dans un commit de bascule distinct après readiness.

Parcours réel Chromium + HTTP/HMAC + PDF.js natif/scanné + PDFKit + SQLite validé avec IA simulée sur Node20.19.5/better-sqlite3 11.7.0. Les champs restent après erreur, les coordonnées inchangées permettent retour après questions, les formulaires POST et boutons initialement désactivés empêchent tout envoi de données en URL sans JS ; fallback téléphone explicite. Avertissements/exclusions et questions du résultat visibles, reçu unique sur résultat réussi.
