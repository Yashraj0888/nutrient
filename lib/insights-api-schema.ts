import { z } from "zod";

const macroSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  fiber: z.number(),
  sugar_g: z.number().optional().default(0),
  cholesterol_mg: z.number().optional().default(0),
});

const microSchema = z.object({
  vitaminA_mcg: z.number(),
  vitaminC_mg: z.number(),
  vitaminD_IU: z.number(),
  vitaminB12_mcg: z.number(),
  iron_mg: z.number(),
  calcium_mg: z.number(),
  potassium_mg: z.number(),
  sodium_mg: z.number(),
});

const coachMealItemSchema = z.object({
  name: z.string(),
  indianName: z.string().optional(),
  grams: z.number(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  fiber: z.number(),
});

const coachMealSchema = z.object({
  mealType: z.string(),
  mealName: z.string(),
  loggedAt: z.string(),
  localTime: z.string(),
  items: z.array(coachMealItemSchema),
  totals: macroSchema.pick({ calories: true, protein: true, carbs: true, fat: true, fiber: true }),
});

const profileSchema = z.object({
  name: z.string(),
  age: z.number(),
  gender: z.string(),
  goal: z.string(),
  activityLevel: z.string(),
  weightKg: z.number(),
  heightCm: z.number(),
});

export const nutritionCoachContextSchema = z.object({
  date: z.string(),
  localDateLabel: z.string(),
  totals: macroSchema.extend({ micros: microSchema }),
  targets: macroSchema.extend({
    micros: microSchema,
    bmr: z.number(),
    tdee: z.number(),
  }),
  profile: profileSchema.optional(),
  meals: z.array(coachMealSchema),
});

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

export const insightsChatRequestSchema = z.object({
  question: z.string().min(1).max(1000),
  history: z.array(chatMessageSchema).max(20).optional().default([]),
  context: nutritionCoachContextSchema,
});
