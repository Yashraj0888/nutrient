"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { CaptureContext } from "./capture-context";
import { ImageUploader } from "./ImageUploader";
import { CameraModal } from "./CameraModal";
import { FoodConfirmationSheet } from "./FoodConfirmationSheet";
import type { CapturedImage } from "@/lib/image-utils";
import type { FoodAnalysisResult, MealType } from "@/lib/types";
import { addMealEntry, generateId, todayKey } from "@/lib/storage";

type Stage = "closed" | "choose" | "camera" | "analyzing" | "confirm";

export function CaptureProvider({ children }: { children: React.ReactNode }) {
  const [stage, setStage] = useState<Stage>("closed");
  const [capturedImage, setCapturedImage] = useState<CapturedImage | null>(null);
  const [analysis, setAnalysis] = useState<FoodAnalysisResult | null>(null);

  const openCapture = useCallback(() => {
    setStage("camera");
  }, []);

  const closeAll = useCallback(() => {
    setStage("closed");
    setCapturedImage(null);
    setAnalysis(null);
  }, []);

  async function analyzeImage(image: CapturedImage) {
    setCapturedImage(image);
    setStage("analyzing");
    try {
      const res = await fetch("/api/analyze-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      date: todayKey(),
      mealType: payload.mealType,
      loggedAt: new Date().toISOString(),
      imageUrl: capturedImage?.previewUrl,
      mealName: payload.mealName,
      items: payload.items,
    });
    toast.success(`Logged ${payload.mealName} to today's diary`);
    closeAll();
  }

  return (
    <CaptureContext.Provider value={{ openCapture }}>
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
