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
- Mode offline (service worker + cache complet)
- Installable comme app sur telephone (PWA)

## Acces depuis le telephone (gratuit, sans Vercel)

### 1. Activer GitHub Pages (a faire une seule fois)

1. Sur GitHub, va dans **Settings** > **Pages** (menu gauche).
2. Dans *Source*, selectionne **GitHub Actions**.
3. Sauvegarde.

Le workflow `.github/workflows/deploy.yml` se declenche automatiquement a chaque push sur `main`.
Ton app sera accessible a l'adresse :

```
https://<ton-user>.github.io/suivi-proteines/
```

### 2. Installer l'app sur ton telephone

#### Android (Chrome)

1. Ouvre l'URL GitHub Pages dans Chrome.
2. Appuie sur les **3 points** en haut a droite.
3. Selectionne **"Ajouter a l'ecran d'accueil"**.
4. Confirme. L'app apparait comme une vraie app sur ton ecran.

#### iPhone / iOS (Safari)

1. Ouvre l'URL GitHub Pages dans Safari.
2. Appuie sur l'icone **Partager** (carre avec fleche vers le haut).
3. Selectionne **"Sur l'ecran d'accueil"**.
4. Confirme. L'app apparait sur ton ecran d'accueil.

### 3. Utilisation hors ligne

Une fois ouverte au moins une fois avec connexion, l'app fonctionne **sans internet** grace au service worker. Toutes les donnees sont stockees localement sur ton telephone.

## Lancer en local

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
- `manifest.json`: metadata PWA (nom, icone, couleurs)
- `icon.svg`: icone de l'app
- `sw.js`: cache offline complet
- `.github/workflows/deploy.yml`: deploiement automatique GitHub Pages

## Notes

- Donnees stockees uniquement localement dans ce navigateur/telephone.
- Changer de navigateur/appareil ne transfere pas les donnees sans export/import.

## GitHub (depot distant)

1. Cree un nouveau depot vide sur GitHub, par exemple `suivi-proteines`.
2. Dans ce dossier, execute:
   - `git remote add origin https://github.com/<ton-user>/suivi-proteines.git`
   - `git push -u origin main`

