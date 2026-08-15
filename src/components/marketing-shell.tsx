import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, ArrowRight } from "lucide-react";
import {
  MarketingNavDropdown,
  PRODUCT_MENU,
  CONTRACTORS_MENU,
} from "@/components/marketing-nav-dropdown";

/** Flat nav links, rendered after the two dropdowns on every marketing page. */
const NAV_LINKS: Array<{ to: string; label: string }> = [
  { to: "/pricing", label: "Pricing" },
  { to: "/compare", label: "Compare" },
  { to: "/about", label: "About" },
];

const NEAR_BLACK = "#FFFFFF";
const BODY_GRAY = "#6B6860";
const INK = "#111110";
const TEAL = "#00B4A8";
const BORDER = "#E4E2DE";

/** The single marketing nav — identical on every public page. */
export function MarketingNav() {
  const [open, setOpen] = useState(false);
  return (
    <header
      className="sticky top-0 z-50"
      style={{ background: NEAR_BLACK, borderBottom: `1px solid ${BORDER}` }}
    >
      <div className="mx-auto flex h-[58px] max-w-7xl items-center justify-between gap-4 px-5 lg:px-8">
        <div className="flex min-w-0 items-center gap-6">
          <Link
            to="/"
            className="no-underline"
            style={{
              color: INK,
              fontWeight: 700,
              fontSize: 20,
              letterSpacing: "-0.03em",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Cleard
          </Link>

          <nav
            className="hidden items-center gap-5 md:flex"
            style={{ flexWrap: "nowrap", whiteSpace: "nowrap" }}
          >
            <div style={{ flexShrink: 0, whiteSpace: "nowrap" }}>
              <MarketingNavDropdown
                label="Product"
                to="/products"
                sections={PRODUCT_MENU}
                triggerColor={BODY_GRAY}
              />
            </div>
            <div style={{ flexShrink: 0, whiteSpace: "nowrap" }}>
              <MarketingNavDropdown
                label="For Contractors"
                to="/join"
                sections={CONTRACTORS_MENU}
                triggerColor={BODY_GRAY}
              />
            </div>
            {NAV_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-[14px] no-underline transition-opacity hover:opacity-70"
                style={{ color: BODY_GRAY, whiteSpace: "nowrap", flexShrink: 0 }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3" style={{ flexShrink: 0 }}>
          <Link
            to="/login"
            className="hidden text-[14px] no-underline sm:inline"
            style={{ color: BODY_GRAY, whiteSpace: "nowrap" }}
          >
            Sign in
          </Link>
          <Link
            to="/join"
            hash="request"
            className="inline-flex items-center px-4 py-2 text-[13.5px] no-underline"
            style={{ background: TEAL, color: INK, fontWeight: 700, whiteSpace: "nowrap" }}
          >
            Get early access
          </Link>
          <button
            className="-mr-2 p-2 md:hidden"
            onClick={() => setOpen((s) => !s)}
            aria-label="Menu"
            style={{ color: BODY_GRAY }}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden" style={{ background: NEAR_BLACK, borderTop: `1px solid ${BORDER}` }}>
          <div className="space-y-4 px-6 py-6">
            {[
              { to: "/products", label: "Product" },
              { to: "/join", label: "For Contractors" },
              ...NAV_LINKS,
              { to: "/login", label: "Sign in" },
            ].map((l) => (
              <Link
                key={l.label}
                to={l.to}
                onClick={() => setOpen(false)}
                className="block text-base no-underline"
                style={{ color: BODY_GRAY }}
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/join"
              hash="request"
              onClick={() => setOpen(false)}
              className="inline-flex w-full items-center justify-center px-4 py-2.5 text-sm no-underline"
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
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
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
