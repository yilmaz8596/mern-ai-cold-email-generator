import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";

type AdminStats = {
  totalUsers: number;
  verifiedUsers: number;
  totalEmails: number;
  creditsSold: number;
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  credits: number;
  verified: boolean;
  isAdmin: boolean;
  joined: string;
  emails: number;
};

type AdminTransaction = {
  id: string;
  user: string;
  plan: string;
  amount: string;
  credits: number;
  date: string;
  status: string;
};

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
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [topUsers, setTopUsers] = useState<AdminUser[]>([]);
  const [recentTx, setRecentTx] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/stats", { credentials: "include" }).then((r) =>
        r.json(),
      ),
      fetch("/api/admin/users", { credentials: "include" }).then((r) =>
        r.json(),
      ),
      fetch("/api/admin/transactions", { credentials: "include" }).then((r) =>
        r.json(),
      ),
    ])
      .then(([s, u, t]) => {
        setStats(s);
        setTopUsers(
          Array.isArray(u)
            ? [...u].sort((a, b) => b.emails - a.emails).slice(0, 3)
            : [],
        );
        setRecentTx(Array.isArray(t) ? t.slice(0, 4) : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats
    ? [
        {
          label: "Total users",
          value: stats.totalUsers.toString(),
          sub: `${stats.verifiedUsers} verified`,
        },
        {
          label: "Credits sold",
          value: stats.creditsSold.toLocaleString(),
          sub: "all time",
        },
        {
          label: "Emails generated",
          value: stats.totalEmails.toLocaleString(),
          sub: "all users",
        },
      ]
    : [];

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

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3"
          >
            {statCards.map((s, i) => (
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
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={0}
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Recent transactions
              </p>
              {recentTx.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No transactions yet.
                </p>
              ) : (
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
                      {recentTx.map((tx, i) => (
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
              )}
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={1}
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Top users by emails
              </p>
              {topUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users yet.</p>
              ) : (
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
                          {u.emails} emails · {u.credits.toLocaleString()}{" "}
                          credits left
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
          <Separator className="hidden" />
        </>
      )}
    </motion.div>
  );
}
