import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

type HistoryRecord = {
  id: string;
  subject: string;
  date: string;
  emailBody: string;
  chars: number;
  creditsUsed: number;
};

export default function HistoryItem({ item }: { item: HistoryRecord }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        show: {
          opacity: 1,
          y: 0,
          transition: { type: "spring", stiffness: 240, damping: 28 },
        },
      }}
      className="flex flex-col gap-3 border border-border bg-card p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-foreground truncate">
            {item.subject}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {new Date(item.date).toLocaleString()}
          </div>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <Badge variant="outline">{item.creditsUsed} cr</Badge>
        </div>
      </div>

      <p className="line-clamp-2 text-sm text-muted-foreground">
        {item.emailBody}
      </p>

      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="xs">
          <Link to={`${item.id}`}>View</Link>
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => navigator.clipboard.writeText(item.emailBody)}
          title="Copy email body"
        >
          Copy
        </Button>
      </div>
    </motion.div>
  );
}
