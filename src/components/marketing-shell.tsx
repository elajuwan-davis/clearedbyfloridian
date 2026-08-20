import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, ArrowRight, ChevronDown } from "lucide-react";
import mark2d from "@/assets/cleard-mark-2d.png.asset.json";
import { TRADES } from "@/lib/trades";
/** Flat nav links — the only dropdown is Trades. */
const NAV_LINKS: Array<{ to: string; label: string }> = [
  { to: "/", label: "Home" },
  { to: "/product", label: "Product" },
  { to: "/pricing", label: "Pricing" },
  { to: "/compare", label: "Compare" },
  { to: "/pitch-deck", label: "Pitch Deck" },
];

/** Trade-specific landing pages. */
const TRADE_LINKS = TRADES.map((t) => ({
  to: "/trades/$slug" as const,
  params: { slug: t.slug },
  label: t.navLabel,
}));

const NEAR_BLACK = "#FAF3E6";
const BODY_GRAY = "#7A5C68";
const INK = "#2F4F4F";
const TEAL = "#673147";
const OAT = "#FAF3E6";
const BORDER = "#E0D3BC";
const SERIF = '"Fraunces", "Iowan Old Style", Georgia, serif';


/** The single marketing nav — identical on every public page. */
export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const [tradesOpen, setTradesOpen] = useState(false);
  return (
    <header
      className="sticky top-0 z-[100]"
      style={{ background: NEAR_BLACK, borderBottom: `1px solid ${BORDER}`, isolation: "isolate" }}
    >
      <div className="mx-auto flex h-[58px] max-w-7xl items-center justify-between gap-4 px-5 lg:px-8">
        <div className="flex min-w-0 items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 no-underline"
            style={{ flexShrink: 0 }}
          >
            <img src={mark2d.url} alt="Cleard" className="h-7 w-7 object-contain" />
            <span
              style={{
                color: TEAL,
                fontFamily: SERIF,
                fontWeight: 600,
                fontSize: 20,
                letterSpacing: "-0.02em",
                whiteSpace: "nowrap",
              }}
            >
              Cleard
            </span>
          </Link>

          <nav
            className="hidden items-center gap-5 md:flex"
            style={{ flexWrap: "nowrap", whiteSpace: "nowrap" }}
          >
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

            <div
              className="relative"
              onMouseEnter={() => setTradesOpen(true)}
              onMouseLeave={() => setTradesOpen(false)}
            >
              <button
                type="button"
                onClick={() => setTradesOpen((s) => !s)}
                className="inline-flex items-center gap-1 text-[14px] transition-opacity hover:opacity-70"
                style={{ color: BODY_GRAY, whiteSpace: "nowrap" }}
                aria-expanded={tradesOpen}
              >
                Trades
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {tradesOpen && (
                <div
                  className="absolute left-0 top-full min-w-[220px] pt-2"
                  style={{ zIndex: 60 }}
                >
                  <div
                    className="grid grid-cols-2 gap-x-2"
                    style={{
                      background: NEAR_BLACK,
                      border: `1px solid ${BORDER}`,
                      minWidth: 460,
                    }}
                  >

                    {TRADE_LINKS.map((t) => (
                      <Link
                        key={t.label}
                        to={t.to}
                        params={t.params}
                        onClick={() => setTradesOpen(false)}
                        className="block px-4 py-3 text-[14px] no-underline transition-opacity hover:opacity-70"
                        style={{ color: INK }}
                      >
                        {t.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
            style={{ background: TEAL, color: OAT, fontWeight: 600, whiteSpace: "nowrap" }}
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
            {[...NAV_LINKS, { to: "/login", label: "Sign in" }].map((l) => (
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

            <div className="pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
              <div
                className="pt-3 text-[10.5px] uppercase tracking-[0.22em]"
                style={{ color: INK, fontWeight: 700 }}
              >
                Trades
              </div>
              <div className="mt-3 space-y-3">
                {TRADE_LINKS.map((t) => (
                  <Link
                    key={t.label}
                    to={t.to}
                    params={t.params}
                    onClick={() => setOpen(false)}
                    className="block text-[15px] no-underline"
                    style={{ color: BODY_GRAY }}
                  >
                    {t.label}
                  </Link>
                ))}
              </div>
            </div>

            <Link
              to="/join"
              hash="request"
              onClick={() => setOpen(false)}
              className="inline-flex w-full items-center justify-center px-4 py-2.5 text-sm no-underline"
              style={{ color: OAT, background: TEAL, fontWeight: 600 }}
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
              fontFamily: SERIF,
              fontWeight: 600,
              color: "#FAF3E6",
            }}
          >
            Cleard
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-x-8 gap-y-2 text-[13px]">
          <Link to="/product" className="no-underline" style={{ color: "rgba(255,255,255,0.7)" }}>Product</Link>
          <a href="https://floridianinc.com/privacy" className="no-underline" style={{ color: "rgba(255,255,255,0.7)" }}>Privacy</a>
          <a href="https://floridianinc.com/terms" className="no-underline" style={{ color: "rgba(255,255,255,0.7)" }}>Terms</a>
          <Link to="/contact" className="no-underline" style={{ color: "rgba(255,255,255,0.7)" }}>Contact</Link>
        </nav>

        <div className="flex flex-col gap-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.45)" }}>
            Company
          </div>
          <Link to="/investor" className="no-underline text-[13px]" style={{ color: "rgba(255,255,255,0.7)" }}>
            Investor Deck
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.45)" }}>
            For Municipalities
          </div>
          <Link to="/municipalities" className="no-underline text-[13px]" style={{ color: "rgba(255,255,255,0.7)" }}>
            CleardGov — Building department services
          </Link>
          <span className="text-[12px]" style={{ color: "rgba(200,196,188,0.5)" }}>
            cleard.io/municipalities
          </span>
        </div>


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
            fontFamily: SERIF,
            fontWeight: 500,
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
