# EST-20261106-01 — bascule publique isolée

Bascule initiale déjà publiée dans la version `0a77a297066990faecbc0db0aba4fdc81ac1683d`. Ce document conserve sa portée et ses consignes de contrôle : les liens du site remplacent l’ancien simulateur, le noindex de la nouvelle page est retiré, `/cost_calculator.html` et les alias existants redirigent directement vers `/estimation-projet.html`, et le sitemap canonique est régénéré. Le correctif progressif EST-PROGRESSIF-20261106 a ensuite été publié dans `cc2c9287d6ff8a51aad99e13cc67ae6ce53a4741`. L’évolution frontend actuelle AUTO-20261106 (v3) est préparée séparément puis confiée au pilote pour publication ; voir la fiche actuelle `ESTIMATION-PROGRESSIVE-2026-11-06.md`. Le fichier et les tests du simulateur restent conservés pour retour arrière. Aucun moteur interne Devis ou règle CRM n’est supprimé.

Apache mod_alias conserve la query string d’origine lorsque la cible Redirect ne possède pas de query : les UTM déclarées arrivent sur l’assistant. Contrôler après déploiement une URL legacy avec UTM synthétique (lecture seule), le code301 et la destination avant de déclarer la bascule vérifiée en production.

Tests locaux : check-seo.py --write (37pages/29URL, inventaire Git des assets), suite Node complète et 6 tests Python IndexNow. Deux attentes de liens historiques des tests existants sont mises à jour vers la nouvelle destination, sans retirer les tests de reçus/mesure/formulaire.

Retour arrière : revert de ce commit uniquement pour menus/robots/redirect/sitemap. Les flags service peuvent être coupés séparément. Ne pas effacer les données Conversions ou pièces métier existantes. La page officielle `/devis-travaux/` conserve son contrat et ses protections propres.
