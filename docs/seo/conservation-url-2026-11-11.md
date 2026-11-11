# Conservation des URL — refonte Mistral Pro Reno

Date de contrôle : 11 novembre 2026. Branche : `refonte-site`.

## 1. Source et tableau complet des pages indexées

Source : export natif Search Console `mistralpro-reno.fr-Coverage-Valid-2026-11-11.zip`, rapport **Indexation > Pages > Pages indexées**, filtre **Toutes les pages connues**. Dernière mise à jour du rapport : **6 novembre 2026**. Les 8 lignes de `Tableau.csv` sont conservées dans `pages-indexees-2026-11-11.csv`. Elles correspondent aux 8 pages concernées du graphique. Ce rapport n'est pas un état temps réel de toutes les URL inspectables.

Préfixe des adresses ci-dessous : `https://www.mistralpro-reno.fr`.

| Adresse actuelle indexée | Contenu retenu | Action | Dernière exploration du rapport |
|---|---|---|---|
| `/services.html` | Nouvelle présentation des neuf métiers provenant de `metiers.html` | Garder l'adresse, publier le nouveau contenu ; supprimer sa 301 | 2026-10-15 |
| `/` | Accueil de la refonte, liens métiers corrigés | Garder l'adresse et le contenu de la refonte | 2026-10-12 |
| `/cost_calculator.html` | Assistant existant `/estimation-projet.html` | Conserver la 301 antérieure à la refonte ; voir exception ci-dessous | 2026-10-09 |
| `/blog.html` | Blog existant, liens vers les pages conservées | Garder l'adresse et le contenu | 2026-10-05 |
| `/zh/` | Accueil chinois existant | Garder l'adresse et le contenu, fichier inchangé | 2026-09-25 |
| `/degat-des-eaux.html` | Page dégâts des eaux existante, liens internes corrigés | Garder l'adresse et le contenu métier | 2026-09-22 |
| `/projets.html` | Vue d'ensemble `/travaux.html` | Conserver la 301 existante, conformément à la demande | 2026-08-08 |
| `/services/electricite.html` | Nouveau contenu de `metiers/electricite.html` | Garder l'adresse, publier le nouveau contenu ; supprimer sa 301 | 2026-06-30 |

Complément : l'inspection GSC Wizard du 9 novembre indique aussi `/estimation-projet.html` comme « Submitted and indexed », exploration du 8 novembre. Son adresse reste inchangée. Cette inspection plus récente est distincte de l'export Pages ci-dessus.

## 2. Correspondances complémentaires de la refonte

Les URL suivantes sont conservées même lorsqu'elles ne figurent pas dans les 8 lignes de l'export.

| Adresse retenue | Source du contenu | Action |
|---|---|---|
| `/services/plomberie.html` | `metiers/plomberie.html` | Nouveau contenu à l'ancienne adresse |
| `/services/peinture.html` | `metiers/peinture.html` | Nouveau contenu à l'ancienne adresse |
| `/services/menuiserie.html` | `metiers/menuiserie.html` | Nouveau contenu à l'ancienne adresse |
| `/services/toiture.html` | `metiers/couverture.html` | Nouveau contenu à l'ancienne adresse |
| `/services/salle-de-bain.html` | Page actuelle | Adresse et fichier conservés intégralement |
| `/services/cuisine.html` | Page actuelle | Adresse et fichier conservés intégralement |
| `/services/extension.html` | Page actuelle | Adresse et fichier conservés intégralement |
| `/services/renovation-appartement.html` | Page actuelle | Adresse et fichier conservés intégralement |
| `/services/copropriete.html` | Page actuelle | Adresse et fichier conservés intégralement |
| `/services/bureaux-commerces.html` | Page actuelle | Adresse et fichier conservés intégralement |
| `/services/maconnerie.html` | `metiers/maconnerie.html` | Nouvelle page |
| `/services/isolation.html` | `metiers/isolation.html` | Nouvelle page |
| `/services/platrerie.html` | `metiers/platrerie.html` | Nouvelle page |
| `/services/carrelage.html` | `metiers/carrelage.html` | Nouvelle page |
| `/travaux.html` | Page Travaux de la refonte | Nouvelle page maintenue, ajout de liens directs vers les six pages de projets conservées |

Le dossier `metiers/` et le fichier `metiers.html` sont supprimés. Les canonical, `og:url`, fils d'Ariane JSON-LD, liens d'en-tête, de pied de page, de l'accueil et du blog utilisent les adresses retenues. Les contenus spécialisés des six anciennes pages de projets sont conservés plutôt que remplacés par des extraits de la page d'ensemble.

## 3. Redirections et exceptions

Le bloc « Refonte 2026 » est supprimé : aucune redirection des anciennes pages `/services...` ne subsiste.

La refonte étant déjà publiée, le contrôle indépendant a constaté un statut HTTP 200 public pour `/metiers.html` et `/metiers/couverture.html`. Dix alias 301 ciblés protègent les adresses créées par cette refonte : `/metiers.html` vers `/services.html`, et chacun des neuf fichiers `/metiers/*.html` vers sa correspondance dans `/services/`, avec `couverture.html` vers `toiture.html`. Ils préservent les liens éventuellement partagés ou explorés depuis la publication. Il n'y a ni redirection inverse des anciennes pages services, ni chaîne entre ces deux familles d'URL.

- `/projets.html` : ancienne page de réalisations retirée ; sa 301 vers `/travaux.html` est expressément conservée.
- `/cost_calculator.html` : exception à la conservation stricte de toutes les URL indexées. Le simulateur avait déjà été remplacé par l'assistant avant cette refonte. Sa 301 vers `/estimation-projet.html` est conservée, comme les autres alias historiques en dehors du bloc à supprimer. Rétablir le simulateur contredirait le parcours assistant existant et les tests de bascule demandés. Le contenu cible existe ; cette URL n'est donc pas sans correspondance.
- Les autres alias historiques (`landing`, `contact`, `devis`) et la normalisation HTTPS/www/index restent inchangés.

**Pages indexées sans correspondance : aucune des 8 lignes de l'export.** Deux URL gardent néanmoins une 301 antérieure : les deux cas sont explicités ci-dessus.

## 4. Vérifications

- `python3 scripts/check-seo.py --write` : PASS.
- `python3 scripts/check-seo.py` : PASS ; **42 pages HTML publiques, 33 URL canoniques indexables, 11 articles de blog**.
- `node --test tests/*.test.js` : **91/91**, aucun échec, aucun test ignoré.
- Moteur `js/estimation-projet.js` et dossier `devis-travaux/` : aucun changement par rapport au point de départ `1499e8bcc773d2b5b04e37337a11c5e369ebaba7`.
- Serveur `facebook-ads-backend` : aucune intervention.
- La PR #13 était déjà fusionnée au début de cette mission : GitHub indique le 11 novembre à **15 h 44, heure de Paris**, merge `fe2e4e9bce3b0c50e1c24921ff12f8e1760578df`.
- Ce correctif est préparé sur `refonte-site`, sans écriture sur `main`, sans fusion ni déploiement.

Les contrôles portent sur les fichiers du correctif. Leur publication sur le domaine dépend de la fusion décidée par Ricardo.

## 5. Liste exhaustive des fichiers du correctif

Statuts par rapport au point de départ de la branche : M = modifié, D = supprimé, A = ajouté.

```text
M	.htaccess
M	404.html
M	blog.html
M	blog/cout-renovation-appartement-paris.html
M	blog/degat-des-eaux-5-etapes.html
M	blog/prix-renovation-appartement-paris-2026.html
M	blog/prix-renovation-de-habitation-ile-de-france.html
M	blog/prix-renovation-salle-de-bain-paris-2026.html
M	blog/renovation-cuisine-paris-2026.html
M	blog/renovation-electricite-paris-2026.html
M	blog/renovation-energetique-paris-2026-aides.html
M	blog/renovation-maison-ile-de-france-2026.html
M	blog/renovation-plomberie-paris-17-2026.html
M	blog/renovation-salle-de-bain-guide-prix.html
M	conditions-utilisation.html
M	cost_calculator.html
M	degat-des-eaux.html
M	index.html
M	mentions-legales.html
D	metiers.html
D	metiers/carrelage.html
D	metiers/couverture.html
D	metiers/electricite.html
D	metiers/isolation.html
D	metiers/maconnerie.html
D	metiers/menuiserie.html
D	metiers/peinture.html
D	metiers/platrerie.html
D	metiers/plomberie.html
M	scripts/check-seo.py
M	services.html
M	services/electricite.html
M	services/menuiserie.html
M	services/peinture.html
M	services/plomberie.html
M	services/toiture.html
M	sitemap.xml
M	travaux.html
A	docs/seo/conservation-url-2026-11-11.md
A	docs/seo/pages-indexees-2026-11-11.csv
A	services/carrelage.html
A	services/isolation.html
A	services/maconnerie.html
A	services/platrerie.html
```
