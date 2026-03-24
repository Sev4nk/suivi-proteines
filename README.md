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

## Publication GitHub Pages

Ce projet est compatible avec GitHub Pages sans build.

Fichiers deja prepares dans ce dossier:

- `.github/workflows/deploy-pages.yml`: deploiement automatique sur GitHub Pages a chaque push sur `main`
- `.nojekyll`: evite certains comportements de publication GitHub Pages
- `manifest.json`: `scope` et `start_url` relatifs pour que la PWA fonctionne aussi dans l'URL du repo

Important:

- Utilise ce dossier comme racine du repo GitHub.
- Ne pousse pas le dossier parent qui contient seulement un autre dossier `suivi-proteines-main/`.

### 1. Initialiser le repo local

Depuis ce dossier:

```bash
git init
git add .
git commit -m "Prepare GitHub Pages deployment"
git branch -M main
git remote add origin https://github.com/<ton-user>/<ton-repo>.git
git push -u origin main
```

### 2. Activer GitHub Pages

Dans GitHub:

1. Ouvre le repo.
2. Va dans `Settings` > `Pages`.
3. Dans `Build and deployment`, choisis `GitHub Actions`.
4. Le workflow `Deploy to GitHub Pages` sera lance automatiquement.

### 3. URL finale

Ton app sera disponible a une URL du type:

```text
https://<ton-user>.github.io/<ton-repo>/
```

### 4. Mise a jour de l'app

Chaque fois que tu modifies l'app:

```bash
git add .
git commit -m "Update app"
git push
```

GitHub Pages redeploiera automatiquement.

## Limite importante

Les donnees sont stockees en `localStorage` dans le navigateur.

- ton telephone aura ses propres donnees
- ton PC aura ses propres donnees
- il n'y a pas de synchronisation automatique entre appareils sans backend

Pour transferer les donnees, utilise l'export/import JSON de l'app.
