/** Map server/API failures to short, user-safe messages (never expose raw SDK JSON). */
export function toPublicApiError(error: unknown): { message: string; status: number } {
  const raw = error instanceof Error ? error.message : String(error);

  if (
    raw.includes("LLM_API_KEY_MISSING") ||
    raw.includes("API_KEY_INVALID") ||
    raw.includes("API key not valid") ||
    raw.includes("Incorrect API key") ||
    raw.includes("invalid_api_key") ||
    raw.includes("authentication_error") ||
    raw.includes("invalid x-api-key")
  ) {
    return {
      message:
        "AI API key is missing or invalid. Open Account → AI provider, paste your key, and save.",
      status: 503,
    };
  }

  if (
    raw.includes("404") ||
    raw.includes("not found") ||
    raw.includes("NOT_FOUND") ||
    raw.includes("model_not_found") ||
    raw.includes("does not exist")
  ) {
    return {
      message:
        "The selected AI model is unavailable. Try the default model or another model id in Account → AI provider.",
      status: 502,
    };
  }

  if (
    raw.includes("429") ||
    raw.includes("RESOURCE_EXHAUSTED") ||
    raw.includes("quota") ||
    raw.includes("rate_limit")
  ) {
    return {
      message: "AI rate limit reached. Please wait a moment and try again.",
      status: 429,
    };
  }

  if (raw.includes("No food items were detected")) {
    return { message: raw, status: 422 };
  }

  return {
    message: "Could not analyze this image right now. Please try again or add items manually.",
    status: 500,
  };
}
