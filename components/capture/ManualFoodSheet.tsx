"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconCheck } from "@/components/icons/nutrivision-icons";
import { guessMealTypeByTime } from "@/lib/food-items";
import { hasLlmApiKey, llmFetch } from "@/lib/llm-settings";
import { useApiKeyGate } from "@/components/ai/ApiKeyGate";
import { addMealEntry, generateId, todayKey } from "@/lib/storage";
import type { DetectedFoodItem, MealType } from "@/lib/types";
import { MEAL_TYPES, MEAL_TYPE_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ManualFoodSheetProps {
  open: boolean;
  onClose: () => void;
  /** Defaults to today */
  date?: string;
}

export function ManualFoodSheet({ open, onClose, date }: ManualFoodSheetProps) {
  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      {open && <ManualFoodContent key="manual" date={date} onClose={onClose} />}
    </Drawer>
  );
}

function ManualFoodContent({
  date,
  onClose,
}: {
  date?: string;
  onClose: () => void;
}) {
  const { requestApiKey } = useApiKeyGate();
  const [name, setName] = useState("");
  const [grams, setGrams] = useState("100");
  const [mealType, setMealType] = useState<MealType>(() => guessMealTypeByTime());
  const [estimating, setEstimating] = useState(false);

  async function handleSave() {
    const trimmed = name.trim();
    const gramsNum = parseFloat(grams);
    if (!trimmed) {
      toast.error("Enter a food name.");
      return;
    }
    if (!gramsNum || gramsNum <= 0) {
      toast.error("Enter a weight in grams.");
      return;
    }
    if (!hasLlmApiKey()) {
      toast.error("Add your AI API key to estimate foods.");
      requestApiKey();
      return;
    }

    setEstimating(true);
    try {
      const res = await llmFetch("/api/estimate-food", {
        method: "POST",
        body: JSON.stringify({ name: trimmed, grams: gramsNum }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Could not estimate this food."
        );
      }
      const item = data as DetectedFoodItem;
      const logDate = date ?? todayKey();
      addMealEntry({
        id: generateId("meal"),
        date: logDate,
        mealType,
        loggedAt: new Date().toISOString(),
        mealName: item.name || trimmed,
        items: [item],
      });
      toast.success(`Logged ${item.name || trimmed}`);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not log this food.");
    } finally {
      setEstimating(false);
    }
  }

  return (
    <DrawerContent className="mx-auto max-w-lg pb-safe">
      <DrawerHeader>
        <DrawerTitle>Add food manually</DrawerTitle>
        <DrawerDescription>
          Type the food name and portion weight. AI estimates the nutrients.
        </DrawerDescription>
      </DrawerHeader>

      <div className="flex flex-col gap-4 px-4 pb-2">
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-semibold">Food name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Masala dosa, grilled chicken"
            className="h-11 rounded-2xl border border-border/50 bg-white px-4 shadow-[var(--nv-shadow)]"
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-semibold">Weight (grams)</Label>
          <Input
            type="number"
            inputMode="decimal"
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
            placeholder="100"
            className="h-11 rounded-2xl border border-border/50 bg-white px-4 shadow-[var(--nv-shadow)]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-semibold">Meal type</Label>
          <div className="flex flex-wrap gap-2">
            {MEAL_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setMealType(type)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-bold transition",
                  mealType === type
                    ? "bg-nv-lime text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {MEAL_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <DrawerFooter>
        <Button
          className="h-12 w-full rounded-full bg-nv-lime font-bold text-primary-foreground hover:bg-nv-lime/90"
          disabled={estimating}
          onClick={() => void handleSave()}
        >
          <IconCheck size={18} />
          {estimating ? "Estimating…" : "Log food"}
        </Button>
      </DrawerFooter>
    </DrawerContent>
  );
}
