# Suivi Proteines - MVP

Mini app web personnelle pour suivre les proteines au quotidien.

## Objectif

Ouvrir, ajouter une prise, voir le total, terminer.

## Fonctions

- Profils: switch rapide en haut avec 2 boutons (Max en bleu, Lili en rouge)
- Profil par personne: taille, poids, age, objectif, macros et cible proteines
- Journal: ajout rapide aliment standard + quantite
- Calcul automatique des proteines
- Total du jour + progression
- Historique journalier avec detail des prises
- Suppression d'une prise
- Export/import JSON
- Synchronisation JSON cloud (URL GET/POST configurable)
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

## Profils Max / Lili

- Le tracking se fait par profil actif.
- Le bouton actif est en surbrillance.
- Les produits et recettes restent communs.
- Les repas/journaux sont separes entre Max et Lili.

## Synchronisation JSON cloud (leger)

Le bloc "Synchronisation JSON (cloud)" est disponible dans l'onglet Profil.

Principe:

1. Renseigner une URL de sync.
2. Optionnel: renseigner une cle API/token.
3. `Envoyer vers cloud`: envoie l'etat complet (profils + DB locale Dexie) en POST.
4. `Charger depuis cloud`: recharge l'etat complet en GET.

Format attendu de la reponse GET:

```json
{
   "app": "protein-tracker",
   "version": 2,
   "state": { "...": "..." },
   "db": {
      "produits": [],
      "recettes": [],
      "recetteProduits": [],
      "repas": [],
      "repasElements": [],
      "profil": []
   }
}
```

Requete d'envoi (POST):

- Header `Content-Type: application/json`
- Header `Authorization: Bearer <token>` si token renseigne
- Header `x-sync-token: <token>` si token renseigne
- Body JSON identique au format ci-dessus

Mobile:

- Tirer vers le bas tout en haut de la page lance une synchronisation complete: "Envoyer vers cloud" puis "Charger depuis cloud".

### Option recommandee sans Vercel: Cloudflare Worker + KV

Le projet contient un mini endpoint pret a deployer dans [cloudflare-sync/worker.js](cloudflare-sync/worker.js).

Ce que tu vas coller dans l'app ensuite:

1. URL de synchronisation: URL du Worker (meme URL sur les 2 telephones)
2. Cle API: token `SYNC_TOKEN` (meme token sur les 2 telephones)

Exemple d'URL finale a coller:

```text
https://suivi-proteines-sync.<ton-subdomain>.workers.dev
```

#### Deploiement rapide

Prerequis:

- Compte Cloudflare gratuit
- Node.js installe

Commandes (dans `cloudflare-sync/`):

```bash
npm init -y
npm install -D wrangler
npx wrangler login
npx wrangler kv namespace create SYNC_STORE
```

1. Copie `wrangler.toml.example` vers `wrangler.toml`
2. Remplace `REPLACE_WITH_KV_NAMESPACE_ID` par l'ID retourne par la commande KV
3. Definis le secret token:

```bash
npx wrangler secret put SYNC_TOKEN
```

4. Deploy:

```bash
npx wrangler deploy
```

Wrangler te renvoie l'URL publique `...workers.dev`.

#### Test rapide du endpoint

Avec token `MON_TOKEN` et URL `MON_URL`:

```bash
curl -X POST "MON_URL" \
   -H "Content-Type: application/json" \
   -H "Authorization: Bearer MON_TOKEN" \
   -d '{"app":"protein-tracker","version":2,"state":{},"db":{}}'

curl -X GET "MON_URL" \
   -H "Authorization: Bearer MON_TOKEN"
```

Si GET renvoie ton JSON, c'est ok: colle la meme URL + token dans les 2 telephones.

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
