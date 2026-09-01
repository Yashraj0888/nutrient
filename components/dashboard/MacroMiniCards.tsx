"use client";

import { NutrientIcon } from "@/components/icons/NutrientIcon";

interface MacroMiniCardsProps {
  carbs: { value: number; target: number };
  fats: { value: number; target: number };
  protein: { value: number; target: number };
}

export function MacroMiniCards({ carbs, fats, protein }: MacroMiniCardsProps) {
  const items = [
    { label: "Carbs", value: carbs, icon: "carbs" as const, bar: "bg-nv-carbs" },
    { label: "Fats", value: fats, icon: "fat" as const, bar: "bg-nv-fat" },
    { label: "Protein", value: protein, icon: "protein" as const, bar: "bg-nv-protein" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {items.map(({ label, value, icon, bar }) => {
        const pct = value.target > 0 ? Math.min(100, (value.value / value.target) * 100) : 0;
        return (
          <div key={label} className="nv-card flex flex-col items-center px-2 py-3.5">
            <NutrientIcon type={icon} size={32} />
            <span className="mt-2 text-[11px] font-semibold text-muted-foreground">{label}</span>
            <span className="mt-0.5 text-center text-[13px] font-bold tabular-nums leading-tight">
              {Math.round(value.value)}
              <span className="font-medium text-muted-foreground"> / {Math.round(value.target)} g</span>
            </span>
            <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-muted">
              <div className={`h-full rounded-full transition-all duration-500 ${bar}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
