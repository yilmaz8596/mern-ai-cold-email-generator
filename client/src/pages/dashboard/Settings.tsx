import React, { useState } from "react";
import { motion } from "framer-motion";
import useStore from "../../store/useStore";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

export default function Settings() {
  const user = useStore((s) => s.user);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [saved, setSaved] = useState(false);

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex h-full flex-col p-6 md:p-8"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Settings
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account details.
        </p>
      </div>

      {/* Two-column grid — fills remaining height without overflow */}
      <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
        {/* Profile card */}
        <div className="flex flex-col border border-border p-5">
          <p className="text-sm font-semibold text-foreground">Profile</p>
          <p className="mt-0.5 mb-5 text-xs text-muted-foreground">
            Update your display name and email.
          </p>
          <form onSubmit={onSave} className="flex flex-1 flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="s-name">Name</Label>
              <Input
                id="s-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="s-email">Email</Label>
              <Input
                id="s-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </div>
            <div className="mt-auto">
              <Button type="submit" size="sm">
                {saved ? "Saved ✓" : "Save changes"}
              </Button>
            </div>
          </form>
        </div>

        {/* Password card */}
        <div className="flex flex-col border border-border p-5">
          <p className="text-sm font-semibold text-foreground">Password</p>
          <p className="mt-0.5 mb-5 text-xs text-muted-foreground">
            Change your account password.
          </p>
          <div className="flex flex-1 flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="s-current">Current password</Label>
              <Input id="s-current" type="password" placeholder="••••••••" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="s-new">New password</Label>
              <Input id="s-new" type="password" placeholder="••••••••" />
            </div>
            <div className="mt-auto">
              <Button size="sm" variant="outline" disabled>
                Update password
              </Button>
            </div>
          </div>
        </div>

        {/* Danger zone card — spans full width on large screens */}
        <div className="flex flex-col border border-destructive/30 p-5 md:col-span-2">
          <p className="text-sm font-semibold text-destructive">Danger zone</p>
          <p className="mt-0.5 mb-5 text-xs text-muted-foreground">
            Irreversible actions for your account.
          </p>
          <div className="mt-auto flex items-center gap-3">
            <Button variant="destructive" size="sm" disabled>
              Delete account
            </Button>
            <p className="text-xs text-muted-foreground">
              This will permanently delete all your data.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
