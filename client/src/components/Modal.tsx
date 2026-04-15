import "react";
import { motion } from "framer-motion";

export default function Modal({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 12, opacity: 0 }}
        className="relative w-full max-w-2xl p-6 bg-card border border-border rounded-2xl"
      >
        {title && <h3 className="mb-4 text-lg font-medium">{title}</h3>}
        <div>{children}</div>
      </motion.div>
    </div>
  );
}
