import React from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import useAiStore from "../../store/useAiStore";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";

export default function HistoryDetail() {
  const { id } = useParams();
  const history = useAiStore((s) => s.history);
  const item = history.find((h) => h.id === id);

  if (!item) {
    return (
      <div className="p-8">
        <Link
          to=".."
          className="text-sm underline-offset-4 hover:underline text-muted-foreground"
        >
          ← Back
        </Link>
        <p className="mt-6 text-sm text-muted-foreground">Item not found.</p>
      </div>
    );
  }

  const sections = [
    { label: "Cold email", value: item.emailBody },
    { label: "LinkedIn DM", value: (item as any).linkedInDM ?? "" },
    { label: "Follow-up", value: (item as any).followUpEmail ?? "" },
  ].filter((s) => s.value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 md:p-8 max-w-2xl"
    >
      <Link
        to=".."
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        ← Back to history
      </Link>

      <div className="mt-6 mb-2 flex items-start justify-between gap-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          {item.subject}
        </h2>
        <Badge variant="outline">{item.creditsUsed} credits</Badge>
      </div>
      <p className="mb-6 text-xs text-muted-foreground">
        {new Date(item.date).toLocaleString()}
      </p>

      <div className="flex flex-col gap-6">
        {sections.map(({ label, value }) => (
          <div key={label}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                {label}
              </span>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => navigator.clipboard.writeText(value)}
              >
                Copy
              </Button>
            </div>
            <pre className="whitespace-pre-wrap border border-border bg-muted/30 p-4 text-sm text-foreground">
              {value}
            </pre>
            <Separator className="mt-6" />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
