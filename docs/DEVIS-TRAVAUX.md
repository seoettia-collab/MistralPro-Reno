# Devis travaux sur le domaine officiel

La page `/devis-travaux/` et ses assets sont servis directement par OVH depuis ce dépôt. Aucun iframe, PHP, reverse proxy ou redirection navigateur vers Render n'est ajouté. Apache peut ajouter la barre finale du répertoire ; le domaine reste `www.mistralpro-reno.fr`.

Source : `seoettia-collab/facebook-ads-backend` au commit `fda44a8dd87845b8b52ea9932f66ad989d40e814`, dossier `public/site-lead-form/`. HTML rendu avec les quatre champs publics de `config/business-context.json` (nom, activité, zone, téléphone) et les six services. CSS, police Archivo et licence OFL sont copiés à l'identique. Le seul changement du client JavaScript est l'URL du fetch : `https://facebook-ads-backend-s20a.onrender.com/public/lead-requests`. La version canonique backend n'est pas modifiée.

L'Origin `https://www.mistralpro-reno.fr` est déjà autorisée par `services/site-leads.js`. Le CSP local `devis-travaux/.htaccess` autorise cette seule destination API externe ; le reste du site conserve ses règles. Ce répertoire ne met pas ses réponses en cache. Seule l'ancienne redirection `/devis-travaux` est retirée à la racine, toutes les autres restent intactes.

Validation synthétique Node 20.11.1 : `node --check devis-travaux/form.js` puis `node --test tests/official-quote-page.test.js`. Les huit tests exécutent le client contre des réponses simulées : attribution, reçu durable, UUID identique après résultat ambigu/rechargement, double clic et stockage indisponible. Le hash du JS normalisé prouve que seul le fetch diffère de la source canonique. Assets, contexte public et politique locale sont contrôlés.

Contrôle OPTIONS en production le 28/10/2026 : HTTP 204, Access-Control-Allow-Origin `https://www.mistralpro-reno.fr`, POST/OPTIONS et Content-Type autorisés, Cache-Control no-store. Aucun POST réel ou communication utilisé pour la recette. Après merge, le workflow existant `.github/workflows/deploy.yml` déploie par FTP vers OVH `/www/`. Le pilote vérifie alors la page et les en-têtes réellement servis avant d'utiliser cette URL dans Ads. La création d'annonce et la vérification du compte Ads restent hors du présent changement.

Toute mise à jour future du formulaire doit reporter la version canonique backend puis conserver l'adaptation d'URL et sa politique CORS/CSP. Pas de clé d'API ni de secret dans cette page.
