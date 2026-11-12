# Cohérence du balisage entreprise — 12 novembre 2026

## Lot autorisé

Harmoniser les horaires et le lien Facebook du site avec les fiches Google et
Bing, conserver le positionnement entreprise générale du bâtiment et livrer une
pull request sans fusion ni publication.

## Référence vérifiée

La fiche Google connectée « Mistral pro reno »
(`locations/1646704770934260552`) fournit les données suivantes, relues le
12 novembre 2026 avec Windsor.ai :

| Élément | Valeur retenue |
| --- | --- |
| Lundi | 08:00–17:30 |
| Mardi à samedi | 08:00–17:00 |
| Dimanche | Fermé, aucun créneau d'ouverture déclaré |
| Facebook officiel | https://www.facebook.com/profile.php?id=61587951641785 |

Les propriétés consultées sont `location_regular_hours_periods` et l'attribut
`attributes/url_facebook`. Aucun changement de la fiche Google ou Bing n'est
effectué dans ce lot.

## Correctif

- Mise à jour des huit propriétés `openingHoursSpecification` existantes.
- Remplacement des six anciens liens Facebook `sameAs`.
- Alignement des deux textes d'horaires visibles sur la page Contact.
- Conservation des types de schéma existants, notamment `GeneralContractor`.

Fichiers HTML concernés : `index.html`, `contact.html`, `blog.html`,
`mentions-legales.html`, `conditions-utilisation.html`, `merci.html`, `404.html`
et `cost_calculator.html`. Les deux derniers contiennent eux aussi des blocs
historiques d'horaires ; la redirection du calculateur reste inchangée.

Aucun autre champ JSON-LD, lien interne, canonical, formulaire, script d'envoi
ou fichier de `/devis-travaux/` n'est modifié. Le sitemap régénéré reste identique.

## Validation locale

- `python3 scripts/check-seo.py --write`, puis `python3 scripts/check-seo.py` :
  PASS, 46 pages publiques et 37 URL canoniques indexables.
- `node --test tests/*.test.js` : 93/93 réussis.
- `python3 -m unittest discover -s tests -p '*_test.py'` : 6/6 tests IndexNow
  réussis, sans soumission réelle.
- `node --check js/main.js` et `git diff --check` : PASS.
- Contrôle indépendant du diff : validé. La comparaison sémantique des JSON-LD
  et du HTML confirme que seules les valeurs autorisées ont changé.

Ces contrôles valident le correctif local ; ils ne constituent pas une nouvelle
validation Google Rich Results et ne prouvent pas une réexploration des pages.
L'aperçu navigateur local n'a pas pu être exécuté : le navigateur Playwright
attendu est absent, puis Chromium système est bloqué au lancement par
`socket() failed: Operation not permitted`. Aucun contrôle visuel mobile ou
ordinateur réussi n'est revendiqué ; les deux textes Contact ont été vérifiés
dans le diff et les contrôles HTML/JSON-LD.

## Livraison et suite

La branche `seo/localbusiness-coherence-20261112` est destinée à une PR vers
`main`, sans fusion. Le site public reste inchangé jusqu'à une intégration
autorisée. Retour arrière possible en annulant le commit de ce lot.

Anomalie distincte repérée, non modifiée : les six pages `renovation-*.html`
à la racine et `zones-intervention.html` déclarent encore l'ancien numéro dans
leur balisage. À traiter dans un lot séparé de cohérence des coordonnées.

## Mise à jour du 12 novembre 2026 : horaires confirmés par le gérant

Horaires réels confirmés : **tous les jours, du lundi au dimanche, 08:00–20:00**.
Ils remplacent les valeurs ci-dessus et l'ancien « lun-ven 8h-18h, sam 9h-12h ».
Appliqué à toutes les propriétés `openingHoursSpecification` du site (ajoutées
aux blocs entreprise des pages métiers, villes, arrondissements et dégât des eaux),
à la page Contact, à la FAQ de `degat-des-eaux.html`, au gabarit blog et aux
générateurs `seo-api`. La fiche Google Business doit être mise à jour à l'identique.
