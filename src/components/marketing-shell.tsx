import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, ArrowRight } from "lucide-react";

const NAV_LINKS = [
  { to: "/products", label: "Products" },
  { to: "/process", label: "How It Works" },
  { to: "/join", label: "For Builders" },
  { to: "/pricing", label: "Pricing", soon: true },
] as const;

function MarketingNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 md-hairline border-b backdrop-blur-md"
      style={{ background: "color-mix(in oklab, #0A0E17 82%, transparent)" }}>
      <div className="mx-auto max-w-7xl px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-baseline gap-2 min-w-0">
          <span className="md-serif text-2xl leading-none" style={{ color: "var(--md-text)" }}>Cléared</span>
          <span className="hidden sm:inline text-[10px] uppercase tracking-[0.24em] md-muted">
            by Flōridian
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-9">
          {NAV_LINKS.map((l) =>
            l.soon ? (
              <span key={l.to} className="text-[13px] md-muted cursor-default flex items-center gap-1.5">
                {l.label}
                <span className="text-[9px] uppercase tracking-[0.2em] md-gold">Soon</span>
              </span>
            ) : (
              <Link
                key={l.to}
                to={l.to}
                className="text-[13px] transition-colors hover:md-gold"
                style={{ color: "var(--md-text)" }}
              >
                {l.label}
              </Link>
            )
          )}
        </nav>

        <div className="hidden md:block">
          <Link to="/join" hash="request" className="md-btn-gold-outline">
            Request Access
          </Link>
        </div>

        <button
          className="md:hidden p-2 -mr-2"
          onClick={() => setOpen((s) => !s)}
          aria-label="Menu"
          style={{ color: "var(--md-text)" }}
        >
          {open ? <Menu className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t md-hairline" style={{ background: "var(--md-bg)" }}>
          <div className="px-6 py-6 space-y-4">
            {NAV_LINKS.map((l) =>
              l.soon ? (
                <div key={l.to} className="flex items-center gap-2 text-sm md-muted">
                  {l.label} <span className="text-[9px] uppercase tracking-[0.2em] md-gold">Soon</span>
                </div>
              ) : (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="block text-base"
                  style={{ color: "var(--md-text)" }}
                >
                  {l.label}
                </Link>
              )
            )}
            <Link to="/join" hash="request" onClick={() => setOpen(false)} className="md-btn-gold-outline w-full">
              Request Access
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function MarketingFooter() {
  return (
    <footer className="border-t md-hairline mt-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-14 grid gap-10 md:grid-cols-3 items-start">
        <div>
          <div className="md-serif text-3xl" style={{ color: "var(--md-text)" }}>Cléared</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.24em] md-muted">
            By Flōridian · Est. 1998
          </div>
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

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="marketing-dark min-h-screen flex flex-col">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
}) {
  return (
    <section className="relative border-b md-hairline overflow-hidden">
      <div className="absolute inset-0 md-grain opacity-60" />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-10 py-24 md:py-36">
        <div className="md-eyebrow md-in md-in-1">{eyebrow}</div>
        <h1 className="mt-6 md-serif text-4xl sm:text-6xl md:text-7xl max-w-4xl md-in md-in-2"
            style={{ color: "var(--md-text)" }}>
          {title}
        </h1>
        {intro && (
          <p className="mt-6 max-w-2xl text-base sm:text-lg md-muted md-in md-in-3">
            {intro}
          </p>
        )}
      </div>
    </section>
  );
}

export { ArrowRight };
