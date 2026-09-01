import type { DetectedFoodItem, MineralProfile, VitaminProfile } from "./types";

/** True when micronutrient profile looks like lazy zeros rather than a database lookup. */
export function hasSuspiciousMicronutrients(item: DetectedFoodItem): boolean {
  const substantial = item.calories >= 60 || item.estimatedGrams >= 40;
  if (!substantial) return false;

  const v = item.vitamins;
  const m = item.minerals;
  const cholesterol = m.cholesterol_mg ?? 0;

  const allMicrosZero =
    v.vitaminA_mcg === 0 &&
    v.vitaminC_mg === 0 &&
    v.vitaminD_IU === 0 &&
    v.vitaminB12_mcg === 0 &&
    m.iron_mg === 0 &&
    m.calcium_mg === 0 &&
    m.potassium_mg === 0 &&
    m.sodium_mg === 0 &&
    cholesterol === 0;

  if (allMicrosZero) return true;

  // Processed / restaurant-style plates usually contain meaningful sodium.
  const likelySeasoned =
    item.calories >= 120 &&
    (item.carbs >= 15 || item.fat >= 4) &&
    item.minerals.sodium_mg < 40;

  if (likelySeasoned) return true;

  // Animal-origin macros pattern: meaningful protein + fat but zero cholesterol.
  const proteinPer100 = (item.protein / Math.max(item.estimatedGrams, 1)) * 100;
  const likelyAnimalProtein =
    proteinPer100 >= 8 &&
    item.fat >= 3 &&
    cholesterol === 0 &&
    item.carbs < 15;

  if (likelyAnimalProtein) return true;

  return false;
}

export function mergeMicronutrients(
  item: DetectedFoodItem,
  patch: {
    sugar_g?: number;
    vitamins?: Partial<VitaminProfile>;
    minerals?: Partial<MineralProfile>;
  }
): DetectedFoodItem {
  return {
    ...item,
    sugar_g: patch.sugar_g ?? item.sugar_g,
    vitamins: { ...item.vitamins, ...patch.vitamins },
    minerals: { ...item.minerals, ...patch.minerals },
  };
}
