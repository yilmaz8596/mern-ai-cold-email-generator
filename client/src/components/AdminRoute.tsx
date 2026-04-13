import { useEffect, useState } from "react";
import { Navigate, Outlet, Link } from "react-router-dom";
import useStore from "../store/useStore";

type Status = "loading" | "authorized" | "forbidden" | "unauthenticated";

export default function AdminRoute() {
  const user = useStore((s) => s.user);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!user) {
      return;
    }
    fetch("/api/admin/stats", { credentials: "include" })
      .then((r) => {
        if (r.ok) setStatus("authorized");
        else if (r.status === 403 || r.status === 401) setStatus("forbidden");
        else setStatus("forbidden");
      })
      .catch(() => setStatus("forbidden"));
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Verifying access…</p>
      </div>
    );
  }

  if (status === "forbidden") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
        <div className="flex size-16 items-center justify-center border border-destructive/40 bg-destructive/10 text-3xl">
          ✕
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Unauthorized
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You don't have permission to access the admin panel.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/dashboard/generate"
            className="border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
          >
            ← Back to app
          </Link>
          <Link
            to="/"
            className="border border-border bg-card px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
          >
            Home
          </Link>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
