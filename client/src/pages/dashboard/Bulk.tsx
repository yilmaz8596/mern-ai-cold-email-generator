import { useRef, useState } from "react";
import Papa from "papaparse";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { fetchWithAuth } from "../../lib/utils";
import useStore from "../../store/useStore";

type CsvRow = {
  product?: string;
  audience?: string;
  tone?: string;
  length?: string;
  email?: string;
};

type RowResult = {
  subject?: string;
  emailBody?: string;
  error?: string;
  sent?: boolean;
  sending?: boolean;
};

const CREDITS_PER_ROW = 7;
const DELAY_MS = 1150;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const CSV_TEMPLATE =
  "product,audience,tone,length,email\n" +
  "Your SaaS,B2B startups,professional,medium,prospect@example.com\n";

function downloadString(text: string, filename: string, mime = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: filename,
  });
  a.click();
  URL.revokeObjectURL(url);
}

export default function Bulk() {
  const credits = useStore((s) => s.credits);
  const deductCredits = useStore((s) => s.deductCredits);

  const [rows, setRows] = useState<CsvRow[]>([]);
  const [results, setResults] = useState<RowResult[]>([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const abortRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, errors }) => {
        if (errors.length) {
          toast.error("CSV parse error: " + errors[0].message);
          return;
        }
        const valid = data.filter(
          (r) => r.product?.trim() && r.audience?.trim(),
        );
        if (!valid.length) {
          toast.error(
            'No valid rows — CSV must contain "product" and "audience" columns.',
          );
          return;
        }
        setRows(valid);
        setResults([]);
        setProgress(0);
        toast.success(
          `${valid.length} row${valid.length === 1 ? "" : "s"} loaded`,
        );
      },
    });
  }

  async function generateAll() {
    const est = rows.length * CREDITS_PER_ROW;
    if (credits < est) {
      toast.error(
        `Not enough credits. Estimated ~${est} needed, you have ${credits.toLocaleString()}.`,
      );
      return;
    }
    abortRef.current = false;
    setGenerating(true);
    setProgress(0);
    const res: RowResult[] = rows.map(() => ({}));
    setResults([...res]);

    for (let i = 0; i < rows.length; i++) {
      if (abortRef.current) {
        toast("Generation stopped.");
        break;
      }

      res[i] = {};
      setResults([...res]);

      const row = rows[i];
      const prompt =
        `Product/Service: ${row.product}\n` +
        `Target Audience: ${row.audience}\n` +
        `Tone: ${row.tone || "professional"}\n` +
        `Length: ${row.length || "medium"}`;

      try {
        const r = await fetchWithAuth("/api/ai/generate-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            product: row.product,
            audience: row.audience,
            tone: row.tone || "professional",
            length: row.length || "medium",
          }),
        });
        const data = (await r.json().catch(() => ({}))) as Record<
          string,
          string
        >;
        if (!r.ok) {
          res[i] = { error: data.message ?? "Generation failed" };
        } else {
          res[i] = { subject: data.subject, emailBody: data.emailBody };
          const creditsUsed = Number(data.creditsUsed) || CREDITS_PER_ROW;
          deductCredits(creditsUsed * 100);
        }
      } catch (err) {
        res[i] = { error: String(err) };
      }

      setResults([...res]);
      setProgress(i + 1);

      if (i < rows.length - 1 && !abortRef.current) await sleep(DELAY_MS);
    }

    setGenerating(false);
  }

  async function sendRow(idx: number) {
    const row = rows[idx];
    const result = results[idx];
    if (!row.email?.trim() || !result?.subject || !result?.emailBody) return;

    setResults((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], sending: true };
      return next;
    });

    try {
      const res = await fetchWithAuth("/api/ai/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: row.email.trim(),
          subject: result.subject,
          body: result.emailBody,
        }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as Record<
          string,
          string
        >;
        throw new Error(d.message ?? "Failed to send");
      }
      setResults((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], sending: false, sent: true };
        return next;
      });
      toast.success(`Sent to ${row.email}`);
    } catch (err) {
      setResults((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], sending: false };
        return next;
      });
      toast.error(String(err));
    }
  }

  async function sendAllReady() {
    for (let i = 0; i < rows.length; i++) {
      if (results[i]?.subject && !results[i].sent && rows[i].email?.trim()) {
        await sendRow(i);
        await sleep(300);
      }
    }
  }

  function copyRow(idx: number) {
    const r = results[idx];
    if (!r?.emailBody) return;
    const text = r.subject
      ? `Subject: ${r.subject}\n\n${r.emailBody}`
      : r.emailBody;
    navigator.clipboard.writeText(text).then(() => toast.success("Copied!"));
  }

  function downloadRow(idx: number) {
    const row = rows[idx];
    const r = results[idx];
    if (!r?.emailBody) return;
    const text = `Subject: ${r.subject ?? ""}\n\n${r.emailBody}`;
    downloadString(
      text,
      `email-${idx + 1}-${(row.product ?? "")
        .slice(0, 20)
        .trim()
        .replace(/\s+/g, "-")}.txt`,
    );
  }

  const hasEmailColumn = rows.some((r) => r.email?.trim());
  const doneCount = results.filter((r) => r.subject || r.error).length;
  const readyToSendCount = results.filter(
    (r, i) => r.subject && !r.sent && rows[i]?.email?.trim(),
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-5xl space-y-8 p-6"
    >
      <div>
        <h1 className="text-xl font-bold tracking-tight">Bulk Generation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a CSV with one prospect per row — each row generates a cold
          email (~{CREDITS_PER_ROW} credits).
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            downloadString(CSV_TEMPLATE, "bulk-template.csv", "text/csv")
          }
        >
          ↓ CSV template
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="sr-only"
          onChange={handleFile}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          Upload CSV
        </Button>

        {rows.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {rows.length} row{rows.length !== 1 ? "s" : ""} loaded
            {hasEmailColumn && " · email column detected"}
          </span>
        )}
      </div>

      {rows.length > 0 && (
        <div className="flex flex-wrap items-center gap-4">
          <Button disabled={generating} onClick={generateAll}>
            {generating
              ? `Generating… ${progress} / ${rows.length}`
              : `Generate ${rows.length} email${rows.length !== 1 ? "s" : ""}`}
          </Button>

          {generating && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                abortRef.current = true;
              }}
            >
              Stop
            </Button>
          )}

          <span className="text-xs text-muted-foreground">
            ~{rows.length * CREDITS_PER_ROW} credits ·{" "}
            {credits.toLocaleString()} available
          </span>
        </div>
      )}

      {generating && rows.length > 0 && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(progress / rows.length) * 100}%` }}
          />
        </div>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">#</th>
                <th className="px-4 py-2.5 text-left font-medium">Product</th>
                <th className="px-4 py-2.5 text-left font-medium">Audience</th>
                {hasEmailColumn && (
                  <th className="px-4 py-2.5 text-left font-medium">To</th>
                )}
                <th className="px-4 py-2.5 text-left font-medium">Subject</th>
                <th className="px-4 py-2.5 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row, i) => {
                const result = results[i];
                const isInFlight =
                  generating &&
                  i === progress &&
                  !result?.subject &&
                  !result?.error;

                return (
                  <tr
                    key={i}
                    className={
                      result?.subject
                        ? ""
                        : result?.error
                          ? "bg-destructive/5"
                          : "bg-muted/20"
                    }
                  >
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {i + 1}
                    </td>
                    <td className="max-w-[140px] truncate px-4 py-2.5">
                      {row.product}
                    </td>
                    <td className="max-w-[140px] truncate px-4 py-2.5 text-muted-foreground">
                      {row.audience}
                    </td>
                    {hasEmailColumn && (
                      <td className="max-w-[160px] truncate px-4 py-2.5 text-muted-foreground">
                        {row.email}
                      </td>
                    )}
                    <td className="max-w-[240px] px-4 py-2.5">
                      {result?.error ? (
                        <span className="text-xs text-destructive">
                          {result.error}
                        </span>
                      ) : result?.subject ? (
                        <span className="line-clamp-1">{result.subject}</span>
                      ) : isInFlight ? (
                        <span className="text-xs text-muted-foreground">
                          Generating…
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {result?.subject && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyRow(i)}
                            className="rounded px-2 py-1 text-xs hover:bg-muted"
                          >
                            Copy
                          </button>
                          <button
                            onClick={() => downloadRow(i)}
                            className="rounded px-2 py-1 text-xs hover:bg-muted"
                          >
                            ↓ .txt
                          </button>
                          {hasEmailColumn && row.email?.trim() && (
                            <button
                              disabled={
                                (result.sending ?? false) ||
                                (result.sent ?? false)
                              }
                              onClick={() => sendRow(i)}
                              className={`rounded px-2 py-1 text-xs transition-colors ${
                                result.sent
                                  ? "text-green-600 dark:text-green-400"
                                  : result.sending
                                    ? "cursor-not-allowed text-muted-foreground"
                                    : "text-primary hover:bg-muted"
                              }`}
                            >
                              {result.sent
                                ? "Sent ✓"
                                : result.sending
                                  ? "Sending…"
                                  : "Send"}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {doneCount > 0 && hasEmailColumn && readyToSendCount > 0 && (
        <div className="flex flex-wrap items-center gap-4 border-t border-border pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={generating}
            onClick={sendAllReady}
          >
            Send {readyToSendCount} ready email
            {readyToSendCount !== 1 ? "s" : ""}
          </Button>
          <p className="text-xs text-muted-foreground">
            Requires a Resend API key saved in{" "}
            <a
              href="/dashboard/settings"
              className="underline underline-offset-4"
            >
              Settings
            </a>
            .
          </p>
        </div>
      )}

      {rows.length === 0 && (
        <div className="flex flex-col items-center justify-center border border-dashed border-border py-20 text-center">
          <p className="text-sm font-medium">No CSV uploaded yet</p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Download the template above, fill in your prospects, then upload it.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Required columns:{" "}
            <code className="rounded bg-muted px-1 py-0.5">product</code>,{" "}
            <code className="rounded bg-muted px-1 py-0.5">audience</code>
            &ensp;·&ensp; Optional:{" "}
            <code className="rounded bg-muted px-1 py-0.5">tone</code>,{" "}
            <code className="rounded bg-muted px-1 py-0.5">length</code>,{" "}
            <code className="rounded bg-muted px-1 py-0.5">email</code>
          </p>
        </div>
      )}
    </motion.div>
  );
}
