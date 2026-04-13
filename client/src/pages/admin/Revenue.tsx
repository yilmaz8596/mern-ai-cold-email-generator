import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type MonthlyPoint = {
  month: string;
  revenue: number;
  count: number;
  credits: number;
};

type PlanPoint = {
  plan: string;
  revenue: number;
  count: number;
};

type RevenueData = {
  monthly: MonthlyPoint[];
  byPlan: PlanPoint[];
  totals: { revenue: number; transactions: number; avgOrder: number };
};

const PLAN_COLORS: Record<string, string> = {
  starter: "#6366f1",
  pro: "#8b5cf6",
};
function planColor(plan: string, i: number) {
  return PLAN_COLORS[plan.toLowerCase()] ?? ["#06b6d4", "#f59e0b", "#10b981"][i % 3];
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

const tooltipStyle = {
  contentStyle: {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 0,
    fontSize: 12,
  },
  itemStyle: { color: "hsl(var(--foreground))" },
  labelStyle: { color: "hsl(var(--muted-foreground))", marginBottom: 4 },
};

export default function AdminRevenue() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/revenue", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Failed to load revenue data.
      </div>
    );
  }

  const { monthly, byPlan, totals } = data;
  const hasData = monthly.length > 0 || byPlan.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 md:p-8"
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Revenue
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          All-time billing and payment analytics
        </p>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Total Revenue"
          value={`$${totals.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        />
        <KpiCard
          label="Total Transactions"
          value={totals.transactions.toLocaleString()}
        />
        <KpiCard
          label="Avg Order Value"
          value={`$${totals.avgOrder.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        />
      </div>

      {!hasData ? (
        <div className="flex h-48 items-center justify-center border border-border text-sm text-muted-foreground">
          No transaction data yet.
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Monthly Revenue Area Chart */}
          {monthly.length > 0 && (
            <div className="border border-border bg-card p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Monthly Revenue
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={monthly} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `$${v}`}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    width={52}
                  />
                  <Tooltip
                    formatter={(v) => [`$${Number(v ?? 0).toFixed(2)}`, "Revenue"]}
                    {...tooltipStyle}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#revenueGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: "#6366f1" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Monthly Transactions Bar Chart */}
          {monthly.length > 0 && (
            <div className="border border-border bg-card p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Transactions per Month
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthly} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip
                    formatter={(v) => [Number(v ?? 0), "Transactions"]}
                    {...tooltipStyle}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[2, 2, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Revenue by Plan Bar Chart */}
          {byPlan.length > 0 && (
            <div className="border border-border bg-card p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Revenue by Plan
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byPlan} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="plan"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
                  />
                  <YAxis
                    tickFormatter={(v) => `$${v}`}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    width={52}
                  />
                  <Tooltip
                    formatter={(v, _name, entry) => {
                      const count = (entry as { payload?: { count?: number } })?.payload?.count ?? 0;
                      return [`$${Number(v ?? 0).toFixed(2)} (${count} orders)`, "Revenue"];
                    }}
                    {...tooltipStyle}
                  />
                  <Bar dataKey="revenue" radius={[2, 2, 0, 0]} maxBarSize={64}>
                    {byPlan.map((entry, i) => (
                      <Cell key={entry.plan} fill={planColor(entry.plan, i)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* Plan legend */}
              <div className="mt-4 flex flex-wrap gap-4">
                {byPlan.map((p, i) => (
                  <div key={p.plan} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span
                      className="inline-block size-2.5 rounded-sm"
                      style={{ background: planColor(p.plan, i) }}
                    />
                    <span className="capitalize">{p.plan}</span>
                    <span className="font-medium text-foreground">${p.revenue.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
