"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DayIntakePoint } from "@/lib/types";
import { formatChartDayLabel } from "@/lib/storage";

interface CalorieTrendChartProps {
  data: DayIntakePoint[];
}

export function CalorieTrendChart({ data }: CalorieTrendChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatChartDayLabel(d.date),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
        <YAxis
          width={48}
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
          formatter={(value, name) => [`${Math.round(Number(value))} kcal`, name === "target" ? "Target" : "Consumed"]}
        />
        <Line type="monotone" dataKey="calories" name="Consumed" stroke="var(--nv-lime)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--nv-lime)" }} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="target" name="Target" stroke="var(--nv-carbs)" strokeWidth={2} strokeDasharray="6 4" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
