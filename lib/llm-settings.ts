"use client";

import {
  DEFAULT_LLM_SETTINGS,
  type LlmProvider,
  type LlmSettings,
} from "./llm-types";

const KEY = "nutrivision:llm";
const UPDATE_EVENT = "nutrivision:update";

function isBrowser() {
  return typeof window !== "undefined";
}

function isProvider(value: unknown): value is LlmProvider {
  return value === "gemini" || value === "openai" || value === "anthropic";
}

export function getLlmSettings(): LlmSettings {
  if (!isBrowser()) return { ...DEFAULT_LLM_SETTINGS };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_LLM_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<LlmSettings>;
    return {
      provider: isProvider(parsed.provider) ? parsed.provider : DEFAULT_LLM_SETTINGS.provider,
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : "",
      model: typeof parsed.model === "string" ? parsed.model : "",
    };
  } catch {
    return { ...DEFAULT_LLM_SETTINGS };
  }
}

export function saveLlmSettings(settings: LlmSettings): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(
    KEY,
    JSON.stringify({
      provider: settings.provider,
      apiKey: settings.apiKey.trim(),
      model: settings.model.trim(),
    })
  );
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: { key: KEY } }));
}

export function clearLlmSettings(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: { key: KEY } }));
}

export function hasLlmApiKey(settings?: LlmSettings): boolean {
  const s = settings ?? getLlmSettings();
  return s.apiKey.trim().length > 0;
}

/** Headers to attach to every AI API fetch so the server can use the user's key. */
export function llmAuthHeaders(settings?: LlmSettings): Record<string, string> {
  const s = settings ?? getLlmSettings();
  const headers: Record<string, string> = {
    "x-llm-provider": s.provider,
  };
  const key = s.apiKey.trim();
  if (key) headers["x-llm-api-key"] = key;
  const model = s.model.trim();
  if (model) headers["x-llm-model"] = model;
  return headers;
}

/** Convenience wrapper: JSON POST with BYOK auth headers. */
export async function llmFetch(input: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }
  const auth = llmAuthHeaders();
  for (const [k, v] of Object.entries(auth)) {
    headers.set(k, v);
  }
  return fetch(input, { ...init, headers });
}
