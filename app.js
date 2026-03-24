/**
 * Suivi Régime v2 - App principale
 * Phase 1: Migration vers Dexie + IndexedDB
 */

const STORAGE_KEY = "protein-tracker-state-v1";

// Constantes héritage (compatibilité v1)
const GOAL_MULTIPLIERS = {
  gain: 2.0,
  maintain: 1.6,
  cut: 2.2
};

// Activity factors pour TDEE (Mifflin-St Jeor)
const ACTIVITY_FACTORS = {
  sedentary: 1.2,           // BMR × 1.2
  lightly_active: 1.375,    // BMR × 1.375
  moderately_active: 1.55,  // BMR × 1.55
  very_active: 1.725,       // BMR × 1.725
  extremely_active: 1.9     // BMR × 1.9
};

// Objectif multipliers
const GOAL_ADJUSTMENTS = {
  gain: 1.10,       // +10%
  maintain: 1.0,    // 0%
  cut: 0.80         // -20%
};

const UNIT_LABELS = {
  g: "g",
  unit: "unite",
  scoop: "dose",
  ml: "ml",
  scoop: "dose"
};

// État global (compatibilité v1)
let state = null;

const els = {
  todayLabel: document.getElementById("todayLabel"),
  dailyTotal: document.getElementById("dailyTotal"),
  dailyTarget: document.getElementById("dailyTarget"),
  progressPct: document.getElementById("progressPct"),
  progressFill: document.getElementById("progressFill"),
  progressBarWrap: document.getElementById("progressBarWrap"),

  tabButtons: Array.from(document.querySelectorAll(".tab-btn")),
  tabPanels: {
    journal: document.getElementById("tab-journal"),
    recipes: document.getElementById("tab-recipes"),
    products: document.getElementById("tab-products"),
    history: document.getElementById("tab-history"),
    profile: document.getElementById("tab-profile")
  },

  entryForm: document.getElementById("entryForm"),
  foodSelect: document.getElementById("foodSelect"),
  quantityInput: document.getElementById("quantityInput"),
  unitLabel: document.getElementById("unitLabel"),
  quickQty: document.getElementById("quickQty"),
  todayEntries: document.getElementById("todayEntries"),
  entryItemTpl: document.getElementById("entryItemTpl"),

  historyList: document.getElementById("historyList"),
  exportBtn: document.getElementById("exportBtn"),
  importFile: document.getElementById("importFile"),

  profileForm: document.getElementById("profileForm"),
  heightInput: document.getElementById("heightInput"),
  weightInput: document.getElementById("weightInput"),
  ageInput: document.getElementById("ageInput"),
  genderSelect: document.getElementById("genderSelect"),
  activityLevelSelect: document.getElementById("activityLevelSelect"),
  goalTypeSelect: document.getElementById("goalTypeSelect"),
  proteinPercentInput: document.getElementById("proteinPercentInput"),
  carbsPercentInput: document.getElementById("carbsPercentInput"),
  fatsPercentInput: document.getElementById("fatsPercentInput"),
  percentWarning: document.getElementById("percentWarning"),
  tdeeBasalMetabolic: document.getElementById("tdeeBasalMetabolic"),
  tdeeMaintenance: document.getElementById("tdeeMaintenance"),
  tdeeDaily: document.getElementById("tdeeDaily"),
  macroProteinTarget: document.getElementById("macroProteinTarget"),
  macroCarbsTarget: document.getElementById("macroCarbsTarget"),
  macroFatsTarget: document.getElementById("macroFatsTarget"),

  // Produits
  productModal: document.getElementById("productModal"),
  productForm: document.getElementById("productForm"),
  productModalTitle: document.getElementById("productModalTitle"),
  productModalClose: document.getElementById("productModalClose"),
  addProductBtn: document.getElementById("addProductBtn"),
  importApiBtn: document.getElementById("importApiBtn"),
  productsList: document.getElementById("productsList"),
  productName: document.getElementById("productName"),
  productCategory: document.getElementById("productCategory"),
  productUnitType: document.getElementById("productUnitType"),
  productPortionSize: document.getElementById("productPortionSize"),
  productPortionUnit: document.getElementById("productPortionUnit"),
  productCalories: document.getElementById("productCalories"),
  productProtein: document.getElementById("productProtein"),
  productCarbs: document.getElementById("productCarbs"),
  productFat: document.getElementById("productFat"),

  // Recettes
  addRecipeBtn: document.getElementById("addRecipeBtn"),
  recipesList: document.getElementById("recipesList"),
  recipeModal: document.getElementById("recipeModal"),
  recipeForm: document.getElementById("recipeForm"),
  recipeModalTitle: document.getElementById("recipeModalTitle"),
  recipeModalClose: document.getElementById("recipeModalClose"),
  recipeName: document.getElementById("recipeName"),
  recipeDescription: document.getElementById("recipeDescription"),
  recipeServings: document.getElementById("recipeServings"),
  recipeIngredientsContainer: document.getElementById("recipeIngredientsContainer"),
  addIngredientBtn: document.getElementById("addIngredientBtn"),
  recipeTotalCalories: document.getElementById("recipeTotalCalories"),
  recipeTotalProtein: document.getElementById("recipeTotalProtein"),
  recipeTotalCarbs: document.getElementById("recipeTotalCarbs"),
  recipeTotalFat: document.getElementById("recipeTotalFat"),
  recipePerPortionCalories: document.getElementById("recipePerPortionCalories"),
  recipePerPortionProtein: document.getElementById("recipePerPortionProtein"),
  recipePerPortionCarbs: document.getElementById("recipePerPortionCarbs"),
  recipePerPortionFat: document.getElementById("recipePerPortionFat"),

  // Journal
  prevDayBtn: document.getElementById("prevDayBtn"),
  nextDayBtn: document.getElementById("nextDayBtn"),
  todayBtn: document.getElementById("todayBtn"),
  journalDate: document.getElementById("journalDate"),
  journalDateFormatted: document.getElementById("journalDateFormatted"),
  journalTotalCalories: document.getElementById("journalTotalCalories"),
  journalTotalProtein: document.getElementById("journalTotalProtein"),
  journalTotalCarbs: document.getElementById("journalTotalCarbs"),
  journalTotalFat: document.getElementById("journalTotalFat"),
  journalProgressKcalText: document.getElementById("journalProgressKcalText"),
  journalProgressProteinText: document.getElementById("journalProgressProteinText"),
  journalProgressCarbsText: document.getElementById("journalProgressCarbsText"),
  journalProgressFatText: document.getElementById("journalProgressFatText"),
  journalProgressKcalFill: document.getElementById("journalProgressKcalFill"),
  journalProgressProteinFill: document.getElementById("journalProgressProteinFill"),
  journalProgressCarbsFill: document.getElementById("journalProgressCarbsFill"),
  journalProgressFatFill: document.getElementById("journalProgressFatFill"),
  mealItemModal: document.getElementById("mealItemModal"),
  mealItemForm: document.getElementById("mealItemForm"),
  mealItemModalTitle: document.getElementById("mealItemModalTitle"),
  mealItemModalClose: document.getElementById("mealItemModalClose"),
  mealItemProduct: document.getElementById("mealItemProduct"),
  mealItemQuantity: document.getElementById("mealItemQuantity"),
  mealItemUnit: document.getElementById("mealItemUnit"),
  mealItemRecipe: document.getElementById("mealItemRecipe"),
  mealItemRecipePortions: document.getElementById("mealItemRecipePortions"),
  selectionTabs: Array.from(document.querySelectorAll(".selection-tab")),
  selectionPanels: {
    product: document.getElementById("selection-product"),
    recipe: document.getElementById("selection-recipe")
  }
};

// Global state for meal management
let currentDate = new Date();
let currentMealType = null;

function openDialog(dialogEl) {
  if (!dialogEl) {
    return;
  }

  if (typeof dialogEl.showModal === "function") {
    dialogEl.showModal();
    return;
  }

  dialogEl.setAttribute("open", "");
  dialogEl.classList.add("fallback-open");
  document.body.classList.add("modal-open");
}

function closeDialog(dialogEl) {
  if (!dialogEl) {
    return;
  }

  if (typeof dialogEl.close === "function") {
    dialogEl.close();
    return;
  }

  dialogEl.removeAttribute("open");
  dialogEl.classList.remove("fallback-open");
  document.body.classList.remove("modal-open");
}

// ============ INITIALIZATION ASYNC ============

async function init() {
  console.log('🚀 Suivi Régime v2 - Démarrage...');
  
  // Initialiser Dexie et migrer données
  try {
    await SuiviDB.initializeDatabase();
    await SuiviDB.migrateFromOldStorage();
    console.log('✓ Base de données prête');
  } catch (error) {
    console.error('✗ Erreur DB:', error);
  }

  // Charger l'état depuis localStorage (compatibilité v1)
  loadStateFromStorage();

  // Configurer UI
  await renderFoodSelect();
  renderProfileForm();
  bindEvents();
  renderAll();
  registerServiceWorker();
  
  console.log('✓ App initialisée');
}

// Démarrer l'app
document.addEventListener('DOMContentLoaded', init);

function bindEvents() {
  // Re-fetch tab buttons after DOM is ready
  els.tabButtons = Array.from(document.querySelectorAll(".tab-btn"));
  
  els.tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => activateTab(btn.dataset.tab));
  });

  if (els.foodSelect) {
    els.foodSelect.addEventListener("change", () => {
      state.lastFoodId = els.foodSelect.value;
      saveState();
      updateUnitAndQuickQty();
    });
  }

  if (els.quickQty && els.quantityInput) {
    els.quickQty.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-value]");
      if (!button) {
        return;
      }
      els.quantityInput.value = button.dataset.value;
      els.quantityInput.focus();
    });
  }

  if (els.entryForm) {
    els.entryForm.addEventListener("submit", (event) => {
      event.preventDefault();
      addEntry();
    });
  }

  if (els.todayEntries) {
    els.todayEntries.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-entry-id]");
      if (!button) {
        return;
      }
      removeEntry(todayKey(), button.dataset.entryId);
    });
  }

  els.profileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveProfileFromForm();
  });

  // Listeners pour recalculer TDEE et macros
  els.heightInput.addEventListener("change", () => updateProfileCalculations());
  els.weightInput.addEventListener("change", () => updateProfileCalculations());
  els.ageInput.addEventListener("change", () => updateProfileCalculations());
  els.genderSelect.addEventListener("change", () => updateProfileCalculations());
  els.activityLevelSelect.addEventListener("change", () => updateProfileCalculations());
  els.goalTypeSelect.addEventListener("change", () => updateProfileCalculations());
  els.proteinPercentInput.addEventListener("input", () => updateMacroTargets());
  els.carbsPercentInput.addEventListener("input", () => updateMacroTargets());
  els.fatsPercentInput.addEventListener("input", () => updateMacroTargets());

  els.exportBtn.addEventListener("click", exportData);
  els.importFile.addEventListener("change", importData);

  // Événements produits
  els.addProductBtn.addEventListener("click", () => openProductModal());
  els.importApiBtn.addEventListener("click", () => importFromOpenFoodFacts());
  els.productModalClose.addEventListener("click", () => closeDialog(els.productModal));
  els.productForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveProduct(event);
  });
  els.productUnitType.addEventListener("change", () => {
    updateProductUnitLabel();
  });

  // Événements recettes
  els.addRecipeBtn.addEventListener("click", () => openRecipeModal());
  els.recipeModalClose.addEventListener("click", () => closeDialog(els.recipeModal));
  els.addIngredientBtn.addEventListener("click", () => addRecipeIngredient());
  els.recipeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveRecipe(event);
  });
  els.recipeServings.addEventListener("change", () => {
    calculateRecipeTotals();
  });

  // Événements Journal
  els.prevDayBtn.addEventListener("click", () => previousDay());
  els.nextDayBtn.addEventListener("click", () => nextDay());
  els.todayBtn.addEventListener("click", () => goToToday());
  
  // Boutons ajouter au repas
  document.querySelectorAll(".btn-add-meal").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      currentMealType = e.target.dataset.mealType;
      openMealItemModal();
    });
  });

  // Modal repas
  els.mealItemModalClose.addEventListener("click", () => closeDialog(els.mealItemModal));
  els.mealItemForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveMealItem();
  });
  els.mealItemProduct.addEventListener("change", () => updateMealItemUnitDisplay());

  // Tabs de sélection (produit vs recette)
  els.selectionTabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      const selectionType = tab.dataset.selectionType;
      switchSelectionType(selectionType);
    });
  });
}

function activateTab(tabName) {
  els.tabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabName);
  });

  Object.keys(els.tabPanels).forEach((name) => {
    els.tabPanels[name].classList.toggle("active", name === tabName);
  });
}

function renderAll() {
  els.todayLabel.textContent = toDisplayDate(todayKey());
  updateUnitAndQuickQty();
  renderSummary();
  renderTodayEntries();
  renderHistory();
  renderProductsList();
  renderRecipesList();
  renderJournalDate();
  renderMealsForDate();
}

async function renderFoodSelect() {
  if (!els.foodSelect) {
    return;
  }

  // Charger depuis Dexie (nouvelle DB)
  let products = await window.SuiviDB.db.produits.toArray();
  
  // Fallback: si Dexie vide, utiliser state.foods depuis localStorage
  if (products.length === 0 && state.foods && state.foods.length > 0) {
    products = state.foods.map((f, idx) => ({
      id: idx,
      name: f.name,
      unitType: f.unitType,
      protein: f.proteinPer100g || f.proteinPerUnit || 0,
      calories: 0,
      carbs: 0,
      fat: 0,
      portionSize: 100
    }));
  }

  // Build options HTML
  const options = products
    .map((product) => `<option value="${product.id}">${product.name}</option>`)
    .join("");

  els.foodSelect.innerHTML = options || '<option>Aucun produit</option>';
  if (products.length > 0) {
    els.foodSelect.value = products[0].id;
  }
}

function updateUnitAndQuickQty() {
  if (!els.foodSelect || !els.unitLabel || !els.quickQty) {
    return;
  }

  const food = getSelectedFood();
  if (!food) {
    return;
  }

  els.unitLabel.value = UNIT_LABELS[food.unitType] || food.unitType;

  const quickValues = food.unitType === "g" ? [100, 150, 200] : [1, 2, 3];
  els.quickQty.innerHTML = quickValues
    .map((value) => `<button type="button" class="quick-chip" data-value="${value}">${value} ${els.unitLabel.value}</button>`)
    .join("");
}

function getProteinTargetFromProfile() {
  const tdee = safeNumber(state?.profile?.tdeeDaily);
  const proteinPct = safeNumber(state?.profile?.macroPercentProtein);

  if (tdee > 0 && proteinPct > 0) {
    return round((tdee * (proteinPct / 100)) / 4, 0);
  }

  const weight = clampFloat(state?.profile?.weightKg || 70, 30, 250);
  const goal = state?.profile?.goalType || "maintain";
  const multiplier = GOAL_MULTIPLIERS[goal] || GOAL_MULTIPLIERS.maintain;
  return round(weight * multiplier, 0);
}

function getMacroTargetsFromProfile() {
  const tdee = safeNumber(state?.profile?.tdeeDaily || state?.profile?.calorieTarget);
  const proteinPct = safeNumber(state?.profile?.macroPercentProtein);
  const carbsPct = safeNumber(state?.profile?.macroPercentCarbs);
  const fatsPct = safeNumber(state?.profile?.macroPercentFats);

  const caloriesTarget = tdee > 0 ? tdee : 2000;
  const proteinTarget = proteinPct > 0 ? (caloriesTarget * (proteinPct / 100)) / 4 : getProteinTargetFromProfile();
  const carbsTarget = carbsPct > 0 ? (caloriesTarget * (carbsPct / 100)) / 4 : 0;
  const fatTarget = fatsPct > 0 ? (caloriesTarget * (fatsPct / 100)) / 9 : 0;

  return {
    calories: round(caloriesTarget, 0),
    protein: round(proteinTarget, 0),
    carbs: round(carbsTarget, 0),
    fat: round(fatTarget, 0)
  };
}

function renderProgressLine(textEl, fillEl, consumed, target, unit) {
  if (!textEl || !fillEl) {
    return;
  }

  const safeConsumed = Math.max(0, consumed);
  const safeTarget = Math.max(0, target);
  const pct = safeTarget > 0 ? Math.min((safeConsumed / safeTarget) * 100, 100) : 0;

  textEl.textContent = `${safeConsumed.toFixed(0)}/${safeTarget.toFixed(0)} ${unit}`;
  fillEl.style.width = `${pct.toFixed(0)}%`;
  fillEl.setAttribute("aria-valuenow", String(Math.round(pct)));
}

async function renderJournalMacroProgress() {
  const dateStr = getDateString(currentDate);
  const totals = await getMealTotalsForDate(dateStr);
  const targets = getMacroTargetsFromProfile();

  renderProgressLine(els.journalProgressKcalText, els.journalProgressKcalFill, totals.calories, targets.calories, "kcal");
  renderProgressLine(els.journalProgressProteinText, els.journalProgressProteinFill, totals.protein, targets.protein, "g");
  renderProgressLine(els.journalProgressCarbsText, els.journalProgressCarbsFill, totals.carbs, targets.carbs, "g");
  renderProgressLine(els.journalProgressFatText, els.journalProgressFatFill, totals.fat, targets.fat, "g");
}

async function getMealTotalsForDate(dateStr) {
  let totalCal = 0;
  let totalProt = 0;
  let totalCarb = 0;
  let totalFat = 0;

  const repas = await window.SuiviDB.db.repas.where("date").equals(dateStr).toArray();
  for (const meal of repas) {
    const items = await window.SuiviDB.db.repasElements.where("repasId").equals(meal.id).toArray();
    for (const item of items) {
      totalCal += item.calories;
      totalProt += item.protein;
      totalCarb += item.carbs;
      totalFat += item.fat;
    }
  }

  return {
    calories: totalCal,
    protein: totalProt,
    carbs: totalCarb,
    fat: totalFat
  };
}

async function renderSummary() {
  const dateStr = getDateString(currentDate);
  const totals = await getMealTotalsForDate(dateStr);
  const target = getProteinTargetFromProfile();
  const ratio = target > 0 ? Math.min((totals.protein / target) * 100, 100) : 0;
  const pct = round(ratio, 0);

  els.dailyTotal.textContent = round(totals.protein, 1).toFixed(1);
  els.dailyTarget.textContent = target.toFixed(0);
  els.progressPct.textContent = pct.toFixed(0);
  els.progressFill.style.width = `${pct}%`;
  els.progressBarWrap.setAttribute("aria-valuenow", String(pct));

  const { formatted } = formatDateDisplay(currentDate);
  els.todayLabel.textContent = formatted;
}

function renderTodayEntries() {
  if (!els.todayEntries || !els.entryItemTpl) {
    return;
  }

  const entries = state.entriesByDate[todayKey()] || [];
  if (entries.length === 0) {
    els.todayEntries.innerHTML = `<p class="empty-state">Aucune prise pour aujourd'hui.</p>`;
    return;
  }

  const sorted = [...entries].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const fragment = document.createDocumentFragment();

  sorted.forEach((entry) => {
    const tpl = els.entryItemTpl.content.cloneNode(true);
    const food = findFood(entry.foodId);
    tpl.querySelector(".entry-title").textContent = food ? food.name : "Aliment";
    tpl.querySelector(".entry-sub").textContent = `${formatQuantity(entry.quantity, entry.unitType)} - ${entry.timeLabel}`;
    tpl.querySelector(".entry-protein").textContent = `${entry.proteinComputed.toFixed(1)} g`;

    const btn = tpl.querySelector(".danger-link");
    btn.dataset.entryId = entry.id;

    fragment.appendChild(tpl);
  });

  els.todayEntries.innerHTML = "";
  els.todayEntries.appendChild(fragment);
}

function renderHistory() {
  const keys = Object.keys(state.entriesByDate).sort((a, b) => b.localeCompare(a));

  if (keys.length === 0) {
    els.historyList.innerHTML = `<p class="empty-state">Pas encore d'historique.</p>`;
    return;
  }

  const html = keys
    .map((key) => {
      const entries = state.entriesByDate[key] || [];
      const total = round(entries.reduce((sum, item) => sum + item.proteinComputed, 0), 1);
      const lines = entries
        .slice()
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
        .map((entry) => {
          const food = findFood(entry.foodId);
          const label = food ? food.name : "Aliment";
          return `${entry.timeLabel} - ${label} (${formatQuantity(entry.quantity, entry.unitType)}): ${entry.proteinComputed.toFixed(1)} g`;
        })
        .join("<br>");

      return `
        <li class="history-card">
          <div>
            <p class="history-date">${toDisplayDate(key)}</p>
            <p class="history-sub">${lines}</p>
          </div>
          <p class="history-total">${total.toFixed(1)} g</p>
        </li>
      `;
    })
    .join("");

  els.historyList.innerHTML = html;
}

function renderProfileForm() {
  const p = state.profile;
  els.heightInput.value = p.heightCm;
  els.weightInput.value = p.weightKg;
  els.ageInput.value = p.age;
  els.genderSelect.value = p.gender;
  els.activityLevelSelect.value = p.activityLevel;
  els.goalTypeSelect.value = p.goalType;
  els.proteinPercentInput.value = p.macroPercentProtein;
  els.carbsPercentInput.value = p.macroPercentCarbs;
  els.fatsPercentInput.value = p.macroPercentFats;
  updateProfileCalculations();
}

function updateProfileCalculations() {
  // Récupérer les données du formulaire
  const height = safeNumber(els.heightInput.value);
  const weight = safeNumber(els.weightInput.value);
  const age = safeNumber(els.ageInput.value);
  const gender = els.genderSelect.value;
  const activityLevel = els.activityLevelSelect.value;
  const goal = els.goalTypeSelect.value;

  // Calcul Mifflin-St Jeor
  let bmr = 0;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  // TDEE de maintenance (sans objectif)
  const activityFactor = ACTIVITY_FACTORS[activityLevel] || 1.55;
  const tdeeMaintenanceValue = bmr * activityFactor;

  // TDEE avec objectif
  const goalMultiplier = GOAL_ADJUSTMENTS[goal] || 1.0;
  const tdeeDailyValue = tdeeMaintenanceValue * goalMultiplier;

  // Affichage
  els.tdeeBasalMetabolic.textContent = Math.round(bmr);
  els.tdeeMaintenance.textContent = Math.round(tdeeMaintenanceValue);
  els.tdeeDaily.textContent = Math.round(tdeeDailyValue);

  // Mettre à jour les macros
  updateMacroTargets();

  // Stocker les valeurs calculées mais pas enregistrer (attendre le submit)
}

function updateMacroTargets() {
  const proteinPercent = safeNumber(els.proteinPercentInput.value);
  const carbsPercent = safeNumber(els.carbsPercentInput.value);
  const fatsPercent = safeNumber(els.fatsPercentInput.value);
  const totalPercent = proteinPercent + carbsPercent + fatsPercent;

  // Vérifier que le total est 100%
  if (Math.abs(totalPercent - 100) > 0.1) {
    els.percentWarning.textContent = `⚠️ Total: ${totalPercent.toFixed(0)}% (doit être 100%)`;
  } else {
    els.percentWarning.textContent = '';
  }

  // Récupérer le TDEE quotidien
  const tdeeDaily = safeNumber(els.tdeeDaily.textContent);

  if (tdeeDaily === 0) {
    els.macroProteinTarget.textContent = '0';
    els.macroCarbsTarget.textContent = '0';
    els.macroFatsTarget.textContent = '0';
    return;
  }

  // Calculer les cibles macros
  const proteinCalories = tdeeDaily * (proteinPercent / 100);
  const carbsCalories = tdeeDaily * (carbsPercent / 100);
  const fatsCalories = tdeeDaily * (fatsPercent / 100);

  // 4 kcal/g pour protéines et glucides, 9 kcal/g pour lipides
  const proteinGrams = proteinCalories / 4;
  const carbsGrams = carbsCalories / 4;
  const fatsGrams = fatsCalories / 9;

  els.macroProteinTarget.textContent = proteinGrams.toFixed(0);
  els.macroCarbsTarget.textContent = carbsGrams.toFixed(0);
  els.macroFatsTarget.textContent = fatsGrams.toFixed(0);
}

function saveProfileFromForm() {
  const height = clampInt(els.heightInput.value, 100, 250);
  const weight = clampFloat(els.weightInput.value, 30, 250);
  const age = clampInt(els.ageInput.value, 12, 100);
  const gender = els.genderSelect.value;
  const activityLevel = els.activityLevelSelect.value;
  const goalType = els.goalTypeSelect.value;
  const proteinPercent = clampInt(els.proteinPercentInput.value, 10, 50);
  const carbsPercent = clampInt(els.carbsPercentInput.value, 20, 70);
  const fatsPercent = clampInt(els.fatsPercentInput.value, 10, 50);

  // Ré-calculer le TDEE pour stocker
  let bmr = 0;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  const activityFactor = ACTIVITY_FACTORS[activityLevel] || 1.55;
  const tdeeMaintenanceValue = bmr * activityFactor;
  const goalMultiplier = GOAL_ADJUSTMENTS[goalType] || 1.0;
  const tdeeDailyValue = tdeeMaintenanceValue * goalMultiplier;

  const next = {
    heightCm: height,
    weightKg: weight,
    age: age,
    gender: gender,
    activityLevel: activityLevel,
    goalType: goalType,
    tdeeBmr: Math.round(bmr),
    tdeeMaintenance: Math.round(tdeeMaintenanceValue),
    tdeeDaily: Math.round(tdeeDailyValue),
    calorieTarget: Math.round(tdeeDailyValue),
    macroPercentProtein: proteinPercent,
    macroPercentCarbs: carbsPercent,
    macroPercentFats: fatsPercent
  };

  state.profile = next;
  saveState();
  updateProfileCalculations();
  renderSummary();
  renderJournalMacroProgress();
  alert('✓ Profil enregistré avec succès !');
}

function addEntry() {
  const food = getSelectedFood();
  if (!food) {
    return;
  }

  const quantity = clampFloat(els.quantityInput.value, 0.1, 5000);
  if (quantity <= 0) {
    return;
  }

  const protein = computeProtein(food, quantity);
  const now = new Date();
  const key = toLocalDateKey(now);

  const entry = {
    id: makeId(),
    timestamp: now.toISOString(),
    timeLabel: now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    foodId: food.id,
    quantity,
    unitType: food.unitType,
    proteinComputed: protein
  };

  if (!state.entriesByDate[key]) {
    state.entriesByDate[key] = [];
  }

  state.entriesByDate[key].push(entry);
  state.lastFoodId = food.id;

  saveState();
  renderSummary();
  renderTodayEntries();
  renderHistory();

  els.quantityInput.value = "";
}

function removeEntry(dateKey, entryId) {
  const entries = state.entriesByDate[dateKey] || [];
  state.entriesByDate[dateKey] = entries.filter((entry) => entry.id !== entryId);

  if (state.entriesByDate[dateKey].length === 0) {
    delete state.entriesByDate[dateKey];
  }

  saveState();
  renderSummary();
  renderTodayEntries();
  renderHistory();
}

function exportData() {
  const payload = {
    exportedAt: new Date().toISOString(),
    app: "protein-tracker",
    version: 1,
    state
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `protein-tracker-${todayKey()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const [file] = event.target.files || [];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const incoming = parsed.state;
      if (!incoming || !incoming.profile || !incoming.entriesByDate || !Array.isArray(incoming.foods)) {
        alert("Fichier invalide.");
        return;
      }

      state = sanitizeState(incoming);
      saveState();
      renderFoodSelect();
      renderProfileForm();
      renderAll();
      alert("Import termine.");
    } catch (error) {
      alert("Import impossible.");
    } finally {
      els.importFile.value = "";
    }
  };

  reader.readAsText(file);
}

function sanitizeState(raw) {
  const safe = getDefaultState();

  const height = clampInt(raw.profile?.heightCm || 175, 100, 250);
  const weight = clampFloat(raw.profile?.weightKg || 70, 30, 250);
  const age = clampInt(raw.profile?.age || 30, 12, 100);
  const gender = (raw.profile?.gender === 'male' || raw.profile?.gender === 'female') ? raw.profile.gender : 'male';
  const activityLevel = Object.keys(ACTIVITY_FACTORS).includes(raw.profile?.activityLevel) ? raw.profile.activityLevel : 'moderately_active';
  const goalType = ["gain", "maintain", "cut"].includes(raw.profile?.goalType) ? raw.profile.goalType : "maintain";
  const macroProtein = clampInt(raw.profile?.macroPercentProtein || 30, 10, 50);
  const macroCarbs = clampInt(raw.profile?.macroPercentCarbs || 40, 20, 70);
  const macroFats = clampInt(raw.profile?.macroPercentFats || 30, 10, 50);

  // Recalculer TDEE
  let bmr = 0;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  const activityFactor = ACTIVITY_FACTORS[activityLevel];
  const tdeeMaintenance = bmr * activityFactor;
  const tdeeDaily = tdeeMaintenance * (GOAL_ADJUSTMENTS[goalType] || 1.0);

  safe.profile = {
    heightCm: height,
    weightKg: weight,
    age: age,
    gender: gender,
    activityLevel: activityLevel,
    goalType: goalType,
    tdeeBmr: Math.round(bmr),
    tdeeMaintenance: Math.round(tdeeMaintenance),
    tdeeDaily: Math.round(tdeeDaily),
    calorieTarget: Math.round(tdeeDaily),
    macroPercentProtein: macroProtein,
    macroPercentCarbs: macroCarbs,
    macroPercentFats: macroFats
  };

  safe.foods = Array.isArray(raw.foods) && raw.foods.length ? raw.foods : safe.foods;
  safe.entriesByDate = typeof raw.entriesByDate === "object" && raw.entriesByDate ? raw.entriesByDate : {};
  safe.lastFoodId = raw.lastFoodId || safe.foods[0].id;

  return safe;
}

function getSelectedFood() {
  if (!els.foodSelect) {
    return null;
  }

  return state.foods.find((food) => food.id === els.foodSelect.value);
}

function findFood(foodId) {
  return state.foods.find((food) => food.id === foodId);
}

function computeProtein(food, quantity) {
  if (food.unitType === "g") {
    return round((quantity * food.proteinPer100g) / 100, 1);
  }

  return round(quantity * food.proteinPerUnit, 1);
}

function getCurrentTarget() {
  const mode = (els.targetModeSelect?.value || state.profile.proteinTargetMode || "auto");
  if (mode === "auto") {
    const weight = clampFloat((els.weightInput?.value || state.profile.weightKg), 30, 250);
    const goal = (els.goalTypeSelect?.value || state.profile.goalType);
    const multiplier = GOAL_MULTIPLIERS[goal] || GOAL_MULTIPLIERS.maintain;
    return round(weight * multiplier, 0);
  }

  return clampInt((els.manualTargetInput?.value || state.profile.proteinTargetValue || 140), 40, 400);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getDefaultState();
    }

    const parsed = JSON.parse(raw);
    return sanitizeState(parsed);
  } catch (error) {
    return getDefaultState();
  }
}

function loadStateFromStorage() {
  state = loadState();
}

function getDefaultState() {
  // Récupérer les produits depuis Dexie ou les produits par défaut v1
  const defaultFoods = [
    { id: "chicken", name: "Poulet cuit", unitType: "g", proteinPer100g: 31 },
    { id: "beef5", name: "Steak hache 5% cuit", unitType: "g", proteinPer100g: 26 },
    { id: "tuna", name: "Thon nature egoutte", unitType: "g", proteinPer100g: 24 },
    { id: "egg", name: "Oeuf entier", unitType: "unit", proteinPerUnit: 6.5 },
    { id: "eggwhite", name: "Blanc d'oeuf", unitType: "unit", proteinPerUnit: 3.6 },
    { id: "whey", name: "Whey", unitType: "scoop", proteinPerUnit: 24 },
    { id: "skyr", name: "Skyr nature", unitType: "g", proteinPer100g: 10 },
    { id: "fromageblanc", name: "Fromage blanc", unitType: "g", proteinPer100g: 8 },
    { id: "lentils", name: "Lentilles cuites", unitType: "g", proteinPer100g: 9 },
    { id: "tofu", name: "Tofu ferme", unitType: "g", proteinPer100g: 13 }
  ];

  return {
    profile: {
      heightCm: 175,
      weightKg: 70,
      age: 30,
      gender: "male",
      activityLevel: "moderately_active",
      goalType: "maintain",
      tdeeBmr: 1700,
      tdeeMaintenance: 2635,
      tdeeDaily: 2635,
      calorieTarget: 2635,
      macroPercentProtein: 30,
      macroPercentCarbs: 40,
      macroPercentFats: 30
    },
    foods: defaultFoods,
    entriesByDate: {},
    lastFoodId: defaultFoods[0].id
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayKey() {
  return toLocalDateKey(new Date());
}

function toLocalDateKey(dateObj) {
  const d = dateObj;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toDisplayDate(key) {
  const [year, month, day] = key.split("-");
  return `${day}/${month}/${year}`;
}

function formatQuantity(quantity, unitType) {
  return `${quantity} ${UNIT_LABELS[unitType] || unitType}`;
}

function safeNumber(value) {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function clampInt(value, min, max) {
  const n = Math.round(safeNumber(value));
  return Math.min(Math.max(n, min), max);
}

function clampFloat(value, min, max) {
  const n = safeNumber(value);
  return round(Math.min(Math.max(n, min), max), 1);
}

function round(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register("sw.js");

    // If an updated worker is already waiting, activate it now.
    if (registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }

    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (!newWorker) {
        return;
      }

      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          newWorker.postMessage({ type: "SKIP_WAITING" });
        }
      });
    });

    // Reload once when the new worker takes control.
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (window.__swReloadedOnce) {
        return;
      }
      window.__swReloadedOnce = true;
      window.location.reload();
    });

    // Trigger update checks proactively (helpful on mobile PWAs).
    registration.update();
    setTimeout(() => registration.update(), 3000);
  } catch (error) {
    // Keep silent to avoid friction in a tiny personal app.
  }
}

// ============ GESTION DES PRODUITS ============

async function openProductModal(productId = null) {
  const form = els.productForm;
  
  if (productId) {
    // Mode édition
    const product = await window.SuiviDB.db.produits.get(productId);
    els.productModalTitle.textContent = 'Éditer le produit';
    form.dataset.productId = productId;
    
    els.productName.value = product.name;
    els.productCategory.value = product.category;
    els.productUnitType.value = product.unitType;
    els.productPortionSize.value = product.portionSize;
    els.productCalories.value = product.calories;
    els.productProtein.value = product.protein;
    els.productCarbs.value = product.carbs;
    els.productFat.value = product.fat;
  } else {
    // Mode création
    els.productModalTitle.textContent = 'Ajouter un produit';
    form.reset();
    delete form.dataset.productId;
    els.productPortionSize.value = 100;
    els.productUnitType.value = 'g';
  }

  updateProductUnitLabel();
  openDialog(els.productModal);
}

function updateProductUnitLabel() {
  const unitType = els.productUnitType.value;
  els.productPortionUnit.value = UNIT_LABELS[unitType] || unitType;
}

async function saveProduct(e) {
  e.preventDefault();
  const form = e.target;
  const productId = form.dataset.productId ? parseInt(form.dataset.productId) : null;

  const productData = {
    name: els.productName.value,
    category: els.productCategory.value,
    unitType: els.productUnitType.value,
    portionSize: parseFloat(els.productPortionSize.value),
    calories: parseFloat(els.productCalories.value),
    protein: parseFloat(els.productProtein.value),
    carbs: parseFloat(els.productCarbs.value),
    fat: parseFloat(els.productFat.value),
    dateModified: Date.now()
  };

  try {
    if (productId) {
      // Mise à jour
      await window.SuiviDB.db.produits.update(productId, productData);
      console.log("✓ Produit mis à jour :", productId);
    } else {
      // Création
      productData.dateAdded = Date.now();
      productData.imported = false;
      const newId = await window.SuiviDB.db.produits.add(productData);
      console.log("✓ Produit créé :", newId);
    }

    closeDialog(els.productModal);
    await renderProductsList();
  } catch (error) {
    console.error('✗ Erreur sauvegarde produit:', error);
    alert('Erreur lors de la sauvegarde');
  }
}

async function deleteProduct(productId) {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
    try {
      // Vérifier si le produit est utilisé dans une recette
      const recettesUsing = await window.SuiviDB.db.recetteProduits
        .where('produitId')
        .equals(productId)
        .toArray();

      if (recettesUsing.length > 0) {
        alert(`Impossible : ce produit est utilisé dans ${recettesUsing.length} recette(s).`);
        return;
      }

      await window.SuiviDB.db.produits.delete(productId);
      console.log("✓ Produit supprimé :", productId);
      await renderProductsList();
    } catch (error) {
      console.error('✗ Erreur suppression:', error);
    }
  }
}

async function renderProductsList() {
  try {
    const products = await window.SuiviDB.db.produits.toArray();
    const container = els.productsList;

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
            <strong>${p.portionSize} ${UNIT_LABELS[p.unitType] || p.unitType}</strong>
          </div>
          <div class="detail-row">
            <span>🔥 Calories :</span>
            <strong>${p.calories.toFixed(0)} kcal</strong>
          </div>
          <div class="nutritional-summary">
            <span>🥩 ${p.protein.toFixed(1)}g</span>
            <span>🍞 ${p.carbs.toFixed(1)}g</span>
            <span>🥑 ${p.fat.toFixed(1)}g</span>
          </div>
        </div>
        <div class="product-actions">
          <button class="btn-sm btn-secondary" onclick="openProductModal(${p.id})">Éditer</button>
          <button class="btn-sm btn-danger" onclick="deleteProduct(${p.id})">Supprimer</button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('✗ Erreur affichage produits:', error);
    els.productsList.innerHTML = '<p class="empty-state">Erreur chargement des produits</p>';
  }
}

async function importFromOpenFoodFacts() {
  const query = prompt('Chercher un produit (ex: "Poulet rôti")');
  if (!query) return;

  try {
    console.log('Recherche OFF:', query);
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1`
    );
    const data = await response.json();

    if (!data.products || data.products.length === 0) {
      alert('Aucun produit trouvé');
      return;
    }

    const results = data.products.slice(0, 5);
    const productNames = results.map(p => p.product_name).join('\n');
    const resultIdx = prompt(`Résultats trouvés:\n\n${productNames}\n\nNuméro du produit (0-${results.length-1}):`, '0');
    
    if (resultIdx === null) return;
    const selectedIdx = parseInt(resultIdx) || 0;
    if (selectedIdx < 0 || selectedIdx >= results.length) {
      alert('Sélection invalide');
      return;
    }

    const selected = results[selectedIdx];
    const nutrition = selected.nutrition_data_per || {};

    await window.SuiviDB.db.produits.add({
      name: selected.product_name || selected.name || 'Produit importé',
      category: 'importé',
      unitType: 'g',
      portionSize: 100,
      calories: nutrition.calories || 0,
      protein: nutrition.proteins || 0,
      carbs: nutrition.carbohydrates || 0,
      fat: nutrition.fat || 0,
      imported: true,
      dateAdded: Date.now()
    });

    console.log("✓ Produit importé :", selected.product_name);
    await renderProductsList();
    alert('✓ Produit importé avec succès !');
  } catch (error) {
    console.error("✗ Erreur import OFF :", error);
    alert('Erreur lors de l\'import. Vérifiez votre connexion.');
  }
}

// ============ GESTION DES RECETTES ============

let currentRecipeIngredients = [];

async function openRecipeModal(recipeId = null) {
  const form = els.recipeForm;
  currentRecipeIngredients = [];

  if (recipeId) {
    // Mode édition
    const recipe = await window.SuiviDB.db.recettes.get(recipeId);
    const ingredients = await window.SuiviDB.db.recetteProduits
      .where('recetteId')
      .equals(recipeId)
      .toArray();

    els.recipeModalTitle.textContent = 'Éditer la recette';
    form.dataset.recipeId = recipeId;
    
    els.recipeName.value = recipe.name;
    els.recipeDescription.value = recipe.description || '';
    els.recipeServings.value = recipe.servings;

    currentRecipeIngredients = ingredients;
  } else {
    // Mode création
    els.recipeModalTitle.textContent = 'Créer une recette';
    form.reset();
    delete form.dataset.recipeId;
    els.recipeServings.value = 1;
  }

  await renderRecipeIngredients();
  calculateRecipeTotals();
  openDialog(els.recipeModal);
}

async function renderRecipeIngredients() {
  const container = els.recipeIngredientsContainer;
  const products = await window.SuiviDB.db.produits.toArray();

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

        <span class="ingredient-unit">${product?.unitType ? UNIT_LABELS[product.unitType] : ''}</span>

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
    const product = await window.SuiviDB.db.produits.get(produitId);
    currentRecipeIngredients[idx].produitId = produitId;
    currentRecipeIngredients[idx].unitType = product.unitType;
  }
  await renderRecipeIngredients();
  calculateRecipeTotals();
}

async function addRecipeIngredient() {
  const products = await window.SuiviDB.db.produits.toArray();
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
    const product = await window.SuiviDB.db.produits.get(ing.produitId);
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

  const servings = parseInt(els.recipeServings.value) || 1;

  // Totaux de la recette
  els.recipeTotalCalories.textContent = Math.round(totalCal);
  els.recipeTotalProtein.textContent = totalProt.toFixed(1);
  els.recipeTotalCarbs.textContent = totalCarb.toFixed(1);
  els.recipeTotalFat.textContent = totalFat.toFixed(1);

  // Par portion
  els.recipePerPortionCalories.textContent = Math.round(totalCal / servings);
  els.recipePerPortionProtein.textContent = (totalProt / servings).toFixed(1);
  els.recipePerPortionCarbs.textContent = (totalCarb / servings).toFixed(1);
  els.recipePerPortionFat.textContent = (totalFat / servings).toFixed(1);
}

async function saveRecipe(e) {
  e.preventDefault();
  
  if (currentRecipeIngredients.length === 0) {
    alert('Ajoutez au moins un ingrédient');
    return;
  }

  const form = e.target;
  const recipeId = form.dataset.recipeId ? parseInt(form.dataset.recipeId) : null;

  const name = els.recipeName.value;
  const description = els.recipeDescription.value;
  const servings = parseInt(els.recipeServings.value);

  // Calculer les totaux finaux
  let totalCal = 0, totalProt = 0, totalCarb = 0, totalFat = 0;
  for (const ing of currentRecipeIngredients) {
    const product = await window.SuiviDB.db.produits.get(ing.produitId);
    totalCal += (ing.quantity / product.portionSize) * product.calories;
    totalProt += (ing.quantity / product.portionSize) * product.protein;
    totalCarb += (ing.quantity / product.portionSize) * product.carbs;
    totalFat += (ing.quantity / product.portionSize) * product.fat;
  }

  try {
    let newRecipeId = recipeId;

    if (recipeId) {
      // Mise à jour recette
      await window.SuiviDB.db.recettes.update(recipeId, {
        name,
        description,
        servings,
        totalCalories: totalCal,
        totalProtein: totalProt,
        totalCarbs: totalCarb,
        totalFat: totalFat,
        dateModified: Date.now()
      });

      // Supprimer les anciens ingrédients
      const oldIngredients = await window.SuiviDB.db.recetteProduits
        .where('recetteId')
        .equals(recipeId)
        .toArray();
      for (const ing of oldIngredients) {
        await window.SuiviDB.db.recetteProduits.delete(ing.id);
      }
    } else {
      // Créer recette
      newRecipeId = await window.SuiviDB.db.recettes.add({
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
    }

    // Insérer les ingrédients
    for (const ing of currentRecipeIngredients) {
      await window.SuiviDB.db.recetteProduits.add({
        recetteId: newRecipeId,
        produitId: ing.produitId,
        quantity: ing.quantity,
        unitType: ing.unitType
      });
    }

    console.log("✓ Recette enregistrée :", name);
    closeDialog(els.recipeModal);
    await renderRecipesList();
  } catch (error) {
    console.error('✗ Erreur sauvegarde recette:', error);
    alert('Erreur lors de la sauvegarde');
  }
}

async function deleteRecipe(recipeId) {
  if (confirm('Êtes-vous sûr de vouloir supprimer cette recette ?')) {
    try {
      // Supprimer les ingrédients associés
      await window.SuiviDB.db.recetteProduits
        .where('recetteId')
        .equals(recipeId)
        .delete();
      
      // Supprimer la recette
      await window.SuiviDB.db.recettes.delete(recipeId);
      
      console.log("✓ Recette supprimée :", recipeId);
      await renderRecipesList();
    } catch (error) {
      console.error('✗ Erreur suppression:', error);
    }
  }
}

async function renderRecipesList() {
  try {
    const recipes = await window.SuiviDB.db.recettes.toArray();
    const container = els.recipesList;

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
          <div>
            <strong>${Math.round(r.totalCalories)}</strong>
            <span>🔥 kcal</span>
          </div>
          <div>
            <strong>🥩 ${r.totalProtein.toFixed(1)}g</strong>
            <span>Protéines</span>
          </div>
          <div>
            <strong>🍞 ${r.totalCarbs.toFixed(1)}g</strong>
            <span>Glucides</span>
          </div>
          <div>
            <strong>🥑 ${r.totalFat.toFixed(1)}g</strong>
            <span>Lipides</span>
          </div>
        </div>
        <div class="recipe-actions">
          <button class="btn-sm btn-secondary" onclick="openRecipeModal(${r.id})">Éditer</button>
          <button class="btn-sm btn-danger" onclick="deleteRecipe(${r.id})">Supprimer</button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('✗ Erreur affichage recettes:', error);
    els.recipesList.innerHTML = '<p class="empty-state">Erreur chargement des recettes</p>';
  }
}

// ============ GESTION DU JOURNAL (PHASE 4) ============

function previousDay() {
  currentDate.setDate(currentDate.getDate() - 1);
  renderJournalDate();
  renderMealsForDate();
}

function nextDay() {
  currentDate.setDate(currentDate.getDate() + 1);
  renderJournalDate();
  renderMealsForDate();
}

function goToToday() {
  currentDate = new Date();
  renderJournalDate();
  renderMealsForDate();
}

function getDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateDisplay(date) {
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = new Date(today.getTime() - 24*60*60*1000).toDateString() === date.toDateString();
  const isTomorrow = new Date(today.getTime() + 24*60*60*1000).toDateString() === date.toDateString();

  let label = '';
  if (isToday) label = 'Aujourd\'hui';
  else if (isYesterday) label = 'Hier';
  else if (isTomorrow) label = 'Demain';

  const formatted = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return { label, formatted };
}

function renderJournalDate() {
  const { label, formatted } = formatDateDisplay(currentDate);
  els.journalDate.textContent = label || formatted;
  els.journalDateFormatted.textContent = formatted;
  updateJournalDateButtonsState();
}

function updateJournalDateButtonsState() {
  const today = new Date();
  const isToday = currentDate.toDateString() === today.toDateString();
  els.todayBtn.style.opacity = isToday ? '0.5' : '1';
  els.todayBtn.disabled = isToday;
}

async function renderMealsForDate() {
  const dateStr = getDateString(currentDate);
  
  // Récupérer tous les repas pour ce jour
  const meals = await window.SuiviDB.db.repas
    .where('date')
    .equals(dateStr)
    .toArray();

  const mealsByType = {
    breakfast: [],
    lunch: [],
    snack: [],
    dinner: []
  };

  // Regrouper par type de repas
  for (const meal of meals) {
    const items = await window.SuiviDB.db.repasElements
      .where('repasId')
      .equals(meal.id)
      .toArray();
    if (mealsByType[meal.type]) {
      mealsByType[meal.type].push({ meal, items });
    }
  }

  // Afficher pour chaque type de repas
  for (const [mealType, data] of Object.entries(mealsByType)) {
    const container = document.getElementById(`meal-${mealType}`);
    if (!container) continue;

    let html = '';
    let mealTotalCal = 0, mealTotalProt = 0, mealTotalCarb = 0, mealTotalFat = 0;

    for (const { meal, items } of data) {
      for (const item of items) {
        let itemName = '';
        let itemInfo = '';

        if (item.elementType === 'product') {
          const product = await window.SuiviDB.db.produits.get(item.elementId);
          if (product) {
            itemName = product.name;
            itemInfo = `${item.quantity} ${UNIT_LABELS[product.unitType] || product.unitType}`;
          }
        } else if (item.elementType === 'recipe') {
          const recipe = await window.SuiviDB.db.recettes.get(item.elementId);
          if (recipe) {
            itemName = recipe.name;
            itemInfo = `${item.quantity} portion(s)`;
          }
        }

        mealTotalCal += item.calories;
        mealTotalProt += item.protein;
        mealTotalCarb += item.carbs;
        mealTotalFat += item.fat;

        html += `
          <li class="meal-item">
            <div class="meal-item-info">
              <strong>${itemName}</strong>
              <span class="meal-item-detail">${itemInfo}</span>
            </div>
            <div class="meal-item-nutrition">
              <span>🔥 ${Math.round(item.calories)} kcal</span>
              <span>🥩 ${item.protein.toFixed(1)}g</span>
              <span>🍞 ${item.carbs.toFixed(1)}g</span>
              <span>🥑 ${item.fat.toFixed(1)}g</span>
            </div>
            <button class="btn-remove-meal" data-item-id="${item.id}" onclick="removeMealItem(${item.id})" title="Supprimer">✕</button>
          </li>
        `;
      }
    }

    container.innerHTML = html || '<p class="empty-state-meal">Aucun élément</p>';

    // Mettre à jour les totaux du repas
    const totalsContainer = document.getElementById(`meal-${mealType}-totals`);
    if (totalsContainer) {
      totalsContainer.innerHTML = `
        <span class="totals-badge">🔥 ${Math.round(mealTotalCal)} kcal</span>
        <span class="totals-badge">🥩 ${mealTotalProt.toFixed(1)}g</span>
        <span class="totals-badge">🍞 ${mealTotalCarb.toFixed(1)}g</span>
        <span class="totals-badge">🥑 ${mealTotalFat.toFixed(1)}g</span>
      `;
    }
  }

  // Calculer les totaux du jour
  await updateDailyTotals();
  await renderSummary();
}

async function updateDailyTotals() {
  const dateStr = getDateString(currentDate);

  const totals = await getMealTotalsForDate(dateStr);
  els.journalTotalCalories.textContent = Math.round(totals.calories);
  els.journalTotalProtein.textContent = totals.protein.toFixed(1);
  els.journalTotalCarbs.textContent = totals.carbs.toFixed(1);
  els.journalTotalFat.textContent = totals.fat.toFixed(1);
  await renderJournalMacroProgress();
}

async function openMealItemModal() {
  const { formatted } = formatDateDisplay(currentDate);
  const mealLabels = {
    breakfast: 'Petit-déjeuner',
    lunch: 'Déjeuner',
    snack: 'Collation',
    dinner: 'Dîner'
  };

  els.mealItemModalTitle.textContent = `Ajouter à ${mealLabels[currentMealType]} (${formatted})`;
  els.mealItemForm.reset();
  els.mealItemForm.dataset.mealType = currentMealType;

  await populateMealItemSelects();
  switchSelectionType('product');
  openDialog(els.mealItemModal);
}

async function populateMealItemSelects() {
  const products = await window.SuiviDB.db.produits.toArray();
  const recipes = await window.SuiviDB.db.recettes.toArray();

  els.mealItemProduct.innerHTML = products.length
    ? products.map(p => `<option value="${p.id}">${p.name}</option>`).join('')
    : '<option value="">Aucun produit</option>';

  els.mealItemRecipe.innerHTML = recipes.length
    ? recipes.map(r => `<option value="${r.id}">${r.name}</option>`).join('')
    : '<option value="">Aucune recette</option>';

  // Assurer une valeur initiale explicite pour la validation HTML5
  if (products.length > 0) {
    els.mealItemProduct.value = String(products[0].id);
  }
  if (recipes.length > 0) {
    els.mealItemRecipe.value = String(recipes[0].id);
  }

  if (products.length > 0) {
    updateMealItemUnitDisplay();
  }
}

async function updateMealItemUnitDisplay() {
  const productId = parseInt(els.mealItemProduct.value);
  if (productId) {
    const product = await window.SuiviDB.db.produits.get(productId);
    if (product) {
      els.mealItemUnit.value = UNIT_LABELS[product.unitType] || product.unitType;
    }
  }
}

function switchSelectionType(type) {
  els.selectionTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.selectionType === type);
  });

  Object.keys(els.selectionPanels).forEach(panelType => {
    els.selectionPanels[panelType].classList.toggle('active', panelType === type);
  });

  const isProduct = type === 'product';

  // Éviter que les champs cachés bloquent le submit du formulaire
  els.mealItemProduct.disabled = !isProduct;
  els.mealItemQuantity.disabled = !isProduct;
  els.mealItemUnit.disabled = !isProduct;
  els.mealItemProduct.required = isProduct;
  els.mealItemQuantity.required = isProduct;

  els.mealItemRecipe.disabled = isProduct;
  els.mealItemRecipePortions.disabled = isProduct;
  els.mealItemRecipe.required = !isProduct;
  els.mealItemRecipePortions.required = !isProduct;
}

async function saveMealItem() {
  const dateStr = getDateString(currentDate);
  const mealType = els.mealItemForm.dataset.mealType;
  const selectionType = document.querySelector('.selection-tab.active')?.dataset.selectionType || 'product';

  let repas = await window.SuiviDB.db.repas
    .where('date')
    .equals(dateStr)
    .and(r => r.type === mealType)
    .first();

  // Créer le repas s'il n'existe pas
  if (!repas) {
    const repasId = await window.SuiviDB.db.repas.add({
      date: dateStr,
      type: mealType,
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0
    });
    repas = await window.SuiviDB.db.repas.get(repasId);
  }

  try {
    if (selectionType === 'product') {
      const productId = parseInt(els.mealItemProduct.value);
      const quantity = parseFloat(els.mealItemQuantity.value);

      if (!Number.isFinite(productId) || !Number.isFinite(quantity) || quantity <= 0) {
        alert('Veuillez sélectionner un produit et une quantité valide.');
        return;
      }

      const product = await window.SuiviDB.db.produits.get(productId);
      if (!product) {
        alert('Produit non trouvé');
        return;
      }

      // Calculer les macros
      const calories = (quantity / product.portionSize) * product.calories;
      const protein = (quantity / product.portionSize) * product.protein;
      const carbs = (quantity / product.portionSize) * product.carbs;
      const fat = (quantity / product.portionSize) * product.fat;

      await window.SuiviDB.db.repasElements.add({
        repasId: repas.id,
        elementType: 'product',
        elementId: productId,
        quantity,
        calories,
        protein,
        carbs,
        fat
      });

      console.log("✓ Produit ajouté au repas");
    } else if (selectionType === 'recipe') {
      const recipeId = parseInt(els.mealItemRecipe.value);
      const portions = parseFloat(els.mealItemRecipePortions.value);

      if (!Number.isFinite(recipeId) || !Number.isFinite(portions) || portions <= 0) {
        alert('Veuillez sélectionner une recette et un nombre de portions valide.');
        return;
      }

      const recipe = await window.SuiviDB.db.recettes.get(recipeId);
      if (!recipe) {
        alert('Recette non trouvée');
        return;
      }

      // Calculer les macros pour les portions
      const calories = (recipe.totalCalories / recipe.servings) * portions;
      const protein = (recipe.totalProtein / recipe.servings) * portions;
      const carbs = (recipe.totalCarbs / recipe.servings) * portions;
      const fat = (recipe.totalFat / recipe.servings) * portions;

      await window.SuiviDB.db.repasElements.add({
        repasId: repas.id,
        elementType: 'recipe',
        elementId: recipeId,
        quantity: portions,
        calories,
        protein,
        carbs,
        fat
      });

      console.log("✓ Recette ajoutée au repas");
    }

    closeDialog(els.mealItemModal);
    await renderMealsForDate();
  } catch (error) {
    console.error('✗ Erreur ajout au repas:', error);
    alert('Erreur lors de l\'ajout');
  }
}

async function removeMealItem(itemId) {
  if (confirm('Supprimer cet élément du repas ?')) {
    try {
      await window.SuiviDB.db.repasElements.delete(itemId);
      console.log("✓ Élément supprimé");
      await renderMealsForDate();
    } catch (error) {
      console.error('✗ Erreur suppression:', error);
    }
  }
}
