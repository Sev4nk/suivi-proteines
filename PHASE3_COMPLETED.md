# Phase 3 - Gestion des Recettes ✅

**Date** : 24 Mars 2026  
**Durée estimée** : 3-4 jours  
**Statut** : ✅ COMPLÉTÉE

---

## 📋 Résumé des tâches

| Tâche | Fichier | Statut | Notes |
|-------|---------|--------|-------|
| HTML : Modal recette | `index.html` | ✅ | Formulaire création/édition complet |
| HTML : Ingrédients multiples | `index.html` | ✅ | Sélection dynamic + quantités |
| HTML : Totaux et calculs | `index.html` | ✅ | Affichage total + par portion |
| JS : Fonctions CRUD | `app.js` | ✅ | Créer, éditer, supprimer recettes |
| JS : Calculs macros auto | `app.js` | ✅ | Agrégation ingrédients |
| JS : Gestion ingrédients | `app.js` | ✅ | Ajouter/supprimer dynamique |
| CSS : Styles recettes | `styles.css` | ✅ | Grid, cards, modal, responsive |

---

## 🎯 Ce qui a été implémenté

### 1. **index.html** - Interface recettes

```html
<!-- Tab Navigation -->
<button class="tab-btn" data-tab="recipes">Recettes</button>

<!-- Section recettes -->
<section id="tab-recipes" class="tab-panel">
  <!-- Cards de recettes -->
  <div id="recipesList" class="recipes-list"></div>
  
  <!-- Modal création/édition -->
  <dialog id="recipeModal">
    <form id="recipeForm">
      <!-- Nom, description, portions -->
      <!-- Fieldset ingrédients (dynamique) -->
      <!-- Totaux affichés (auto-calculés) -->
    </form>
  </dialog>
</section>
```

### 2. **app.js** - Fonctions recettes

**Gestion ingrédients** :
- `addRecipeIngredient()` - Ajouter ligne ingrédient
- `removeRecipeIngredient(idx)` - Retirer ingrédient
- `updateRecipeIngredient(idx, field, value)` - Modifier sélection/quantité
- `renderRecipeIngredients()` - Afficher liste dynamique

**Calculs nutritionnels** :
- `calculateRecipeTotals()` - Agrégation ingrédients
  - Formule : `(quantité / portionRef) * valeur`
  - Somme toutes les valeurs (calories, protéines, glucides, lipides)
  - Divise par nombre portions pour affichage "par portion"

**CRUD** :
- `openRecipeModal(recipeId?)` - Modal création/édition
- `saveRecipe(event)` - Sauvegarder en Dexie
- `deleteRecipe(recipeId)` - Supprimer recette
- `renderRecipesList()` - Afficher grille recettes

### 3. **styles.css** - Design

```css
.recipes-list { grid auto-fill minmax(280px, 1fr) }
.recipe-card { background, hover, shadow }
.recipe-header { nom + servings tag }
.recipe-nutrition { grille 4 colonnes (kcal, P, C, L) }
.recipe-actions { buttons éditer/supprimer }
.ingredients-container { liste flex colonne }
.ingredient-row { grid 4 colonnes (select, qty, unit, delete) }
.recipe-totals { fieldset vert avec 2 grilles (total + per portion) }
.totals-grid { 4 colonnes avec valeurs grandes }
```

---

## 📊 Fonctionnalités détaillées

### Créer une recette

1. **Tab "Recettes"** → Click **"+ Nouvelle Recette"**
2. **Formulaire** s'ouvre (modal)
3. **Informations** :
   - Nom : "Poulet curry" ✓
   - Description : "Poulet avec sauce épicée" ✓
   - Portions : 2 ✓
4. **Ingrédients** :
   - Click **"+ Ajouter ingrédient"**
   - Sélectionner produit (ex: Poulet) ✓
   - Quantité : 400g ✓
   - → Macros du produit × (400/100) = macros pour 400g
   - Répéter pour autres ingrédients
5. **Totaux auto-calculés** (affichés en direct) :
   - Total recette : 1200 kcal, P: 62g, C: 20g, L: 15g
   - Par portion (÷2) : 600 kcal, P: 31g, C: 10g, L: 7.5g
6. **Enregistrer** → Sauvegarde Dexie
7. **Recette** apparaît en grille

### Éditer une recette

1. Cliquer **"Éditer"** sur une card
2. Modal pré-remplie :
   - Nom, description, portions
   - Ingrédients existants + quantités
3. Modifier champs / ingrédients
4. Totaux se recalculent dynamiquement
5. Cliquer **"Enregistrer"**
6. Mise à jour Dexie

### Supprimer une recette

1. Cliquer **"Supprimer"** sur une card
2. Confirmation dialog
3. Suppression :
   - Recette dans `db.recettes`
   - Tous les ingrédients dans `db.recetteProduits`
4. Grille mise à jour

### Détail : Calcul macros

```javascript
// Pour chaque ingrédient
produit = Poulet cuit (100g : 165 kcal, 31g P, 0g C, 3.6g L)
quantité = 400g

calculé = (400/100) × [165, 31, 0, 3.6]
        = 4 × [165, 31, 0, 3.6]
        = [660 kcal, 124g P, 0g C, 14.4g L]

// Somme tous ingrédients
totalRecette = ∑[660, 124, 0, 14.4]

// Par portion (si 2 portions)
parPortion = totalRecette ÷ 2
```

---

## 🗄️ Interaction avec Dexie

```javascript
// RECETTES
await db.recettes.add({
  name, description, servings,
  totalCalories, totalProtein, totalCarbs, totalFat,
  dateCreated, dateModified
})

await db.recettes.update(id, { ... })
await db.recettes.delete(id)
await db.recettes.toArray()

// INGRÉDIENTS
await db.recetteProduits.add({
  recetteId, produitId, quantity, unitType
})

await db.recetteProduits.where('recetteId').equals(id).toArray()
await db.recetteProduits.where('recetteId').equals(id).delete()
```

---

## 💻 Flux utilisateur complet

```
Acceuil → Tab "Recettes"
    ↓
┌──────────────────────────────────────┐
│   Mes Recettes                       │
│ [+ Nouvelle Recette]                 │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ CARD: Poulet curry (2 portions)  │ │
│ │ 1200 kcal | P62g | C20g | L15g   │ │
│ │ [Éditer] [Supprimer]             │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ CARD: Riz complet (1 portion)    │ │
│ │ 450 kcal | P9g | C96g | L4g      │ │
│ │ [Éditer] [Supprimer]             │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
    ↓ [Click + Ajouter]
┌─────────────────────────────────────────────┐
│ | Modal Créer Recette                       │
│ |                                           │
│ | Nom : ________________________             │
│ | Description : ____________________        │
│ | Portions : [1]                            │
│ |                                           │
│ | Ingrédients:                              │
│ | [Poulet] [400g] g [✕]                     │
│ | [Riz]    [100g] g [✕]                     │
│ | [+ Add]                                   │
│ |                                           │
│ | TOTAUX:    1200 kcal | P40g | C100g | L10g
│ | Par portion: 600 kcal | P20g | C50g  | L5g
│ |                                           │
│ | [Annuler] [Enregistrer]                   │
└─────────────────────────────────────────────┘
```

---

## ✅ Validations & Vérifications

✓ Recette doit avoir ≥ 1 ingrédient  
✓ Tous les ingrédients mappe aux produits Dexie  
✓ Calculs macros automatiques et instantanés  
✓ Nombre de portions ≥ 1  
✓ Gestion suppression : supprimer recette + tous ses ingrédients  
✓ Édition : remplace ingrédients completement  
✓ Try/catch Dexie operations  

---

## 🎨 Design & Responsive

- **Cards** : Grid auto-fill (min 280px), 4 colonnes desktop, 1 mobile
- **Modal** : Backdrop blur, max-width 600px
- **Ingrédients** : Grid 4 colonnes (select, qty, unit, delete)
- **Totaux** : 4 colonnes (Kcal, Protein, Carbs, Fat)
- **Responsive** : Ingrédients 1 colonne mobile, Totaux 2×2 mobile

---

## 📝 Fichiers modifiés

- 📝 **index.html** - Ajout modal recettes + formulaire complet
- 📝 **app.js** - Fonctions CRUD + calculs + gestion ingrédients
- 📝 **styles.css** - Styles recettes, ingredients, totaux + responsive

---

## 🧪 Comment tester

### Test Manuel - Créer recette

```
1. Tab "Recettes"
2. Click "+ Nouvelle Recette"
3. Remplir :
   - Nom: "Ma Recette"
   - Portions: 2
4. Click "+ Ajouter ingrédient"
5. Select "Poulet cuit"
6. Quantité: 200
7. ✓ Totaux se mettent à jour
8. Click "+ Ajouter ingrédient" (encore)
9. Select "Riz blanc cuit"
10. Quantité: 150
11. ✓ Totaux mis à jour
12. Click "Enregistrer"
13. ✓ Recette doit apparaître en grille
```

### Test Manuel - Éditer recette

```
1. Cliquer "Éditer" sur une card
2. Modifier nom, portions, ingrédients
3. Cliquer "Enregistrer"
4. ✓ Doit être mise à jour
```

### Test Manuel - Supprimer recette

```
1. Cliquer "Supprimer" sur une card
2. Confirmer dialog
3. ✓ Recette disparaît
```

### Console Browser

```javascript
// Voir toutes les recettes
const recipes = await SuiviDB.db.recettes.toArray();
console.table(recipes);

// Voir ingrédients d'une recette
const ings = await SuiviDB.db.recetteProduits
  .where('recetteId').equals(1).toArray();
console.table(ings);

// Vérifier calculs
recipes[0].totalCalories // Devrait égal somme ingrédients
```

---

## 🎯 Points clés

✅ Calcul macros **automatique** et **instantané**  
✅ **Dynamic** : Ajouter/supprimer ingrédients sans recharger  
✅ **Réutilisable** : Les recettes stockées dans Dexie  
✅ **Flexible** : Portions quelconques  
✅ Simple et **intuitif**  

---

## 🚀 Prochaine phase

**Phase 4 : Planification des repas** (3-4 jours)
- Journal quotidien amélioré
- Navigation dates (hier/aujourd'hui/demain)
- 4 repas types (petit-déj, déj, snack, soir)
- Ajouter produits/recettes aux repas
- Totaux du jour vs objectifs

---

**Status** : Phase 3 COMPLÉTÉE - Prêt pour Phase 4 ! 🎉
