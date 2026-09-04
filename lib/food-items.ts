import type { DetectedFoodItem, MineralProfile, VitaminProfile } from "./types";
import { generateId } from "./storage";

/** Recompute all nutrient fields of a food item for a new portion size, scaling
 * proportionally from the item's original estimated grams. */
export function scaleFoodItem(original: DetectedFoodItem, grams: number): DetectedFoodItem {
  const ratio = original.estimatedGrams > 0 ? grams / original.estimatedGrams : 1;
  const round1 = (n: number) => Math.round(n * ratio * 10) / 10;

  const vitamins: VitaminProfile = {
    vitaminA_mcg: round1(original.vitamins.vitaminA_mcg),
    vitaminC_mg: round1(original.vitamins.vitaminC_mg),
    vitaminD_IU: round1(original.vitamins.vitaminD_IU),
    vitaminB12_mcg: round1(original.vitamins.vitaminB12_mcg),
  };
  const minerals: MineralProfile = {
    iron_mg: round1(original.minerals.iron_mg),
    calcium_mg: round1(original.minerals.calcium_mg),
    potassium_mg: round1(original.minerals.potassium_mg),
    sodium_mg: round1(original.minerals.sodium_mg),
  };

  return {
    ...original,
    estimatedGrams: Math.round(grams),
    calories: Math.round(original.calories * ratio),
    protein: round1(original.protein),
    carbs: round1(original.carbs),
    fat: round1(original.fat),
    fiber: round1(original.fiber),
    sugar_g: original.sugar_g != null ? round1(original.sugar_g) : undefined,
    vitamins,
    minerals: {
      ...minerals,
      cholesterol_mg:
        original.minerals.cholesterol_mg != null
          ? Math.round(original.minerals.cholesterol_mg * ratio)
          : undefined,
    },
  };
}

export function formatFoodName(item: { name: string; indianName?: string }): string {
  const indian = item.indianName?.trim();
  if (indian && indian.toLowerCase() !== item.name.trim().toLowerCase()) {
    return `${item.name} (${indian})`;
  }
  return item.name;
}

export function formatMealName(meal: { mealName: string; mealIndianName?: string }): string {
  const indian = meal.mealIndianName?.trim();
  if (indian && indian.toLowerCase() !== meal.mealName.trim().toLowerCase()) {
    return `${meal.mealName} (${indian})`;
  }
  return meal.mealName;
}

export function createCustomFoodItem(input: {
  name: string;
  indianName?: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}): DetectedFoodItem {
  return {
    id: generateId("custom"),
    name: input.name,
    indianName: input.indianName?.trim() || undefined,
    estimatedGrams: input.grams,
    calories: input.calories,
    protein: input.protein,
    carbs: input.carbs,
    fat: input.fat,
    fiber: input.fiber,
    vitamins: { vitaminA_mcg: 0, vitaminC_mg: 0, vitaminD_IU: 0, vitaminB12_mcg: 0 },
    minerals: { iron_mg: 0, calcium_mg: 0, potassium_mg: 0, sodium_mg: 0 },
  };
}

export function sumFoodItems(items: DetectedFoodItem[]) {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
      fiber: acc.fiber + item.fiber,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
}

export function guessMealTypeByTime(): "breakfast" | "lunch" | "dinner" | "snack" {
  const hour = new Date().getHours();
  if (hour < 11) return "breakfast";
  if (hour < 16) return "lunch";
  if (hour < 21) return "dinner";
  return "snack";
}
