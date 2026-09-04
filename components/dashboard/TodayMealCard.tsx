"use client";

import { useMemo } from "react";
import { NutrientIcon } from "@/components/icons/NutrientIcon";
import { FoodHealthRating } from "@/components/food/FoodHealthRating";
import { formatFoodName, sumFoodItems } from "@/lib/food-items";
import { scoreFoodItems } from "@/lib/food-health";
import type { MealLogEntry } from "@/lib/types";
import { MEAL_TYPE_LABELS } from "@/lib/types";

interface TodayMealCardProps {
  entry: MealLogEntry;
  onOpen?: (entry: MealLogEntry) => void;
  onRemove?: (id: string) => void;
}

export function TodayMealCard({ entry, onOpen, onRemove }: TodayMealCardProps) {
  const totals = sumFoodItems(entry.items);
  const target = Math.max(totals.calories, Math.round(totals.calories * 1.02));
  const completed = totals.calories >= target * 0.9;
  const health = useMemo(() => scoreFoodItems(entry.items), [entry.items]);

  return (
    <div className="nv-card overflow-hidden p-0">
      <div className="flex items-start gap-2 p-4">
        <button
          type="button"
          onClick={() => onOpen?.(entry)}
          className="flex min-w-0 flex-1 items-start gap-3 text-left transition active:opacity-80"
        >
          <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-accent ring-1 ring-border/40">
            {entry.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={entry.imageUrl} alt={entry.mealName} className="size-full object-cover" />
            ) : (
              <NutrientIcon type="meal" size={28} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold">{MEAL_TYPE_LABELS[entry.mealType]}</p>
                <p className="truncate text-sm text-muted-foreground">{entry.mealName}</p>
                <p className="text-sm text-muted-foreground">
                  {Math.round(totals.calories)} / {target} kcal
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                  completed ? "badge-completed" : "badge-progress"
                }`}
              >
                {completed ? "Completed" : "On Progress"}
              </span>
            </div>
          </div>
        </button>
        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(entry.id)}
            className="mt-0.5 shrink-0 px-1 text-base font-semibold leading-none text-muted-foreground"
            aria-label="Remove meal"
          >
            ×
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => onOpen?.(entry)}
        className="w-full border-t border-border/60 px-4 py-3 text-left transition active:bg-secondary/40"
      >
        <FoodHealthRating rating={health} compact />
      </button>

      <button
        type="button"
        onClick={() => onOpen?.(entry)}
        className="w-full border-t border-border/60 px-4 py-2 text-left transition active:bg-secondary/40"
      >
        {entry.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-2 py-2 text-sm">
            <span className="truncate text-muted-foreground">
              {formatFoodName(item)} | {item.estimatedGrams}g
            </span>
            <span className="flex shrink-0 items-center gap-1 font-semibold tabular-nums">
              <NutrientIcon type="calories" size={14} />
              {Math.round(item.calories)}
            </span>
          </div>
        ))}
        <p className="pb-1 pt-1 text-[11px] font-semibold text-nv-lime-dark">Tap to view or edit</p>
      </button>
    </div>
  );
}
