# EST-20261106-01 — page d’estimation par conversation

Travail préparé sur branche, pas publié. Nouvelle URL prévue : `/estimation-projet.html`. Les menus, liens existants et le simulateur restent intacts tant que la recette complète n’est pas validée.

## Parcours

1. Prénom, nom, adresse complète du projet, CP/ville en Île-de-France, téléphone et email obligatoires. Accord de traitement et information sur l’analyse des documents. Les coordonnées sont saisies une fois puis conservées dans la session de la page.
2. Texte libre ou texte collé. Ajout cumulatif de plusieurs photos/plans PDF et retrait individuel. JPEG/PNG/PDF, 5 fichiers/8 Mo originaux, 5 pages par PDF et au plus 12 images d’analyse. Les PDF sont rendus en images, y compris scans, via PDF.js 4.10.38 fixé ; un document illisible ou au-delà des limites est signalé et bloque la génération jusqu’à retrait/remplacement. Aucun fichier n’est considéré analysé sur sa seule sélection.
3. Questions courtes ou estimation préliminaire avec lots, quantités, totaux recalculés et hypothèses. Téléchargement PDF après réponse confirmée du serveur. Demande enregistrée dans Conversions avant l’appel IA, reçu exact requis pour annoncer cet enregistrement.

Le client ne crée pas de devis officiel et ne voit aucun coût interne ni marge. Aucun mécanisme de signature, paiement ou email client n’est déclenché. La fourchette ±20 % est un ordre de grandeur de préparation, pas une garantie statistique ou contractuelle.

## Design

Charte actuelle `premium.css?v=1.1` : Raleway locale, fond crème, surfaces claires, encre sombre, accent jaune ponctuel. Le formulaire et la discussion sont dans un panneau unique. Mobile une colonne, sans double zone de défilement, champs 16 px et boutons 50 px. Photo chantier et logo existants du site. Les trois étapes restent courtes ; aucun délai artificiel annoncé.

## Contrat technique

Gateway fixe `https://facebook-ads-backend-s20a.onrender.com/public/site-estimates`. Pas de clé administrative, clé IA, secret bridge ou coordonnées dans l’URL. Token de session uniquement en mémoire, transmis en header. Aucune conversation n’est conservée en localStorage.

Les originaux et pages d’analyse sont stockés côté gateway en privé, accessibles pendant 24 heures au projet correspondant ; les documents sont disponibles en interne par route authentifiée. La génération ne relance pas automatiquement les erreurs réseau ou réponses ambiguës. Le même UUID et le même contenu sont conservés pour un réessai de confirmation. Saisie et fichiers restent sur la page en cas d’erreur.

La route du backend et le bridge Mistral Devis doivent être configurés et activés avant ouverture du parcours. Les flags sont désactivés par défaut ; dans cet état, l’interface informe de l’indisponibilité et ne prétend pas avoir créé une estimation.

`?preview=depart` / `?preview=conversation` sont des modes de conception explicitement signalés, uniquement sur localhost/127.0.0.1/file. Ils n’effectuent aucun appel IA, stockage de demande ou PDF. Ne jamais activer ce mode sur le domaine public pour présenter un faux service.

## Validation exécutée

Syntaxe JS contrôlée et 5 tests Node simulés : aperçu sans appel, conservation de saisie en panne, refus de session invalide, UUID identique après résultat incertain, reçu discordant ne confirmant pas une réception. Aucune donnée réelle ou génération payante utilisée.

Captures navigateur réel réalisées en mode aperçu sur 360/390/768/1440, départ et conversation, avec logo/photo/fontes réels chargés et sans débordement horizontal. Le choix de fichiers est personnalisé en français et accessible au clavier. Revue visuelle indépendante designer validée sur départ/conversation, mobile/tablette/desktop après corrections (breakpoint 900 px, introduction masquée pendant discussion mobile). Restent avant fusion : test de sélection/retrait de fichiers, PDF normal et scanné, erreurs de parsing, tests Express et chaîne de bout en bout isolée. PDFKit multipage testé séparément côté Devis ; le rendu typographique doit être confirmé dans un lecteur standard.

Après validation seulement : rediriger `cost_calculator.html` vers cette page en conservant les paramètres, puis remplacer les liens menus/CTA dans les sources courantes. Le retour arrière conserve le simulateur d’origine et retire la nouvelle orientation, sans toucher aux demandes reçues.

Sources techniques : https://mozilla.github.io/pdf.js/examples/ ; version vérifiée https://github.com/mozilla/pdf.js/releases/tag/v4.10.38 .
