"use client";

import { useMemo, useState } from "react";
import { IconCheck, IconMinus, IconPlus, IconTrash } from "@/components/icons/nutrivision-icons";
import { NutrientIcon } from "@/components/icons/NutrientIcon";
import { FoodHealthRating } from "@/components/food/FoodHealthRating";
import { scoreFoodItem, scoreFoodItems } from "@/lib/food-health";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatFoodName, formatMealName, guessMealTypeByTime, scaleFoodItem, sumFoodItems } from "@/lib/food-items";
import type { DetectedFoodItem, FoodAnalysisResult, MealType } from "@/lib/types";
import { MEAL_TYPES, MEAL_TYPE_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DraftItem {
  original: DetectedFoodItem;
  checked: boolean;
}

interface FoodConfirmationSheetProps {
  open: boolean;
  previewUrl: string | null;
  analysis: FoodAnalysisResult | null;
  onClose: () => void;
  onConfirm: (payload: { mealName: string; mealType: MealType; items: DetectedFoodItem[] }) => void;
}

export function FoodConfirmationSheet({
  open,
  previewUrl,
  analysis,
  onClose,
  onConfirm,
}: FoodConfirmationSheetProps) {
  const sheetKey = analysis
    ? `${analysis.mealName}-${analysis.detectedItems.map((i) => i.id).join(",")}`
    : "empty";

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      {analysis && (
        <FoodConfirmationContent
          key={sheetKey}
          previewUrl={previewUrl}
          analysis={analysis}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      )}
    </Drawer>
  );
}

function buildInitialState(analysis: FoodAnalysisResult) {
  const drafts: Record<string, DraftItem> = {};
  const gramsByItem: Record<string, number> = {};
  for (const item of analysis.detectedItems) {
    drafts[item.id] = { original: item, checked: true };
    gramsByItem[item.id] = item.estimatedGrams;
  }
  return {
    mealName: formatMealName(analysis),
    mealType: guessMealTypeByTime(),
    drafts,
    gramsByItem,
  };
}

function FoodConfirmationContent({
  previewUrl,
  analysis,
  onConfirm,
}: {
  previewUrl: string | null;
  analysis: FoodAnalysisResult;
  onClose: () => void;
  onConfirm: (payload: { mealName: string; mealType: MealType; items: DetectedFoodItem[] }) => void;
}) {
  const initial = buildInitialState(analysis);
  const [mealName, setMealName] = useState(initial.mealName);
  const [mealType, setMealType] = useState<MealType>(initial.mealType);
  const [drafts, setDrafts] = useState(initial.drafts);
  const [gramsByItem, setGramsByItem] = useState(initial.gramsByItem);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customEstimating, setCustomEstimating] = useState(false);
  const [customForm, setCustomForm] = useState({
    name: "",
    grams: "100",
  });

  const scaledItems = useMemo(() => {
    return Object.entries(drafts).map(([id, draft]) => ({
      id,
      checked: draft.checked,
      item: scaleFoodItem(draft.original, gramsByItem[id] ?? draft.original.estimatedGrams),
    }));
  }, [drafts, gramsByItem]);

  const checkedItems = scaledItems.filter((d) => d.checked).map((d) => d.item);
  const totals = sumFoodItems(checkedItems);
  const checkedCount = checkedItems.length;
  const mealHealth = scoreFoodItems(checkedItems);
  const showPerItemRatings = scaledItems.length > 1;

  function toggleChecked(id: string) {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], checked: !prev[id].checked },
    }));
  }

  function adjustGrams(id: string, delta: number) {
    setGramsByItem((prev) => {
      const current = prev[id] ?? 0;
      const next = Math.max(0, Math.round(current + delta));
      return { ...prev, [id]: next };
    });
  }

  function removeItem(id: string) {
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  async function handleAddCustom() {
    const grams = parseFloat(customForm.grams) || 0;
    if (!customForm.name.trim() || grams <= 0) return;

    setCustomEstimating(true);
    try {
      const res = await fetch("/api/estimate-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: customForm.name.trim(), grams }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Could not estimate nutrients for this food."
        );
      }
      const item = data as DetectedFoodItem;
      setDrafts((prev) => ({ ...prev, [item.id]: { original: item, checked: true } }));
      setGramsByItem((prev) => ({ ...prev, [item.id]: grams }));
      setCustomForm({ name: "", grams: "100" });
      setShowAddCustom(false);
      toast.success(`Added ${formatFoodName(item)}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not estimate nutrients. Please try again.";
      toast.error(message);
    } finally {
      setCustomEstimating(false);
    }
  }

  function handleConfirm() {
    if (checkedItems.length === 0) return;
    onConfirm({ mealName: mealName.trim() || "Meal", mealType, items: checkedItems });
  }

  return (
    <DrawerContent className="mx-auto flex max-h-[92dvh] max-w-lg flex-col pb-safe">
        <DrawerHeader className="pb-2">
          <div className="flex items-center gap-3">
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Captured meal"
                className="size-14 shrink-0 rounded-xl object-cover ring-1 ring-border"
              />
            )}
            <div className="flex-1 text-left">
              <Input
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                placeholder="Meal name"
                className="h-9 border-none px-0 text-base font-semibold shadow-none focus-visible:ring-0"
              />
              <DrawerDescription className="text-left">
                Review the detected items, adjust portions, then confirm.
              </DrawerDescription>
            </div>
          </div>
          <DrawerTitle className="sr-only">Confirm food log</DrawerTitle>

          <div className="flex gap-1.5 overflow-x-auto pt-2 no-scrollbar">
            {MEAL_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setMealType(type)}
                className={cn(
                  "tap-target shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition",
                  mealType === type
                    ? "border-nv-lime bg-nv-lime text-primary-foreground"
                    : "border-border bg-card text-muted-foreground"
                )}
              >
                {MEAL_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4">
          <div className="flex flex-col gap-2 pb-3">
            {scaledItems.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No items yet — add one manually below.
              </p>
            )}
            {scaledItems.map(({ id, checked, item }) => {
              const itemHealth = showPerItemRatings ? scoreFoodItem(item) : null;
              return (
              <div
                key={id}
                className={cn(
                  "flex flex-col gap-2 rounded-2xl border border-border bg-card p-3 transition",
                  !checked && "opacity-50"
                )}
              >
                <div className="flex items-center gap-3">
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggleChecked(id)}
                  className="tap-target size-6 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{formatFoodName(item)}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-medium">
                      <NutrientIcon type="calories" size={12} />
                      {item.calories} kcal
                    </span>
                    <span className="rounded-full bg-nv-protein/15 px-2 py-0.5 font-medium text-nv-protein">
                      Protein {item.protein}g
                    </span>
                    <span className="rounded-full bg-nv-carbs/15 px-2 py-0.5 font-medium text-nv-carbs">
                      Carbs {item.carbs}g
                    </span>
                    <span className="rounded-full bg-nv-lime/15 px-2 py-0.5 font-medium text-nv-lime-dark">
                      Fiber {item.fiber}g
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="tap-target size-8 rounded-full"
                    onClick={() => adjustGrams(id, -10)}
                    aria-label={`Decrease ${item.name} portion`}
                  >
                    <IconMinus size={14} />
                  </Button>
                  <span className="w-12 text-center text-sm font-medium tabular-nums">
                    {item.estimatedGrams}g
                  </span>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="tap-target size-8 rounded-full"
                    onClick={() => adjustGrams(id, 10)}
                    aria-label={`Increase ${item.name} portion`}
                  >
                    <IconPlus size={14} />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="tap-target size-8 rounded-full text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(id)}
                    aria-label={`Remove ${item.name}`}
                  >
                    <IconTrash size={14} />
                  </Button>
                </div>
                </div>
                {itemHealth && <FoodHealthRating rating={itemHealth} compact />}
              </div>
            );
            })}

            {!showAddCustom ? (
              <button
                type="button"
                onClick={() => setShowAddCustom(true)}
                className="tap-target mt-1 rounded-2xl border border-dashed border-border py-3 text-sm font-medium text-muted-foreground transition active:bg-muted"
              >
                + Add a custom item
              </button>
            ) : (
              <div className="mt-1 flex flex-col gap-3 rounded-2xl border border-border bg-card p-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[12px] font-semibold text-muted-foreground">Food name</Label>
                  <Input
                    placeholder="e.g. 2 egg whites and 1 whole egg"
                    value={customForm.name}
                    onChange={(e) => setCustomForm((f) => ({ ...f, name: e.target.value }))}
                    className="h-11 rounded-xl border-0 bg-secondary"
                    disabled={customEstimating}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[12px] font-semibold text-muted-foreground">Quantity (grams)</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="100"
                    value={customForm.grams}
                    onChange={(e) => setCustomForm((f) => ({ ...f, grams: e.target.value }))}
                    className="h-11 rounded-xl border-0 bg-secondary"
                    disabled={customEstimating}
                  />
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Nutrients are estimated automatically by AI from the name and quantity.
                </p>
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    className="flex-1 h-10 rounded-xl"
                    onClick={() => setShowAddCustom(false)}
                    disabled={customEstimating}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 h-10 rounded-xl"
                    onClick={() => void handleAddCustom()}
                    disabled={customEstimating || !customForm.name.trim()}
                  >
                    {customEstimating ? (
                      <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <IconCheck size={16} />
                    )}
                    {customEstimating ? "Estimating…" : "Add item"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DrawerFooter className="gap-3 border-t bg-muted/40 pt-3">
          <FoodHealthRating rating={mealHealth} />
          <div className="grid grid-cols-4 gap-2 text-center">
            <TotalStat label="kcal" value={Math.round(totals.calories)} color="text-foreground" />
            <TotalStat label="Protein" value={`${Math.round(totals.protein)}g`} color="text-nv-protein" />
            <TotalStat label="Carbs" value={`${Math.round(totals.carbs)}g`} color="text-nv-carbs" />
            <TotalStat label="Fat" value={`${Math.round(totals.fat)}g`} color="text-nv-fat" />
          </div>
          <Button
            size="lg"
            className="h-12 w-full rounded-full bg-nv-lime text-base font-bold text-primary-foreground hover:bg-nv-lime/90"
            disabled={checkedCount === 0}
            onClick={handleConfirm}
          >
            Confirm &amp; Log to Day ({checkedCount})
          </Button>
        </DrawerFooter>
    </DrawerContent>
  );
}

function TotalStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex flex-col">
      <span className={cn("text-lg font-bold tabular-nums", color)}>{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}
