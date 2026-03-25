/**
 * Configuration Dexie - Base de données locale IndexedDB
 * Gère produits, recettes, repas et profil utilisateur
 */

const db = new Dexie('SuiviRegimeDB');

db.version(1).stores({
  // Table des produits/aliments
  // Index par ID (auto), nom et catégorie pour recherche rapide
  produits: '++id, name, category',
  
  // Table des recettes
  recettes: '++id, name',
  
  // Association recette -> produits (ingredients)
  // Clé primaire: auto; index par recetteId et produitId
  recetteProduits: '++id, recetteId, produitId',
  
  // Table des repas (petit-déj, déj, snack, soir)
  // Index par date (YYYY-MM-DD) et type de repas
  repas: '++id, date, type',
  
  // Association repas -> recettes/produits consommés
  // elementType: 'produit' | 'recette'
  repasElements: '++id, repasId, elementType, elementId',
  
  // Profil utilisateur (généralement 1 seul document)
  profil: '++id'
});

db.version(2).stores({
  produits: '++id, name, category',
  recettes: '++id, name',
  recetteProduits: '++id, recetteId, produitId',
  repas: '++id, date, type, profileId, [date+profileId], [date+type+profileId]',
  repasElements: '++id, repasId, elementType, elementId',
  profil: '++id'
}).upgrade(async (tx) => {
  await tx.table('repas').toCollection().modify((meal) => {
    if (!meal.profileId) {
      meal.profileId = 'max';
    }
  });
});

/**
 * Initialisation avec données par défaut
 */
async function initializeDatabase() {
  const produitCount = await db.produits.count();
  
  if (produitCount === 0) {
    console.log('Initialisation DB avec produits par défaut...');
    
    const defaultProducts = [
      { name: "Poulet cuit", category: "protéines", unitType: "g", calories: 165, protein: 31, carbs: 0, fat: 3.6, portionSize: 100, imported: false },
      { name: "Steak haché 5% cuit", category: "protéines", unitType: "g", calories: 147, protein: 26, carbs: 0, fat: 5, portionSize: 100, imported: false },
      { name: "Thon nature égoutté", category: "protéines", unitType: "g", calories: 96, protein: 24, carbs: 0, fat: 0.8, portionSize: 100, imported: false },
      { name: "Œuf entier", category: "protéines", unitType: "unit", calories: 78, protein: 6.5, carbs: 0.6, fat: 5.3, portionSize: 1, imported: false },
      { name: "Blanc d'œuf", category: "protéines", unitType: "unit", calories: 17, protein: 3.6, carbs: 0.7, fat: 0, portionSize: 1, imported: false },
      { name: "Whey protéine", category: "protéines", unitType: "scoop", calories: 120, protein: 24, carbs: 2, fat: 1, portionSize: 1, imported: false },
      { name: "Skyr nature", category: "protéines", unitType: "g", calories: 100, protein: 10, carbs: 3.5, fat: 5.5, portionSize: 100, imported: false },
      { name: "Fromage blanc", category: "protéines", unitType: "g", calories: 80, protein: 8, carbs: 4, fat: 5, portionSize: 100, imported: false },
      { name: "Lentilles cuites", category: "glucides", unitType: "g", calories: 116, protein: 9, carbs: 20, fat: 0.4, portionSize: 100, imported: false },
      { name: "Tofu ferme", category: "protéines", unitType: "g", calories: 76, protein: 13, carbs: 1.9, fat: 4.8, portionSize: 100, imported: false },
      { name: "Riz blanc cuit", category: "glucides", unitType: "g", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, portionSize: 100, imported: false },
      { name: "Riz complet cuit", category: "glucides", unitType: "g", calories: 112, protein: 2.6, carbs: 24, fat: 0.9, portionSize: 100, imported: false },
      { name: "Pâtes cuites", category: "glucides", unitType: "g", calories: 131, protein: 5, carbs: 25, fat: 1.1, portionSize: 100, imported: false },
      { name: "Pain complet", category: "glucides", unitType: "g", calories: 265, protein: 8, carbs: 49, fat: 3.3, portionSize: 100, imported: false },
      { name: "Avoine crue", category: "glucides", unitType: "g", calories: 389, protein: 17, carbs: 66, fat: 7, portionSize: 100, imported: false },
      { name: "Banane", category: "fruits", unitType: "unit", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, portionSize: 1, imported: false },
      { name: "Pomme", category: "fruits", unitType: "unit", calories: 52, protein: 0.3, carbs: 14, fat: 0.2, portionSize: 1, imported: false },
      { name: "Orange", category: "fruits", unitType: "unit", calories: 47, protein: 0.9, carbs: 12, fat: 0.1, portionSize: 1, imported: false },
      { name: "Brocoli cuit", category: "légumes", unitType: "g", calories: 33, protein: 2.8, carbs: 7, fat: 0.4, portionSize: 100, imported: false },
      { name: "Carotte cuite", category: "légumes", unitType: "g", calories: 41, protein: 0.9, carbs: 10, fat: 0.2, portionSize: 100, imported: false },
      { name: "Huile d'olive", category: "lipides", unitType: "ml", calories: 884, protein: 0, carbs: 0, fat: 100, portionSize: 100, imported: false },
      { name: "Beurre", category: "lipides", unitType: "g", calories: 717, protein: 0.9, carbs: 0.1, fat: 81, portionSize: 100, imported: false },
      { name: "Lait entier", category: "protéines", unitType: "ml", calories: 64, protein: 3.2, carbs: 4.8, fat: 3.9, portionSize: 100, imported: false },
      { name: "Yaourt grec nature", category: "protéines", unitType: "g", calories: 60, protein: 10, carbs: 3.3, fat: 0.6, portionSize: 100, imported: false }
    ];

    for (const product of defaultProducts) {
      product.dateAdded = Date.now();
      await db.produits.add(product);
    }
    
    console.log('✓ DB initialisée avec', defaultProducts.length, 'produits');
  }

  // Créer le profil par défaut s'il n'existe pas
  const profilCount = await db.profil.count();
  if (profilCount === 0) {
    await db.profil.add({
      heightCm: 175,
      weightKg: 70,
      age: 30,
      gender: 'male',
      goalType: 'maintenance',
      tdeeCalories: 2000,
      targetCalories: 2000,
      proteinPercent: 30,
      carbsPercent: 40,
      fatPercent: 30,
      targetProteinG: 150,
      targetCarbsG: 250,
      targetFatG: 67,
      dateCreated: Date.now()
    });
    console.log('✓ Profil par défaut créé');
  }
}

/**
 * Migration depuis ancien localStorage
 * Convertit les données de l'ancienne app (protein-tracker-v1) vers Dexie
 */
async function migrateFromOldStorage() {
  try {
    const oldStateJson = localStorage.getItem('protein-tracker-state-v1');
    if (!oldStateJson) {
      console.log('Aucune donnée ancienne à migrer');
      return;
    }

    const oldState = JSON.parse(oldStateJson);
    if (!oldState.foods || oldState.foods.length === 0) {
      console.log('Aucun aliment ancien à migrer');
      return;
    }

    console.log('Migration en cours...', oldState.foods.length, 'aliments');

    // Migrer les aliments
    for (const food of oldState.foods) {
      // Vérifier si le produit existe déjà (par nom)
      const existing = await db.produits.where('name').equals(food.name).first();
      if (!existing) {
        await db.produits.add({
          name: food.name,
          category: 'migré',
          unitType: food.unitType || 'g',
          calories: food.caloriesPer100g || 0,
          protein: food.proteinPer100g || food.proteinPerUnit || 0,
          carbs: 0,
          fat: 0,
          portionSize: food.unitType === 'g' ? 100 : 1,
          imported: false,
          dateAdded: Date.now()
        });
      }
    }

    console.log('✓ Migration complétée');
    // Garder les anciennes données (commenté pour sécurité)
    // localStorage.removeItem('protein-tracker-state-v1');
  } catch (error) {
    console.error('✗ Erreur migration:', error);
  }
}

/**
 * Exporte la DB pour sauvegarde
 */
async function exportDatabase() {
  const data = await snapshotDatabase();
  
  return JSON.stringify(data, null, 2);
}

async function snapshotDatabase() {
  return {
    produits: await db.produits.toArray(),
    recettes: await db.recettes.toArray(),
    recetteProduits: await db.recetteProduits.toArray(),
    repas: await db.repas.toArray(),
    repasElements: await db.repasElements.toArray(),
    profil: await db.profil.toArray(),
    exportDate: new Date().toISOString()
  };
}

async function restoreDatabase(data) {
  const snapshot = data || {};
  await db.transaction('rw', db.produits, db.recettes, db.recetteProduits, db.repas, db.repasElements, db.profil, async () => {
    await db.produits.clear();
    await db.recettes.clear();
    await db.recetteProduits.clear();
    await db.repas.clear();
    await db.repasElements.clear();
    await db.profil.clear();

    await db.produits.bulkPut(Array.isArray(snapshot.produits) ? snapshot.produits : []);
    await db.recettes.bulkPut(Array.isArray(snapshot.recettes) ? snapshot.recettes : []);
    await db.recetteProduits.bulkPut(Array.isArray(snapshot.recetteProduits) ? snapshot.recetteProduits : []);

    const meals = Array.isArray(snapshot.repas) ? snapshot.repas.map((meal) => ({
      ...meal,
      profileId: meal.profileId || 'max'
    })) : [];
    await db.repas.bulkPut(meals);

    await db.repasElements.bulkPut(Array.isArray(snapshot.repasElements) ? snapshot.repasElements : []);
    await db.profil.bulkPut(Array.isArray(snapshot.profil) ? snapshot.profil : []);
  });
}

/**
 * Importe une sauvegarde DB
 */
async function importDatabase(jsonData) {
  try {
    const data = JSON.parse(jsonData);
    await restoreDatabase(data);
    
    console.log('✓ Import complété');
    return true;
  } catch (error) {
    console.error('✗ Erreur import:', error);
    return false;
  }
}

/**
 * Utilitaires pour tests
 */
async function testDatabase() {
  try {
    console.group('🧪 Tests d\'intégrité DB');

    // Test 1: Ajouter un produit test
    const testProd = await db.produits.add({
      name: "TEST_PRODUIT",
      category: "test",
      unitType: "g",
      calories: 100,
      protein: 10,
      carbs: 20,
      fat: 5,
      portionSize: 100,
      imported: false,
      dateAdded: Date.now()
    });
    console.log('✓ Produit test créé (ID:', testProd, ')');

    // Test 2: Récupérer le produit
    const retrieved = await db.produits.get(testProd);
    console.log('✓ Produit récupéré:', retrieved.name);

    // Test 3: Compter les produits
    const count = await db.produits.count();
    console.log('✓ Total produits:', count);

    // Test 4: Supprimer le test
    await db.produits.delete(testProd);
    console.log('✓ Produit test supprimé');

    console.log('✅ Tous les tests passés !');
    console.groupEnd();
    return true;
  } catch (error) {
    console.error('❌ Erreur test:', error);
    console.groupEnd();
    return false;
  }
}

// Export pour usage global
if (typeof window !== 'undefined') {
  window.SuiviDB = {
    db,
    initializeDatabase,
    migrateFromOldStorage,
    exportDatabase,
    importDatabase,
    snapshotDatabase,
    restoreDatabase,
    testDatabase
  };
}
