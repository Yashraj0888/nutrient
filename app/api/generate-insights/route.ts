import { NextResponse } from "next/server";
import { generateDailyInsights } from "@/lib/llm";
import { resolveLlmCredentials } from "@/lib/llm-credentials";
import { toPublicApiError } from "@/lib/api-errors";
import { nutritionCoachContextSchema } from "@/lib/insights-api-schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = nutritionCoachContextSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  try {
    const credentials = resolveLlmCredentials(request);
    const result = await generateDailyInsights(parsed.data, credentials);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[generate-insights] failed", error);
    const { message, status } = toPublicApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
