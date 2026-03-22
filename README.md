# Suivi Proteines - MVP

Mini app web personnelle pour suivre les proteines au quotidien.

## Objectif

Ouvrir, ajouter une prise, voir le total, terminer.

## Fonctions

- Profil: taille, poids, age, objectif, cible proteines (manuelle ou auto)
- Journal: ajout rapide aliment standard + quantite
- Calcul automatique des proteines
- Total du jour + progression
- Historique journalier avec detail des prises
- Suppression d'une prise
- Export/import JSON
- Stockage local navigateur (localStorage)
- Mode offline basique (service worker)

## Lancer

Option la plus simple:

1. Ouvrir `index.html` dans le navigateur.

Option recommandee (pour service worker/PWA):

1. Dans ce dossier, lancer un serveur local:
   - `python -m http.server 8080`
2. Ouvrir `http://localhost:8080`

## Structure

- `index.html`: structure UI
- `styles.css`: style mobile-first
- `app.js`: logique metier + stockage + rendu
- `manifest.json`: metadata PWA minimale
- `sw.js`: cache offline basique

## Notes

- Donnees stockees uniquement localement dans ce navigateur.
- Changer de navigateur/appareil ne transfere pas les donnees sans export/import.

## Deploiement GitHub Pages (acces HTTPS depuis le telephone)

Le repo est configure avec GitHub Actions pour se deployer automatiquement sur GitHub Pages a chaque push sur `main`.

### Activer GitHub Pages (une seule fois)

1. Va dans **Settings > Pages** de ton repo GitHub.
2. Sous **Source**, choisis **GitHub Actions**.
3. Sauvegarde.

Le prochain push sur `main` declenche le workflow et publie le site.  
Ton app sera accessible a : `https://<ton-user>.github.io/suivi-proteines/`

### Ajouter au telephone (PWA)

- **Android (Chrome)** : ouvre l'URL, appuie sur les trois points > "Ajouter a l'ecran d'accueil".
- **iOS (Safari)** : ouvre l'URL, appuie sur Partager > "Sur l'ecran d'accueil".

