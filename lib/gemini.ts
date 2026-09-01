import { GoogleGenAI, Type, type Schema } from "@google/genai";
import type { DailyTotals, DetectedFoodItem, FoodAnalysisResult, NutrientTargets } from "./types";
import type { NutritionCoachContext } from "./nutrition-coach";
import { generateId } from "./storage";
import { hasSuspiciousMicronutrients, mergeMicronutrients } from "./nutrient-validation";

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.7-flash";
const ANALYSIS_TEMPERATURE = 0;
const REFINEMENT_TEMPERATURE = 0;

const PLACEHOLDER_KEYS = new Set(["your_gemini_api_key_here", ""]);

let client: GoogleGenAI | null = null;
let cachedKey: string | null = null;

function resolveApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || PLACEHOLDER_KEYS.has(apiKey)) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add your key to .env.local (not the placeholder) and restart the dev server."
    );
  }
  return apiKey;
}

export function getGeminiClient(): GoogleGenAI {
  const apiKey = resolveApiKey();
  if (client && cachedKey === apiKey) return client;
  client = new GoogleGenAI({ apiKey });
  cachedKey = apiKey;
  return client;
}

const vitaminsSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    vitaminA_mcg: { type: Type.NUMBER },
    vitaminC_mg: { type: Type.NUMBER },
    vitaminD_IU: { type: Type.NUMBER },
    vitaminB12_mcg: { type: Type.NUMBER },
  },
  required: ["vitaminA_mcg", "vitaminC_mg", "vitaminD_IU", "vitaminB12_mcg"],
};

const mineralsSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    iron_mg: { type: Type.NUMBER },
    calcium_mg: { type: Type.NUMBER },
    potassium_mg: { type: Type.NUMBER },
    sodium_mg: { type: Type.NUMBER },
    cholesterol_mg: { type: Type.NUMBER },
  },
  required: ["iron_mg", "calcium_mg", "potassium_mg", "sodium_mg", "cholesterol_mg"],
};

const micronutrientPatchSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    sugar_g: { type: Type.NUMBER },
    vitamins: vitaminsSchema,
    minerals: mineralsSchema,
  },
  required: ["sugar_g", "vitamins", "minerals"],
};

const detectedItemSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    name: { type: Type.STRING },
    indianName: { type: Type.STRING },
    estimatedGrams: { type: Type.NUMBER },
    calories: { type: Type.NUMBER },
    protein: { type: Type.NUMBER },
    carbs: { type: Type.NUMBER },
    fat: { type: Type.NUMBER },
    fiber: { type: Type.NUMBER },
    sugar_g: { type: Type.NUMBER },
    vitamins: vitaminsSchema,
    minerals: mineralsSchema,
  },
  required: [
    "id",
    "name",
    "indianName",
    "estimatedGrams",
    "calories",
    "protein",
    "carbs",
    "fat",
    "fiber",
    "sugar_g",
    "vitamins",
    "minerals",
  ],
};

export const foodAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    mealName: { type: Type.STRING },
    mealIndianName: { type: Type.STRING },
    detectedItems: {
      type: Type.ARRAY,
      items: detectedItemSchema,
    },
  },
  required: ["mealName", "mealIndianName", "detectedItems"],
};

export const singleFoodEstimateSchema: Schema = detectedItemSchema;

const MICRONUTRIENT_RULES = `
MICRONUTRIENT RULES (production accuracy — mandatory):
1. NEVER default cholesterol, sodium, vitamins, or minerals to 0 without a database lookup for the specific food and portion.
2. Zero is valid ONLY when USDA FoodData Central or NIN IFCT confirms the amount is truly negligible for that exact food (e.g. raw apple cholesterol ≈ 0).
3. For EVERY item, perform this internal workflow before returning numbers:
   a. Infer ingredients and cooking method from the image/name (broth, seasoning, oil, egg, meat, dairy, packet seasoning, etc.).
   b. Look up each component in USDA FoodData Central (primary) or NIN IFCT (Indian dishes).
   c. Scale each nutrient: nutrient_portion = (per_100g × estimated_grams) / 100.
   d. SUM across all components for the final vitamins, minerals, sugar_g, and cholesterol_mg.
4. Cholesterol (mg): required lookup — not optional. Animal-origin ingredients contain cholesterol: eggs (including in noodles, pasta, ramen, baked goods), meat, poultry, fish, shellfish, dairy, ghee, butter, shrimp, organ meats. Pure plant-only wheat/rice noodles may be ~0; egg noodles, instant noodles, restaurant stir-fried noodles, and meat-topped noodles are NOT zero — look up the matching database entry.
5. Sodium (mg): processed, packaged, instant, restaurant, soy sauce, seasoning cubes, brined, and fried foods are typically 200–2000+ mg per serving. Only fresh unseasoned produce is very low.
6. Vitamins: must reflect ingredients — B vitamins from grains/legumes/meat/eggs; vitamin C from vegetables/fruits; vitamin A from dairy, eggs, liver, orange vegetables; vitamin D from eggs, fish, fortified foods.
7. Iron, calcium, potassium: lookup from database per ingredient; do not leave all three at zero for calorie-dense cooked foods.
8. sugar_g: total sugars in the portion (not only added sugar).
9. Self-check before output: for any item ≥80 kcal, at least TWO of {sodium_mg, iron_mg, potassium_mg, calcium_mg} should be non-zero unless it is plain water/black coffee. If all micronutrients are zero, repeat the database lookup.
`;

const ACCURACY_RULES = `
MACRO & PORTION RULES (mandatory):
1. Look up each identified food in USDA FoodData Central (primary) and NIN Indian Food Composition Tables / IFCT for Indian dishes. Do NOT guess from memory.
2. All nutrient values must be for the EXACT portion weight in grams — never return per-100g values in response fields.
3. Calculation: identify database entry → get per-100g values → scale linearly to estimated_grams.
4. Composite dishes: decompose into components (base + oil + protein + sauce + garnish), estimate grams each, sum all nutrients.
5. Calorie validation: calories ≈ protein×4 + carbs×4 + fat×9 within ±8%. If not, recalculate calories from macros.
6. Rounding: calories whole numbers; macros/fiber/sugar 1 decimal; cholesterol whole mg; minerals/vitamins to sensible precision.
7. Portion estimation: use plate/bowl size, item count, thickness, packaging labels if visible. Use realistic gram ranges — never arbitrary round numbers.
8. Include ALL visible cooking fat, oil, ghee, cream, gravy, batter, seasoning, and broth in estimates.
9. When uncertain between two database entries, pick the one that matches cooking method (raw vs boiled vs fried vs instant/packaged).
`;

const FOOD_ANALYSIS_PROMPT = `You are a senior clinical nutritionist and expert food-image analyst building data for a production consumer nutrition app. Accuracy is critical — users rely on these numbers for health decisions.

Study the image deeply. Spend substantial reasoning on visual details BEFORE assigning any numbers. Do not rush.

## PHASE 1 — Deep visual inspection
- Image quality, angle, lighting, shadows
- Container type, volume, fill level (bowl depth, noodle pile height, sauce pool)
- Packaging or labels if visible (brand, "instant", flavor packet)
- Cooking method: boiled, stir-fried, deep-fried, steamed, instant/rehydrated, in broth
- Visible oil sheen, egg strands, meat pieces, shrimp, dairy, fried toppings, seasoning, sauce color/thickness
- Separate every distinct component (noodles vs broth vs egg vs meat vs vegetables vs oil)

## PHASE 2 — Ingredient & portion decomposition
For each distinct item:
- List probable ingredients (including hidden: seasoning packet, egg in dough, chicken stock, soy sauce, cooking oil)
- Estimate cooked weight in grams per component, then total estimated_grams for the logged item
- Count pieces if applicable (cakes of noodles, egg halves, shrimp count)

## PHASE 3 — Database-backed nutrient calculation
${ACCURACY_RULES}
${MICRONUTRIENT_RULES}

## PHASE 4 — Naming
- "name": precise English (include style if relevant: "Stir-Fried Egg Noodles", "Instant Masala Noodles")
- "indianName": Hindi/Indian romanized name when applicable
- "mealName" / "mealIndianName": overall meal description

## OUTPUT
- Unique ids: "item-1", "item-2", ...
- Return ONLY valid JSON matching the schema. No commentary.`;

const FOOD_ESTIMATE_PROMPT = `You are a senior clinical nutritionist with USDA FoodData Central and NIN IFCT access, producing data for a production consumer app.

Given food name and exact grams, return precise nutrients for that portion.

${ACCURACY_RULES}
${MICRONUTRIENT_RULES}

Naming:
- "name": English; "indianName": Indian name if applicable else repeat English
- If the name describes multiple components, compute combined nutrients for the full description at the given grams.

Return one food item JSON. id = "estimate-1". estimated_grams must match user input exactly.`;

const REFINE_MICRONUTRIENTS_PROMPT = `You are auditing micronutrient data for a production nutrition app. A prior estimate has implausible or missing micronutrients (often incorrectly all zeros).

Re-lookup ONLY micronutrients in USDA FoodData Central and NIN IFCT for the exact food, ingredients, and cooking method implied by the name and macros below. Do NOT change calories, protein, carbs, fat, fiber, or estimated_grams.

${MICRONUTRIENT_RULES}

Return corrected sugar_g, vitamins, and minerals for the EXACT portion.`;

function roundMicros(item: DetectedFoodItem): DetectedFoodItem {
  const v = item.vitamins;
  const m = item.minerals;
  return {
    ...item,
    sugar_g: Math.round((item.sugar_g ?? 0) * 10) / 10,
    vitamins: {
      vitaminA_mcg: Math.round(v.vitaminA_mcg * 10) / 10,
      vitaminC_mg: Math.round(v.vitaminC_mg * 10) / 10,
      vitaminD_IU: Math.round(v.vitaminD_IU),
      vitaminB12_mcg: Math.round(v.vitaminB12_mcg * 100) / 100,
    },
    minerals: {
      iron_mg: Math.round(m.iron_mg * 100) / 100,
      calcium_mg: Math.round(m.calcium_mg * 10) / 10,
      potassium_mg: Math.round(m.potassium_mg * 10) / 10,
      sodium_mg: Math.round(m.sodium_mg),
      cholesterol_mg: Math.round(m.cholesterol_mg ?? 0),
    },
  };
}

/** Reconcile calories with macro-derived energy. */
function normalizeFoodItem(item: DetectedFoodItem): DetectedFoodItem {
  const protein = Math.round(item.protein * 10) / 10;
  const carbs = Math.round(item.carbs * 10) / 10;
  const fat = Math.round(item.fat * 10) / 10;
  const fiber = Math.round(item.fiber * 10) / 10;
  const macroCalories = Math.round(protein * 4 + carbs * 4 + fat * 9);
  const calories =
    item.calories > 0 && Math.abs(item.calories - macroCalories) / item.calories <= 0.08
      ? Math.round(item.calories)
      : macroCalories;

  return roundMicros({
    ...item,
    estimatedGrams: Math.round(item.estimatedGrams),
    protein,
    carbs,
    fat,
    fiber,
    calories,
  });
}

async function refineMicronutrients(item: DetectedFoodItem): Promise<DetectedFoodItem> {
  const ai = getGeminiClient();

  const context = [
    `Food: ${item.name}${item.indianName ? ` (${item.indianName})` : ""}`,
    `Portion: ${item.estimatedGrams} g`,
    `Macros: ${item.calories} kcal | protein ${item.protein}g | carbs ${item.carbs}g | fat ${item.fat}g | fiber ${item.fiber}g`,
    `Current (suspect) micros: ${JSON.stringify({ sugar_g: item.sugar_g, vitamins: item.vitamins, minerals: item.minerals })}`,
  ].join("\n");

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: `${REFINE_MICRONUTRIENTS_PROMPT}\n\n${context}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: micronutrientPatchSchema,
      temperature: REFINEMENT_TEMPERATURE,
    },
  });

  const text = response.text;
  if (!text) return item;

  const patch = JSON.parse(text) as {
    sugar_g: number;
    vitamins: DetectedFoodItem["vitamins"];
    minerals: DetectedFoodItem["minerals"];
  };

  return normalizeFoodItem(mergeMicronutrients(item, patch));
}

async function ensureReliableMicronutrients(item: DetectedFoodItem): Promise<DetectedFoodItem> {
  const normalized = normalizeFoodItem(item);
  if (!hasSuspiciousMicronutrients(normalized)) return normalized;
  try {
    return await refineMicronutrients(normalized);
  } catch {
    return normalized;
  }
}

async function normalizeAnalysisResult(result: FoodAnalysisResult): Promise<FoodAnalysisResult> {
  const detectedItems = await Promise.all(result.detectedItems.map(ensureReliableMicronutrients));
  return { ...result, detectedItems };
}

export async function analyzeFoodImage(
  base64Image: string,
  mimeType: string
): Promise<FoodAnalysisResult> {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { text: FOOD_ANALYSIS_PROMPT },
          { inlineData: { data: base64Image, mimeType } },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: foodAnalysisSchema,
      temperature: ANALYSIS_TEMPERATURE,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response for the food image.");
  }

  const parsed = JSON.parse(text) as FoodAnalysisResult;
  return normalizeAnalysisResult(parsed);
}

export async function estimateFoodByName(
  name: string,
  grams: number
): Promise<DetectedFoodItem> {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: `Food: ${name.trim()}\nQuantity: ${grams} grams\n\n${FOOD_ESTIMATE_PROMPT}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: singleFoodEstimateSchema,
      temperature: ANALYSIS_TEMPERATURE,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response for the food estimate.");
  }

  const parsed = JSON.parse(text) as DetectedFoodItem;
  return ensureReliableMicronutrients(
    normalizeFoodItem({
      ...parsed,
      id: generateId("custom"),
      estimatedGrams: grams,
      name: parsed.name || name.trim(),
    })
  );
}

const insightSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    insights: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          kind: {
            type: Type.STRING,
            enum: ["highlight", "gap", "info", "warning"],
          },
          nutrient: { type: Type.STRING },
          message: { type: Type.STRING },
        },
        required: ["kind", "message"],
      },
    },
  },
  required: ["summary", "insights"],
};

export async function generateDailyInsights(
  context: NutritionCoachContext
): Promise<{ summary: string; insights: { kind: string; nutrient?: string; message: string }[] }> {
  const ai = getGeminiClient();

  const prompt = `You are a friendly registered-dietitian-style nutrition coach for the CalBro app.
The user is viewing their AI insights page. Produce a helpful snapshot of their day so far.

Date: ${context.localDateLabel} (${context.date})

User profile:
${JSON.stringify(context.profile ?? {}, null, 2)}

Meals logged today (with local timestamps and meal types — use these to answer lunch/dinner questions):
${JSON.stringify(context.meals, null, 2)}

Running daily totals so far:
${JSON.stringify(context.totals, null, 2)}

Daily targets:
${JSON.stringify(context.targets, null, 2)}

Write:
- One 2-3 sentence "summary" of how the day is going so far. Mention specific meals or times when useful.
- 3-6 "insights", each tagged as:
  - "highlight" for goals met or exceeded appropriately.
  - "gap" for meaningful shortfalls, with a concrete food suggestion.
  - "warning" for concerning excesses.
  - "info" for neutral observations.
Keep each insight message under 160 characters. Be specific with numbers and meal names where useful.`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: insightSchema,
      temperature: 0.4,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response for insights.");
  }

  return JSON.parse(text);
}

export interface CoachChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function answerNutritionQuestion(
  context: NutritionCoachContext,
  question: string,
  history: CoachChatMessage[] = []
): Promise<string> {
  const ai = getGeminiClient();

  const systemContext = `You are CalBro's AI nutrition coach. Answer using ONLY the user's logged data below.
If they ask what they ate for breakfast/lunch/dinner/snacks, use mealType, localTime, and items.
If data is missing, say so clearly and suggest logging meals.

Date: ${context.localDateLabel} (${context.date})

Profile: ${JSON.stringify(context.profile ?? {})}

Meals today:
${JSON.stringify(context.meals, null, 2)}

Daily totals: ${JSON.stringify(context.totals, null, 2)}
Daily targets: ${JSON.stringify(context.targets, null, 2)}

Keep answers concise (2-5 sentences), friendly, and actionable. Use kcal and grams.`;

  const contents = [
    { role: "user" as const, parts: [{ text: systemContext }] },
    { role: "model" as const, parts: [{ text: "Understood. I will answer based on the user's logged meals and nutrition data for today." }] },
    ...history.flatMap((msg) => [
      {
        role: (msg.role === "user" ? "user" : "model") as "user" | "model",
        parts: [{ text: msg.content }],
      },
    ]),
    { role: "user" as const, parts: [{ text: question }] },
  ];

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents,
    config: { temperature: 0.35 },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }
  return text;
}
