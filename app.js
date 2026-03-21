const STORAGE_KEY = "protein-tracker-state-v1";

const DEFAULT_FOODS = [
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

const DEFAULT_STATE = {
  profile: {
    heightCm: 175,
    weightKg: 70,
    age: 30,
    goalType: "gain",
    proteinTargetMode: "manual",
    proteinTargetValue: 140
  },
  foods: DEFAULT_FOODS,
  entriesByDate: {},
  lastFoodId: DEFAULT_FOODS[0].id
};

const GOAL_MULTIPLIERS = {
  gain: 2.0,
  maintain: 1.6,
  cut: 2.2
};

const UNIT_LABELS = {
  g: "g",
  unit: "unite",
  scoop: "dose"
};

let state = loadState();

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
  goalTypeSelect: document.getElementById("goalTypeSelect"),
  targetModeSelect: document.getElementById("targetModeSelect"),
  manualTargetInput: document.getElementById("manualTargetInput"),
  autoHint: document.getElementById("autoHint")
};

init();

function init() {
  renderFoodSelect();
  renderProfileForm();
  bindEvents();
  renderAll();
  registerServiceWorker();
}

function bindEvents() {
  els.tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => activateTab(btn.dataset.tab));
  });

  els.foodSelect.addEventListener("change", () => {
    state.lastFoodId = els.foodSelect.value;
    saveState();
    updateUnitAndQuickQty();
  });

  els.quickQty.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-value]");
    if (!button) {
      return;
    }
    els.quantityInput.value = button.dataset.value;
    els.quantityInput.focus();
  });

  els.entryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addEntry();
  });

  els.todayEntries.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-entry-id]");
    if (!button) {
      return;
    }
    removeEntry(todayKey(), button.dataset.entryId);
  });

  els.profileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveProfileFromForm();
  });

  els.targetModeSelect.addEventListener("change", () => {
    updateTargetModeUi();
    renderSummary();
  });

  els.weightInput.addEventListener("input", () => {
    if (els.targetModeSelect.value === "auto") {
      renderSummary();
      updateTargetModeUi();
    }
  });

  els.goalTypeSelect.addEventListener("change", () => {
    if (els.targetModeSelect.value === "auto") {
      renderSummary();
      updateTargetModeUi();
    }
  });

  els.exportBtn.addEventListener("click", exportData);
  els.importFile.addEventListener("change", importData);
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
}

function renderFoodSelect() {
  const options = state.foods
    .map((food) => `<option value="${food.id}">${food.name}</option>`)
    .join("");

  els.foodSelect.innerHTML = options;
  els.foodSelect.value = state.lastFoodId || state.foods[0].id;
}

function updateUnitAndQuickQty() {
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

function renderSummary() {
  const key = todayKey();
  const entries = state.entriesByDate[key] || [];
  const total = round(entries.reduce((sum, entry) => sum + entry.proteinComputed, 0), 1);
  const target = getCurrentTarget();
  const ratio = target > 0 ? Math.min((total / target) * 100, 100) : 0;
  const pct = round(ratio, 0);

  els.dailyTotal.textContent = total.toFixed(1);
  els.dailyTarget.textContent = target.toFixed(0);
  els.progressPct.textContent = pct.toFixed(0);
  els.progressFill.style.width = `${pct}%`;
  els.progressBarWrap.setAttribute("aria-valuenow", String(pct));
}

function renderTodayEntries() {
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
  els.goalTypeSelect.value = p.goalType;
  els.targetModeSelect.value = p.proteinTargetMode;
  els.manualTargetInput.value = p.proteinTargetValue;
  updateTargetModeUi();
}

function updateTargetModeUi() {
  const isAuto = els.targetModeSelect.value === "auto";
  els.manualTargetInput.disabled = isAuto;

  const weight = safeNumber(els.weightInput.value);
  const goal = els.goalTypeSelect.value;
  const multiplier = GOAL_MULTIPLIERS[goal] || GOAL_MULTIPLIERS.maintain;
  const auto = round(weight * multiplier, 0);

  els.autoHint.textContent = isAuto
    ? `Objectif calcule: ${auto.toFixed(0)} g (poids x ${multiplier})`
    : "Mode manuel actif.";
}

function saveProfileFromForm() {
  const next = {
    heightCm: clampInt(els.heightInput.value, 100, 250),
    weightKg: clampFloat(els.weightInput.value, 30, 250),
    age: clampInt(els.ageInput.value, 12, 100),
    goalType: els.goalTypeSelect.value,
    proteinTargetMode: els.targetModeSelect.value,
    proteinTargetValue: clampInt(els.manualTargetInput.value || "140", 40, 400)
  };

  state.profile = next;
  saveState();
  updateTargetModeUi();
  renderSummary();
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
  const safe = structuredClone(DEFAULT_STATE);

  safe.profile = {
    heightCm: clampInt(raw.profile.heightCm, 100, 250),
    weightKg: clampFloat(raw.profile.weightKg, 30, 250),
    age: clampInt(raw.profile.age, 12, 100),
    goalType: ["gain", "maintain", "cut"].includes(raw.profile.goalType) ? raw.profile.goalType : "maintain",
    proteinTargetMode: ["manual", "auto"].includes(raw.profile.proteinTargetMode) ? raw.profile.proteinTargetMode : "manual",
    proteinTargetValue: clampInt(raw.profile.proteinTargetValue, 40, 400)
  };

  safe.foods = Array.isArray(raw.foods) && raw.foods.length ? raw.foods : DEFAULT_FOODS;
  safe.entriesByDate = typeof raw.entriesByDate === "object" && raw.entriesByDate ? raw.entriesByDate : {};
  safe.lastFoodId = raw.lastFoodId || safe.foods[0].id;

  return safe;
}

function getSelectedFood() {
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
  const mode = els.targetModeSelect.value || state.profile.proteinTargetMode;
  if (mode === "auto") {
    const weight = clampFloat(els.weightInput.value || state.profile.weightKg, 30, 250);
    const goal = els.goalTypeSelect.value || state.profile.goalType;
    const multiplier = GOAL_MULTIPLIERS[goal] || GOAL_MULTIPLIERS.maintain;
    return round(weight * multiplier, 0);
  }

  return clampInt(els.manualTargetInput.value || state.profile.proteinTargetValue, 40, 400);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return structuredClone(DEFAULT_STATE);
    }

    const parsed = JSON.parse(raw);
    return sanitizeState(parsed);
  } catch (error) {
    return structuredClone(DEFAULT_STATE);
  }
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

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {
      // Keep silent to avoid friction in a tiny personal app.
    });
  }
}
