import React from "react";
import { motion } from "framer-motion";
import useStore from "../../store/useStore";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 28,
      delay: i * 0.07,
    },
  }),
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  completed: "default",
  pending: "secondary",
  failed: "destructive",
};

export default function Billing() {
  const credits = useStore((s) => s.credits);
  const transactions = useStore((s) => s.transactions);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 md:p-8"
    >
      {/* header */}
      <div className="mb-2">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Billing
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your credit balance and transaction history.
        </p>
      </div>

      <Separator className="my-6" />

      {/* balance card */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="mb-8 flex items-center justify-between border border-border bg-card p-5"
      >
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Available credits
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            {credits.toLocaleString()}
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          Active
        </Badge>
      </motion.div>

      {/* history table */}
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Transaction history
      </p>

      {transactions.length === 0 ? (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center justify-center gap-2 border border-dashed border-border py-16 text-center"
        >
          <p className="text-sm text-muted-foreground">No transactions yet.</p>
          <p className="text-xs text-muted-foreground/60">
            Credit purchases will appear here.
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="overflow-x-auto"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 text-left font-medium text-muted-foreground">
                  Date
                </th>
                <th className="pb-3 text-left font-medium text-muted-foreground">
                  Plan
                </th>
                <th className="pb-3 text-left font-medium text-muted-foreground">
                  Credits
                </th>
                <th className="pb-3 text-left font-medium text-muted-foreground">
                  Amount
                </th>
                <th className="pb-3 text-left font-medium text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, i) => (
                <motion.tr
                  key={tx.id}
                  variants={fadeUp}
                  custom={i}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="py-3 text-muted-foreground">{tx.date}</td>
                  <td className="py-3 font-medium text-foreground">
                    {tx.plan}
                  </td>
                  <td className="py-3 text-muted-foreground">
                    +{tx.credits.toLocaleString()}
                  </td>
                  <td className="py-3 text-foreground">{tx.amount}</td>
                  <td className="py-3">
                    <Badge
                      variant={statusVariant[tx.status] ?? "outline"}
                      className="text-[10px]"
                    >
                      {tx.status}
                    </Badge>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </motion.div>
  );
}
