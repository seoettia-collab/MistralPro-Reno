# FINITIONS-ESTIMATION-01 — /estimation-projet.html

Branche `feat/finitions-estimation-01` depuis main (468e4a0, #27 et #28 fusionnées). En-tête et pied de page non modifiés.

## Changements
1. Chips : police Manrope (sans-serif déjà chargée localement), fond blanc, bordure 1,5 px, ombre légère, hauteur 52 px, icône SVG inline à gauche pour les types de travaux, survol, sélection pleine (fond doré foncé #7d5411, texte blanc, pastille ✓), focus clavier 3 px. « Je ne sais pas » : bordure pointillée, texte gris, toujours cliquable.
2. Erreurs : invisibles tant que l'étape n'a pas été validée (« Continuer ») ou que le champ n'a pas été quitté ; bordure rouge sur le groupe ou le champ concerné (aria-invalid).
3. Titres de questions : Manrope gras 17 px ; la serif reste sur les grands titres.
4. Étapes : pastilles numérotées (courante dorée, faite foncée), barre de progression 33 / 67 / 100 %.
5. Boutons : « Continuer → » doré plein, pleine largeur et collé en bas de l'écran sur mobile ; « ← Retour » secondaire blanc.
6. Code postal : 24 px, inputmode numeric, chiffres seuls, bordure + coche verte et nom de la ville quand valide.
7. Grille 2 colonnes égales sur mobile (« Nature des travaux » sur 1 colonne : libellés longs).

## Contraste (AA)
| Élément | Couleurs | Ratio |
| --- | --- | --- |
| chip texte | #201f1d sur #ffffff | 16.47:1 |
| chip sélectionnée / bouton principal | #ffffff sur #7d5411 | 6.67:1 |
| texte secondaire, Je ne sais pas | #55514b sur #faf9f9 | 7.50:1 |
| erreur | #a12626 sur #faf9f9 | 7.08:1 |
| validation verte | #2e7d4f sur #faf9f9 | 4.80:1 |
| code postal valide | #201f1d sur #f1f8f3 | 15.26:1 |
| placeholder | #6b665f sur #ffffff | 5.69:1 |
| bordure chip (UI ≥3) | #8a857e sur #faf9f9 | 3.48:1 |
| pastille étape faite | #ffffff sur #2d2b2b | 14.07:1 |
| lien Ajouter un détail | #7d5411 sur #faf9f9 | 6.35:1 |

## Performance
Aucun fichier ajouté : CSS dans le bloc inline existant (+6,4 Ko non compressé, ~1,6 Ko gzip), icônes SVG inline (~1,5 Ko), police Manrope déjà chargée par premium.css. Pas de script supplémentaire.

## Captures (docs/finitions-estimation-01/)
Mobile 390 px et ordinateur, avant / après, états normal, sélectionné, erreur ; plus étape 2 avec boutons en bas (mobile). Captures faites sur une copie locale de la page (photo d'illustration remplacée par le logo).

## Tests
`node --test tests/estimation-finitions.test.js tests/estimation-paris.test.js`
