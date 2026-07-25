import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";

// Legacy tokens (kept for backwards compat with pages that import them)
export const OBSIDIAN = "#153157";
export const MUTED = "#8A8F9E";
export const HAIRLINE = "#1E2533";

const NAV_LINKS = [
  { to: "/products", label: "Products" },
  { to: "/process", label: "How It Works" },
  { to: "/versus", label: "Compare" },
  { to: "/join", label: "For Builders" },
] as const;

export function PublicNav() {
  const [open, setOpen] = useState(false);
  return (
    <header
      className="sticky top-0 z-50 border-b md-hairline backdrop-blur-md"
      style={{ background: "color-mix(in oklab, #0A0E17 82%, transparent)" }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="md-serif text-2xl leading-none" style={{ color: "var(--md-text)" }}>Cleard</span>
        </Link>
        <nav className="hidden md:flex items-center gap-9">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-[13px] transition-colors hover:md-gold"
              style={{ color: "var(--md-text)" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <Link to="/join" hash="request" className="md-btn-gold-outline">
            Request Access
          </Link>
          <Link to="/portal" className="md-btn-gold">
            Client Portal
          </Link>
        </div>

        <button
          className="md:hidden p-2 -mr-2"
          onClick={() => setOpen((s) => !s)}
          aria-label="Menu"
          style={{ color: "var(--md-text)" }}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t md-hairline" style={{ background: "var(--md-bg)" }}>
          <div className="px-6 py-6 space-y-4">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="block text-base"
                style={{ color: "var(--md-text)" }}
              >
                {l.label}
              </Link>
            ))}
            <Link to="/join" hash="request" onClick={() => setOpen(false)} className="md-btn-gold-outline w-full">
              Request Access
            </Link>
            <Link to="/portal" onClick={() => setOpen(false)} className="md-btn-gold w-full">
              Client Portal
            </Link>

          </div>
        </div>
      )}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t md-hairline mt-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-14 grid gap-10 md:grid-cols-3 items-start">
        <div>
          <div className="md-serif text-3xl" style={{ color: "var(--md-text)" }}>Cleard</div>
          <div className="mt-4 text-[11px] uppercase tracking-[0.24em] md-muted">Coverage</div>
          <p className="mt-2 text-sm md-muted leading-relaxed">
            Statewide coverage across Florida.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 md:justify-center text-sm">
          <Link to="/products" className="hover:md-gold" style={{ color: "var(--md-text)" }}>Products</Link>
          <Link to="/process" className="hover:md-gold" style={{ color: "var(--md-text)" }}>How It Works</Link>
          <a href="https://floridianinc.com/terms" className="hover:md-gold" style={{ color: "var(--md-text)" }}>Terms</a>
          <a href="https://floridianinc.com/privacy" className="hover:md-gold" style={{ color: "var(--md-text)" }}>Privacy</a>
        </div>
        <div className="md:text-right text-sm md-muted space-y-1">
          <div>team@floridianinc.com</div>
          <div>(772) 675-3274</div>
        </div>
      </div>
      <div className="border-t md-hairline">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-5 text-[11px] md-muted">
          © 2026 Flōridian Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="marketing-dark min-h-screen flex flex-col">
      <PublicNav />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
