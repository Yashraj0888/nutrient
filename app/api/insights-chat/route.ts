import { NextResponse } from "next/server";
import { answerNutritionQuestion } from "@/lib/llm";
import { resolveLlmCredentials } from "@/lib/llm-credentials";
import { toPublicApiError } from "@/lib/api-errors";
import { insightsChatRequestSchema } from "@/lib/insights-api-schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = insightsChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  try {
    const credentials = resolveLlmCredentials(request);
    const answer = await answerNutritionQuestion(
      parsed.data.context,
      parsed.data.question,
      parsed.data.history,
      credentials
    );
    return NextResponse.json({ answer });
  } catch (error) {
    console.error("[insights-chat] failed", error);
    const { message, status } = toPublicApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
