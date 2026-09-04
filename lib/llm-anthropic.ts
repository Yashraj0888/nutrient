import type { DetectedFoodItem, FoodAnalysisResult } from "./types";
import type { NutritionCoachContext } from "./nutrition-coach";
import type { LlmCredentials } from "./llm-types";
import type { CoachChatMessage } from "./gemini";
import {
  FOOD_ANALYSIS_PROMPT,
  FOOD_ESTIMATE_PROMPT,
  REFINE_MICRONUTRIENTS_PROMPT,
  buildCoachSystemContext,
  buildDailyInsightsPrompt,
  ensureReliableMicronutrients,
  normalizeFoodItem,
} from "./gemini";
import {
  FOOD_ANALYSIS_JSON_SHAPE,
  FOOD_ITEM_JSON_SHAPE,
  INSIGHTS_JSON_SHAPE,
  MICRONUTRIENT_PATCH_JSON_SHAPE,
  withJsonOnlyInstruction,
} from "./llm-json-shapes";
import { generateId } from "./storage";
import { mergeMicronutrients } from "./nutrient-validation";

type AnthropicContent =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: { type: "base64"; media_type: string; data: string };
    };

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

async function anthropicMessages(
  credentials: LlmCredentials,
  messages: { role: "user" | "assistant"; content: string | AnthropicContent[] }[],
  options?: { system?: string; temperature?: number; maxTokens?: number }
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": credentials.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: credentials.model,
      max_tokens: options?.maxTokens ?? 4096,
      temperature: options?.temperature ?? 0,
      system: options?.system,
      messages,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    error?: { message?: string };
    content?: { type: string; text?: string }[];
  };

  if (!res.ok) {
    throw new Error(data.error?.message || `Anthropic request failed (${res.status})`);
  }

  const text = data.content?.find((c) => c.type === "text")?.text?.trim();
  if (!text) throw new Error("Anthropic returned an empty response.");
  return text;
}

async function refineMicronutrients(
  item: DetectedFoodItem,
  credentials: LlmCredentials
): Promise<DetectedFoodItem> {
  const context = [
    `Food: ${item.name}${item.indianName ? ` (${item.indianName})` : ""}`,
    `Portion: ${item.estimatedGrams} g`,
    `Macros: ${item.calories} kcal | protein ${item.protein}g | carbs ${item.carbs}g | fat ${item.fat}g | fiber ${item.fiber}g`,
    `Current (suspect) micros: ${JSON.stringify({ sugar_g: item.sugar_g, vitamins: item.vitamins, minerals: item.minerals })}`,
  ].join("\n");

  const text = await anthropicMessages(credentials, [
    {
      role: "user",
      content: withJsonOnlyInstruction(
        `${REFINE_MICRONUTRIENTS_PROMPT}\n\n${context}`,
        MICRONUTRIENT_PATCH_JSON_SHAPE
      ),
    },
  ]);

  const patch = JSON.parse(stripCodeFences(text)) as {
    sugar_g: number;
    vitamins: DetectedFoodItem["vitamins"];
    minerals: DetectedFoodItem["minerals"];
  };
  return normalizeFoodItem(mergeMicronutrients(item, patch));
}

export async function analyzeFoodImageAnthropic(
  base64Image: string,
  mimeType: string,
  credentials: LlmCredentials
): Promise<FoodAnalysisResult> {
  const text = await anthropicMessages(credentials, [
    {
      role: "user",
      content: [
        {
          type: "image",
          source: { type: "base64", media_type: mimeType, data: base64Image },
        },
        {
          type: "text",
          text: withJsonOnlyInstruction(FOOD_ANALYSIS_PROMPT, FOOD_ANALYSIS_JSON_SHAPE),
        },
      ],
    },
  ]);

  const parsed = JSON.parse(stripCodeFences(text)) as FoodAnalysisResult;
  const detectedItems = await Promise.all(
    (parsed.detectedItems ?? []).map((item) =>
      ensureReliableMicronutrients(item, (n) => refineMicronutrients(n, credentials))
    )
  );
  return { ...parsed, detectedItems };
}

export async function estimateFoodByNameAnthropic(
  name: string,
  grams: number,
  credentials: LlmCredentials
): Promise<DetectedFoodItem> {
  const text = await anthropicMessages(credentials, [
    {
      role: "user",
      content: withJsonOnlyInstruction(
        `Food: ${name.trim()}\nQuantity: ${grams} grams\n\n${FOOD_ESTIMATE_PROMPT}`,
        FOOD_ITEM_JSON_SHAPE
      ),
    },
  ]);

  const parsed = JSON.parse(stripCodeFences(text)) as DetectedFoodItem;
  return ensureReliableMicronutrients(
    normalizeFoodItem({
      ...parsed,
      id: generateId("custom"),
      estimatedGrams: grams,
      name: parsed.name || name.trim(),
    }),
    (n) => refineMicronutrients(n, credentials)
  );
}

export async function generateDailyInsightsAnthropic(
  context: NutritionCoachContext,
  credentials: LlmCredentials
): Promise<{ summary: string; insights: { kind: string; nutrient?: string; message: string }[] }> {
  const text = await anthropicMessages(
    credentials,
    [
      {
        role: "user",
        content: withJsonOnlyInstruction(buildDailyInsightsPrompt(context), INSIGHTS_JSON_SHAPE),
      },
    ],
    { temperature: 0.4 }
  );
  return JSON.parse(stripCodeFences(text));
}

export async function answerNutritionQuestionAnthropic(
  context: NutritionCoachContext,
  question: string,
  history: CoachChatMessage[],
  credentials: LlmCredentials
): Promise<string> {
  const messages: { role: "user" | "assistant"; content: string }[] = [
    ...history.map((m) => ({
      role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: question },
  ];

  return anthropicMessages(credentials, messages, {
    system: buildCoachSystemContext(context),
    temperature: 0.35,
    maxTokens: 1024,
  });
}
