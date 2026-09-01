import type { DailyLog, DailyTotals, MealLogEntry, NutrientTargets, UserProfile } from "./types";
import { MEAL_TYPE_LABELS } from "./types";

export interface CoachMealItem {
  name: string;
  indianName?: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface CoachMeal {
  mealType: string;
  mealName: string;
  loggedAt: string;
  localTime: string;
  items: CoachMealItem[];
  totals: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
}

export interface NutritionCoachContext {
  date: string;
  localDateLabel: string;
  totals: DailyTotals;
  targets: NutrientTargets;
  profile?: {
    name: string;
    age: number;
    gender: string;
    goal: string;
    activityLevel: string;
    weightKg: number;
    heightCm: number;
  };
  meals: CoachMeal[];
}

function mealTotals(items: CoachMealItem[]) {
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

function formatMealTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function buildNutritionCoachContext(
  date: string,
  log: DailyLog,
  totals: DailyTotals,
  targets: NutrientTargets,
  profile?: UserProfile | null
): NutritionCoachContext {
  const [y, m, d] = date.split("-").map(Number);
  const localDateLabel = new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const meals: CoachMeal[] = [...log.meals]
    .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt))
    .map((meal: MealLogEntry) => {
      const items: CoachMealItem[] = meal.items.map((item) => ({
        name: item.name,
        indianName: item.indianName,
        grams: item.estimatedGrams,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        fiber: item.fiber,
      }));
      return {
        mealType: MEAL_TYPE_LABELS[meal.mealType],
        mealName: meal.mealName,
        loggedAt: meal.loggedAt,
        localTime: formatMealTime(meal.loggedAt),
        items,
        totals: mealTotals(items),
      };
    });

  return {
    date,
    localDateLabel,
    totals,
    targets,
    profile: profile
      ? {
          name: profile.name,
          age: profile.age,
          gender: profile.gender,
          goal: profile.goal,
          activityLevel: profile.activityLevel,
          weightKg: profile.weightKg,
          heightCm: profile.heightCm,
        }
      : undefined,
    meals,
  };
}
