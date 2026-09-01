"use client";

import { useProfile } from "@/hooks/use-profile";

function bmiCategory(bmi: number) {
  if (bmi < 18.5) return { label: "Underweight", color: "#60a5fa" };
  if (bmi < 25) return { label: "Normal", color: "#6bcb77" };
  if (bmi < 30) return { label: "Overweight", color: "#ffd166" };
  return { label: "Obese", color: "#ff6b6b" };
}

export function BMICard() {
  const { profile } = useProfile();
  if (!profile) return null;

  const bmi = profile.weightKg / (profile.heightCm / 100) ** 2;
  const category = bmiCategory(bmi);
  const pointer = Math.min(100, Math.max(0, ((bmi - 15) / 20) * 100));

  return (
    <div className="nv-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold">BMI</h2>
        <span
          className="rounded-full px-2.5 py-1 text-[10px] font-bold"
          style={{ background: `${category.color}22`, color: category.color }}
        >
          {category.label}
        </span>
      </div>
      <p className="text-2xl font-bold tabular-nums">
        {bmi.toFixed(0)} <span className="text-sm font-semibold text-muted-foreground">Current BMI</span>
      </p>
      <div className="relative mt-4 h-2.5 overflow-hidden rounded-full">
        <div className="absolute inset-0 flex">
          <span className="flex-1 bg-blue-400" />
          <span className="flex-1 bg-[#6bcb77]" />
          <span className="flex-1 bg-[#ffd166]" />
          <span className="flex-1 bg-[#ff6b6b]" />
        </div>
        <span
          className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-foreground shadow"
          style={{ left: `${pointer}%` }}
        />
      </div>
    </div>
  );
}
