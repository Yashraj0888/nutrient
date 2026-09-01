// Core domain types shared across the app (client + API routes).

export type Gender = "male" | "female" | "other";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "very_active";

export type Goal = "weight_loss" | "muscle_gain" | "maintenance";

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  weightKg: number;
  heightCm: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface MicroTargets {
  vitaminA_mcg: number;
  vitaminC_mg: number;
  vitaminD_IU: number;
  vitaminB12_mcg: number;
  iron_mg: number;
  calcium_mg: number;
  potassium_mg: number;
  sodium_mg: number;
}

export interface NutrientTargets extends MacroTargets {
  micros: MicroTargets;
  bmr: number;
  tdee: number;
}

export interface VitaminProfile {
  vitaminA_mcg: number;
  vitaminC_mg: number;
  vitaminD_IU: number;
  vitaminB12_mcg: number;
}

export interface MineralProfile {
  iron_mg: number;
  calcium_mg: number;
  potassium_mg: number;
  sodium_mg: number;
  cholesterol_mg?: number;
}

export interface DetectedFoodItem {
  id: string;
  name: string;
  /** Common Hindi / Indian name (romanized), e.g. "Chawal", "Dal", "Paneer" */
  indianName?: string;
  estimatedGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar_g?: number;
  vitamins: VitaminProfile;
  minerals: MineralProfile;
}

/** A detected item as it lives in the confirmation checklist UI state. */
export interface DraftFoodItem extends DetectedFoodItem {
  checked: boolean;
  /** grams originally estimated by Gemini, used as the scaling baseline */
  baseGrams: number;
  isCustom?: boolean;
}

export interface FoodAnalysisResult {
  mealName: string;
  mealIndianName?: string;
  detectedItems: DetectedFoodItem[];
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface MealLogEntry {
  id: string;
  date: string; // YYYY-MM-DD (local)
  mealType: MealType;
  loggedAt: string; // ISO timestamp
  imageUrl?: string; // data URL thumbnail, optional
  mealName: string;
  items: DetectedFoodItem[];
}

export interface DailyLog {
  date: string;
  meals: MealLogEntry[];
}

export interface DailyTotals extends MacroTargets {
  micros: MicroTargets;
  sugar_g: number;
  cholesterol_mg: number;
}

export type InsightKind = "highlight" | "gap" | "info" | "warning";

export interface Insight {
  kind: InsightKind;
  nutrient?: string;
  message: string;
}

export interface InsightsResult {
  summary: string;
  insights: Insight[];
}

export interface DayIntakePoint {
  date: string;
  calories: number;
  target: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  fiberTarget: number;
  micros: MicroTargets;
}

export const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};
