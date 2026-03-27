import React from "react";
import { motion } from "framer-motion";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";

/* shared mock data — single source of truth across admin pages */
export const MOCK_USERS = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice@co.com",
    credits: 840,
    verified: true,
    plan: "Pro",
    joined: "2026-01-12",
    emails: 42,
  },
  {
    id: "2",
    name: "Bob Martinez",
    email: "bob@co.com",
    credits: 0,
    verified: false,
    plan: "Free",
    joined: "2026-02-03",
    emails: 3,
  },
  {
    id: "3",
    name: "Carol White",
    email: "carol@co.com",
    credits: 3200,
    verified: true,
    plan: "Pro",
    joined: "2026-03-10",
    emails: 98,
  },
  {
    id: "4",
    name: "David Kim",
    email: "david@inc.com",
    credits: 4750,
    verified: true,
    plan: "Pro",
    joined: "2026-03-14",
    emails: 76,
  },
  {
    id: "5",
    name: "Eva Moore",
    email: "eva@startup.io",
    credits: 980,
    verified: true,
    plan: "Starter",
    joined: "2026-03-20",
    emails: 21,
  },
];

export const MOCK_TX = [
  {
    id: "tx001",
    user: "alice@co.com",
    plan: "Pro",
    amount: "$29",
    credits: 5000,
    date: "2026-03-24",
    status: "completed",
  },
  {
    id: "tx002",
    user: "carol@co.com",
    plan: "Pro",
    amount: "$29",
    credits: 5000,
    date: "2026-03-22",
    status: "completed",
  },
  {
    id: "tx003",
    user: "david@inc.com",
    plan: "Pro",
    amount: "$29",
    credits: 5000,
    date: "2026-03-20",
    status: "completed",
  },
  {
    id: "tx004",
    user: "eva@startup.io",
    plan: "Starter",
    amount: "$9",
    credits: 1000,
    date: "2026-03-19",
    status: "completed",
  },
  {
    id: "tx005",
    user: "bob@co.com",
    plan: "Starter",
    amount: "$9",
    credits: 1000,
    date: "2026-03-15",
    status: "failed",
  },
];

const totalRevenue = MOCK_TX.filter((t) => t.status === "completed").reduce(
  (s, t) => s + parseInt(t.amount.replace("$", "")),
  0,
);
const totalCredits = MOCK_TX.filter((t) => t.status === "completed").reduce(
  (s, t) => s + t.credits,
  0,
);
const totalEmails = MOCK_USERS.reduce((s, u) => s + u.emails, 0);

const stats = [
  {
    label: "Total users",
    value: MOCK_USERS.length.toString(),
    sub: `${MOCK_USERS.filter((u) => u.verified).length} verified`,
  },
  {
    label: "Credits sold",
    value: totalCredits.toLocaleString(),
    sub: "all time",
  },
  {
    label: "Emails generated",
    value: totalEmails.toLocaleString(),
    sub: "all users",
  },
  { label: "Revenue (MTD)", value: `$${totalRevenue}`, sub: "completed only" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 28,
      delay: i * 0.08,
    },
  }),
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const planColor: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  Pro: "default",
  Starter: "secondary",
  Free: "outline",
};

export default function AdminOverview() {
  const topUsers = [...MOCK_USERS]
    .sort((a, b) => b.emails - a.emails)
    .slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 md:p-8"
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Overview
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform metrics at a glance.
        </p>
      </div>

      {/* stat cards */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            variants={fadeUp}
            custom={i}
            className="border border-border bg-card p-5"
          >
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {s.label}
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
              {s.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">{s.sub}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* recent transactions */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={0}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Recent transactions
          </p>
          <div className="border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  {["User", "Plan", "Amount", "Date"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_TX.slice(0, 4).map((tx, i) => (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {tx.user}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge
                        variant={planColor[tx.plan] ?? "outline"}
                        className="text-xs"
                      >
                        {tx.plan}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-foreground">
                      {tx.amount}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {tx.date}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* top users */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={1}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Top users by emails
          </p>
          <div className="flex flex-col gap-3">
            {topUsers.map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex items-center gap-3 border border-border bg-card p-4"
              >
                <div className="flex size-9 shrink-0 items-center justify-center border border-border bg-muted text-sm font-bold text-foreground">
                  {u.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {u.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {u.emails} emails · {u.credits.toLocaleString()} credits
                    left
                  </p>
                </div>
                <Badge
                  variant={planColor[u.plan] ?? "outline"}
                  className="text-xs"
                >
                  {u.plan}
                </Badge>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
