import React, { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import useAiStore from "../../store/useAiStore";
import HistoryItem from "../../components/history/HistoryItem";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

export default function History() {
  const history = useAiStore((s) => s.history);
  const removeHistory = useAiStore((s) => s.removeHistory);

  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    subject: string;
  } | null>(null);

  const handleDeleteRequest = (id: string, subject: string) => {
    setConfirmDelete({ id, subject });
  };

  const handleDeleteConfirm = () => {
    if (!confirmDelete) return;
    removeHistory(confirmDelete.id);
    toast.success("Entry deleted.");
    setConfirmDelete(null);
  };

  return (
    <>
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
              <HistoryItem
                key={h.id}
                item={h}
                onDeleteRequest={handleDeleteRequest}
              />
            ))}
          </motion.div>
        )}
      </motion.div>

      <Dialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete entry?</DialogTitle>
            <DialogDescription>
              &ldquo;{confirmDelete?.subject}&rdquo; will be permanently
              removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
