# EST-20261106-01 — bascule publique isolée

À fusionner uniquement après déploiement de la page et readiness `/public/site-estimates/status` disponible, puis recette publique autorisée. Ce commit remplace les liens du site vers l’ancien simulateur, retire le noindex de la nouvelle page, redirige `/cost_calculator.html` et les alias existants directement vers `/estimation-projet.html`, puis régénère le sitemap canonique. Le fichier et les tests du simulateur restent conservés pour retour arrière. Aucun moteur interne Devis ou règle CRM n’est supprimé.

Apache mod_alias conserve la query string d’origine lorsque la cible Redirect ne possède pas de query : les UTM déclarées arrivent sur l’assistant. Contrôler après déploiement une URL legacy avec UTM synthétique (lecture seule), le code301 et la destination avant de déclarer la bascule vérifiée en production.

Tests locaux : check-seo.py --write (37pages/29URL, inventaire Git des assets), suite Node complète et 6 tests Python IndexNow. Deux attentes de liens historiques des tests existants sont mises à jour vers la nouvelle destination, sans retirer les tests de reçus/mesure/formulaire.

Retour arrière : revert de ce commit uniquement pour menus/robots/redirect/sitemap. Les flags service peuvent être coupés séparément. Ne pas effacer les données Conversions ou pièces métier existantes. La page officielle `/devis-travaux/` conserve son contrat et ses protections propres.
