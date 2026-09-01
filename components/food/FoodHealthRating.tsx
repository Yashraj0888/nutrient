"use client";

import { healthColor, type FoodHealthResult } from "@/lib/food-health";
import { cn } from "@/lib/utils";

interface FoodHealthRatingProps {
  rating: FoodHealthResult;
  compact?: boolean;
  className?: string;
}

export function FoodHealthRating({ rating, compact = false, className }: FoodHealthRatingProps) {
  const color = healthColor(rating.score);

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-muted-foreground">Nutrition rating</span>
        <span className="text-xs font-bold" style={{ color }}>
          {rating.label}
        </span>
      </div>

      <div className="relative h-2.5 overflow-hidden rounded-full">
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(90deg, #ff6b6b 0%, #ff9f43 25%, #ffd166 50%, #a8e063 75%, #6bcb77 100%)",
          }}
        />
        <span
          className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
          style={{ left: `${rating.score}%`, backgroundColor: color }}
        />
      </div>

      {!compact && rating.factors.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {rating.factors.map((factor) => (
            <li
              key={`${factor.name}-${factor.impact}`}
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                factor.impact === "good" && "bg-[#6bcb77]/20 text-[#3d7a45]",
                factor.impact === "moderate" && "bg-[#ffd166]/25 text-[#9a6b00]",
                factor.impact === "bad" && "bg-[#ff6b6b]/20 text-[#b33a3a]"
              )}
            >
              {factor.name}
              {factor.detail ? ` · ${factor.detail}` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
