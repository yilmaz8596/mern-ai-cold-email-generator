import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import useAiStore from "../../store/useAiStore";

type HistoryRecord = {
  id: string;
  subject: string;
  date: string;
  emailBody: string;
  chars: number;
  creditsUsed: number;
  inputs?: { product: string; audience: string; tone: string; length: string };
};

type Props = {
  item: HistoryRecord;
  onDeleteRequest: (id: string, subject: string) => void;
};

export default function HistoryItem({ item, onDeleteRequest }: Props) {
  const updateHistory = useAiStore((s) => s.updateHistory);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [draftSubject, setDraftSubject] = useState(item.subject);

  const handleRegenerate = () => {
    if (!item.inputs) {
      toast.info("No inputs saved for this entry.");
      return;
    }
    navigate("/dashboard/generate", { state: { inputs: item.inputs } });
  };

  const saveEdit = () => {
    const trimmed = draftSubject.trim();
    if (!trimmed) return;
    updateHistory(item.id, { subject: trimmed });
    setEditing(false);
    toast.success("Subject updated.");
  };

  const cancelEdit = () => {
    setDraftSubject(item.subject);
    setEditing(false);
  };

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
          {editing ? (
            <div className="flex items-center gap-2">
              <Input
                autoFocus
                value={draftSubject}
                onChange={(e) => setDraftSubject(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit();
                  if (e.key === "Escape") cancelEdit();
                }}
                className="h-7 text-sm"
              />
              <Button size="xs" onClick={saveEdit}>
                Save
              </Button>
              <Button size="xs" variant="ghost" onClick={cancelEdit}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="font-semibold text-foreground truncate">
              {item.subject}
            </div>
          )}
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
          onClick={() => {
            navigator.clipboard.writeText(item.emailBody);
            toast.success("Copied to clipboard.");
          }}
        >
          Copy
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => {
            setDraftSubject(item.subject);
            setEditing(true);
          }}
        >
          Edit
        </Button>
        {item.inputs && (
          <Button variant="ghost" size="xs" onClick={handleRegenerate}>
            Regenerate
          </Button>
        )}
        <Button
          variant="ghost"
          size="xs"
          className="text-destructive hover:text-destructive"
          onClick={() => onDeleteRequest(item.id, item.subject)}
        >
          Delete
        </Button>
      </div>
    </motion.div>
  );
}
