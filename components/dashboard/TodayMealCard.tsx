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
  onRemove?: (id: string) => void;
}

export function TodayMealCard({ entry, onRemove }: TodayMealCardProps) {
  const totals = sumFoodItems(entry.items);
  const target = Math.max(totals.calories, Math.round(totals.calories * 1.02));
  const completed = totals.calories >= target * 0.9;
  const health = useMemo(() => scoreFoodItems(entry.items), [entry.items]);

  return (
    <div className="nv-card overflow-hidden p-0">
      <div className="flex items-start gap-3 p-4">
        <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-accent">
          {entry.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={entry.imageUrl} alt="" className="size-full object-cover" />
          ) : (
            <NutrientIcon type="meal" size={28} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-bold">{MEAL_TYPE_LABELS[entry.mealType]}</p>
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
        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(entry.id)}
            className="text-xs font-semibold text-muted-foreground"
            aria-label="Remove meal"
          >
            ×
          </button>
        )}
      </div>

      <div className="border-t border-border/60 px-4 py-3">
        <FoodHealthRating rating={health} compact />
      </div>

      <div className="border-t border-border/60 px-4 py-2">
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
      </div>
    </div>
  );
}
