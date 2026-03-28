import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import useStore from "../store/useStore";
import useAiStore from "../store/useAiStore";
import type { GenerateInputs } from "../types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

const LENGTH_LABELS: Record<string, number> = {
  short: 300,
  medium: 700,
  long: 1200,
};

type Result = {
  subject: string;
  emailBody: string;
  linkedInDM: string;
  followUpEmail: string;
};

export default function GeneratorForm() {
  const location = useLocation();
  const prefill = (location.state as { inputs?: GenerateInputs } | null)?.inputs;

  const [product, setProduct] = useState(prefill?.product ?? "");
  const [audience, setAudience] = useState(prefill?.audience ?? "");
  const [tone, setTone] = useState(prefill?.tone ?? "professional");
  const [length, setLength] = useState(prefill?.length ?? "medium");
  const [loading, setLoading] = useState(false);

  // When navigated with pre-filled inputs, clear the router state so
  // a manual refresh doesn't re-apply the old values.
  useEffect(() => {
    if (prefill) window.history.replaceState({}, "");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [activeTab, setActiveTab] = useState<keyof Result>("emailBody");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const credits = useStore((s) => s.credits);
  const deductCredits = useStore((s) => s.deductCredits);
  const generate = useAiStore((s) => s.generate);
  const fetchHistory = useAiStore((s) => s.fetchHistory);

  const estimateChars = LENGTH_LABELS[length] ?? 700;
  const estimateCredits = Math.ceil(estimateChars / 100);
  const canGenerate = !!product.trim() && !!audience.trim();

  const onGenerate = async () => {
    if (credits < estimateCredits) {
      setUpgradeOpen(true);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await generate({ product, audience, tone, length });
      const chars =
        data.subject.length +
        data.emailBody.length +
        data.linkedInDM.length +
        data.followUpEmail.length;

      const ok = deductCredits(chars);
      if (!ok) {
        setUpgradeOpen(true);
        return;
      }

      setResult(data);
      setActiveTab("emailBody");
      // Refresh history from DB so the new entry appears in History page
      fetchHistory();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const copyActive = () => {
    if (!result) return;
    navigator.clipboard.writeText(result[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const downloadActive = () => {
    if (!result) return;
    const tabName = activeTab === "emailBody" ? "cold-email" : activeTab === "linkedInDM" ? "linkedin-dm" : "follow-up";
    const text = activeTab === "emailBody"
      ? `Subject: ${result.subject}\n\n${result[activeTab]}`
      : result[activeTab];
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tabName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabLabels: { key: keyof Result; label: string }[] = [
    { key: "emailBody", label: "Cold email" },
    { key: "linkedInDM", label: "LinkedIn DM" },
    { key: "followUpEmail", label: "Follow-up" },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      {/* ── Input form ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Your details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product">Product / Service *</Label>
            <Input
              id="product"
              placeholder="e.g. Project management SaaS"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="audience">Target audience *</Label>
            <Input
              id="audience"
              placeholder="e.g. Series-A startup CTOs"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Length</Label>
              <Select value={length} onValueChange={setLength}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short (~300 chars)</SelectItem>
                  <SelectItem value="medium">Medium (~700 chars)</SelectItem>
                  <SelectItem value="long">Long (~1 200 chars)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Estimated cost:{" "}
              <Badge variant="outline">{estimateCredits} credits</Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setProduct("");
                  setAudience("");
                  setResult(null);
                }}
              >
                Reset
              </Button>
              <Button
                size="sm"
                onClick={onGenerate}
                disabled={loading || !canGenerate}
              >
                {loading ? "Generating…" : "Generate"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Output ─────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {result ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
          >
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle>Results</CardTitle>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Subject: <em>{result.subject}</em>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyActive}>
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadActive}>
                      Download
                    </Button>
                  </div>
                </div>
                {/* tabs */}
                <div className="mt-3 flex gap-0 border-b border-border">
                  {tabLabels.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`px-4 py-2 text-sm transition-colors ${
                        activeTab === key
                          ? "border-b-2 border-primary font-medium text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Textarea
                    readOnly
                    value={result[activeTab]}
                    className="min-h-48 resize-none font-mono text-sm"
                  />
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center border border-dashed border-border bg-muted/30 p-8 text-sm text-muted-foreground"
          >
            Fill in the form and hit <strong className="mx-1 text-foreground">Generate</strong> to see results.
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Upgrade modal ──────────────────────────────── */}
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>You need more credits</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { name: "Starter", credits: "1 000", price: "$9" },
              { name: "Pro", credits: "5 000", price: "$29" },
              { name: "Enterprise", credits: "20 000", price: "$99" },
            ].map((plan) => (
              <div
                key={plan.name}
                className="flex flex-col gap-2 border border-border p-4"
              >
                <div className="font-semibold text-foreground">{plan.name}</div>
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {plan.price}
                </div>
                <div className="text-xs text-muted-foreground">
                  {plan.credits} credits
                </div>
                <Button size="sm" className="mt-2">
                  Buy
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
