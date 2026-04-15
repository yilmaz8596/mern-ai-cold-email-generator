import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";

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

type ConfirmTarget = { id: string; name: string; isSuspended: boolean } | null;

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [suspended, setSuspended] = useState<Set<string>>(new Set());
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget>(null);

  useEffect(() => {
    fetch("/api/admin/users", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase()),
  );

  const toggle = (id: string) =>
    setSuspended((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleConfirm = () => {
    if (confirmTarget) toggle(confirmTarget.id);
    setConfirmTarget(null);
  };

  const maxCredits = Math.max(...users.map((u) => u.credits), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 md:p-8"
    >
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Users
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading
              ? "Loading…"
              : `${filtered.length} of ${users.length} accounts · ${users.filter((u) => u.verified).length} verified`}
          </p>
        </div>
        <Input
          placeholder="Search by name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-64"
        />
      </div>

      <div className="overflow-x-auto border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              {[
                "User",
                "Credits",
                "Emails",
                "Verified",
                "Joined",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  Loading users…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  No users match your search.
                </td>
              </tr>
            ) : (
              filtered.map((u, i) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`border-b border-border last:border-0 transition-colors hover:bg-muted/20 ${
                    suspended.has(u.id) ? "opacity-50" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 shrink-0 items-center justify-center border border-border bg-muted text-xs font-bold text-foreground">
                        {u.name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{u.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-foreground">
                        {u.credits.toLocaleString()}
                      </span>
                      <div className="h-1 w-20 bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${Math.round((u.credits / maxCredits) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.emails}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={u.verified ? "default" : "outline"}
                      className="text-xs"
                    >
                      {u.verified ? "Verified" : "Pending"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.joined}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant={suspended.has(u.id) ? "default" : "outline"}
                      className="w-24 text-xs h-7 px-2.5"
                      onClick={() =>
                        setConfirmTarget({
                          id: u.id,
                          name: u.name,
                          isSuspended: suspended.has(u.id),
                        })
                      }
                    >
                      {suspended.has(u.id) ? "Unsuspend" : "Suspend"}
                    </Button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog
        open={!!confirmTarget}
        onOpenChange={(open) => {
          if (!open) setConfirmTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {confirmTarget?.isSuspended ? "Unsuspend user?" : "Suspend user?"}
            </DialogTitle>
            <DialogDescription>
              {confirmTarget?.isSuspended ? (
                <>
                  This will restore access for{" "}
                  <span className="font-medium text-foreground">
                    {confirmTarget?.name}
                  </span>
                  . They will be able to log in again.
                </>
              ) : (
                <>
                  This will block{" "}
                  <span className="font-medium text-foreground">
                    {confirmTarget?.name}
                  </span>{" "}
                  from accessing the platform. You can reverse this at any time.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmTarget(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant={confirmTarget?.isSuspended ? "default" : "destructive"}
              onClick={handleConfirm}
            >
              {confirmTarget?.isSuspended ? "Yes, unsuspend" : "Yes, suspend"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
