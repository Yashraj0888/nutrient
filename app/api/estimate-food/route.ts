import { NextResponse } from "next/server";
import { z } from "zod";
import { estimateFoodByName } from "@/lib/gemini";
import { toPublicApiError } from "@/lib/api-errors";

export const runtime = "nodejs";

const requestSchema = z.object({
  name: z.string().min(1, "Food name is required"),
  grams: z.number().positive("Quantity must be greater than 0"),
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
    const item = await estimateFoodByName(parsed.data.name, parsed.data.grams);
    return NextResponse.json(item);
  } catch (error) {
    console.error("[estimate-food] failed", error);
    const { message, status } = toPublicApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
