"use client";

import { useMemo, useState } from "react";
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
import { IconCheck, IconMinus, IconPlus, IconTrash } from "@/components/icons/nutrivision-icons";
import { NutrientIcon } from "@/components/icons/NutrientIcon";
import { FoodHealthRating } from "@/components/food/FoodHealthRating";
import { formatFoodName, scaleFoodItem, sumFoodItems } from "@/lib/food-items";
import { scoreFoodItems } from "@/lib/food-health";
import { removeMealEntry, updateMealEntry } from "@/lib/storage";
import type { DetectedFoodItem, MealLogEntry, MealType } from "@/lib/types";
import { MEAL_TYPES, MEAL_TYPE_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MealDetailSheetProps {
  open: boolean;
  entry: MealLogEntry | null;
  date: string;
  onClose: () => void;
}

export function MealDetailSheet({ open, entry, date, onClose }: MealDetailSheetProps) {
  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      {entry && (
        <MealDetailContent key={entry.id} entry={entry} date={date} onClose={onClose} />
      )}
    </Drawer>
  );
}

function MealDetailContent({
  entry,
  date,
  onClose,
}: {
  entry: MealLogEntry;
  date: string;
  onClose: () => void;
}) {
  const [mealName, setMealName] = useState(entry.mealName);
  const [mealType, setMealType] = useState<MealType>(entry.mealType);
  const [bases] = useState<Record<string, DetectedFoodItem>>(() =>
    Object.fromEntries(entry.items.map((item) => [item.id, item]))
  );
  const [gramsByItem, setGramsByItem] = useState<Record<string, number>>(() =>
    Object.fromEntries(entry.items.map((item) => [item.id, item.estimatedGrams]))
  );

  const items = useMemo(
    () =>
      Object.entries(bases).map(([id, base]) =>
        scaleFoodItem(base, gramsByItem[id] ?? base.estimatedGrams)
      ),
    [bases, gramsByItem]
  );

  const totals = sumFoodItems(items);
  const health = scoreFoodItems(items);

  function bumpGrams(id: string, delta: number) {
    setGramsByItem((prev) => {
      const current = prev[id] ?? bases[id]?.estimatedGrams ?? 0;
      return { ...prev, [id]: Math.max(1, current + delta) };
    });
  }

  function handleSave() {
    const name = mealName.trim() || entry.mealName;
    updateMealEntry(date, entry.id, {
      mealName: name,
      mealType,
      items,
    });
    toast.success("Meal updated");
    onClose();
  }

  function handleDelete() {
    removeMealEntry(date, entry.id);
    toast.info("Meal removed");
    onClose();
  }

  return (
    <DrawerContent className="mx-auto max-h-[92vh] max-w-lg pb-safe">
      <DrawerHeader className="text-left">
        <DrawerTitle>Meal details</DrawerTitle>
        <DrawerDescription>Edit meal type, portion weights, or remove this log.</DrawerDescription>
      </DrawerHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-2">
        {entry.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.imageUrl}
            alt={entry.mealName}
            className="h-48 w-full rounded-3xl object-cover shadow-[var(--nv-shadow)]"
          />
        ) : (
          <div className="flex h-28 items-center justify-center rounded-3xl bg-accent">
            <NutrientIcon type="meal" size={48} />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-semibold">Meal name</Label>
          <Input
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
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

        <div className="rounded-2xl border border-border/50 bg-card p-3">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-bold">{Math.round(totals.calories)} kcal</span>
            <FoodHealthRating rating={health} compact />
          </div>
          <p className="text-[11px] text-muted-foreground">
            P {Math.round(totals.protein)}g · C {Math.round(totals.carbs)}g · F{" "}
            {Math.round(totals.fat)}g
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-sm font-semibold">Items & weight</Label>
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-2xl border border-border/40 bg-secondary/40 px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{formatFoodName(item)}</p>
                <p className="text-[11px] text-muted-foreground">
                  {Math.round(item.calories)} kcal
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Decrease grams"
                  onClick={() => bumpGrams(item.id, -10)}
                  className="flex size-8 items-center justify-center rounded-full bg-white shadow-[var(--nv-shadow)]"
                >
                  <IconMinus size={14} />
                </button>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={gramsByItem[item.id] ?? item.estimatedGrams}
                  onChange={(e) => {
                    const next = parseFloat(e.target.value);
                    if (!Number.isFinite(next)) return;
                    setGramsByItem((prev) => ({
                      ...prev,
                      [item.id]: Math.max(1, next),
                    }));
                  }}
                  className="h-8 w-16 rounded-xl border border-border/50 bg-white px-2 text-center text-sm font-semibold"
                />
                <span className="text-xs font-medium text-muted-foreground">g</span>
                <button
                  type="button"
                  aria-label="Increase grams"
                  onClick={() => bumpGrams(item.id, 10)}
                  className="flex size-8 items-center justify-center rounded-full bg-white shadow-[var(--nv-shadow)]"
                >
                  <IconPlus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <DrawerFooter className="gap-2">
        <Button
          className="h-12 w-full rounded-full bg-nv-lime font-bold text-primary-foreground hover:bg-nv-lime/90"
          onClick={handleSave}
        >
          <IconCheck size={18} />
          Save changes
        </Button>
        <Button
          variant="ghost"
          className="h-11 w-full rounded-full text-muted-foreground"
          onClick={handleDelete}
        >
          <IconTrash size={16} />
          Delete meal
        </Button>
      </DrawerFooter>
    </DrawerContent>
  );
}
