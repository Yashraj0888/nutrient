"use client";

interface CalorieRingProps {
  consumed: number;
  target: number;
  centerValue?: "target" | "consumed";
}

const SIZE = 148;
const STROKE = 9;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CalorieRing({ consumed, target, centerValue = "target" }: CalorieRingProps) {
  const safeTarget = target > 0 ? target : 1;
  const ratio = Math.min(1, consumed / safeTarget);
  const dashOffset = CIRCUMFERENCE * (1 - ratio);
  const center = centerValue === "target" ? Math.round(target) : Math.round(consumed);

  return (
    <div className="relative flex shrink-0 items-center justify-center" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.65)"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center text-center">
        <span className="text-stat-lg">{center}</span>
        <span className="mt-0.5 text-[11px] font-semibold text-muted-foreground">kcal</span>
      </div>
    </div>
  );
}
