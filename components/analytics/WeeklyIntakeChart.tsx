"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DayIntakePoint } from "@/lib/types";
import { formatDateLabel } from "@/lib/storage";

interface WeeklyIntakeChartProps {
  data: DayIntakePoint[];
}

export function WeeklyIntakeChart({ data }: WeeklyIntakeChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatDateLabel(d.date).replace("Today", "Today").slice(0, 6),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
        />
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
        <Bar dataKey="calories" name="Consumed" radius={[8, 8, 8, 8]} fill="var(--nv-lime)" maxBarSize={28} />
        <Line
          type="monotone"
          dataKey="target"
          name="Target"
          stroke="var(--nv-fat)"
          strokeDasharray="6 4"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
