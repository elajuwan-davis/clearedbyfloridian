import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, ArrowRight } from "lucide-react";

// Pricing and Compare are intentionally NOT linked publicly — the pages stay
// live at /pricing and /versus for internal use only.
const NAV_LINKS: Array<{ to: string; label: string; soon?: boolean }> = [
  { to: "/products", label: "Product" },
  { to: "/join", label: "For GCs" },
  
  { to: "/about", label: "About" },
];



function MarketingNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50"
      style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(10px)" }}>
      <div className="mx-auto max-w-7xl px-6 lg:px-10 h-[68px] flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2.5 no-underline min-w-0">
          <div
            className="h-7 w-7 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{
              background: "#16A34A",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            C
          </div>
          <span
            className="font-semibold text-[15px] tracking-[-0.01em]"
            style={{
              fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
              color: "var(--ink, #0F1E2E)",
            }}
          >
            Cleard
          </span>
        </Link>

        <nav className="hidden md:flex flex-1 items-center justify-center gap-8">
          {NAV_LINKS.map((l) =>
            l.soon ? (
              <span key={l.to} className="text-[13px] md-muted cursor-default flex items-center gap-1.5">
                {l.label}
                <span className="text-[9px] uppercase tracking-[0.2em]" style={{ color: "var(--md-obsidian)" }}>Soon</span>
              </span>
            ) : (
              <Link
                key={l.to}
                to={l.to}
                className="text-[13px] transition-colors"
                style={{ color: "var(--md-text)" }}
              >
                {l.label}
              </Link>
            )
          )}
        </nav>

        <div className="hidden md:flex items-center gap-5">
          <Link
            to="/login"
            className="text-[13.5px] font-medium"
            style={{ color: "#0F1E2E" }}
          >
            Sign in
          </Link>
          <Link
            to="/join"
            hash="request"
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13.5px] font-semibold text-white"
            style={{ background: "#16A34A" }}
          >
            Get early access <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <button
          className="md:hidden p-2 -mr-2"
          onClick={() => setOpen((s) => !s)}
          aria-label="Menu"
          style={{ color: "var(--md-text)" }}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t md-hairline" style={{ background: "#FFFFFF" }}>
          <div className="px-6 py-6 space-y-4">
            {NAV_LINKS.map((l) =>
              l.soon ? (
                <div key={l.to} className="flex items-center gap-2 text-sm md-muted">
                  {l.label} <span className="text-[9px] uppercase tracking-[0.2em]" style={{ color: "var(--md-obsidian)" }}>Soon</span>
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
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="block text-base font-medium"
              style={{ color: "#0F1E2E" }}
            >
              Sign in
            </Link>
            <Link
              to="/join"
              hash="request"
              onClick={() => setOpen(false)}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
              style={{ background: "#16A34A" }}
            >
              Get early access <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function MarketingFooter() {
  return (
    <footer className="md-section-dark mt-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-14 grid gap-10 md:grid-cols-3 items-start">
        <div>
          <div className="flex items-center gap-2.5">
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ background: "#16A34A", fontFamily: "'Space Grotesk', sans-serif" }}
            >
              C
            </div>
            <span className="font-semibold text-[18px]" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#FFFFFF" }}>
              Cleard
            </span>
          </div>
          <div className="mt-4 text-[11px] uppercase tracking-[0.15em]" style={{ color: "color-mix(in oklab, #fff 70%, transparent)" }}>Coverage</div>
          <p className="mt-2 text-sm md-muted leading-relaxed">
            Statewide coverage across Florida.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 md:justify-center text-sm">
          <Link to="/products" style={{ color: "#FFFFFF" }}>Products</Link>
          <Link to="/process" style={{ color: "#FFFFFF" }}>How It Works</Link>
          
          <a href="https://floridianinc.com/terms" style={{ color: "#FFFFFF" }}>Terms</a>
          <a href="https://floridianinc.com/privacy" style={{ color: "#FFFFFF" }}>Privacy</a>
        </div>
        <div className="md:text-right text-sm md-muted space-y-1">
          <div>info@cleard.com</div>
          <div>(772) 675-3274</div>
        </div>
      </div>
      <div className="border-t md-hairline">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-5 text-[11px] md-muted">
          © 2026 Cleard Inc. All rights reserved.
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
        <h1
          className="mt-6 md-in md-in-2 max-w-4xl"
          style={{
            fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
            fontWeight: 800,
            fontSize: "clamp(2.25rem, 6vw, 4.5rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            color: "var(--md-text)",
          }}
        >
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
