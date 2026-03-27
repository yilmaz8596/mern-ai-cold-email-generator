import React from "react";
import { NavLink } from "react-router-dom";
import useStore from "../../store/useStore";

const navItems = [
  { to: "/dashboard/generate", label: "Generate", icon: "✦" },
  { to: "/dashboard/history", label: "History", icon: "◷" },
  { to: "/dashboard/billing", label: "Billing", icon: "◈" },
  { to: "/dashboard/settings", label: "Settings", icon: "◎" },
];

export default function Sidebar() {
  const credits = useStore((s) => s.credits);

  return (
    <aside className="hidden w-56 shrink-0 border-r border-border bg-sidebar pb-6 pt-6 lg:flex lg:flex-col">
      <nav className="flex flex-col gap-0.5 px-3">
        {navItems.map(({ to, label, icon }) => (
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

      {/* Credits panel */}
      <div className="mt-auto px-3">
        <div className="flex items-center gap-3 border border-border bg-muted/40 px-3 py-3">
          {/* Coin / credit icon */}
          <div className="flex size-8 shrink-0 items-center justify-center bg-primary/10 text-primary">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              className="size-4"
            >
              <circle cx="12" cy="12" r="9" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 7v1m0 8v1M9.5 9.5C9.5 8.67 10.57 8 12 8s2.5.67 2.5 1.5S13.43 11 12 11s-2.5.68-2.5 1.5S10.57 16 12 16s2.5-.67 2.5-1.5"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Credits
            </p>
            <p className="text-sm font-bold text-foreground">
              {credits.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
