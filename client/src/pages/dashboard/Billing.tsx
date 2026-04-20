import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import useStore from "../../store/useStore";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
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

// Plans are defined inside the component so they can read variant IDs from state

export default function Billing() {
  const credits = useStore((s) => s.credits);
  const transactions = useStore((s) => s.transactions);
  const buyCredits = useStore((s) => s.buyCredits);
  const refreshCredits = useStore((s) => s.refreshCredits);
  const refreshTransactions = useStore((s) => s.refreshTransactions);

  const location = useLocation();
  const navigate = useNavigate();
  const [buying, setBuying] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Variant IDs state (read from env when available, fallback to hardcoded IDs)
  const [variantIds] = useState<Record<string, string>>(() => ({
    starter: (import.meta.env.VITE_LS_VARIANT_STARTER as string) || "1454345",
    pro: (import.meta.env.VITE_LS_VARIANT_PRO as string) || "1454346",
  }));

  // Define plans here so they can reference `variantIds` state
  const PLANS = [
    {
      name: "Starter",
      credits: 5_000,
      price: "$9",
      desc: "Great for trying out cold outreach.",
      variantId: variantIds.starter,
    },
    {
      name: "Pro",
      credits: 20_000,
      price: "$29",
      desc: "For teams running high-volume campaigns.",
      variantId: variantIds.pro,
      highlighted: true,
    },
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshCredits();
      toast.success("Balance refreshed.");
    } catch {
      toast.error("Could not refresh balance. Please log in again.");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("success") === "true") {
      navigate("/dashboard/billing", { replace: true });
      refreshCredits()
        .then(() => toast.success("Payment successful — credits added!"))
        .catch(() =>
          toast.info(
            "Payment received! Click ↻ Refresh to update your balance.",
          ),
        );
    }
    // load transaction history when landing on billing page
    refreshTransactions().catch(() => {
      /* ignore errors; UI will show empty state */
    });
  }, []);

  const handleBuy = async (variantId: string, planName: string) => {
    if (!variantId) {
      console.warn("Billing: variantId missing or empty", {
        variantId,
        planName,
      });
      toast.error("This plan is not configured yet.");
      return;
    }
    try {
      setBuying(variantId);
      await buyCredits(variantId);
    } catch {
      toast.error(`Could not start ${planName} checkout. Please try again.`);
      setBuying(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 md:p-8"
    >
      <div className="mb-2">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Billing
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your credit balance and transaction history.
        </p>
      </div>

      <Separator className="my-6" />

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
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="xs"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? "Syncing…" : "↻ Refresh"}
          </Button>
          <Badge variant="outline" className="text-xs">
            Active
          </Badge>
        </div>
      </motion.div>

      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Top up credits
      </p>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="mb-10 grid gap-3 sm:grid-cols-2"
      >
        {PLANS.map((plan, i) => (
          <motion.div
            key={plan.name}
            variants={fadeUp}
            custom={i}
            className={`flex flex-col gap-4 border p-5 ${
              plan.highlighted
                ? "border-primary bg-primary/5"
                : "border-border bg-card"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-foreground">{plan.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {plan.desc}
                </p>
              </div>
              {plan.highlighted && (
                <Badge variant="default" className="text-[10px]">
                  Popular
                </Badge>
              )}
            </div>
            <div>
              <span className="text-2xl font-bold text-foreground">
                {plan.price}
              </span>
              <span className="ml-1.5 text-sm text-muted-foreground">
                / {plan.credits.toLocaleString()} credits
              </span>
            </div>
            <Button
              className="w-full"
              variant={plan.highlighted ? "default" : "outline"}
              disabled={buying === plan.variantId}
              onClick={() => handleBuy(plan.variantId, plan.name)}
            >
              {buying === plan.variantId ? "Redirecting…" : `Buy ${plan.name}`}
            </Button>
          </motion.div>
        ))}
      </motion.div>

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
