# Bing et IndexNow — 1 novembre 2026

Le site publie son fichier de preuve de propriété IndexNow à sa racine.
Il s'agit du jeton public de vérification d'hébergement exigé par IndexNow,
pas d'une clé API du compte Microsoft. Aucune clé Bing Webmaster n'est stockée
dans le dépôt ni utilisée par ce mécanisme.

Après un déploiement FTP réussi, le workflow exécute
`python3 scripts/notify-indexnow.py`. Le script vérifie que la preuve exacte est
servie sur le domaine, puis transmet un lot à https://api.indexnow.org/indexnow.

La première publication transmet les URL canoniques du sitemap (29 lors de la
mise en place). Les mises à jour suivantes sélectionnent les pages HTML modifiées,
ajoutées ou supprimées. Les changements de documentation seule ne déclenchent
pas d'envoi. Le formulaire publicitaire, les modèles et les pages utilitaires ne
font pas partie de la soumission. Le sitemap continue d'assurer la découverte
complète du site.

Les statuts sont précis : HTTP 200 = réception ; HTTP 202 = validation de la
preuve en attente. Aucun de ces statuts ne démontre l'indexation ni un classement.
Le protocole partage les signalements entre moteurs participants, dont Bing.

Un échec de notification est visible dans l'étape et le résumé GitHub Actions.
Il ne retire pas un site déjà déployé et ne bloque pas les déploiements suivants.
Il n'y a ni boucle de soumission, ni notification de prospects ou de contenu privé.

## Vérification

- Six tests hors réseau : amorçage, absence de soumission pour les documents,
  sélection des pages modifiées/supprimées, statuts 200/202, preuve non concordante,
  rejet d'un domaine tiers.
- Simulation sans requête : `python3 scripts/notify-indexnow.py --all --dry-run`.
- Contrôle SEO existant : 36 pages, 29 URL canoniques, 11 articles.
- Contrôler la conclusion de l'étape IndexNow et ses logs après publication,
  même si le workflow complet est vert (`continue-on-error` pour cette seule étape).

## Accès statistique Bing

Windsor retourne le site https://www.mistralpro-reno.fr/, mais la lecture des
statistiques échoue avec le code Bing 14, NotAuthorized. La clé configurée doit
correspondre à un utilisateur Bing ayant validé ce site exact. La cause précise
ne peut pas être déduite du seul code. Aucun zéro de trafic n'est annoncé.

## Retour arrière

Retirer l'étape de notification du workflow et restaurer le script, son test et
le fichier de preuve ensemble par un nouveau commit. Le sitemap et le contenu du
site n'ont pas besoin d'être retirés. Aucune base de données n'est modifiée.

Référence : https://www.indexnow.org/documentation
