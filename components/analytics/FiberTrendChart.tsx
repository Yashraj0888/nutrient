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

interface FiberTrendChartProps {
  data: DayIntakePoint[];
}

export function FiberTrendChart({ data }: FiberTrendChartProps) {
  const chartData = data.map((d) => ({
    label: formatChartDayLabel(d.date),
    fiber: Math.round(d.fiber),
    target: Math.round(d.fiberTarget),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
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
          formatter={(value, name) => [`${Math.round(Number(value))} g`, name === "target" ? "Target" : "Fiber"]}
        />
        <Line type="monotone" dataKey="fiber" name="Fiber" stroke="var(--nv-fiber)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--nv-fiber)" }} />
        <Line type="monotone" dataKey="target" name="Target" stroke="var(--muted-foreground)" strokeWidth={1.5} strokeDasharray="5 4" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
