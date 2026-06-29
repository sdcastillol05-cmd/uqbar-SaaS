"use client";

import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fmtCOP } from "@/lib/format";

interface CashFlowChartProps {
  data: { day: string; ingresos: number; egresos: number }[];
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl border bg-popover px-3 py-2.5 shadow-lg text-sm">
      <p className="text-display text-xs text-accent-foreground mb-1.5 capitalize">
        {label}
      </p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-popover-foreground">
          <span
            className="inline-block w-2 h-2 rounded-sm"
            style={{ backgroundColor: p.color }}
          />
          {p.name === "ingresos" ? "Ingresos" : "Egresos"}: {fmtCOP(p.value)}
        </p>
      ))}
    </div>
  );
}

function yTickFormatter(value: number) {
  if (value === 0) return "0";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return String(value);
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  return (
    <ResponsiveContainer width="100%" height={190}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-5)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--chart-5)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          vertical={false}
          stroke="var(--border)"
          strokeOpacity={0.6}
        />
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 10, fontWeight: 600 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
          tickFormatter={yTickFormatter}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="ingresos"
          stroke="var(--chart-5)"
          strokeWidth={2.5}
          fill="url(#incomeGradient)"
          dot={{ r: 3, fill: "var(--chart-5)", strokeWidth: 2, stroke: "var(--card)" }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="egresos"
          stroke="var(--chart-2)"
          strokeWidth={2}
          strokeDasharray="5 4"
          dot={{ r: 2.5, fill: "var(--chart-2)", strokeWidth: 1.5, stroke: "var(--card)" }}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
