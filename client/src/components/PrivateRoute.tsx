import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import useStore from "../store/useStore";

export default function PrivateRoute() {
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (user) return;

    (async () => {
      setChecking(true);
      try {
        const res = await fetch("/api/user/me", { credentials: "include" });
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (data && data.user) setUser(data.user);
        }
      } catch (err) {
        // ignore
      } finally {
        if (mounted) setChecking(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user, setUser]);

  if (user) return <Outlet />;
  if (checking) return null;
  return <Navigate to="/login" replace />;
}
