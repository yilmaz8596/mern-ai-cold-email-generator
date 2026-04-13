import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "../../components/ui/badge";

type AdminTransaction = {
  id: string;
  user: string;
  plan: string;
  amount: string;
  credits: number;
  date: string;
  status: string;
};

const planColor: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  Pro: "default",
  Starter: "secondary",
  Free: "outline",
};
const statusColor: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  completed: "default",
  pending: "secondary",
  failed: "destructive",
};

const ALL_PLANS = ["All", "Pro", "Starter", "Free"] as const;
type PlanFilter = (typeof ALL_PLANS)[number];

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PlanFilter>("All");

  useEffect(() => {
    fetch("/api/admin/transactions", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setTransactions(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === "All"
      ? transactions
      : transactions.filter((tx) => tx.plan === filter);
  const completed = transactions.filter((t) => t.status === "completed");
  const totalRevenue = completed.reduce(
    (s, t) => s + parseInt(t.amount.replace("$", "") || "0"),
    0,
  );
  const totalCredits = completed.reduce((s, t) => s + t.credits, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 md:p-8"
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Transactions
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Credit purchase log · {loading ? "…" : `${transactions.length} total`}
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: "Total revenue", value: `$${totalRevenue}` },
          { label: "Credits issued", value: totalCredits.toLocaleString() },
          { label: "Transactions", value: completed.length.toString() },
        ].map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="border border-border bg-card p-4"
          >
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {c.label}
            </p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">
              {c.value}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mb-4 flex gap-1">
        {ALL_PLANS.map((p) => (
          <button
            key={p}
            onClick={() => setFilter(p)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors border ${
              filter === p
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              {[
                "ID",
                "User",
                "Plan",
                "Amount",
                "Credits",
                "Date",
                "Status",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody key={filter}>
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  No transactions{filter !== "All" ? ` for ${filter}` : ""}.
                </td>
              </tr>
            ) : (
              filtered.map((tx, i) => (
                <motion.tr
                  key={tx.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-border last:border-0 hover:bg-muted/20"
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {tx.id.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{tx.user}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={planColor[tx.plan] ?? "outline"}
                      className="text-xs"
                    >
                      {tx.plan}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {tx.amount}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {tx.credits.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{tx.date}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={statusColor[tx.status] ?? "outline"}
                      className="text-xs"
                    >
                      {tx.status}
                    </Badge>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
