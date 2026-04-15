import "react";
import { Outlet, NavLink, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const links = [
  { to: "overview", label: "Overview", icon: "▣" },
  { to: "users", label: "Users", icon: "▦" },
  { to: "transactions", label: "Transactions", icon: "≡" },
  { to: "revenue", label: "Revenue", icon: "$" },
];

function currentPageLabel(pathname: string) {
  const seg = pathname.split("/").pop() ?? "";
  return links.find((l) => l.to === seg)?.label ?? "Admin";
}

export default function AdminLayout() {
  const location = useLocation();
  const pageLabel = currentPageLabel(location.pathname);

  return (
    <div
      className="flex min-h-screen flex-col bg-background text-left text-foreground"
      style={{ width: "100%", textAlign: "left" }}
    >
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card px-6">
        <div className="flex items-center gap-2 text-sm">
          <Link to="/" className="font-bold tracking-tight text-foreground">
            Mailify
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Admin
          </span>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-sm font-medium text-foreground">
            {pageLabel}
          </span>
        </div>
        <Link
          to="/dashboard/generate"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Back to app
        </Link>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-52 shrink-0 border-r border-border bg-sidebar pt-6 pb-8 lg:flex lg:flex-col">
          <nav className="flex flex-col gap-0.5 px-3">
            {links.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-accent font-medium text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`
                }
              >
                <span className="text-base leading-none">{icon}</span>
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-1 overflow-auto"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
