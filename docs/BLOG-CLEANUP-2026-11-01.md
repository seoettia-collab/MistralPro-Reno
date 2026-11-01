# Relecture du blog — 1er novembre 2026

11 articles conservés, sans suppression ni changement d’URL canonique. Les images et les dates de publication sont conservées. Une date de relecture réelle est visible dans les articles ; dateModified est synchronisée.

## Corrections publiques

- Page Blog : retrait de la rubrique d’archives vide ; titres et extraits cohérents avec les guides revus ; bouton de devis vers le simulateur.
- Filtres : sujet principal conservé, étiquette prix secondaire, compteur accessible, état des boutons et masquage de la section à la une lorsqu’elle ne correspond pas.
- Distinction éditoriale : préparation du budget d’appartement / tarifs détaillés ; préparation du chantier de salle de bain / guide des prix.
- Suppression des qualifications RGE attribuées à Mistral Pro Reno sans justificatif dans les sources examinées. Cela ne constitue pas une conclusion sur la qualification réelle de l’entreprise.
- Correction des promesses de primes, de cumuls et de délais automatiques. Prêts et subventions distingués. Références vers France Rénov’, son annuaire RGE et Service Public.
- Révision des affirmations générales sur Consuel, les démarches en mairie, les nouvelles normes annuelles et les travaux électriques/plomberie. Les prescriptions précises doivent être définies selon le chantier.
- Prix présentés comme indicatifs à confirmer après visite ; ces montants ne proviennent pas d’un relevé statistique du marché.
- FAQ visibles et JSON-LD synchronisés.

## Génération dans Dashboard

Le générateur identifié dans `seo-api/routes/contentGen.js` imposait une année dans tous les titres et des prix prétendument actuels, sans source obligatoire. Son prompt est revu pour éviter les qualifications inventées, les normes annuelles supposées et les promesses financières. Ces instructions réduisent le risque ; elles ne remplacent pas la relecture avant publication.

Le site public est déployé par GitHub Actions vers OVH. Le code API nécessite également le déploiement du service `seo-api` pour que les nouvelles consignes soient utilisées par Dashboard ; le déploiement FTP ne prouve pas celui de l’API.

## Validation

Contrôles SEO : métadonnées, H1, canonicals, sitemap, liens et assets, JSON-LD. Conservation des 11 URL d’articles et des figures. Tests de comportement des filtres. Vérification du déploiement et des pages publiques.

Google Business Profile n’est pas une condition d’indexation du site dans les résultats web classiques. La fiche sert à gérer la présence de l’entreprise dans les résultats locaux et Maps. Source : https://developers.google.com/search/docs/fundamentals/get-on-google
