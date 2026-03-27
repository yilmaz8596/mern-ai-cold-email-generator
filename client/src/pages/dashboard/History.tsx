import React from "react";
import { motion } from "framer-motion";
import useAiStore from "../../store/useAiStore";
import HistoryItem from "../../components/history/HistoryItem";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

export default function History() {
  const history = useAiStore((s) => s.history);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 md:p-8"
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          History
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {history.length} generation{history.length !== 1 ? "s" : ""} saved.
        </p>
      </div>

      {history.length === 0 ? (
        <div className="flex items-center justify-center border border-dashed border-border bg-muted/30 p-16 text-center text-sm text-muted-foreground">
          No generations yet. Go to{" "}
          <a
            href="/dashboard/generate"
            className="mx-1 font-medium text-foreground underline-offset-4 hover:underline"
          >
            Generate
          </a>{" "}
          to create your first email.
        </div>
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid gap-3"
        >
          {history.map((h) => (
            <HistoryItem key={h.id} item={h} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
