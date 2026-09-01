"use client";

import { CalorieRing } from "./CalorieRing";
import { cn } from "@/lib/utils";

interface NutritionSummaryCardProps {
  consumed: number;
  target: number;
  protein: { value: number; target: number };
  carbs: { value: number; target: number };
  fiber: { value: number; target: number };
}

export function NutritionSummaryCard({
  consumed,
  target,
  protein,
  carbs,
  fiber,
}: NutritionSummaryCardProps) {
  const remaining = Math.max(0, Math.round(target - consumed));

  return (
    <div className="nv-card-mint px-4 py-5 sm:px-5 sm:py-6">
      <div className="flex items-center justify-between gap-1">
        <StatBlock label="Consumed" value={Math.round(consumed)} align="left" />
        <CalorieRing consumed={consumed} target={target} centerValue="target" />
        <StatBlock label="Remaining" value={remaining} align="right" />
      </div>

      <div className="mt-5 flex flex-col gap-2.5">
        <MacroRow label="Protein" value={protein.value} target={protein.target} color="bg-foreground" />
        <MacroRow label="Carbs" value={carbs.value} target={carbs.target} color="bg-nv-teal" />
        <MacroRow label="Fiber" value={fiber.value} target={fiber.target} color="bg-nv-fiber" />
      </div>
    </div>
  );
}

function StatBlock({
  label,
  value,
  align,
}: {
  label: string;
  value: number;
  align: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "flex min-w-[4.5rem] flex-col",
        align === "right" ? "items-end text-right" : "items-start"
      )}
    >
      <span className="text-stat leading-tight">
        {value}
        <span className="ml-0.5 text-[10px] font-semibold text-muted-foreground">kcal</span>
      </span>
      <span className="mt-1 text-[11px] font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

function MacroRow({
  label,
  value,
  target,
  color,
}: {
  label: string;
  value: number;
  target: number;
  color: string;
}) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-16 shrink-0 text-[10px] font-semibold text-foreground/70">{label}</span>
      <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/60">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-14 shrink-0 text-right text-[10px] font-semibold tabular-nums text-muted-foreground">
        {Math.round(value)}g
      </span>
    </div>
  );
}
