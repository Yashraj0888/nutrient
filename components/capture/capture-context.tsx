"use client";

import { createContext, useContext } from "react";

interface CaptureContextValue {
  openCapture: () => void;
}

export const CaptureContext = createContext<CaptureContextValue | null>(null);

export function useCaptureFlow(): CaptureContextValue {
  const ctx = useContext(CaptureContext);
  if (!ctx) {
    throw new Error("useCaptureFlow must be used within <CaptureProvider>");
  }
  return ctx;
}
