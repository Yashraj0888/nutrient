import {
  getProviderMeta,
  resolveModel,
  type LlmCredentials,
  type LlmProvider,
} from "./llm-types";

const PLACEHOLDER_KEYS = new Set([
  "",
  "your_gemini_api_key_here",
  "your_openai_api_key_here",
  "your_anthropic_api_key_here",
]);

function isProvider(value: string | null): value is LlmProvider {
  return value === "gemini" || value === "openai" || value === "anthropic";
}

/**
 * Resolve BYOK credentials from request headers only.
 * No server/env API keys — the user must configure a key in Account.
 */
export function resolveLlmCredentials(request: Request): LlmCredentials {
  const headerProvider = request.headers.get("x-llm-provider");
  const headerKey = request.headers.get("x-llm-api-key")?.trim() ?? "";
  const headerModel = request.headers.get("x-llm-model")?.trim() ?? "";

  const provider: LlmProvider = isProvider(headerProvider) ? headerProvider : "gemini";

  if (!headerKey || PLACEHOLDER_KEYS.has(headerKey)) {
    const meta = getProviderMeta(provider);
    throw new Error(
      `LLM_API_KEY_MISSING: Add your ${meta.label} API key in Account → AI provider before using AI features.`
    );
  }

  return {
    provider,
    apiKey: headerKey,
    model: resolveModel(provider, headerModel || undefined),
  };
}
