"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DayIntakePoint } from "@/lib/types";
import { formatDateLabel } from "@/lib/storage";

interface MacroBalanceChartProps {
  data: DayIntakePoint[];
}

export function MacroBalanceChart({ data }: MacroBalanceChartProps) {
  const chartData = data.map((d) => ({
    label: formatDateLabel(d.date).slice(0, 6),
    Protein: Math.round(d.protein),
    Carbs: Math.round(d.carbs),
    Fat: Math.round(d.fat),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={40} />
        <Tooltip
          contentStyle={{
            borderRadius: 16,
            border: "1px solid var(--border)",
            background: "var(--popover)",
            color: "var(--popover-foreground)",
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Protein" stackId="macro" fill="var(--nv-lime)" radius={[0, 0, 0, 0]} maxBarSize={28} />
        <Bar dataKey="Carbs" stackId="macro" fill="var(--nv-carbs)" maxBarSize={28} />
        <Bar dataKey="Fat" stackId="macro" fill="var(--nv-fat)" radius={[8, 8, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
