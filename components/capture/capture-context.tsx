"use client";

import { createContext, useContext } from "react";

export interface OpenLogOptions {
  /** Date key (YYYY-MM-DD) to log into. Defaults to today. */
  date?: string;
}

interface CaptureContextValue {
  /** Opens the camera directly */
  openCapture: (opts?: OpenLogOptions) => void;
  /** Opens manual name + grams logger */
  openManual: (opts?: OpenLogOptions) => void;
}

export const CaptureContext = createContext<CaptureContextValue | null>(null);

export function useCaptureFlow(): CaptureContextValue {
  const ctx = useContext(CaptureContext);
  if (!ctx) {
    throw new Error("useCaptureFlow must be used within <CaptureProvider>");
  }
  return ctx;
}
