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

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

async function openAiChatJson(
  credentials: LlmCredentials,
  messages: { role: "system" | "user" | "assistant"; content: unknown }[],
  temperature = 0
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${credentials.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: credentials.model,
      temperature,
      response_format: { type: "json_object" },
      messages,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    error?: { message?: string };
    choices?: { message?: { content?: string } }[];
  };

  if (!res.ok) {
    throw new Error(data.error?.message || `OpenAI request failed (${res.status})`);
  }

  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("OpenAI returned an empty response.");
  return stripCodeFences(text);
}

async function openAiChatText(
  credentials: LlmCredentials,
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  temperature = 0.35
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${credentials.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: credentials.model,
      temperature,
      messages,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    error?: { message?: string };
    choices?: { message?: { content?: string } }[];
  };

  if (!res.ok) {
    throw new Error(data.error?.message || `OpenAI request failed (${res.status})`);
  }

  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("OpenAI returned an empty response.");
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

  const text = await openAiChatJson(credentials, [
    {
      role: "user",
      content: withJsonOnlyInstruction(
        `${REFINE_MICRONUTRIENTS_PROMPT}\n\n${context}`,
        MICRONUTRIENT_PATCH_JSON_SHAPE
      ),
    },
  ]);

  const patch = JSON.parse(text) as {
    sugar_g: number;
    vitamins: DetectedFoodItem["vitamins"];
    minerals: DetectedFoodItem["minerals"];
  };
  return normalizeFoodItem(mergeMicronutrients(item, patch));
}

export async function analyzeFoodImageOpenAI(
  base64Image: string,
  mimeType: string,
  credentials: LlmCredentials
): Promise<FoodAnalysisResult> {
  const text = await openAiChatJson(credentials, [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: withJsonOnlyInstruction(FOOD_ANALYSIS_PROMPT, FOOD_ANALYSIS_JSON_SHAPE),
        },
        {
          type: "image_url",
          image_url: { url: `data:${mimeType};base64,${base64Image}` },
        },
      ],
    },
  ]);

  const parsed = JSON.parse(text) as FoodAnalysisResult;
  const detectedItems = await Promise.all(
    (parsed.detectedItems ?? []).map((item) =>
      ensureReliableMicronutrients(item, (n) => refineMicronutrients(n, credentials))
    )
  );
  return { ...parsed, detectedItems };
}

export async function estimateFoodByNameOpenAI(
  name: string,
  grams: number,
  credentials: LlmCredentials
): Promise<DetectedFoodItem> {
  const text = await openAiChatJson(credentials, [
    {
      role: "user",
      content: withJsonOnlyInstruction(
        `Food: ${name.trim()}\nQuantity: ${grams} grams\n\n${FOOD_ESTIMATE_PROMPT}`,
        FOOD_ITEM_JSON_SHAPE
      ),
    },
  ]);

  const parsed = JSON.parse(text) as DetectedFoodItem;
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

export async function generateDailyInsightsOpenAI(
  context: NutritionCoachContext,
  credentials: LlmCredentials
): Promise<{ summary: string; insights: { kind: string; nutrient?: string; message: string }[] }> {
  const text = await openAiChatJson(
    credentials,
    [
      {
        role: "user",
        content: withJsonOnlyInstruction(buildDailyInsightsPrompt(context), INSIGHTS_JSON_SHAPE),
      },
    ],
    0.4
  );
  return JSON.parse(text);
}

export async function answerNutritionQuestionOpenAI(
  context: NutritionCoachContext,
  question: string,
  history: CoachChatMessage[],
  credentials: LlmCredentials
): Promise<string> {
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: buildCoachSystemContext(context) },
    ...history.map((m) => ({
      role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: question },
  ];
  return openAiChatText(credentials, messages);
}
