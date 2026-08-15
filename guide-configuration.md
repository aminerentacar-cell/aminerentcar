# Guide de configuration — Amine Rent A Car

Ce guide connecte ton site (`index.html`) à un Google Sheet, pour que chaque
réservation :
- s'ajoute automatiquement dans le tableau Excel/Google Sheets,
- déclenche un email automatique,
- rende la voiture "Indisponible" immédiatement (premier arrivé, premier servi),
- soit libérée automatiquement si non finalisée sous 6h.

## Liste actuelle des voitures (à copier dans l'onglet "Voitures")

Colle exactement ces noms dans la colonne A (ils doivent correspondre au `data-car` du site) :

| Nom | Statut |
|---|---|
| Kia Picanto | Disponible |
| Suzuki Swift | Disponible |
| Dacia Logan | Disponible |
| Seat Ibiza | Disponible |
| Renault Clio 5 | Disponible |
| Dacia Stepway Manuelle | Disponible |
| Dacia Stepway Automatique | Disponible |
| Kia Stonic | Disponible |
| Mazda CX-7 4x4 6CV | Disponible |
| BYD | Disponible |
| Range Rover Defender 2010 | Disponible |
| Mercedes C200E Kit AMG | Disponible |
| Volkswagen Virtus | Indisponible |
| Hyundai i20 | Indisponible |
| Peugeot 208 | Indisponible |
| Volkswagen Polo 8 | Indisponible |
| Peugeot 2008 | Indisponible |
| Chery Tiggo 7 | Indisponible |
| Haval | Indisponible |
| Kia Sportage | Indisponible |
| Volkswagen Golf 8 | Indisponible |
| Jaguar F-Pace | Indisponible |

> Le site (`index.html`) est maintenant la version complète avec header, hero, "à propos", flotte cliquable, formulaire de réservation classique (formsubmit.co), section "3 étapes WhatsApp", agences, contact et footer. Les 12 premières voitures sont cliquables dans la section "Notre flotte" (badge vert = disponible) ; les 10 dernières sont dans la carte "Sur demande" (toujours indisponibles pour l'instant, mais peuvent être libérées plus tard en changeant leur statut dans le Sheet).

## Étape 1 — Créer le Google Sheet

1. Va sur [sheets.google.com](https://sheets.google.com) et crée une feuille nommée par ex. **Amine Rent A Car — Réservations**.
2. Renomme le premier onglet **Voitures** et mets en ligne 1 : `Nom | Statut`
   Puis liste chaque voiture avec son statut initial (`Disponible` ou `Indisponible`), exactement comme dans `index.html` (mêmes noms).
3. Crée un deuxième onglet **Reservations** avec en ligne 1 :
   `Horodatage | Voiture | Nom | Téléphone | Email | Début | Fin | Statut | Expiration`
   (le script remplit tout automatiquement, ne touche pas aux lignes suivantes).

## Étape 2 — Coller le script

1. Dans le Sheet : **Extensions → Apps Script**.
2. Supprime le contenu par défaut et colle tout le contenu de `Code.gs`.
3. Remplace `ton-email@exemple.com` par ton vrai email dans la ligne `EMAIL_PROPRIETAIRE`.
4. Sauvegarde (icône disquette).

## Étape 3 — Déployer comme application Web

1. En haut à droite : **Déployer → Nouveau déploiement**.
2. Type : **Application Web**.
3. Exécuter en tant que : **Moi**. Qui a accès : **Tout le monde**.
4. Clique **Déployer**, autorise les permissions demandées (email, feuille de calcul).
5. Copie l'**URL de l'application Web** — c'est ton `SCRIPT_URL`.

## Étape 4 — Connecter le site

Dans `index.html`, remplace :
```js
const SCRIPT_URL = "REMPLACE_PAR_TON_URL_APPS_SCRIPT";
```
par ton URL copiée à l'étape 3.

## Étape 5 — Activer la libération automatique après 6h

1. Dans Apps Script : icône **horloge (Déclencheurs)** à gauche.
2. **Ajouter un déclencheur** → fonction `liberateExpiredReservations` →
   source d'événement : **Basée sur le temps** → **Minuteur toutes les 15 minutes**.
3. Enregistre.

Résultat : si une réservation reste "En attente" plus de 6h après confirmation,
la voiture repasse automatiquement "Disponible" pour le client suivant.

## Étape 6 — Publier le site sur Netlify

1. Va sur [netlify.com](https://netlify.com) → glisse le dossier contenant `index.html`
   (avec tes images) dans la zone de dépôt ("Deploy manually").
2. Le site est en ligne en quelques secondes avec une URL Netlify.

## Notes importantes

- **Les noms de voitures doivent être identiques** entre `index.html` (attribut `data-car`) et l'onglet **Voitures** du Sheet — sinon la synchronisation ne fonctionnera pas pour ce véhicule.
- Le site vérifie la disponibilité réelle **à chaque chargement et toutes les 60 secondes**, donc si deux clients cliquent en même temps, c'est le Google Sheet qui tranche : la deuxième personne verra "cette voiture vient d'être réservée".
- Sans `SCRIPT_URL` configuré, le site fonctionne quand même visuellement (design, animations, modal) mais les réservations ne pourront pas être envoyées — pense à faire les étapes 1 à 4 avant de mettre le site en ligne pour de vrai.
- Les images (`47300.png`, `47324.jpg`, etc.) doivent être dans le même dossier que `index.html` — ou dans le sous-dossier `images/` pour celles qui le mentionnent déjà — avant de déposer le tout sur Netlify.
