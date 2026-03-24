# Phase 5 - Profil & Objectifs ✅

**Date** : 24 Mars 2026  
**Durée estimée** : 1-2 jours  
**Statut** : ✅ COMPLÉTÉE

---

## 📋 Résumé des tâches

| Tâche | Fichier | Statut | Notes |
|-------|---------|--------|-------|
| HTML : Enhanced profile form | `index.html` | ✅ | Données + TDEE + macros |
| HTML : Fieldsets & displays | `index.html` | ✅ | Sections organisées |
| JS : TDEE calculation | `app.js` | ✅ | Mifflin-St Jeor formula |
| JS : Goal adjustments | `app.js` | ✅ | +10% / 0% / -20% |
| JS : Macro targets | `app.js` | ✅ | % protéines/glucides/lipides |
| CSS : Profile styling | `styles.css` | ✅ | Fieldsets, grids, responsive |

---

## 🎯 Ce qui a été implémenté

### 1. **index.html** - Enhanced Profil Tab

**Section Données personnelles** :
- Taille (cm), Poids (kg), Age (ans)
- **Sexe** : Homme / Femme (NEW)
- **Activité physique** : 5 niveaux (NEW)
  - Très sédentaire
  - Légèrement actif
  - Modérément actif
  - Très actif
  - Extrêmement actif

**Section Objectif** :
- Type d'objectif : Prise de masse (+10%) / Maintien / Perte de poids (-20%)

**Section Calculs (Mifflin-St Jeor)** :
- **MB (Métabolisme de base)** - formule Mifflin-St Jeor
- **TDEE (sans objectif)** - MB × Activity Factor
- **Objectif quotidien** - TDEE × Goal Adjustment

**Section Macronutriments** :
- % Protéines (10-50%), % Glucides (20-70%), % Lipides (10-50%)
- Avertissement si total ≠ 100%
- Affichage auto-calculé :
  - Protéines (g) - kcal × % ÷ 4 kcal/g
  - Glucides (g) - kcal × % ÷ 4 kcal/g
  - Lipides (g) - kcal × % ÷ 9 kcal/g

### 2. **app.js** - Nouvelle logique Phase 5

**Constantes** :
```javascript
ACTIVITY_FACTORS = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9
}

GOAL_ADJUSTMENTS = {
  gain: 1.10,      // +10%
  maintain: 1.0,   // 0%
  cut: 0.80        // -20%
}
```

**Formule Mifflin-St Jeor** (BMR) :
```javascript
Homme: 10 × poids + 6.25 × taille - 5 × age + 5
Femme: 10 × poids + 6.25 × taille - 5 × age - 161
```

**Fonctions principales** :
- `updateProfileCalculations()` - Calcule TDEE et affiche
  - Récalcul à chaque changement (hauteur, poids, âge, sexe, activité, objectif)
  - Appelle `updateMacroTargets()` automatiquement
  
- `updateMacroTargets()` - Calcule objectifs macros
  - Vérifie que % total = 100%
  - Calcule grammes de chaque macro basé sur TDEE quotidien
  - Affiche avec avertissement si pourcentages invalides

- `saveProfileFromForm()` - Enregistre profil + recalcule TDEE
  - Sauvegarde tous les paramètres en state
  - Calcul final du TDEE avec tous les paramètres
  - Affiche confirmation

**État de profil mise à jour** :
```javascript
state.profile = {
  heightCm, weightKg, age,
  gender, activityLevel, goalType,  // NEW
  tdeeBmr, tdeeMaintenance, tdeeDaily, calorieTarget,  // NEW
  macroPercentProtein, macroPercentCarbs, macroPercentFats  // NEW
}
```

### 3. **Event Listeners** - Binding complet

```javascript
// Recalculer TDEE/macros en temps réel
els.heightInput.addEventListener("change", updateProfileCalculations);
els.weightInput.addEventListener("change", updateProfileCalculations);
els.ageInput.addEventListener("change", updateProfileCalculations);
els.genderSelect.addEventListener("change", updateProfileCalculations);
els.activityLevelSelect.addEventListener("change", updateProfileCalculations);
els.goalTypeSelect.addEventListener("change", updateProfileCalculations);

// Valider macros % et recalculer cibles
els.proteinPercentInput.addEventListener("input", updateMacroTargets);
els.carbsPercentInput.addEventListener("input", updateMacroTargets);
els.fatsPercentInput.addEventListener("input", updateMacroTargets);

// Sauvegarder
els.profileForm.addEventListener("submit", saveProfileFromForm);
```

### 4. **styles.css** - Design complet

**Fieldsets** :
- Bordure teal, padding, fond légèrement teinté
- Legend styled au-dessus

**Calculation display** :
- Grid 3 colonnes (MB | TDEE | Objectif)
- Cards avec gradient subtil
- Grandes valeurs en teal

**Macro targets display** :
- Grid 3 colonnes (Protéines | Glucides | Lipides)
- Cards avec bordure/shadow hover
- Grandes valeurs en teal

**Responsive** (@460px) :
- Grilles → 1 colonne (stacked)
- Padding réduit

---

## 📊 Calculs détaillés

### Mifflin-St Jeor (Metabolism Basal)

```
Homme: MB = 10 × W + 6.25 × H - 5 × A + 5
Femme: MB = 10 × W + 6.25 × H - 5 × A - 161

W = poids (kg)
H = taille (cm)
A = age (ans)

Exemple (Homme 70kg, 175cm, 30ans):
MB = 10(70) + 6.25(175) - 5(30) + 5
   = 700 + 1093.75 - 150 + 5
   = 1648.75 ≈ 1649 kcal/jour
```

### TDEE (Total Daily Energy Expenditure)

```
TDEE = MB × Activity Factor

Activity Factors:
- Sédentaire (peu/pas): 1.2
- Peu actif (1-3 j/sem): 1.375
- Modérément actif (3-5 j/sem): 1.55
- Très actif (6-7 j/sem): 1.725
- Ultra actif (2× par jour): 1.9

Exemple (MB 1649, Modérément actif):
TDEE = 1649 × 1.55 = 2556 kcal/jour
```

### Objectif quotidien

```
Objectif = TDEE × Goal Adjustment

Goal Adjustments:
- Prise (+10%): × 1.10
- Maintien: × 1.0
- Perte (-20%): × 0.80

Exemple (TDEE 2556, Perte):
Objectif = 2556 × 0.80 = 2045 kcal/jour
```

### Macro targets

```
Basé sur % du TDEE quotidien

Protéines (P):
  kcal_P = TDEE × (P% / 100)
  grammes = kcal_P / 4

Glucides (C):
  kcal_C = TDEE × (C% / 100)
  grammes = kcal_C / 4

Lipides (L):
  kcal_L = TDEE × (L% / 100)
  grammes = kcal_L / 9

Exemple (2045 kcal, 30% P / 40% C / 30% L):
P: 2045 × 0.30 / 4 = 154 g
C: 2045 × 0.40 / 4 = 205 g
L: 2045 × 0.30 / 9 = 68 g
```

---

## 🎨 Flux utilisateur

```
Utilisateur ouvre Tab "Profil & Objectifs"
    ↓
┌─────────────────────────────────────────────┐
│ Profil & Objectifs                          │
│                                             │
│ ▼ Données personnelles                      │
│ Taille: [175]  Poids: [70]                 │
│ Age: [30]      Sexe: [Homme ▼]             │
│ Activité: [Modérément actif ▼]             │
│                                             │
│ ▼ Objectif                                  │
│ Type: [Maintien ▼]                         │
│                                             │
│ ▼ Calculs (Mifflin-St Jeor)                 │
│ ┌────────────────────────────────────────┐ │
│ │ MB: 1649 kcal   TDEE: 2556 kcal   OBJ │ │
│ │                                     │ │
│ │                 2556 kcal/jour      │ │
│ └────────────────────────────────────────┘ │
│                                             │
│ ▼ Objectifs macronutriments                 │
│ P: [30]%  C: [40]%  L: [30]%               │
│                                             │
│ ┌────────────────────────────────────────┐ │
│ │ Protéines  │  Glucides  │  Lipides   │ │
│ │   154g     │    256g    │    85g     │ │
│ └────────────────────────────────────────┘ │
│                                             │
│ [Enregistrer le profil]                    │
└─────────────────────────────────────────────┘

Utilateur change Sexe → Homme à Femme
    ↓ updateProfileCalculations() triggered
    ↓ MB recalculé
    ↓ TDEE recalculé
    ↓ Macro targets recalculés
    ↓ Affichage mis à jour instantanément

Utilisateur change % Protéines: 30 → 35
    ↓ updateMacroTargets() triggered
    ↓ % Carbs automatiquement réduit à maintenir 100%
    ↓ Grammes recalculés
    ↓ Affichage mis à jour

Utilisateur click "Enregistrer le profil"
    ↓ saveProfileFromForm()
    ↓ Toutes les données sauvegardées en state
    ↓ localStorage persisté
    ↓ "✓ Profil enregistré avec succès !"
```

---

## 📱 Responsive Design

**Desktop** (>460px) :
- Fieldsets en colonnes
- Grilles 3 colonnes (MB/TDEE/Obj, P/C/L)
- Space large

**Mobile** (<460px) :
- Fieldsets mêmes
- Grilles → 1 colonne (stacked)
- Padding réduit pour économiser espace

---

## ✅ Validations & Vérifications

✓ Toutes les entrées numériques clamped (values valides)  
✓ Sexe stocké (male/female)  
✓ Activité stockée (5 niveaux seulement)  
✓ Calcul Mifflin-St Jeor correct pour H/F  
✓ Activity factors corrects (1.2 - 1.9)  
✓ Goal adjustments appliqués (+10%, 0%, -20%)  
✓ Macros % totalisent ~100% (avec avertissement si non)  
✓ Calcul grammes macros correct (÷4 pour P/C, ÷9 pour L)  
✓ Try/catch localStorage OK  
✓ Pas d'erreur JS  

---

## 🗄️ Compatibilité Data

**Ancien format (Phase 1-3)** → **Nouveau (Phase 5)** :
- `oldProfile.goalType` → `newProfile.goalType` (conservé)
- `oldProfile.proteinTargetMode` → SUPPRIMÉ (remplacé par macro %)
- `oldProfile.proteinTargetValue` → SUPPRIMÉ (remplacé par macro targets)
- **Nouveaux** : gender, activityLevel, tdeeBmr, tdeeMaintenance, tdeeDaily, macroPercent*

**Migration automatique** via `sanitizeState()` :
- Anciennes données importées conservent valeurs
- Recalcul automatique TDEE avec defaults si données manquantes
- Pour anciennes données : gender=male, activity=moderate, goal=maintain

---

## 📝 Fichiers modifiés

- 📝 **index.html** - Remplacement complet du profil avec fieldsets/displays
- 📝 **app.js** - Constantes + 3 fonctions remplacées, 2 nouvelles + sanitizeState mise à jour
- 📝 **styles.css** - ~50 lignes CSS + responsive pour profil

---

## 🧪 Comment tester

### Test 1 - TDEE Calculation

```
1. Données: H/175cm, 70kg, 30ans, Homme, Modéré, Maintien
2. Vérifier MB ≈ 1649
3. Vérifier TDEE ≈ 2556 (1649 × 1.55)
4. Vérifier Objectif ≈ 2556 (maintien = ×1.0)
```

### Test 2 - Sexe Impact

```
1. Changer Sexe → Femme
2. ✓ MB devrait diminuer (formule différente)
3. ✓ TDEE + Objectif mises à jour
```

### Test 3 - Activity Impact

```
1. Activité: Sédentaire (1.2)
2. Vérifier TDEE ≈ 1679 (1649 × 1.2)
3. Changer → Très actif (1.725)
4. Vérifier TDEE ≈ 2845 (1649 × 1.725)
```

### Test 4 - Goal Impact

```
1. Type: Prise (+10%)
2. Objectif = TDEE × 1.10
3. Type: Perte (-20%)
4. Objectif = TDEE × 0.80
```

### Test 5 - Macro Targets

```
1. P: 30%, C: 40%, L: 30%
2. Vérifier % = 100%
3. Calculer: P = 2556 × 0.30 / 4 = 192g (check)
4. Changer P: 35%, C → 37% auto
5. Vérifier avertissement si total ≠ 100%
```

### Test 6 - Persistence

```
1. Remplir profil, enregistrer
2. Recharger page
3. ✓ Toutes les données persistent
```

---

## 🎯 Points clés

✅ **Formule scientifique** (Mifflin-St Jeor) - précision ±10%  
✅ **Sexe-spécifique** - calcul dépend du sexe  
✅ **5 niveaux d'activité** - flexible  
✅ **3 objectifs** (+10%, 0%, -20%)  
✅ **Macros en %** - flexibles et pratiques  
✅ **Calculs instantanés** - en temps réel  
✅ **Validation %** - avertissement si invalide  
✅ **Persistence** - localStorage + state  
✅ **Migration** - compatible anciennes données  

---

## 🚀 Prochaine phase

**Phase 6 : Coach Feedback** (2-3 jours)
- Afficher budget calorieque vs réel
- Macros atteints vs objectifs
- Messages motivants
- Calories restantes

---

**Status** : Phase 5 COMPLÉTÉE - Profil + TDEE complet ! 🎉

**Prochaines actions** :
- Lier journal à objectifs (afficher vs cible)
- Implémenter coach feedback
- Tests utilisateur
