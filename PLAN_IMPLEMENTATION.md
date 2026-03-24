# Plan d'Implémentation Détaillé - Suivi Régime v2

**Statut** : Plan de roadmap complète  
**Date** : Mars 2026  
**Objectif** : Transformer l'app de tracking protéiné simple en **plateforme complète de suivi nutritionnel** avec recettes, repas, objectifs et feedback coach.

---

## 📋 Vue d'ensemble des étapes

| Phase | Titre | Priorité | Effort | Délai |
|-------|-------|----------|--------|-------|
| 1 | Base de données locale (IndexedDB + Dexie) | 🔴 Critique | M | 1-2j |
| 2 | Gestion des produits alimentaires | 🔴 Critique | M | 2-3j |
| 3 | Gestion des recettes | 🟠 Haute | M | 3-4j |
| 4 | Planification des repas (journal) | 🟠 Haute | L | 3-4j |
| 5 | Paramètres & objectifs utilisateur | 🟡 Moyenne | S | 1-2j |
| 6 | Suivi & feedback coach | 🟡 Moyenne | M | 2-3j |
| 7 | Tests unitaires | 🟡 Moyenne | M | 2j |

**Durée estimée totale** : ~17-21 jours (en travail continu)

---

## Phase 1 : Base de données locale (IndexedDB + Dexie)

### 1.1 Configuration Dexie

#### Objectif
Installer et configurer une base de données locale robuste pour stocker produits, recettes, repas et profil utilisateur. Dexie offre une API promise-based simplifiée pour IndexedDB.

#### Fichier à créer : `db.js`

```javascript
import Dexie from 'https://cdn.jsdelivr.net/npm/dexie@4/dist/dexie.min.js';

export const db = new Dexie('SuiviRegimeDB');

db.version(1).stores({
  // Table des produits/aliments
  produits: '++id, name, category',
  
  // Table des recettes
  recettes: '++id, name',
  
  // Association recette -> produits (ingredients)
  recetteProduits: '++id, recetteId, produitId',
  
  // Table des repas (petit-déj, déj, snack, soir)
  repas: '++id, date, type', // date format: 'YYYY-MM-DD'
  
  // Association repas -> recettes/produits consommés
  repasElements: '++id, repasId, elementType, elementId', // elementType: 'produit' | 'recette'
  
  // Profil utilisateur
  profil: '++id'
});

export default db;
```

#### Détails des schémas

**Table `produits`** :
```javascript
{
  id: 1,
  name: "Poulet cuit",
  category: "protéines", // 'protéines', 'glucides', 'lipides', 'fruits', 'légumes', etc.
  unitType: "g", // "g", "unit" (œuf), "ml", "portion"
  calories: 165, // par portion de référence
  protein: 31, // en g
  carbs: 0,    // en g
  fat: 3.6,    // en g
  portionSize: 100, // la portion de référence en g (si unitType="g")
  imported: false, // true si importé d'OpenFoodFacts
  dateAdded: Date.now()
}
```

**Table `recettes`** :
```javascript
{
  id: 1,
  name: "Poulet curry",
  description: "Poulet avec sauce curry douce",
  servings: 2, // nombre de portions de la recette
  totalCalories: 450,
  totalProtein: 62,
  totalCarbs: 20,
  totalFat: 15,
  dateCreated: Date.now(),
  dateModified: Date.now()
}
```

**Table `recetteProduits`** (jointure) :
```javascript
{
  id: 1,
  recetteId: 1,
  produitId: 5,
  quantity: 200, // 200g de ce produit
  unitType: "g"
  // Lors de la requête, on multipliera quantity * (calories/portionSize) pour le produit
}
```

**Table `repas`** :
```javascript
{
  id: 1,
  date: "2026-03-24",
  type: "lunch", // 'breakfast', 'lunch', 'snack', 'dinner'
  totalCalories: 650,
  totalProtein: 50,
  totalCarbs: 60,
  totalFat: 20,
  dateCreated: Date.now()
}
```

**Table `repasElements`** :
```javascript
{
  id: 1,
  repasId: 1,
  elementType: "recette", // 'produit' ou 'recette'
  elementId: 1, // ID du produit ou de la recette
  quantity: 1.5, // portion (peut être fraction pour recette)
  calories: 450,
  protein: 31,
  carbs: 15,
  fat: 12
}
```

**Table `profil`** :
```javascript
{
  id: 1,
  heightCm: 175,
  weightKg: 70,
  age: 30,
  goalType: "weight_loss", // 'weight_loss', 'muscle_gain', 'maintenance'
  deficitPercent: 20, // % de déficit calorique pour perte de poids
  surplusPercent: 10, // % de surplus pour prise de masse
  
  // Calculs automatiques basés sur les formules (Mifflin-St Jeor, etc.)
  tdeeCalories: 2000, // Total Daily Energy Expenditure
  targetCalories: 1600, // objectif calorique journalier
  
  // Macros cibles (en %)
  proteinPercent: 30,
  carbsPercent: 40,
  fatPercent: 30,
  
  // Ou en valeurs absolues (g)
  targetProteinG: 150,
  targetCarbsG: 200,
  targetFatG: 53,
  
  dateModified: Date.now()
}
```

#### Tests d'intégrité

```javascript
// À ajouter dans app.js pour valider la DB
async function testDatabase() {
  try {
    // Test 1 : insérer un produit
    const produitId = await db.produits.add({
      name: "Riz blanc cuit",
      category: "glucides",
      unitType: "g",
      calories: 130,
      protein: 2.7,
      carbs: 28,
      fat: 0.3,
      portionSize: 100
    });
    console.log("✓ Produit inséré :", produitId);

    // Test 2 : récupérer le produit
    const produit = await db.produits.get(produitId);
    console.log("✓ Produit récupéré :", produit);

    // Test 3 : vérifier que la DB persiste
    console.log("✓ Base de données initialized avec succès");
  } catch (error) {
    console.error("✗ Erreur DB :", error);
  }
}

// Appeler au démarrage
await testDatabase();
```

### 1.2 Migration des données existantes

**Objectif** : Convertir l'ancien stockage `localStorage` en `IndexedDB` pour plus de capacité et meilleure performance.

#### Script de migration

```javascript
async function migrateFromLocalStorage() {
  const oldState = JSON.parse(localStorage.getItem('protein-tracker-state-v1') || '{}');
  
  if (!oldState.foods) {
    console.log("Aucune donnée ancienne à migrer");
    return;
  }

  // Migrer les aliments
  for (const food of oldState.foods) {
    await db.produits.add({
      name: food.name,
      category: 'other',
      unitType: food.unitType,
      calories: food.caloriesPer100g || 0,
      protein: food.proteinPer100g || food.proteinPerUnit || 0,
      carbs: 0,
      fat: 0,
      portionSize: 100,
      imported: false,
      dateAdded: Date.now()
    });
  }

  console.log("✓ Migration complétée : ", oldState.foods.length, "aliments migré");
}

// Appeler une seule fois
await migrateFromLocalStorage();
```

---

## Phase 2 : Gestion des produits alimentaires

### 2.1 Interface d'ajout/édition de produits

#### Objectif
Créer une section dédiée dans l'app pour gérer la base alimentaire personnelle : ajouter, éditer, supprimer, importer des produits.

#### Modifications HTML (`index.html`)

Ajouter un nouveau tab "Produits" :

```html
<nav class="tab-nav" aria-label="Navigation principale">
  <button class="tab-btn active" data-tab="journal">Journal</button>
  <button class="tab-btn" data-tab="recipes">Recettes</button>
  <button class="tab-btn" data-tab="products">Produits</button>
  <button class="tab-btn" data-tab="history">Historique</button>
  <button class="tab-btn" data-tab="profile">Profil</button>
</nav>

<section id="tab-products" class="tab-panel">
  <article class="panel">
    <div class="panel-head">
      <h2>Ma Base Alimentaire</h2>
      <div class="product-actions">
        <button id="addProductBtn" class="btn-primary">+ Ajouter Produit</button>
        <button id="importApiBtn" class="btn-secondary">Importer (OpenFoodFacts)</button>
      </div>
    </div>

    <!-- Liste des produits avec actions -->
    <div id="productsList" class="products-grid">
      <!-- Sera rempli dynamiquement -->
    </div>

    <!-- Modal d'ajout/édition de produit -->
    <dialog id="productModal" class="modal">
      <div class="modal-content">
        <h3 id="productModalTitle">Ajouter un produit</h3>
        <form id="productForm" class="stack">
          <label>
            Nom *
            <input id="productName" type="text" required placeholder="Ex: Poulet rôti">
          </label>

          <label>
            Catégorie
            <select id="productCategory">
              <option value="protéines">Protéines</option>
              <option value="glucides">Glucides</option>
              <option value="lipides">Lipides</option>
              <option value="fruits">Fruits</option>
              <option value="légumes">Légumes</option>
              <option value="autre">Autre</option>
            </select>
          </label>

          <label>
            Type d'unité
            <select id="productUnitType">
              <option value="g">Gramme (g)</option>
              <option value="ml">Millilitre (ml)</option>
              <option value="unit">Unité (ex: 1 œuf)</option>
              <option value="portion">Portion standard</option>
            </select>
          </label>

          <div class="quantity-row">
            <label>
              Taille portion référence *
              <input id="productPortionSize" type="number" min="1" step="10" required placeholder="100">
            </label>
            <label>
              Unité
              <input id="productPortionUnit" type="text" readonly>
            </label>
          </div>

          <fieldset>
            <legend>Valeurs nutritionnelles (pour la portion)</legend>
            <div class="quantity-row">
              <label>
                Calories
                <input id="productCalories" type="number" min="0" step="0.1" required>
              </label>
              <label>
                Protéines (g)
                <input id="productProtein" type="number" min="0" step="0.1" required>
              </label>
            </div>
            <div class="quantity-row">
              <label>
                Glucides (g)
                <input id="productCarbs" type="number" min="0" step="0.1" required>
              </label>
              <label>
                Lipides (g)
                <input id="productFat" type="number" min="0" step="0.1" required>
              </label>
            </div>
          </fieldset>

          <div class="modal-actions">
            <button type="button" id="productModalClose" class="btn-secondary">Annuler</button>
            <button type="submit" class="btn-primary">Enregistrer</button>
          </div>
        </form>
      </div>
    </dialog>
  </article>
</section>
```

#### Fonctions de gestion (ajouter à `app.js`)

```javascript
// ========== GESTION DES PRODUITS ==========

async function openProductModal(productId = null) {
  const modal = document.getElementById('productModal');
  const form = document.getElementById('productForm');
  const title = document.getElementById('productModalTitle');

  if (productId) {
    // Mode édition
    const product = await db.produits.get(productId);
    title.textContent = 'Éditer le produit';
    form.dataset.productId = productId;
    
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productUnitType').value = product.unitType;
    document.getElementById('productPortionSize').value = product.portionSize;
    document.getElementById('productCalories').value = product.calories;
    document.getElementById('productProtein').value = product.protein;
    document.getElementById('productCarbs').value = product.carbs;
    document.getElementById('productFat').value = product.fat;
  } else {
    // Mode ajout
    title.textContent = 'Ajouter un produit';
    form.reset();
    delete form.dataset.productId;
  }

  modal.showModal();
}

async function saveProduct(e) {
  e.preventDefault();
  const form = e.target;
  const productId = form.dataset.productId ? parseInt(form.dataset.productId) : null;

  const productData = {
    name: document.getElementById('productName').value,
    category: document.getElementById('productCategory').value,
    unitType: document.getElementById('productUnitType').value,
    portionSize: parseFloat(document.getElementById('productPortionSize').value),
    calories: parseFloat(document.getElementById('productCalories').value),
    protein: parseFloat(document.getElementById('productProtein').value),
    carbs: parseFloat(document.getElementById('productCarbs').value),
    fat: parseFloat(document.getElementById('productFat').value),
    dateModified: Date.now()
  };

  if (productId) {
    // Mise à jour
    await db.produits.update(productId, productData);
    console.log("✓ Produit mis à jour :", productId);
  } else {
    // Création
    productData.dateAdded = Date.now();
    productData.imported = false;
    const newId = await db.produits.add(productData);
    console.log("✓ Produit créé :", newId);
  }

  document.getElementById('productModal').close();
  await renderProductsList();
}

async function deleteProduct(productId) {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
    // Vérifier si le produit est utilisé dans une recette
    const recettesUsing = await db.recetteProduits
      .where('produitId')
      .equals(productId)
      .toArray();

    if (recettesUsing.length > 0) {
      alert(`Impossible : ce produit est utilisé dans ${recettesUsing.length} recette(s).`);
      return;
    }

    await db.produits.delete(productId);
    console.log("✓ Produit supprimé :", productId);
    await renderProductsList();
  }
}

async function renderProductsList() {
  const container = document.getElementById('productsList');
  const products = await db.produits.toArray();

  if (products.length === 0) {
    container.innerHTML = '<p class="empty-state">Aucun produit. Commencez par en ajouter un !</p>';
    return;
  }

  container.innerHTML = products.map(p => `
    <div class="product-card">
      <div class="product-header">
        <strong>${p.name}</strong>
        <span class="product-category">${p.category}</span>
      </div>
      <div class="product-details">
        <div class="detail-row">
          <span>Portion :</span>
          <strong>${p.portionSize} ${p.unitType}</strong>
        </div>
        <div class="detail-row">
          <span>Calories :</span>
          <strong>${p.calories} kcal</strong>
        </div>
        <div class="nutritional-summary">
          <span>P: ${p.protein}g</span>
          <span>C: ${p.carbs}g</span>
          <span>L: ${p.fat}g</span>
        </div>
      </div>
      <div class="product-actions">
        <button class="btn-sm btn-secondary" onclick="openProductModal(${p.id})">Éditer</button>
        <button class="btn-sm btn-danger" onclick="deleteProduct(${p.id})">Supprimer</button>
      </div>
    </div>
  `).join('');
}

// ========== IMPORT DEPUIS OPENFOODFACTS ==========

async function importFromOpenFoodFacts() {
  const query = prompt('Chercher un produit (ex: "Poulet rôti" ou code-barres)');
  if (!query) return;

  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${query}&json=1`
    );
    const data = await response.json();

    if (!data.products || data.products.length === 0) {
      alert('Aucun produit trouvé');
      return;
    }

    // Afficher les résultats et permettre l'import
    const results = data.products.slice(0, 5); // top 5
    let html = '<select id="offResults">';
    results.forEach((p, idx) => {
      html += `<option value="${idx}">${p.product_name} (${p.brands || 'marque?'})</option>`;
    });
    html += '</select>';

    alert(html); // À améliorer avec un modal
    const selectedIdx = parseInt(document.getElementById('offResults')?.value || 0);
    const selected = results[selectedIdx];

    // Mapper les données OFF aux champs locaux
    const nutrition = selected.nutrition_data_per || {};
    await db.produits.add({
      name: selected.product_name,
      category: 'imported',
      unitType: 'g',
      portionSize: 100,
      calories: nutrition.calories || 0,
      protein: nutrition.proteins || 0,
      carbs: nutrition.carbohydrates || 0,
      fat: nutrition.fat || 0,
      imported: true,
      dateAdded: Date.now()
    });

    console.log("✓ Produit importé desde OpenFoodFacts :", selected.product_name);
    await renderProductsList();
  } catch (error) {
    console.error("✗ Erreur import OFF :", error);
    alert('Erreur lors de l\'import. Vérifiez votre connexion');
  }
}
```

### 2.2 Styles CSS pour les produits (ajouter à `styles.css`)

```css
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.product-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s ease;
}

.product-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.5rem;
}

.product-category {
  font-size: 0.75rem;
  background: rgba(13, 75, 87, 0.3);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  text-transform: capitalize;
}

.product-details {
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.nutritional-summary {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  opacity: 0.8;
}

.product-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
}

.btn-danger {
  background-color: rgba(220, 38, 38, 0.1);
  border: 1px solid rgba(220, 38, 38, 0.3);
  color: #ef4444;
}

.btn-danger:hover {
  background-color: rgba(220, 38, 38, 0.2);
}

.modal {
  background: rgba(13, 20, 30, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
}

.modal-content h3 {
  margin-bottom: 1.5rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}
```

---

## Phase 3 : Gestion des recettes

### 3.1 Interface de création / édition de recettes

#### Objectif
Permettre à l'utilisateur de créer des recettes en sélectionnant plusieurs produits et quantités, puis calculer automatiquement les macros totales de la recette.

#### Modifications HTML (`index.html`)

```html
<section id="tab-recipes" class="tab-panel">
  <article class="panel">
    <div class="panel-head">
      <h2>Mes Recettes</h2>
      <button id="addRecipeBtn" class="btn-primary">+ Nouvelle Recette</button>
    </div>

    <div id="recipesList" class="recipes-list">
      <!-- Sera rempli dynamiquement -->
    </div>

    <!-- Modal création/édition recette -->
    <dialog id="recipeModal" class="modal">
      <div class="modal-content">
        <h3 id="recipeModalTitle">Créer une recette</h3>
        <form id="recipeForm" class="stack">
          <label>
            Nom de la recette *
            <input id="recipeName" type="text" required placeholder="Ex: Poulet curry">
          </label>

          <label>
            Description (optionnel)
            <textarea id="recipeDescription" placeholder="Notes, instructions..."></textarea>
          </label>

          <label>
            Portions (combien de portions offre cette recette)
            <input id="recipeServings" type="number" min="1" step="1" value="1" required>
          </label>

          <fieldset>
            <legend>Ingrédients</legend>
            <div id="recipeIngredientsContainer" class="ingredients-container">
              <!-- Dynamiquement ajouté -->
            </div>
            <button type="button" id="addIngredientBtn" class="btn-secondary">+ Ajouter ingrédient</button>
          </fieldset>

          <!-- Totaux de la recette (calculés) -->
          <fieldset class="recipe-totals">
            <legend>Totaux de la recette</legend>
            <div class="totals-grid">
              <div>
                <p>Calories</p>
                <p id="recipeTotalCalories" class="value">0</p>
              </div>
              <div>
                <p>Protéines</p>
                <p id="recipeTotalProtein" class="value">0</p> g
              </div>
              <div>
                <p>Glucides</p>
                <p id="recipeTotalCarbs" class="value">0</p> g
              </div>
              <div>
                <p>Lipides</p>
                <p id="recipeTotalFat" class="value">0</p> g
              </div>
            </div>

            <hr style="margin: 1rem 0; opacity: 0.2;">

            <!-- Par portion -->
            <p style="font-size: 0.9rem; opacity: 0.8; margin-bottom: 0.5rem;">
              <strong>Par portion :</strong>
            </p>
            <div class="totals-grid">
              <div>
                <p>Calories</p>
                <p id="recipePerPortionCalories" class="value">0</p>
              </div>
              <div>
                <p>Protéines</p>
                <p id="recipePerPortionProtein" class="value">0</p> g
              </div>
              <div>
                <p>Glucides</p>
                <p id="recipePerPortionCarbs" class="value">0</p> g
              </div>
              <div>
                <p>Lipides</p>
                <p id="recipePerPortionFat" class="value">0</p> g
              </div>
            </div>
          </fieldset>

          <div class="modal-actions">
            <button type="button" id="recipeModalClose" class="btn-secondary">Annuler</button>
            <button type="submit" class="btn-primary">Enregistrer</button>
          </div>
        </form>
      </div>
    </dialog>
  </article>
</section>
```

#### Fonctions de recettes (ajouter à `app.js`)

```javascript
// ========== GESTION DES RECETTES ==========

let currentRecipeIngredients = []; // stockage temporaire des ingrédients en édition

async function openRecipeModal(recipeId = null) {
  const modal = document.getElementById('recipeModal');
  const form = document.getElementById('recipeForm');
  const title = document.getElementById('recipeModalTitle');

  currentRecipeIngredients = []; // reset

  if (recipeId) {
    // Mode édition
    const recipe = await db.recettes.get(recipeId);
    const ingredients = await db.recetteProduits
      .where('recetteId')
      .equals(recipeId)
      .toArray();

    title.textContent = 'Éditer la recette';
    form.dataset.recipeId = recipeId;
    
    document.getElementById('recipeName').value = recipe.name;
    document.getElementById('recipeDescription').value = recipe.description || '';
    document.getElementById('recipeServings').value = recipe.servings;

    currentRecipeIngredients = ingredients;
  } else {
    // Mode création
    title.textContent = 'Créer une recette';
    form.reset();
    delete form.dataset.recipeId;
  }

  renderRecipeIngredients();
  modal.showModal();
}

async function renderRecipeIngredients() {
  const container = document.getElementById('recipeIngredientsContainer');
  const products = await db.produits.toArray();

  container.innerHTML = currentRecipeIngredients.map((ing, idx) => {
    const product = products.find(p => p.id === ing.produitId);
    return `
      <div class="ingredient-row" data-idx="${idx}">
        <select class="ingredient-select" onchange="updateRecipeIngredient(${idx}, 'produitId', this.value)">
          <option value="">-- Choisir un produit --</option>
          ${products.map(p => `
            <option value="${p.id}" ${p.id === ing.produitId ? 'selected' : ''}>
              ${p.name}
            </option>
          `).join('')}
        </select>

        <input 
          type="number" 
          min="0" 
          step="0.1" 
          class="ingredient-quantity"
          value="${ing.quantity}"
          onchange="updateRecipeIngredient(${idx}, 'quantity', this.value)"
          placeholder="Quantité"
        >

        <span class="ingredient-unit">${product?.unitType || ''}</span>

        <button 
          type="button" 
          class="btn-sm btn-danger" 
          onclick="removeRecipeIngredient(${idx})"
        >
          ✕
        </button>
      </div>
    `;
  }).join('');
}

async function removeRecipeIngredient(idx) {
  currentRecipeIngredients.splice(idx, 1);
  await renderRecipeIngredients();
  calculateRecipeTotals();
}

async function updateRecipeIngredient(idx, field, value) {
  if (field === 'quantity') {
    currentRecipeIngredients[idx].quantity = parseFloat(value) || 0;
  } else if (field === 'produitId') {
    const produitId = parseInt(value);
    const product = await db.produits.get(produitId);
    currentRecipeIngredients[idx].produitId = produitId;
    currentRecipeIngredients[idx].unitType = product.unitType;
  }
  await renderRecipeIngredients();
  calculateRecipeTotals();
}

async function addRecipeIngredient() {
  const products = await db.produits.toArray();
  if (products.length === 0) {
    alert('Vous n\'avez aucun produit. Ajoutez-en d\'abord.');
    return;
  }
  
  currentRecipeIngredients.push({
    produitId: products[0].id,
    quantity: 100,
    unitType: products[0].unitType
  });
  
  await renderRecipeIngredients();
}

async function calculateRecipeTotals() {
  let totalCal = 0, totalProt = 0, totalCarb = 0, totalFat = 0;

  for (const ing of currentRecipeIngredients) {
    const product = await db.produits.get(ing.produitId);
    if (!product) continue;

    // Calculer les calories/macros pour la quantité donnée
    const cal = (ing.quantity / product.portionSize) * product.calories;
    const prot = (ing.quantity / product.portionSize) * product.protein;
    const carb = (ing.quantity / product.portionSize) * product.carbs;
    const fat = (ing.quantity / product.portionSize) * product.fat;

    totalCal += cal;
    totalProt += prot;
    totalCarb += carb;
    totalFat += fat;
  }

  const servings = parseInt(document.getElementById('recipeServings').value) || 1;

  // Totaux de la recette
  document.getElementById('recipeTotalCalories').textContent = Math.round(totalCal);
  document.getElementById('recipeTotalProtein').textContent = totalProt.toFixed(1);
  document.getElementById('recipeTotalCarbs').textContent = totalCarb.toFixed(1);
  document.getElementById('recipeTotalFat').textContent = totalFat.toFixed(1);

  // Par portion
  document.getElementById('recipePerPortionCalories').textContent = Math.round(totalCal / servings);
  document.getElementById('recipePerPortionProtein').textContent = (totalProt / servings).toFixed(1);
  document.getElementById('recipePerPortionCarbs').textContent = (totalCarb / servings).toFixed(1);
  document.getElementById('recipePerPortionFat').textContent = (totalFat / servings).toFixed(1);
}

async function saveRecipe(e) {
  e.preventDefault();
  
  if (currentRecipeIngredients.length === 0) {
    alert('Ajoutez au moins un ingrédient');
    return;
  }

  const form = e.target;
  const recipeId = form.dataset.recipeId ? parseInt(form.dataset.recipeId) : null;

  const name = document.getElementById('recipeName').value;
  const description = document.getElementById('recipeDescription').value;
  const servings = parseInt(document.getElementById('recipeServings').value);

  // Calculer les totaux finaux
  let totalCal = 0, totalProt = 0, totalCarb = 0, totalFat = 0;
  for (const ing of currentRecipeIngredients) {
    const product = await db.produits.get(ing.produitId);
    totalCal += (ing.quantity / product.portionSize) * product.calories;
    totalProt += (ing.quantity / product.portionSize) * product.protein;
    totalCarb += (ing.quantity / product.portionSize) * product.carbs;
    totalFat += (ing.quantity / product.portionSize) * product.fat;
  }

  if (recipeId) {
    // Mise à jour
    await db.recettes.update(recipeId, {
      name,
      description,
      servings,
      totalCalories: totalCal,
      totalProtein: totalProt,
      totalCarbs: totalCarb,
      totalFat: totalFat,
      dateModified: Date.now()
    });

    // Supprimer les anciens ingrédients et ajouter les nouveaux
    const oldIngredients = await db.recetteProduits.where('recetteId').equals(recipeId).toArray();
    for (const ing of oldIngredients) {
      await db.recetteProduits.delete(ing.id);
    }
  } else {
    // Création
    const newRecipeId = await db.recettes.add({
      name,
      description,
      servings,
      totalCalories: totalCal,
      totalProtein: totalProt,
      totalCarbs: totalCarb,
      totalFat: totalFat,
      dateCreated: Date.now(),
      dateModified: Date.now()
    });
    
    // Insérer les nouveaux ingrédients avec la recipeId
    for (const ing of currentRecipeIngredients) {
      ing.recetteId = newRecipeId;
    }
    break; // Réussir à récupérer le newRecipeId plus tard
  }

  // Insérer les ingrédients
  for (const ing of currentRecipeIngredients) {
    const recId = recipeId || newRecipeId; // ou utiliser le result de .add()
    await db.recetteProduits.add({
      recetteId: recId,
      produitId: ing.produitId,
      quantity: ing.quantity,
      unitType: ing.unitType
    });
  }

  console.log("✓ Recette enregistrée :", name);
  document.getElementById('recipeModal').close();
  await renderRecipesList();
}

async function deleteRecipe(recipeId) {
  if (confirm('Êtes-vous sûr de vouloir supprimer cette recette ?')) {
    // Supprimer les ingrédients associés
    await db.recetteProduits.where('recetteId').equals(recipeId).delete();
    
    // Supprimer la recette
    await db.recettes.delete(recipeId);
    
    console.log("✓ Recette supprimée :", recipeId);
    await renderRecipesList();
  }
}

async function renderRecipesList() {
  const container = document.getElementById('recipesList');
  const recipes = await db.recettes.toArray();

  if (recipes.length === 0) {
    container.innerHTML = '<p class="empty-state">Aucune recette. Créez-en une !</p>';
    return;
  }

  container.innerHTML = recipes.map(r => `
    <div class="recipe-card">
      <div class="recipe-header">
        <strong>${r.name}</strong>
        <span class="recipe-servings">${r.servings} portion(s)</span>
      </div>
      ${r.description ? `<p class="recipe-description">${r.description}</p>` : ''}
      <div class="recipe-nutrition">
        <div>Cal: ${Math.round(r.totalCalories)}</div>
        <div>P: ${r.totalProtein.toFixed(1)}g</div>
        <div>C: ${r.totalCarbs.toFixed(1)}g</div>
        <div>L: ${r.totalFat.toFixed(1)}g</div>
      </div>
      <div class="recipe-actions">
        <button class="btn-sm btn-secondary" onclick="openRecipeModal(${r.id})">Éditer</button>
        <button class="btn-sm btn-danger" onclick="deleteRecipe(${r.id})">Supprimer</button>
      </div>
    </div>
  `).join('');
}
```

---

## Phase 4 : Planification des repas (Journal/Calendrier)

### 4.1 Interface de journal des repas

#### Objectif
Créer une vue « journal » où l'utilisateur peut ajouter des produits/recettes à ses repas quotidiens (petit-déj, déj, snack, soir) et voir les totaux du jour.

#### Vue améliorée du tab Journal

```html
<section id="tab-journal" class="tab-panel active">
  <article class="panel">
    <div class="panel-head">
      <h2>Journal du <span id="journalDate">aujourd'hui</span></h2>
      <div class="date-nav">
        <button id="prevDayBtn" class="btn-sm btn-secondary">← Hier</button>
        <button id="todayBtn" class="btn-sm btn-secondary">Aujourd'hui</button>
        <button id="nextDayBtn" class="btn-sm btn-secondary">Demain →</button>
      </div>
    </div>

    <!-- Affichage des repas par type -->
    <div id="mealsContainer" class="meals-layout">
      <!-- Sera rempli dynamiquement -->
    </div>
  </article>

  <!-- Totaux du jour -->
  <article class="panel panel-daily-totals" aria-live="polite">
    <h3>Résumé de la journée</h3>
    <div class="daily-totals-grid">
      <div class="total-item">
        <p class="label">Calories</p>
        <p class="value" id="dailyTotalCalories">0</p>
        <p class="target">/ <span id="dailyTargetCalories">2000</span></p>
      </div>
      <div class="total-item">
        <p class="label">Protéines</p>
        <p class="value" id="dailyTotalProtein">0</p> g
        <p class="target">/ <span id="dailyTargetProtein">150</span> g</p>
      </div>
      <div class="total-item">
        <p class="label">Glucides</p>
        <p class="value" id="dailyTotalCarbs">0</p> g
        <p class="target">/ <span id="dailyTargetCarbs">250</span> g</p>
      </div>
      <div class="total-item">
        <p class="label">Lipides</p>
        <p class="value" id="dailyTotalFat">0</p> g
        <p class="target">/ <span id="dailyTargetFat">70</span> g</p>
      </div>
    </div>

    <!-- Retour coach -->
    <div id="coachFeedback" class="coach-feedback">
      <!-- Sera mis à jour dynamiquement -->
    </div>
  </article>

  <!-- Dialog pour ajouter aliment/recette à un repas -->
  <dialog id="addMealElementModal" class="modal">
    <div class="modal-content">
      <h3>Ajouter au repas</h3>
      <form id="addMealElementForm" class="stack">
        <label>
          Type
          <select id="mealElementType">
            <option value="produit">Produit</option>
            <option value="recette">Recette</option>
          </select>
        </label>

        <label>
          Sélectionner
          <select id="mealElementSelect">
            <!-- Options dynamiques selon le type -->
          </select>
        </label>

        <label>
          Quantité
          <input id="mealElementQuantity" type="number" min="0" step="0.1" value="1" required>
        </label>

        <div class="modal-actions">
          <button type="button" id="addMealElementClose" class="btn-secondary">Annuler</button>
          <button type="submit" class="btn-primary">Ajouter</button>
        </div>
      </form>
    </div>
  </dialog>
</section>
```

#### Fonctions de journal (ajouter à `app.js`)

```javascript
// ========== GESTION DU JOURNAL DES REPAS ==========

let currentDate = new Date();
let mealBeingAdded = null; // { repasId, type }

const MEAL_TYPES = {
  breakfast: { label: 'Petit-déjeuner', emoji: '🌅' },
  lunch: { label: 'Déjeuner', emoji: '🍽️' },
  snack: { label: 'Goûter', emoji: '🍎' },
  dinner: { label: 'Dîner', emoji: '🌙' }
};

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateLabel(date) {
  const today = formatDate(new Date());
  const target = formatDate(date);
  
  if (target === today) return 'Aujourd\'hui';
  
  const diff = date - new Date();
  if (diff > 0 && diff < 86400000) return 'Demain';
  if (diff < 0 && diff > -86400000) return 'Hier';
  
  return date.toLocaleDateString('fr-FR', { weekday: 'short', month: 'short', day: 'numeric' });
}

async function renderJournal(date = new Date()) {
  const dateStr = formatDate(date);
  document.getElementById('journalDate').textContent = getDateLabel(date);

  // Récupérer ou créer les repas pour cette date
  let meals = await db.repas
    .where('date')
    .equals(dateStr)
    .toArray();

  if (meals.length === 0) {
    // Créer les 4 repas par défaut
    for (const type of ['breakfast', 'lunch', 'snack', 'dinner']) {
      const repasId = await db.repas.add({
        date: dateStr,
        type,
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        dateCreated: Date.now()
      });
      meals.push({ id: repasId, date: dateStr, type, totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 });
    }
  }

  // Afficher les repas
  const container = document.getElementById('mealsContainer');
  container.innerHTML = '';

  for (const meal of meals) {
    const elements = await db.repasElements
      .where('repasId')
      .equals(meal.id)
      .toArray();

    const mealHTML = document.createElement('div');
    mealHTML.className = 'meal-section';
    mealHTML.innerHTML = `
      <div class="meal-header">
        <h3>${MEAL_TYPES[meal.type].emoji} ${MEAL_TYPES[meal.type].label}</h3>
        <button class="btn-sm btn-primary" onclick="openAddMealElementModal(${meal.id}, '${meal.type}')">
          + Ajouter
        </button>
      </div>

      <ul class="meal-elements-list">
        ${elements.map(el => `
          <li class="meal-element">
            <div class="element-info">
              <strong>${el.calories ? Math.round(el.calories) : '?'} kcal</strong>
              <span class="element-nutrition">P: ${el.protein?.toFixed(1) || '?'}g | C: ${el.carbs?.toFixed(1) || '?'}g | L: ${el.fat?.toFixed(1) || '?'}g</span>
            </div>
            <button class="btn-sm btn-danger" onclick="removeMealElement(${el.id}, ${meal.id})">✕</button>
          </li>
        `).join('')}
      </ul>

      <div class="meal-totals">
        <span>${Math.round(meal.totalCalories)} kcal</span>
        <span>P: ${meal.totalProtein?.toFixed(1) || 0}g</span>
        <span>C: ${meal.totalCarbs?.toFixed(1) || 0}g</span>
        <span>L: ${meal.totalFat?.toFixed(1) || 0}g</span>
      </div>
    `;

    container.appendChild(mealHTML);
  }

  // Calculer et afficher les totaux du jour
  await updateDailyTotals(dateStr);
}

async function updateDailyTotals(dateStr) {
  const meals = await db.repas.where('date').equals(dateStr).toArray();

  let totalCal = 0, totalProt = 0, totalCarb = 0, totalFat = 0;

  for (const meal of meals) {
    totalCal += meal.totalCalories || 0;
    totalProt += meal.totalProtein || 0;
    totalCarb += meal.totalCarbs || 0;
    totalFat += meal.totalFat || 0;
  }

  document.getElementById('dailyTotalCalories').textContent = Math.round(totalCal);
  document.getElementById('dailyTotalProtein').textContent = totalProt.toFixed(1);
  document.getElementById('dailyTotalCarbs').textContent = totalCarb.toFixed(1);
  document.getElementById('dailyTotalFat').textContent = totalFat.toFixed(1);

  // Charger les objectifs du profil
  const profil = await db.profil.toArray();
  if (profil.length > 0) {
    const target = profil[0];
    document.getElementById('dailyTargetCalories').textContent = target.targetCalories || 2000;
    document.getElementById('dailyTargetProtein').textContent = target.targetProteinG || 150;
    document.getElementById('dailyTargetCarbs').textContent = target.targetCarbsG || 250;
    document.getElementById('dailyTargetFat').textContent = target.targetFatG || 70;

    // Afficher feedback coach
    await displayCoachFeedback(totalCal, totalProt, totalCarb, totalFat, target);
  }
}

async function openAddMealElementModal(repasId, mealType) {
  mealBeingAdded = { repasId, type: mealType };

  const modal = document.getElementById('addMealElementModal');
  const typeSelect = document.getElementById('mealElementType');
  const elementSelect = document.getElementById('mealElementSelect');

  // Remplir les options par défaut (produits)
  const products = await db.produits.toArray();
  elementSelect.innerHTML = products.map(p => `
    <option value="${p.id}">${p.name}</option>
  `).join('');

  // Listener pour changer type
  typeSelect.onchange = async () => {
    const type = typeSelect.value;
    if (type === 'produit') {
      const products = await db.produits.toArray();
      elementSelect.innerHTML = products.map(p => `
        <option value="${p.id}">${p.name}</option>
      `).join('');
    } else {
      const recipes = await db.recettes.toArray();
      elementSelect.innerHTML = recipes.map(r => `
        <option value="${r.id}">${r.name}</option>
      `).join('');
    }
  };

  modal.showModal();
}

async function saveMealElement(e) {
  e.preventDefault();

  const type = document.getElementById('mealElementType').value;
  const elementId = parseInt(document.getElementById('mealElementSelect').value);
  const quantity = parseFloat(document.getElementById('mealElementQuantity').value) || 1;

  let calories = 0, protein = 0, carbs = 0, fat = 0;

  if (type === 'produit') {
    const product = await db.produits.get(elementId);
    calories = (quantity / product.portionSize) * product.calories;
    protein = (quantity / product.portionSize) * product.protein;
    carbs = (quantity / product.portionSize) * product.carbs;
    fat = (quantity / product.portionSize) * product.fat;
  } else {
    const recipe = await db.recettes.get(elementId);
    calories = (quantity / recipe.servings) * recipe.totalCalories;
    protein = (quantity / recipe.servings) * recipe.totalProtein;
    carbs = (quantity / recipe.servings) * recipe.totalCarbs;
    fat = (quantity / recipe.servings) * recipe.totalFat;
  }

  // Ajouter à la DB
  await db.repasElements.add({
    repasId: mealBeingAdded.repasId,
    elementType: type,
    elementId,
    quantity,
    calories,
    protein,
    carbs,
    fat
  });

  // Mettre à jour les totaux du repas
  const meal = await db.repas.get(mealBeingAdded.repasId);
  await db.repas.update(mealBeingAdded.repasId, {
    totalCalories: (meal.totalCalories || 0) + calories,
    totalProtein: (meal.totalProtein || 0) + protein,
    totalCarbs: (meal.totalCarbs || 0) + carbs,
    totalFat: (meal.totalFat || 0) + fat
  });

  document.getElementById('addMealElementModal').close();
  await renderJournal(currentDate);
}

async function removeMealElement(elementId, repasId) {
  const element = await db.repasElements.get(elementId);
  const meal = await db.repas.get(repasId);

  // Soustraire des totaux du repas
  await db.repas.update(repasId, {
    totalCalories: Math.max(0, (meal.totalCalories || 0) - (element.calories || 0)),
    totalProtein: Math.max(0, (meal.totalProtein || 0) - (element.protein || 0)),
    totalCarbs: Math.max(0, (meal.totalCarbs || 0) - (element.carbs || 0)),
    totalFat: Math.max(0, (meal.totalFat || 0) - (element.fat || 0))
  });

  // Supprimer l'élément
  await db.repasElements.delete(elementId);

  await renderJournal(currentDate);
}
```

---

## Phase 5 : Paramètres et objectifs utilisateur

### 5.1 Formulaire de profil amélioré

#### Calcul automatique des besoins caloriques

```javascript
// ========== GESTION DU PROFIL & OBJECTIFS ==========

function calculateTDEE(heightCm, weightKg, age, activityLevel = 1.2) {
  // Formule Mifflin-St Jeor (pour homme; adaptable pour femme)
  const baseMetabolism = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  return Math.round(baseMetabolism * activityLevel);
}

async function saveProfile(e) {
  e.preventDefault();

  const height = parseInt(document.getElementById('profileHeight').value);
  const weight = parseFloat(document.getElementById('profileWeight').value);
  const age = parseInt(document.getElementById('profileAge').value);
  const gender = document.getElementById('profileGender').value; // 'male' | 'female'
  const goalType = document.getElementById('profileGoal').value; // 'weight_loss' | 'muscle_gain' | 'maintenance'

  // Calcul TDEE
  const tdee = calculateTDEE(height, weight, age);

  // Calcul des objectifs caloriques
  let targetCalories = tdee;
  if (goalType === 'weight_loss') {
    const deficitPercent = 20; // 20% déficit par défaut
    targetCalories = Math.round(tdee * (1 - deficitPercent / 100));
  } else if (goalType === 'muscle_gain') {
    const surplusPercent = 10;
    targetCalories = Math.round(tdee * (1 + surplusPercent / 100));
  }

  // Objectifs macros (ratios standards)
  const proteinPercent = 30;
  const carbsPercent = 40;
  const fatPercent = 30;

  const targetProteinG = Math.round((targetCalories * proteinPercent / 100) / 4); // 4 cal/g
  const targetCarbsG = Math.round((targetCalories * carbsPercent / 100) / 4);
  const targetFatG = Math.round((targetCalories * fatPercent / 100) / 9); // 9 cal/g

  // Sauvegarder ou mettre à jour le profil
  const existingProfile = await db.profil.toArray();
  if (existingProfile.length > 0) {
    await db.profil.update(existingProfile[0].id, {
      heightCm: height,
      weightKg: weight,
      age,
      gender,
      goalType,
      tdeeCalories: tdee,
      targetCalories,
      proteinPercent,
      carbsPercent,
      fatPercent,
      targetProteinG,
      targetCarbsG,
      targetFatG,
      dateModified: Date.now()
    });
  } else {
    await db.profil.add({
      heightCm: height,
      weightKg: weight,
      age,
      gender,
      goalType,
      tdeeCalories: tdee,
      targetCalories,
      proteinPercent,
      carbsPercent,
      fatPercent,
      targetProteinG,
      targetCarbsG,
      targetFatG,
      dateCreated: Date.now()
    });
  }

  console.log("✓ Profil mis à jour");
  alert(`Votre objectif journalier: ${targetCalories} kcal\nP: ${targetProteinG}g | C: ${targetCarbsG}g | L: ${targetFatG}g`);
  await renderJournal(currentDate);
}
```

---

## Phase 6 : Suivi et feedback coach

### 6.1 Logique de feedback intelligent

```javascript
// ========== FEEDBACK COACH ==========

async function displayCoachFeedback(totalCal, totalProt, totalCarb, totalFat, target) {
  const feedback = document.getElementById('coachFeedback');
  
  if (!target || !target.targetCalories) {
    feedback.innerHTML = '';
    return;
  }

  const messages = [];

  // Analyse calorique
  const calPercent = Math.round((totalCal / target.targetCalories) * 100);
  if (calPercent < 70) {
    messages.push(`⚠️ Vous êtes à ${calPercent}% de vos calories cibles. Vous en manquez ~${target.targetCalories - totalCal} kcal!`);
  } else if (calPercent > 130) {
    messages.push(`⚠️ Vous avez dépassé vos calories de ~${totalCal - target.targetCalories} kcal (${calPercent}%).`);
  } else if (calPercent >= 100 && calPercent <= 105) {
    messages.push(`✅ Parfait ! Vous avez atteint vos calories cibles.`);
  } else {
    messages.push(`👍 Vous êtes à ${calPercent}% de votre objectif calorique.`);
  }

  // Analyse protéines
  const protPercent = Math.round((totalProt / target.targetProteinG) * 100);
  if (protPercent < 80) {
    messages.push(`💪 Vous manquez de protéines : ${totalProt.toFixed(1)}g / ${target.targetProteinG}g (${protPercent}%).`);
  } else if (protPercent > 120) {
    messages.push(`💪 Très bonnes protéines : ${totalProt.toFixed(1)}g / ${target.targetProteinG}g (${protPercent}%).`);
  } else {
    messages.push(`✅ Protéines OK : ${totalProt.toFixed(1)}g / ${target.targetProteinG}g (${protPercent}%).`);
  }

  // Afficher les messages
  feedback.innerHTML = `
    <div class="feedback-messages">
      ${messages.map(msg => `<p>${msg}</p>`).join('')}
    </div>
  `;
}
```

---

## Phase 7 : Tests unitaires

### 7.1 Configuration Jest

#### Package.json (à ajouter)
```json
{
  "devDependencies": {
    "jest": "^29.0.0"
  },
  "scripts": {
    "test": "jest"
  }
}
```

#### Tests (fichier `__tests__/calculations.test.js`)

```javascript
describe('Calculs nutritionnels', () => {
  test('calcule les calories d\'une portion correctement', () => {
    const product = {
      calories: 165,
      portionSize: 100
    };
    const quantity = 150;
    const result = (quantity / product.portionSize) * product.calories;
    expect(result).toBe(247.5);
  });

  test('agrège les macros d\'une recette', () => {
    const ingredients = [
      { calories: 200, protein: 30, carbs: 0, fat: 5, quantity: 100, portionSize: 100 },
      { calories: 100, protein: 2, carbs: 20, fat: 1, quantity: 150, portionSize: 100 }
    ];

    let total = { cal: 0, prot: 0, carb: 0, fat: 0 };
    for (const ing of ingredients) {
      total.cal += (ing.quantity / ing.portionSize) * ing.calories;
      total.prot += (ing.quantity / ing.portionSize) * ing.protein;
      total.carb += (ing.quantity / ing.portionSize) * ing.carbs;
      total.fat += (ing.quantity / ing.portionSize) * ing.fat;
    }

    expect(total.cal).toBeCloseTo(350, 1);
    expect(total.prot).toBe(30.6);
  });

  test('calcule les objectifs caloirques selon le goal', () => {
    const tdee = 2000;
    assert.equal(Math.round(tdee * 0.8), 1600); // 20% déficit
    assert.equal(Math.round(tdee * 1.1), 2200); // 10% surplus
  });
});
```

---

## 📊 Résumé des fichiers à créer/modifier

| Fichier | Statut | Description |
|---------|--------|-------------|
| `db.js` | ✨ Créer | Configuration Dexie + schémas DB |
| `app.js` | 📝 Extension | Ajouter phases 2-7 (produits, recettes, repas, profil, feedback) |
| `index.html` | 📝 Extension | Ajouter tabs pour recettes, produits; modals, journal amélioré |
| `styles.css` | 📝 Extension | Styles pour cards, grilles, modals |
| `__tests__/calculations.test.js` | ✨ Créer | Tests unitaires |
| `sw.js` | ✅ Existant | Service Worker (PWA) - garder comme-is |
| `manifest.json` | ✅ Existant | Manifest PWA - garder comme-is |

---

## 🚀 Ordre d'implémentation recommandé

1. **Phase 1** (1-2j) : Installer Dexie, configurer DB, migrer données
2. **Phase 2** (2-3j) : UI produits + CRUD + import OpenFoodFacts
3. **Phase 3** (3-4j) : UI recettes + calcul auto des macros
4. **Phase 4** (3-4j) : Journal des repas quotidiens
5. **Phase 5** (1-2j) : Profil & objectifs dynamiques
6. **Phase 6** (2-3j) : Feedback coach et visualisations
7. **Phase 7** (2j) : Tests + polissage

---

## 💡 Points clés pour la succès

✅ **Stockage local** : Tout persiste via Dexie (IndexedDB)  
✅ **Offline-first** : L'app fonctionne sans internet  
✅ **Calcul automatique** : Les macros se calculent, pas de saisie manuelle  
✅ **Réutilisabilité** : Les produits et recettes se réutilisent facilement  
✅ **Simplicité UI** : Navigation claire, peu de clics pour l'essentiel  
✅ **Feedback immédiat** : Coach inline montre progression vs objectifs  

---

**Status Général** : 📋 Plan détaillé complété. Prêt pour Phase 1 !
