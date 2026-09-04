import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeFoodImage } from "@/lib/llm";
import { resolveLlmCredentials } from "@/lib/llm-credentials";
import { toPublicApiError } from "@/lib/api-errors";

export const runtime = "nodejs";

const requestSchema = z.object({
  image: z.string().min(1, "image is required"),
  mimeType: z.string().min(1).default("image/jpeg"),
});

function stripDataUrlPrefix(value: string): string {
  const commaIndex = value.indexOf(",");
  if (value.startsWith("data:") && commaIndex !== -1) {
    return value.slice(commaIndex + 1);
  }
  return value;
}

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
    const credentials = resolveLlmCredentials(request);
    const base64 = stripDataUrlPrefix(parsed.data.image);
    const result = await analyzeFoodImage(base64, parsed.data.mimeType, credentials);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[analyze-food] failed", error);
    const { message, status } = toPublicApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
