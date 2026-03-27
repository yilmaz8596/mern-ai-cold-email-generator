import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import useAiStore from "../../store/useAiStore";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Separator } from "../../components/ui/separator";

export default function HistoryDetail() {
  const { id } = useParams();
  const history = useAiStore((s) => s.history);
  const updateHistory = useAiStore((s) => s.updateHistory);
  const item = history.find((h) => h.id === id);

  // subject editing
  const [editingSubject, setEditingSubject] = useState(false);
  const [draftSubject, setDraftSubject] = useState("");

  // body editing — track which section key is being edited
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [draftBody, setDraftBody] = useState("");

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

  const saveSubject = () => {
    const trimmed = draftSubject.trim();
    if (!trimmed) return;
    updateHistory(item.id, { subject: trimmed });
    setEditingSubject(false);
    toast.success("Subject updated.");
  };

  type SectionKey = "emailBody";

  const saveSection = (key: SectionKey) => {
    const trimmed = draftBody.trim();
    if (!trimmed) return;
    updateHistory(item.id, { [key]: trimmed });
    setEditingSection(null);
    toast.success("Content updated.");
  };

  const sections: {
    label: string;
    key: SectionKey | "linkedInDM" | "followUpEmail";
    value: string;
  }[] = [
    { label: "Cold email", key: "emailBody", value: item.emailBody },
    {
      label: "LinkedIn DM",
      key: "linkedInDM",
      value: (item as any).linkedInDM ?? "",
    },
    {
      label: "Follow-up",
      key: "followUpEmail",
      value: (item as any).followUpEmail ?? "",
    },
  ].filter((s) => s.value) as {
    label: string;
    key: SectionKey;
    value: string;
  }[];

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
        {editingSubject ? (
          <div className="flex flex-1 items-center gap-2">
            <Input
              autoFocus
              value={draftSubject}
              onChange={(e) => setDraftSubject(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveSubject();
                if (e.key === "Escape") setEditingSubject(false);
              }}
              className="text-base font-bold"
            />
            <Button size="xs" onClick={saveSubject}>
              Save
            </Button>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setEditingSubject(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex flex-1 items-start gap-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {item.subject}
            </h2>
            <Button
              size="xs"
              variant="ghost"
              className="mt-0.5 shrink-0"
              onClick={() => {
                setDraftSubject(item.subject);
                setEditingSubject(true);
              }}
            >
              Edit
            </Button>
          </div>
        )}
        <Badge variant="outline" className="shrink-0">
          {item.creditsUsed} credits
        </Badge>
      </div>
      <p className="mb-6 text-xs text-muted-foreground">
        {new Date(item.date).toLocaleString()}
      </p>

      <div className="flex flex-col gap-6">
        {sections.map(({ label, key, value }) => (
          <div key={label}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                {label}
              </span>
              <div className="flex gap-1.5">
                {editingSection === key ? null : (
                  <>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => {
                        setDraftBody(value);
                        setEditingSection(key);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => {
                        navigator.clipboard.writeText(value);
                        toast.success("Copied to clipboard.");
                      }}
                    >
                      Copy
                    </Button>
                  </>
                )}
              </div>
            </div>
            {editingSection === key ? (
              <div className="flex flex-col gap-2">
                <textarea
                  autoFocus
                  value={draftBody}
                  onChange={(e) => setDraftBody(e.target.value)}
                  rows={10}
                  className="w-full resize-y border border-border bg-muted/30 p-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <div className="flex gap-2">
                  <Button
                    size="xs"
                    onClick={() => saveSection(key as SectionKey)}
                  >
                    Save
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => setEditingSection(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap border border-border bg-muted/30 p-4 text-sm text-foreground">
                {value}
              </pre>
            )}
            <Separator className="mt-6" />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
