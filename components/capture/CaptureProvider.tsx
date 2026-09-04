"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { CaptureContext } from "./capture-context";
import { ImageUploader } from "./ImageUploader";
import { CameraModal } from "./CameraModal";
import { ManualFoodSheet } from "./ManualFoodSheet";
import { FoodConfirmationSheet } from "./FoodConfirmationSheet";
import type { CapturedImage } from "@/lib/image-utils";
import type { FoodAnalysisResult, MealType } from "@/lib/types";
import { addMealEntry, generateId, todayKey } from "@/lib/storage";
import { hasLlmApiKey, llmFetch } from "@/lib/llm-settings";
import { useApiKeyGate } from "@/components/ai/ApiKeyGate";
import type { OpenLogOptions } from "./capture-context";

type Stage = "closed" | "choose" | "camera" | "manual" | "analyzing" | "confirm";

export function CaptureProvider({ children }: { children: React.ReactNode }) {
  const { requestApiKey } = useApiKeyGate();
  const [stage, setStage] = useState<Stage>("closed");
  const [logDate, setLogDate] = useState(() => todayKey());
  const [capturedImage, setCapturedImage] = useState<CapturedImage | null>(null);
  const [analysis, setAnalysis] = useState<FoodAnalysisResult | null>(null);

  const requireKey = useCallback(() => {
    if (hasLlmApiKey()) return true;
    toast.error("Add your AI API key to scan or log meals.");
    requestApiKey();
    return false;
  }, [requestApiKey]);

  const openCapture = useCallback(
    (opts?: OpenLogOptions) => {
      if (!requireKey()) return;
      setLogDate(opts?.date ?? todayKey());
      setStage("camera");
    },
    [requireKey]
  );

  const openManual = useCallback(
    (opts?: OpenLogOptions) => {
      if (!requireKey()) return;
      setLogDate(opts?.date ?? todayKey());
      setStage("manual");
    },
    [requireKey]
  );

  const closeAll = useCallback(() => {
    setStage("closed");
    setCapturedImage(null);
    setAnalysis(null);
  }, []);

  async function analyzeImage(image: CapturedImage) {
    if (!requireKey()) {
      setStage("closed");
      return;
    }
    setCapturedImage(image);
    setStage("analyzing");
    try {
      const res = await llmFetch("/api/analyze-food", {
        method: "POST",
        body: JSON.stringify({ image: image.base64, mimeType: image.mimeType }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Could not analyze this image. Please try again."
        );
      }
      const result = data as FoodAnalysisResult;
      if (!result.detectedItems || result.detectedItems.length === 0) {
        throw new Error("No food items were detected. Try a clearer photo, or add items manually.");
      }
      setAnalysis(result);
      setStage("confirm");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not analyze this image. Please try again.";
      toast.error(message, { duration: 5000 });
      setStage("camera");
    }
  }

  function handleConfirm(payload: {
    mealName: string;
    mealType: MealType;
    items: FoodAnalysisResult["detectedItems"];
  }) {
    addMealEntry({
      id: generateId("meal"),
      date: logDate,
      mealType: payload.mealType,
      loggedAt: new Date().toISOString(),
      imageUrl: capturedImage?.previewUrl,
      mealName: payload.mealName,
      items: payload.items,
    });
    toast.success(`Logged ${payload.mealName}`);
    closeAll();
  }

  return (
    <CaptureContext.Provider value={{ openCapture, openManual }}>
      {children}

      <ImageUploader
        open={stage === "choose"}
        onClose={closeAll}
        onOpenCamera={() => setStage("camera")}
        onImageSelected={(image) => void analyzeImage(image)}
      />

      <CameraModal
        open={stage === "camera"}
        onClose={closeAll}
        onCapture={(image) => void analyzeImage(image)}
        onGallery={() => setStage("choose")}
      />

      <ManualFoodSheet open={stage === "manual"} onClose={closeAll} date={logDate} />

      {stage === "analyzing" && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/95 backdrop-blur-sm">
          {capturedImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={capturedImage.previewUrl}
              alt="Analyzing meal"
              className="size-40 rounded-3xl object-cover shadow-lg ring-1 ring-border animate-pulse"
            />
          )}
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <span className="size-2 animate-ping rounded-full bg-nv-lime" />
            Analyzing your meal…
          </div>
        </div>
      )}

      <FoodConfirmationSheet
        open={stage === "confirm" && analysis !== null}
        previewUrl={capturedImage?.previewUrl ?? null}
        analysis={analysis}
        onClose={closeAll}
        onConfirm={handleConfirm}
      />
    </CaptureContext.Provider>
  );
}
