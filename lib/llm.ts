import type { DetectedFoodItem, FoodAnalysisResult } from "./types";
import type { NutritionCoachContext } from "./nutrition-coach";
import type { LlmCredentials } from "./llm-types";
import {
  analyzeFoodImage as analyzeFoodImageGemini,
  answerNutritionQuestion as answerNutritionQuestionGemini,
  estimateFoodByName as estimateFoodByNameGemini,
  generateDailyInsights as generateDailyInsightsGemini,
  type CoachChatMessage,
} from "./gemini";
import {
  analyzeFoodImageOpenAI,
  answerNutritionQuestionOpenAI,
  estimateFoodByNameOpenAI,
  generateDailyInsightsOpenAI,
} from "./llm-openai";
import {
  analyzeFoodImageAnthropic,
  answerNutritionQuestionAnthropic,
  estimateFoodByNameAnthropic,
  generateDailyInsightsAnthropic,
} from "./llm-anthropic";

export type { CoachChatMessage };

export async function analyzeFoodImage(
  base64Image: string,
  mimeType: string,
  credentials: LlmCredentials
): Promise<FoodAnalysisResult> {
  if (credentials.provider === "openai") {
    return analyzeFoodImageOpenAI(base64Image, mimeType, credentials);
  }
  if (credentials.provider === "anthropic") {
    return analyzeFoodImageAnthropic(base64Image, mimeType, credentials);
  }
  return analyzeFoodImageGemini(base64Image, mimeType, credentials);
}

export async function estimateFoodByName(
  name: string,
  grams: number,
  credentials: LlmCredentials
): Promise<DetectedFoodItem> {
  if (credentials.provider === "openai") {
    return estimateFoodByNameOpenAI(name, grams, credentials);
  }
  if (credentials.provider === "anthropic") {
    return estimateFoodByNameAnthropic(name, grams, credentials);
  }
  return estimateFoodByNameGemini(name, grams, credentials);
}

export async function generateDailyInsights(
  context: NutritionCoachContext,
  credentials: LlmCredentials
): Promise<{ summary: string; insights: { kind: string; nutrient?: string; message: string }[] }> {
  if (credentials.provider === "openai") {
    return generateDailyInsightsOpenAI(context, credentials);
  }
  if (credentials.provider === "anthropic") {
    return generateDailyInsightsAnthropic(context, credentials);
  }
  return generateDailyInsightsGemini(context, credentials);
}

export async function answerNutritionQuestion(
  context: NutritionCoachContext,
  question: string,
  history: CoachChatMessage[],
  credentials: LlmCredentials
): Promise<string> {
  if (credentials.provider === "openai") {
    return answerNutritionQuestionOpenAI(context, question, history, credentials);
  }
  if (credentials.provider === "anthropic") {
    return answerNutritionQuestionAnthropic(context, question, history, credentials);
  }
  return answerNutritionQuestionGemini(context, question, history, credentials);
}
