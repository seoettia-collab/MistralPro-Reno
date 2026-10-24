# ADS-LEAD-001 — Demande de devis courte

Date : 24 octobre 2026. Statut : brouillon, réception réelle à valider avant mise en ligne.

## Parcours

Page `demande-devis.html`, indépendante des pages existantes et du simulateur.
Salle de bain, cuisine, peinture, rénovation complète, autres travaux : plusieurs
choix possibles. Trois champs obligatoires : prénom, téléphone français, code
postal des travaux en Île-de-France. Une précision reste facultative.

Exemples de liens de campagne :

- `/demande-devis.html?service=salle-de-bain&utm_source=chatgpt&utm_medium=paid`
- `/demande-devis.html?service=cuisine&utm_source=chatgpt&utm_medium=paid`
- `/demande-devis.html?service=peinture&utm_source=chatgpt&utm_medium=paid`

Les paramètres `service` servent uniquement à présélectionner un choix modifiable.

## Réception et suivi

Réutilisation de l'URL n8n déjà présente dans `js/main.js` :
`https://ettia.app.n8n.cloud/webhook/landing-form`.
Le contrat client reprend `nom`, `telephone`, `travaux`, `message`, `form_name`,
`form_location`, `submitted_at`, `page_url` et ajoute `code_postal` et quatre UTM.

**La présence de cette URL dans le dépôt ne prouve pas que le workflow est encore
actif ou qu'il transmet correctement ces champs. Aucun prospect fictif n'a été
envoyé. Vérifier le workflow, son destinataire et la réception réelle avant fusion.**
Un statut HTTP 2xx confirme seulement l'acceptation par le webhook, pas la remise
finale d'un email. Configurer le workflow pour répondre après enregistrement durable
du prospect ; ne pas considérer un simple accusé de démarrage comme une preuve de remise.

Après réponse HTTP positive uniquement : confirmation dans la page et événement
`lead_request_success` dans `dataLayer`, une fois par soumission réussie.
Aucune redirection vers `merci.html` : le script existant y recompte une conversion.
Aucune coordonnée client dans l'événement analytique. Aucun pixel ou GTM chargé
par cette page. Le raccordement au compte publicitaire, la configuration du suivi
et sa gestion du consentement restent à réaliser ; les conversions OpenAI ne sont
donc pas encore remontées. Aucun compte publicitaire créé, aucune dépense engagée.

La validation et le piège robot côté navigateur sont des aides UX ; ils ne
remplacent pas les contrôles serveur ni une protection anti-spam dans le workflow.

## Vérifications réalisées

- `node --check js/demande-devis.js` : OK.
- Neuf scénarios par environnement DOM/réseau simulé : absence de sélection,
  téléphone incorrect, hors zone, succès avec plusieurs choix, erreur HTTP,
  panne réseau, double soumission, piège robot, champs HTML invalides : OK.
- Succès : une seule requête et un seul événement, sans coordonnées.
- Échec : coordonnées conservées, erreur visible, bouton réactivé, aucune conversion.

Restent : contrôle visuel mobile dans le navigateur, validation du workflow et de
la réception, mention de confidentialité adaptée au circuit réel, raccordement du
suivi Ads Manager. Le numéro affiché reprend celui du site actuel : 07 55 18 89 37.

## Mise en ligne

Le workflow `.github/workflows/deploy.yml` déploie automatiquement les pushes sur
`main` vers OVH. Ce brouillon doit rester sur sa branche tant que la réception
et le rendu ne sont pas validés. Aucune modification des pages existantes.
