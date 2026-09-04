/** Bring-your-own-key LLM configuration (client + server). */

export type LlmProvider = "gemini" | "openai" | "anthropic";

export interface LlmSettings {
  provider: LlmProvider;
  apiKey: string;
  /** Optional model override; empty = provider default */
  model: string;
}

/** Resolved credentials used by API routes for a single request. */
export interface LlmCredentials {
  provider: LlmProvider;
  apiKey: string;
  model: string;
}

export const LLM_PROVIDERS: {
  id: LlmProvider;
  label: string;
  description: string;
  keyPlaceholder: string;
  keyHelpUrl: string;
  defaultModel: string;
  modelHint: string;
}[] = [
  {
    id: "gemini",
    label: "Google Gemini",
    description: "Best for food photo analysis with structured nutrition output",
    keyPlaceholder: "AIza…",
    keyHelpUrl: "https://aistudio.google.com/apikey",
    defaultModel: "gemini-3.7-flash",
    modelHint: "e.g. gemini-3.7-flash, gemini-2.5-flash",
  },
  {
    id: "openai",
    label: "OpenAI",
    description: "GPT-4o vision for meal analysis and coaching",
    keyPlaceholder: "sk-…",
    keyHelpUrl: "https://platform.openai.com/api-keys",
    defaultModel: "gpt-4o",
    modelHint: "e.g. gpt-4o, gpt-4o-mini",
  },
  {
    id: "anthropic",
    label: "Anthropic Claude",
    description: "Claude vision models for analysis and coaching",
    keyPlaceholder: "sk-ant-…",
    keyHelpUrl: "https://console.anthropic.com/settings/keys",
    defaultModel: "claude-sonnet-4-20250514",
    modelHint: "e.g. claude-sonnet-4-20250514",
  },
];

export const DEFAULT_LLM_SETTINGS: LlmSettings = {
  provider: "gemini",
  apiKey: "",
  model: "",
};

export function getProviderMeta(provider: LlmProvider) {
  return LLM_PROVIDERS.find((p) => p.id === provider) ?? LLM_PROVIDERS[0];
}

export function resolveModel(provider: LlmProvider, model?: string): string {
  const trimmed = model?.trim();
  if (trimmed) return trimmed;
  return getProviderMeta(provider).defaultModel;
}
