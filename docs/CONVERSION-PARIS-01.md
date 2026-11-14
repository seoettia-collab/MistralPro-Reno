# CONVERSION-PARIS-01 — /estimation-projet.html

Branche `feat/conversion-paris-01` (depuis main 0b18a1f, PR #26 non fusionnée). Backend associé : seoettia-collab/facebook-ads-backend, même nom de branche.

## Parcours
1. **Votre projet** : travaux (choix multiple), code postal du chantier, surface approximative. Aucune coordonnée.
2. **Précisions** : pièces (choix multiple), nature des travaux, démarrage souhaité. « Je ne sais pas » sur chaque question. Détail, photos, plans : facultatifs.
3. **Coordonnées** : prénom, nom, téléphone, e-mail, adresse, code postal, ville (pré-remplis depuis l'étape 1). Boutons « Être rappelé pour mon projet » et « Voir mon estimation indicative » actifs dès que tout est saisi.
4. **Demande enregistrée** : affichée seulement après reçu serveur (`stored:true`, `receipt === session_id`). L'estimation et le PDF viennent ensuite ; si le calcul échoue, la demande reste enregistrée.

Campagne Paris : `?zone=paris` ou `utm_campaign` contenant « paris » → titre « Votre rénovation à Paris », rappel Paris intra-muros, 75001-75020 et 75116 uniquement. Sans cela : parcours Île-de-France inchangé.
Contrôle ville / code postal : navigateur (`js/estimation-flow.js`) et serveur (`checkLocation`).

## Mesure (GA4 G-S4F06V2C5C, chargé en différé)
`estimation_step_view` (1-4), `estimation_step_complete`, `estimation_step_error`, `estimation_submit`, `estimation_error`, `estimation_abandon` (dernière étape vue, à la sortie), `generate_lead` **uniquement après reçu confirmé** (`generate_lead_test` en mode TEST), `estimation_result`, `estimation_pdf`. Abandons par étape : exploration « entonnoir » GA4 sur `estimation_step_view` step 1→4. Marquer `generate_lead` comme conversion clé dans GA4.

## Mode TEST
`?test=1` (ou nom commençant par TEST) : texte préfixé [TEST] dans le Dashboard, alerte SMS `skipped_test`, événement GA4 `generate_lead_test`.

## PR #16 et #17
- #16 (/devis-travaux/, retrait OpenAI) : fichiers distincts, aucun conflit, reste indépendante.
- #17 (questionnaire simple) : remplacée. Les réponses rapides couvrent le besoin ; `js/estimation-questionnaire.js` n'est plus chargé par la page (fichier et tests conservés). À fermer.
- #26 : seule la ligne `<head>` de la page diffère (inchangée ici) ; fusion attendue sans conflit sur cette page.

## Recette du 14/11/2026
Banc local : la page réelle + les routes /public/site-estimates servies par le **vrai code serveur** de la branche backend (site-estimates.js, site-leads.js) sur SQLite ; seul le modèle IA est simulé. Aucun appel production, aucun client réel.

**Paris, rappel, réponse réseau perdue puis nouvelle tentative**
- Étape 1 vide → 3 erreurs ; 92100 refusé (« Ce parcours concerne Paris intra-muros… »).
- 75017 → ville pré-remplie « Paris » ; « Boulogne » refusé ; « Paris 17e » accepté.
- Réponse /lead coupée après enregistrement → message « non confirmé », aucun succès affiché, bouton « Réessayer l'envoi ». Nouvelle tentative → succès, **1 lead, 1 demande, 1 alerte** (pas de doublon).
- Estimation calculée, PDF téléchargé (en-tête %PDF vérifié).
- Événements : step_view 1→4, submit, error, submit, generate_lead_test, result, pdf.

**Île-de-France, estimation, calcul IA en panne** : 92100 + « Paris » refusé (navigateur, 0 appel réseau) ; Boulogne-Billancourt accepté ; IA en panne → « Demande enregistrée — référence … » puis « Estimation indisponible… votre demande est bien enregistrée ».

**Contenu reçu dans le Dashboard (requestsForLead)**
```
lead : Jean TEST Conversion · +33600000000 · test@example.test
code postal : 75017
attribution : utm_source=facebook, utm_medium=paid_social, utm_campaign=paris-renovation-nov, utm_content=video-a, ad_id=120200001, fbclid=IwAR0testFbclid123
détail :
[TEST] Demande de test — ne pas rappeler.
Demande : Être rappelé pour mon projet
Parcours : Paris intra-muros
Travaux : Rénovation complète, Cuisine
Pièces : Cuisine, Salle de bain
Nature des travaux : Je ne sais pas
Surface approximative : 40 à 70 m²
Démarrage souhaité : Dans 1 à 3 mois
Chantier : 12 rue de Lévis, 75017 Paris 17e
Origine : utm_source=facebook ; … ; fbclid=IwAR0testFbclid123
Précisions : TEST — 3e étage sans ascenseur, parquet à conserver
détails : prénom, nom, e-mail, adresse, ville, pièces jointes (nom, type, taille)
alerte : skipped_test
```

Tests automatiques : site `tests/estimation-paris.test.js` 10/10 ; backend `tests/conversion-paris.test.js` 9/9 + `site-estimates.test.js` 17/17 (le test pièce admin non concerné n'a pas été rejoué).

## Reste à faire (non réalisable sans déploiement)
1. Déployer la branche backend sur Render (route /lead) **avant** le site.
2. Test réel sur téléphone depuis le navigateur intégré Facebook (lien de pub de test avec `&test=1`) : étapes, reçu, Dashboard, PDF.
3. GA4 : marquer `generate_lead` comme conversion, créer l'entonnoir `estimation_step_view`.
