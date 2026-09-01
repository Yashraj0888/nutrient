import type { DetectedFoodItem } from "./types";

export type HealthLabel = "Healthy" | "Moderate" | "Needs attention";

export interface HealthFactor {
  name: string;
  impact: "good" | "moderate" | "bad";
  detail?: string;
}

export interface FoodHealthResult {
  score: number;
  label: HealthLabel;
  factors: HealthFactor[];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function per100(value: number, grams: number) {
  const g = grams > 0 ? grams : 100;
  return (value / g) * 100;
}

function labelFromScore(score: number): HealthLabel {
  if (score >= 67) return "Healthy";
  if (score >= 40) return "Moderate";
  return "Needs attention";
}

function lerp(score: number, points: [number, number][]) {
  if (points.length === 0) return 50;
  if (score <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    if (score <= x1) {
      const t = (score - x0) / (x1 - x0 || 1);
      return y0 + t * (y1 - y0);
    }
  }
  return points[points.length - 1][1];
}

function isFruit(item: DetectedFoodItem, grams: number) {
  const sugar = item.sugar_g ?? 0;
  const fatPer100 = per100(item.fat, grams);
  return sugar >= 6 && item.fiber >= 1.5 && fatPer100 < 8 && item.protein < 12;
}

function isLeanProtein(item: DetectedFoodItem, proteinPer100: number) {
  const sugar = item.sugar_g ?? 0;
  return proteinPer100 >= 9 && item.carbs < 12 && sugar < 8;
}

function isWholeGrainOrStaple(item: DetectedFoodItem, proteinPer100: number) {
  const carbsPer100 = per100(item.carbs, item.estimatedGrams || 100);
  return carbsPer100 >= 18 && proteinPer100 < 10 && item.fiber < 8;
}

function isHealthyFatSource(item: DetectedFoodItem, grams: number) {
  const fatPer100 = per100(item.fat, grams);
  const sugar = item.sugar_g ?? 0;
  const carbsPer100 = per100(item.carbs, grams);
  const sodium = item.minerals.sodium_mg;
  if (carbsPer100 >= 15 || sodium >= 350) return false;
  return fatPer100 >= 12 && sugar < 6 && (item.protein >= 6 || item.fiber >= 5);
}

function isLikelyProcessed(item: DetectedFoodItem, grams: number, fatCalShare: number) {
  const sugar = item.sugar_g ?? 0;
  const sodium = item.minerals.sodium_mg;
  const calPer100 = per100(item.calories, grams);
  const proteinPer100 = per100(item.protein, grams);
  const carbsPer100 = per100(item.carbs, grams);
  const fatPer100 = per100(item.fat, grams);

  if (sugar >= 15 && item.fiber < 2) return true;
  if (sodium >= 650 && fatCalShare >= 0.3) return true;
  if (fatCalShare >= 0.48 && sodium >= 300 && item.fiber < 4) return true;
  if (fatPer100 >= 11 && carbsPer100 >= 22 && proteinPer100 < 7) return true;
  if (calPer100 >= 360 && item.fiber < 3 && proteinPer100 < 8) return true;
  if (sodium >= 500 && carbsPer100 >= 20 && item.fiber < 4) return true;
  return false;
}

function scoreProtein(item: DetectedFoodItem, proteinPer100: number, lean: boolean) {
  if (lean) return lerp(proteinPer100, [[8, 78], [12, 86], [18, 94], [25, 97]]);
  return lerp(proteinPer100, [[0, 55], [6, 68], [12, 80], [20, 90]]);
}

function scoreFiber(item: DetectedFoodItem, grams: number, lean: boolean, staple: boolean) {
  const fiberPer100 = per100(item.fiber, grams);
  if (lean || staple) {
    return lerp(item.fiber, [[0, 68], [2, 74], [5, 84], [10, 93]]);
  }
  return lerp(fiberPer100, [[0, 42], [2, 68], [4, 80], [8, 92]]);
}

function scoreSugar(item: DetectedFoodItem, fruit: boolean) {
  const sugar = item.sugar_g ?? 0;
  if (fruit) {
    return lerp(sugar, [[0, 92], [10, 82], [18, 72], [28, 58]]);
  }
  return lerp(sugar, [[0, 94], [4, 84], [10, 55], [18, 28], [30, 12], [45, 5]]);
}

function scoreSodium(sodium: number) {
  return lerp(sodium, [[0, 94], [140, 88], [300, 74], [500, 58], [800, 35], [1200, 15]]);
}

function scoreFat(
  item: DetectedFoodItem,
  grams: number,
  fatCalShare: number,
  lean: boolean,
  healthyFat: boolean,
  processed: boolean
) {
  if (healthyFat) return lerp(per100(item.fat, grams), [[10, 76], [20, 80], [35, 74], [50, 66]]);
  if (lean) return lerp(fatCalShare, [[0.35, 88], [0.55, 82], [0.7, 76], [0.85, 70]]);
  if (processed) {
    return lerp(fatCalShare, [[0.2, 62], [0.35, 48], [0.45, 36], [0.55, 26], [0.7, 16]]);
  }
  return lerp(fatCalShare, [[0.2, 88], [0.4, 74], [0.55, 58], [0.7, 38], [0.85, 22]]);
}

function scoreProcessing(
  item: DetectedFoodItem,
  grams: number,
  fatCalShare: number,
  processed: boolean,
  fruit: boolean,
  lean: boolean
) {
  if (processed) {
    const sugar = item.sugar_g ?? 0;
    const carbsPer100 = per100(item.carbs, grams);
    if (sugar >= 20) return 10;
    if (fatCalShare >= 0.42 && carbsPer100 >= 18) return 22;
    if (item.minerals.sodium_mg >= 700) return 26;
    return 34;
  }
  if (fruit) return 82;
  if (lean) return 88;
  if (isWholeGrainOrStaple(item, per100(item.protein, grams))) return 74;
  if (item.fiber >= 4 || item.protein >= 8) return 80;
  return 72;
}

function buildFactors(
  item: DetectedFoodItem,
  scores: Record<string, number>,
  flags: { fruit: boolean; lean: boolean; processed: boolean; healthyFat: boolean }
): HealthFactor[] {
  const factors: HealthFactor[] = [];

  if (flags.lean) factors.push({ name: "Lean protein", impact: "good" });
  if (flags.fruit) factors.push({ name: "Whole fruit", impact: "good" });
  if (flags.healthyFat) factors.push({ name: "Healthy fats", impact: "good" });
  if (item.fiber >= 5) factors.push({ name: "High fiber", impact: "good" });
  else if (item.fiber >= 3) factors.push({ name: "Good fiber", impact: "good" });
  if ((item.sugar_g ?? 0) <= 2 && item.carbs < 12) factors.push({ name: "Low sugar", impact: "good" });
  if (item.minerals.sodium_mg <= 140) factors.push({ name: "Low sodium", impact: "good" });

  if (flags.processed) factors.push({ name: "Highly processed", impact: "bad" });
  if ((item.sugar_g ?? 0) >= 15 && !flags.fruit) {
    factors.push({ name: "High sugar", impact: "bad", detail: `${Math.round(item.sugar_g ?? 0)} g` });
  }
  if (item.minerals.sodium_mg >= 600) {
    factors.push({ name: "High sodium", impact: "bad", detail: `${Math.round(item.minerals.sodium_mg)} mg` });
  } else if (item.minerals.sodium_mg >= 350) {
    factors.push({ name: "Moderate sodium", impact: "moderate", detail: `${Math.round(item.minerals.sodium_mg)} mg` });
  }
  if ((item.minerals.cholesterol_mg ?? 0) >= 200 && !flags.lean) {
    factors.push({
      name: "High cholesterol",
      impact: "bad",
      detail: `${Math.round(item.minerals.cholesterol_mg ?? 0)} mg`,
    });
  }

  const ranked = [
    ...factors.filter((f) => f.impact === "good").slice(0, 2),
    ...factors.filter((f) => f.impact === "moderate").slice(0, 1),
    ...factors.filter((f) => f.impact === "bad").slice(0, 1),
  ];

  if (ranked.length === 0) {
    if (scores.processing >= 75) ranked.push({ name: "Balanced whole food", impact: "good" });
    else ranked.push({ name: "Mixed nutrients", impact: "moderate" });
  }

  return ranked.slice(0, 4);
}

/** Score a single food item from 0 (unhealthy) to 100 (healthy). */
export function scoreFoodItem(item: DetectedFoodItem): FoodHealthResult {
  const grams = item.estimatedGrams || 100;
  const proteinPer100 = per100(item.protein, grams);
  const calories = item.calories || 1;
  const fatCalShare = (item.fat * 9) / calories;

  const fruit = isFruit(item, grams);
  const lean = isLeanProtein(item, proteinPer100);
  const healthyFat = isHealthyFatSource(item, grams);
  const processed = isLikelyProcessed(item, grams, fatCalShare);

  const dimensions = {
    protein: scoreProtein(item, proteinPer100, lean),
    fiber: scoreFiber(item, grams, lean, isWholeGrainOrStaple(item, proteinPer100)),
    sugar: scoreSugar(item, fruit),
    sodium: scoreSodium(item.minerals.sodium_mg),
    fat: scoreFat(item, grams, fatCalShare, lean, healthyFat, processed),
    processing: scoreProcessing(item, grams, fatCalShare, processed, fruit, lean),
  };

  const weights = processed
    ? { protein: 0.07, fiber: 0.07, sugar: 0.24, sodium: 0.16, fat: 0.24, processing: 0.22 }
    : fruit
      ? { protein: 0.08, fiber: 0.18, sugar: 0.22, sodium: 0.1, fat: 0.12, processing: 0.3 }
      : lean
        ? { protein: 0.28, fiber: 0.1, sugar: 0.14, sodium: 0.14, fat: 0.14, processing: 0.2 }
        : { protein: 0.18, fiber: 0.18, sugar: 0.18, sodium: 0.14, fat: 0.14, processing: 0.18 };

  let raw =
    dimensions.protein * weights.protein +
    dimensions.fiber * weights.fiber +
    dimensions.sugar * weights.sugar +
    dimensions.sodium * weights.sodium +
    dimensions.fat * weights.fat +
    dimensions.processing * weights.processing;

  const sugar = item.sugar_g ?? 0;
  const carbsPer100 = per100(item.carbs, grams);

  if (sugar >= 18 && item.fiber < 2 && item.protein < 3) {
    raw = Math.min(raw, lerp(sugar, [[18, 38], [30, 26], [45, 14]]));
  } else if (processed && !lean && fatCalShare >= 0.42 && carbsPer100 >= 22) {
    raw = Math.min(
      raw,
      46 - Math.max(0, fatCalShare - 0.38) * 30 - Math.max(0, item.minerals.sodium_mg - 200) * 0.025
    );
  }

  const finalScore = clamp(Math.round(raw), 0, 100);
  const factors = buildFactors(item, dimensions, { fruit, lean, processed, healthyFat });

  return { score: finalScore, label: labelFromScore(finalScore), factors };
}

/** Calorie-weighted health score for a meal or list of items. */
export function scoreFoodItems(items: DetectedFoodItem[]): FoodHealthResult {
  if (items.length === 0) {
    return { score: 50, label: "Moderate", factors: [] };
  }

  let totalCal = 0;
  let weighted = 0;
  const allFactors: HealthFactor[] = [];

  for (const item of items) {
    const result = scoreFoodItem(item);
    const weight = Math.max(item.calories, 1);
    totalCal += weight;
    weighted += result.score * weight;
    allFactors.push(...result.factors);
  }

  const score = clamp(Math.round(weighted / totalCal), 0, 100);
  const summary = [
    ...allFactors.filter((f) => f.impact === "good").slice(0, 2),
    ...allFactors.filter((f) => f.impact === "moderate").slice(0, 1),
    ...allFactors.filter((f) => f.impact === "bad").slice(0, 1),
  ].slice(0, 4);

  return {
    score,
    label: labelFromScore(score),
    factors: summary.length > 0 ? summary : [{ name: "Mixed meal balance", impact: "moderate" }],
  };
}

export function healthColor(score: number): string {
  if (score >= 67) return "#6bcb77";
  if (score >= 40) return "#ffd166";
  return "#ff6b6b";
}

/** @internal Sample foods for calibration — not used in production. */
export function __calibrateFoodHealth() {
  const base = {
    vitamins: { vitaminA_mcg: 0, vitaminC_mg: 0, vitaminD_IU: 0, vitaminB12_mcg: 0 },
    minerals: { iron_mg: 1, calcium_mg: 20, potassium_mg: 100, sodium_mg: 50, cholesterol_mg: 0 },
  };

  const samples: { name: string; expect: "green" | "yellow" | "red"; item: DetectedFoodItem }[] = [
    {
      name: "Boiled egg",
      expect: "green",
      item: { id: "1", name: "Boiled Egg", estimatedGrams: 50, calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3, fiber: 0, sugar_g: 0.2, ...base, minerals: { ...base.minerals, sodium_mg: 62, cholesterol_mg: 186 } },
    },
    {
      name: "Chicken breast",
      expect: "green",
      item: { id: "2", name: "Chicken", estimatedGrams: 150, calories: 248, protein: 46, carbs: 0, fat: 5.4, fiber: 0, sugar_g: 0, ...base, minerals: { ...base.minerals, sodium_mg: 120, cholesterol_mg: 130 } },
    },
    {
      name: "Apple",
      expect: "green",
      item: { id: "3", name: "Apple", estimatedGrams: 180, calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4, sugar_g: 19, ...base },
    },
    {
      name: "Dal",
      expect: "green",
      item: { id: "4", name: "Dal", estimatedGrams: 200, calories: 230, protein: 18, carbs: 32, fat: 4, fiber: 14, sugar_g: 2, ...base, minerals: { ...base.minerals, sodium_mg: 320 } },
    },
    {
      name: "Brown rice",
      expect: "green",
      item: { id: "5", name: "Brown rice", estimatedGrams: 150, calories: 165, protein: 4, carbs: 34, fat: 1.2, fiber: 2.5, sugar_g: 0, ...base },
    },
    {
      name: "Greek yogurt",
      expect: "green",
      item: { id: "6", name: "Yogurt", estimatedGrams: 150, calories: 130, protein: 15, carbs: 8, fat: 3, fiber: 0, sugar_g: 5, ...base },
    },
    {
      name: "Pizza slice",
      expect: "yellow",
      item: { id: "7", name: "Pizza", estimatedGrams: 120, calories: 285, protein: 12, carbs: 33, fat: 10, fiber: 2, sugar_g: 4, ...base, minerals: { ...base.minerals, sodium_mg: 640 } },
    },
    {
      name: "French fries",
      expect: "red",
      item: { id: "8", name: "Fries", estimatedGrams: 150, calories: 450, protein: 5, carbs: 58, fat: 22, fiber: 4, sugar_g: 0, ...base, minerals: { ...base.minerals, sodium_mg: 380 } },
    },
    {
      name: "Soda",
      expect: "red",
      item: { id: "9", name: "Soda", estimatedGrams: 330, calories: 140, protein: 0, carbs: 39, fat: 0, fiber: 0, sugar_g: 39, ...base, minerals: { ...base.minerals, sodium_mg: 45 } },
    },
    {
      name: "Samosa",
      expect: "red",
      item: { id: "10", name: "Samosa", estimatedGrams: 80, calories: 260, protein: 5, carbs: 28, fat: 17, fiber: 2, sugar_g: 1, ...base, minerals: { ...base.minerals, sodium_mg: 420 } },
    },
    {
      name: "Almonds",
      expect: "green",
      item: { id: "11", name: "Almonds", estimatedGrams: 30, calories: 174, protein: 6, carbs: 6, fat: 15, fiber: 3.5, sugar_g: 1, ...base },
    },
    {
      name: "White rice",
      expect: "yellow",
      item: { id: "12", name: "White rice", estimatedGrams: 150, calories: 195, protein: 4, carbs: 43, fat: 0.4, fiber: 0.6, sugar_g: 0, ...base },
    },
  ];

  return samples.map(({ name, expect, item }) => {
    const result = scoreFoodItem(item);
    const bucket = result.score >= 67 ? "green" : result.score >= 40 ? "yellow" : "red";
    return { name, expect, bucket, score: result.score, label: result.label, ok: bucket === expect || (expect === "yellow" && bucket === "green") };
  });
}
