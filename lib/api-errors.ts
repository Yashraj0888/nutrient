/** Map server/API failures to short, user-safe messages (never expose raw SDK JSON). */
export function toPublicApiError(error: unknown): { message: string; status: number } {
  const raw = error instanceof Error ? error.message : String(error);

  if (
    raw.includes("API_KEY_INVALID") ||
    raw.includes("API key not valid") ||
    raw.includes("GEMINI_API_KEY is not set") ||
    raw.includes("your_gemini_api_key_here")
  ) {
    return {
      message:
        "Gemini API key is missing or invalid. Add a valid GEMINI_API_KEY to .env.local and restart the dev server.",
      status: 503,
    };
  }

  if (raw.includes("404") || raw.includes("not found") || raw.includes("NOT_FOUND")) {
    return {
      message:
        "The configured Gemini model is unavailable. Try setting GEMINI_MODEL=gemini-3.7-flash in .env.local.",
      status: 502,
    };
  }

  if (raw.includes("429") || raw.includes("RESOURCE_EXHAUSTED") || raw.includes("quota")) {
    return {
      message: "Gemini rate limit reached. Please wait a moment and try again.",
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
