import type {
  ActivityLevel,
  Gender,
  Goal,
  MicroTargets,
  NutrientTargets,
  UserProfile,
} from "./types";

/**
 * Nutrition math engine — clinical standard formulas only.
 *
 * BMR: Mifflin-St Jeor (1990) — preferred over Harris-Benedict in modern practice.
 * TDEE: BMR × physical-activity factor (single selected level).
 * Daily calories: TDEE adjusted by ONE selected goal (never combined).
 * Macros: protein from body weight (g/kg); fat % of calories; carbs = remainder.
 */

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary (little to no exercise)",
  light: "Lightly active (1–3 days/week)",
  moderate: "Moderately active (3–5 days/week)",
  very_active: "Very active (6–7 days/week)",
};

export const ACTIVITY_SHORT_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary",
  light: "Light",
  moderate: "Moderate",
  very_active: "Very active",
};

export const GOAL_LABELS: Record<Goal, string> = {
  weight_loss: "Weight loss",
  muscle_gain: "Muscle gain",
  maintenance: "Maintenance",
};

export interface MetabolicBreakdown {
  bmr: number;
  activityLevel: ActivityLevel;
  activityMultiplier: number;
  tdee: number;
  goal: Goal;
  goalAdjustmentKcal: number;
  calories: number;
  formulaNote: string;
}

/** Mifflin-St Jeor basal metabolic rate (kcal/day). Inputs: weight kg, height cm, age years. */
export function calculateBMR(
  gender: Gender,
  weightKg: number,
  heightCm: number,
  age: number
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === "male") return base + 5;
  if (gender === "female") return base - 161;
  return base - 78;
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
}

function goalCalorieAdjustment(tdee: number, goal: Goal): number {
  switch (goal) {
    case "weight_loss":
      return -Math.min(500, Math.round(tdee * 0.2));
    case "muscle_gain":
      return Math.min(400, Math.round(tdee * 0.12));
    case "maintenance":
    default:
      return 0;
  }
}

function minimumDailyCalories(gender: Gender): number {
  if (gender === "male") return 1500;
  if (gender === "female") return 1200;
  return 1350;
}

function proteinGramsPerKg(goal: Goal): number {
  switch (goal) {
    case "weight_loss":
      return 2.0;
    case "muscle_gain":
      return 2.0;
    case "maintenance":
    default:
      return 1.6;
  }
}

function fatCaloriePercent(goal: Goal): number {
  switch (goal) {
    case "weight_loss":
      return 0.3;
    case "muscle_gain":
      return 0.25;
    case "maintenance":
    default:
      return 0.28;
  }
}

function microTargets(gender: Gender): MicroTargets {
  const isFemale = gender === "female";
  return {
    vitaminA_mcg: isFemale ? 700 : 900,
    vitaminC_mg: isFemale ? 75 : 90,
    vitaminD_IU: 800,
    vitaminB12_mcg: 2.4,
    iron_mg: isFemale ? 18 : 8,
    calcium_mg: 1000,
    potassium_mg: isFemale ? 2600 : 3400,
    sodium_mg: 2300,
  };
}

export function getMetabolicBreakdown(
  profile: Pick<UserProfile, "gender" | "weightKg" | "heightCm" | "age" | "activityLevel" | "goal">
): MetabolicBreakdown {
  const { gender, weightKg, heightCm, age, activityLevel, goal } = profile;
  const bmr = calculateBMR(gender, weightKg, heightCm, age);
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel];
  const tdee = calculateTDEE(bmr, activityLevel);
  const goalAdjustmentKcal = goalCalorieAdjustment(tdee, goal);
  const rawCalories = tdee + goalAdjustmentKcal;
  const calories = Math.max(minimumDailyCalories(gender), Math.round(rawCalories));

  const adjustmentLabel =
    goalAdjustmentKcal === 0
      ? "no adjustment"
      : `${goalAdjustmentKcal > 0 ? "+" : ""}${goalAdjustmentKcal} kcal for ${GOAL_LABELS[goal].toLowerCase()}`;

  return {
    bmr: Math.round(bmr),
    activityLevel,
    activityMultiplier: multiplier,
    tdee: Math.round(tdee),
    goal,
    goalAdjustmentKcal,
    calories,
    formulaNote: `BMR (Mifflin-St Jeor) × ${multiplier} activity = ${Math.round(tdee)} TDEE, then ${adjustmentLabel}.`,
  };
}

export function calculateNutrientTargets(
  profile: Pick<UserProfile, "gender" | "weightKg" | "heightCm" | "age" | "activityLevel" | "goal">
): NutrientTargets {
  const { gender, weightKg, goal } = profile;
  const metabolic = getMetabolicBreakdown(profile);
  const calories = metabolic.calories;

  const protein = weightKg * proteinGramsPerKg(goal);
  const proteinCalories = protein * 4;
  const fatCalories = calories * fatCaloriePercent(goal);
  const fat = fatCalories / 9;
  const remainingCalories = Math.max(0, calories - proteinCalories - fatCalories);
  const carbs = remainingCalories / 4;
  const fiber = (calories / 1000) * 14;

  return {
    bmr: metabolic.bmr,
    tdee: metabolic.tdee,
    calories,
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
    fiber: Math.round(fiber),
    micros: microTargets(gender),
  };
}

export function ageFromProfile(profile: { age: number }): number {
  return profile.age;
}
