"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DayIntakePoint } from "@/lib/types";
import { formatChartDayLabel } from "@/lib/storage";

interface MacroTrendChartProps {
  data: DayIntakePoint[];
}

export function MacroTrendChart({ data }: MacroTrendChartProps) {
  const chartData = data.map((d) => ({
    label: formatChartDayLabel(d.date),
    Protein: Math.round(d.protein),
    Carbs: Math.round(d.carbs),
    Fat: Math.round(d.fat),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
        <YAxis
          width={44}
          tickMargin={4}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 16,
            border: "1px solid var(--border)",
            background: "var(--popover)",
            fontSize: 12,
          }}
          formatter={(value) => [`${Math.round(Number(value))} g`]}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="Protein" stroke="var(--nv-protein)" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="Carbs" stroke="var(--nv-carbs)" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="Fat" stroke="var(--nv-fat)" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
