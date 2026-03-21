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

## GitHub (depot distant)

1. Cree un nouveau depot vide sur GitHub, par exemple `suivi-proteines`.
2. Dans ce dossier, execute:
   - `git remote add origin https://github.com/<ton-user>/suivi-proteines.git`
   - `git push -u origin main`

## Publication Vercel

1. Sur Vercel, clique `Add New...` puis `Project`.
2. Importe le repo GitHub `suivi-proteines`.
3. Framework preset: `Other`.
4. Build command: laisser vide.
5. Output directory: laisser vide.
6. Deploy.
