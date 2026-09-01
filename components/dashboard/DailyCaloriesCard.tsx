"use client";

import { NutrientIcon } from "@/components/icons/NutrientIcon";
import { IconForkKnife } from "@/components/icons/nutrivision-icons";

interface DailyCaloriesCardProps {
  consumed: number;
  target: number;
}

export function DailyCaloriesCard({ consumed, target }: DailyCaloriesCardProps) {
  const safeTarget = target > 0 ? target : 1;
  const remaining = Math.max(0, Math.round(target - consumed));
  const ratio = Math.min(1, consumed / safeTarget);
  const size = 108;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - ratio);

  return (
    <div className="nv-card flex items-center gap-4 p-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef1f4" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--nv-lime)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <IconForkKnife size={18} className="mb-0.5 text-muted-foreground" />
          <span className="text-lg font-bold tabular-nums leading-none">{remaining}</span>
          <span className="text-[10px] font-semibold text-muted-foreground">Left</span>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
          <NutrientIcon type="calories" size={18} />
          Daily Calories
        </div>
        <p className="mt-1 text-[1.65rem] font-bold leading-tight tracking-tight tabular-nums">
          {Math.round(consumed).toLocaleString()}
          <span className="text-base font-semibold text-muted-foreground">
            {" "}/ {Math.round(target).toLocaleString()} kcal
          </span>
        </p>
      </div>
    </div>
  );
}
