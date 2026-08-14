import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, ArrowRight } from "lucide-react";
import {
  MarketingNavDropdown,
  PRODUCT_MENU,
  CONTRACTORS_MENU,
} from "@/components/marketing-nav-dropdown";

// About is intentionally NOT linked publicly — the page stays live at /about
// for direct-URL / internal use only.
const NAV_LINKS: Array<{ to: string; label: string; soon?: boolean }> = [];




const NEAR_BLACK = "#FFFFFF";
const BODY_GRAY = "#6B6860";
const INK = "#111110";
const TEAL = "#00B4A8";
const BORDER = "#E4E2DE";

function MarketingNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50" style={{ background: NEAR_BLACK, borderBottom: `1px solid ${BORDER}` }}>
      <div className="mx-auto max-w-7xl px-6 lg:px-10 h-[76px] flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center no-underline min-w-0">
          <span
            className="text-[19px] tracking-[-0.01em]"
            style={{
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
              fontWeight: 700,
              color: INK,
            }}
          >
            Cleard
          </span>
        </Link>

        <nav className="hidden md:flex flex-1 items-center justify-center gap-10">
          <MarketingNavDropdown
            label="Product"
            to="/products"
            sections={PRODUCT_MENU}
            triggerColor={BODY_GRAY}
            triggerSize={13.5}
          />
          <MarketingNavDropdown
            label="Contractors"
            to="/join"
            sections={CONTRACTORS_MENU}
            triggerColor={BODY_GRAY}
            triggerSize={13.5}
          />
          {NAV_LINKS.map((l) =>
            l.soon ? (
              <span key={l.to} className="text-[13.5px] cursor-default flex items-center gap-1.5" style={{ color: BODY_GRAY }}>
                {l.label}
                <span className="text-[9px] uppercase tracking-[0.2em]">Soon</span>
              </span>
            ) : (
              <Link
                key={l.to}
                to={l.to}
                className="text-[13.5px] no-underline transition-opacity hover:opacity-70"
                style={{ color: BODY_GRAY, fontWeight: 400 }}
              >
                {l.label}
              </Link>
            )
          )}
        </nav>

        <div className="hidden md:flex items-center gap-7">
          <Link to="/login" className="text-[13.5px] no-underline" style={{ color: BODY_GRAY }}>
            Sign in
          </Link>
          <Link
            to="/join"
            hash="request"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-[13.5px] font-medium no-underline"
            style={{
              color: INK,
              border: "none",
              background: TEAL,
              fontWeight: 700,
            }}
          >
            Get early access
          </Link>
        </div>

        <button
          className="md:hidden p-2 -mr-2"
          onClick={() => setOpen((s) => !s)}
          aria-label="Menu"
          style={{ color: BODY_GRAY }}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden" style={{ background: NEAR_BLACK, borderTop: `1px solid ${BORDER}` }}>
          <div className="px-6 py-6 space-y-4">
            <Link to="/products" onClick={() => setOpen(false)} className="block text-base no-underline" style={{ color: BODY_GRAY }}>
              Product
            </Link>
            <Link to="/join" onClick={() => setOpen(false)} className="block text-base no-underline" style={{ color: BODY_GRAY }}>
              Contractors
            </Link>
            {NAV_LINKS.map((l) =>
              l.soon ? (
                <div key={l.to} className="flex items-center gap-2 text-sm" style={{ color: BODY_GRAY }}>
                  {l.label} <span className="text-[9px] uppercase tracking-[0.2em]">Soon</span>
                </div>
              ) : (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="block text-base no-underline"
                  style={{ color: BODY_GRAY }}
                >
                  {l.label}
                </Link>
              )
            )}
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="block text-base no-underline"
              style={{ color: BODY_GRAY }}
            >
              Sign in
            </Link>
            <Link
              to="/join"
              hash="request"
              onClick={() => setOpen(false)}
              className="inline-flex w-full items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium no-underline"
              style={{ color: INK, background: TEAL, fontWeight: 700 }}
            >
              Get early access
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}


function MarketingFooter() {
  return (
    <footer style={{ background: INK, borderTop: "1px solid rgba(255,255,255,0.12)" }}>
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-12 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <Link to="/" className="flex items-center no-underline">
          <span
            className="text-[18px] tracking-[-0.03em]"
            style={{
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
              fontWeight: 700,
              color: "#FFFFFF",
            }}
          >
            Cleard
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-x-8 gap-y-2 text-[13px]">
          <Link to="/products" className="no-underline" style={{ color: "rgba(255,255,255,0.7)" }}>Product</Link>
          <a href="https://floridianinc.com/privacy" className="no-underline" style={{ color: "rgba(255,255,255,0.7)" }}>Privacy</a>
          <a href="https://floridianinc.com/terms" className="no-underline" style={{ color: "rgba(255,255,255,0.7)" }}>Terms</a>
          <Link to="/contact" className="no-underline" style={{ color: "rgba(255,255,255,0.7)" }}>Contact</Link>
        </nav>

        <div className="text-[12px]" style={{ color: "rgba(200,196,188,0.6)" }}>
          © 2026 Cleard
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
