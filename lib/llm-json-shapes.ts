/** Shared JSON shape descriptions for providers without native schema APIs. */

export const FOOD_ITEM_JSON_SHAPE = `{
  "id": string,
  "name": string,
  "indianName": string,
  "estimatedGrams": number,
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "fiber": number,
  "sugar_g": number,
  "vitamins": {
    "vitaminA_mcg": number,
    "vitaminC_mg": number,
    "vitaminD_IU": number,
    "vitaminB12_mcg": number
  },
  "minerals": {
    "iron_mg": number,
    "calcium_mg": number,
    "potassium_mg": number,
    "sodium_mg": number,
    "cholesterol_mg": number
  }
}`;

export const FOOD_ANALYSIS_JSON_SHAPE = `{
  "mealName": string,
  "mealIndianName": string,
  "detectedItems": [${FOOD_ITEM_JSON_SHAPE}]
}`;

export const MICRONUTRIENT_PATCH_JSON_SHAPE = `{
  "sugar_g": number,
  "vitamins": {
    "vitaminA_mcg": number,
    "vitaminC_mg": number,
    "vitaminD_IU": number,
    "vitaminB12_mcg": number
  },
  "minerals": {
    "iron_mg": number,
    "calcium_mg": number,
    "potassium_mg": number,
    "sodium_mg": number,
    "cholesterol_mg": number
  }
}`;

export const INSIGHTS_JSON_SHAPE = `{
  "summary": string,
  "insights": [
    {
      "kind": "highlight" | "gap" | "info" | "warning",
      "nutrient"?: string,
      "message": string
    }
  ]
}`;

export function withJsonOnlyInstruction(prompt: string, shape: string): string {
  return `${prompt}

Return ONLY valid JSON matching this exact shape (no markdown fences, no commentary):
${shape}`;
}
