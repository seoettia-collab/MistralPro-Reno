# SOCIAL-01 — Liens Facebook et Instagram

Branche `feat/social-01`, depuis main à jour (#26 fusionnée).

- Facebook : https://www.facebook.com/profile.php?id=61587951641785
- Instagram : https://www.instagram.com/mistral_pro_reno/

## Ce qui change
1. Icônes SVG inline (≈0,6 Ko, aucune librairie) dans l'en-tête et le pied de page de toutes les pages publiques, `target="_blank" rel="noopener"`, `aria-label`, zone tactile 44 px.
2. Bloc « Suivez nos chantiers » sur l'accueil et sur /travaux.html (page réalisations), deux boutons, aucun widget tiers.
3. `sameAs` : Instagram ajouté à côté de Facebook dans tous les balisages GeneralContractor/LocalBusiness.
4. Générateurs seo-api (contentGen, publisher, seoExecutor) et gabarit blog/TEMPLATE.html : mêmes icônes.
5. `css/premium.css` : 2 règles pour l'en-tête premium (masqué sous 380 px), cache rafraîchi (v=20261114).

Pages exclues volontairement : estimation-projet.html (tunnel de conversion, pas de sortie vers les réseaux), merci.html (sameAs seulement), devis-travaux/, seo-dashboard/, fichier de vérification Google.

## Maintenance
`node scripts/social-links.js` : réapplique les liens, idempotent (utile après une fusion).

## Tests
`node --test tests/social-links.test.js` : 7 tests (présence en-tête/pied, sécurité des liens, bloc accueil, absence de widget, sameAs, générateurs, idempotence).
