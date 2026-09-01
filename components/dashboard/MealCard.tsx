"use client";

import { Trash2, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFoodName, sumFoodItems } from "@/lib/food-items";
import type { MealLogEntry } from "@/lib/types";

interface MealCardProps {
  entry: MealLogEntry;
  onRemove?: (id: string) => void;
}

export function MealCard({ entry, onRemove }: MealCardProps) {
  const totals = sumFoodItems(entry.items);
  const itemNames = entry.items.map((i) => formatFoodName(i)).join(", ");
  const time = new Date(entry.loggedAt).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="nv-card flex items-center gap-3.5 p-3.5">
      <div className="flex size-[3.25rem] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-nv-cream">
        {entry.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={entry.imageUrl} alt={entry.mealName} className="size-full object-cover" />
        ) : (
          <UtensilsCrossed className="size-5 text-muted-foreground" strokeWidth={1.75} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-[15px] font-semibold">{entry.mealName}</p>
          <span className="shrink-0 text-[11px] font-medium text-muted-foreground">{time}</span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{itemNames}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge>{Math.round(totals.calories)} kcal</Badge>
          <Badge color="protein">Protein {Math.round(totals.protein)}g</Badge>
          <Badge color="carbs">Carbs {Math.round(totals.carbs)}g</Badge>
          <Badge color="fiber">Fiber {Math.round(totals.fiber)}g</Badge>
        </div>
      </div>

      {onRemove && (
        <Button
          size="icon"
          variant="ghost"
          className="tap-target size-9 shrink-0 rounded-full text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(entry.id)}
          aria-label={`Remove ${entry.mealName}`}
        >
          <Trash2 className="size-4" strokeWidth={1.75} />
        </Button>
      )}
    </div>
  );
}

function Badge({
  children,
  color,
}: {
  children: React.ReactNode;
  color?: "protein" | "carbs" | "fiber";
}) {
  const colors = {
    protein: "bg-foreground/8 text-foreground",
    carbs: "bg-nv-teal/15 text-nv-teal",
    fiber: "bg-nv-fiber/15 text-nv-fiber",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        color ? colors[color] : "bg-muted text-muted-foreground"
      }`}
    >
      {children}
    </span>
  );
}
