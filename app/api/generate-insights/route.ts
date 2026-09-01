import { NextResponse } from "next/server";
import { z } from "zod";
import { generateDailyInsights } from "@/lib/gemini";
import { toPublicApiError } from "@/lib/api-errors";

export const runtime = "nodejs";

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

const requestSchema = z.object({
  totals: macroSchema.extend({ micros: microSchema }),
  targets: macroSchema.extend({
    micros: microSchema,
    bmr: z.number(),
    tdee: z.number(),
  }),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  try {
    const result = await generateDailyInsights(parsed.data.totals, parsed.data.targets);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[generate-insights] failed", error);
    const { message, status } = toPublicApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
