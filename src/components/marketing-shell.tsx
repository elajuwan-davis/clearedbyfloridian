import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, ArrowRight, ChevronDown } from "lucide-react";
import mark2d from "@/assets/cleard-mark-2d.png.asset.json";
import { TRADES } from "@/lib/trades";

/** Flat nav links — dropdowns are Solutions and Trades. */
const NAV_LINKS: Array<{ to: string; label: string }> = [
  { to: "/", label: "Home" },
  { to: "/contact", label: "Partnerships" },
  { to: "/pricing", label: "Pricing" },
  { to: "/411", label: "411" },
];


/** Solutions links. */
const SOLUTION_LINKS: Array<{ to: string; label: string }> = [
  { to: "/join", label: "Cleard — For Contractors" },
  { to: "/cleardapproval", label: "CleardApproval — For HOAs" },
  { to: "/municipalities", label: "CleardGov — For Municipalities" },
];


const NEAR_BLACK = "#FAF3E6";
const BODY_GRAY = "#7A5C68";
const INK = "#2F4F4F";
const TEAL = "#673147";
const OAT = "#FAF3E6";
const BORDER = "#E0D3BC";
const SERIF = '"Fraunces", "Iowan Old Style", Georgia, serif';


/** The single marketing nav — identical on every public page. */
// nav v2
export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const [tradesOpen, setTradesOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  return (
    <header
      className="sticky top-0 z-[100]"
      style={{ background: NEAR_BLACK, borderBottom: `1px solid ${BORDER}`, isolation: "isolate" }}
    >
      <div className="mx-auto grid h-[68px] max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 lg:px-10">
        <div className="flex min-w-0 items-center" style={{ gridColumn: 1 }}>
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
        </div>

        <nav
            className="hidden items-center justify-center gap-8 md:flex"
            style={{ flexWrap: "nowrap", whiteSpace: "nowrap", gridColumn: 2 }}
          >
            <Link
              to="/"
              className="text-[14px] no-underline transition-opacity hover:opacity-70"
              style={{ color: BODY_GRAY, whiteSpace: "nowrap", flexShrink: 0 }}
            >
              Home
            </Link>

            <div
              className="relative"
              onMouseEnter={() => setSolutionsOpen(true)}
              onMouseLeave={() => setSolutionsOpen(false)}
            >
              <button
                type="button"
                data-plain
                onClick={() => setSolutionsOpen((s) => !s)}
                className="inline-flex items-center gap-1 text-[14px] transition-opacity hover:opacity-70"
                style={{
                  color: BODY_GRAY,
                  whiteSpace: "nowrap",
                  background: "none",
                  border: "none",
                  padding: 0,
                  borderRadius: 0,
                  boxShadow: "none",
                  backdropFilter: "none",
                  WebkitBackdropFilter: "none",
                }}
                aria-expanded={solutionsOpen}
              >
                Solutions
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {solutionsOpen && (
                <div
                  className="absolute left-0 top-full min-w-[220px] pt-2"
                  style={{ zIndex: 60 }}
                >
                  <div
                    style={{
                      background: NEAR_BLACK,
                      border: `1px solid ${BORDER}`,
                      minWidth: 280,
                    }}
                  >
                    {SOLUTION_LINKS.map((t) => (
                      <Link
                        key={t.label}
                        to={t.to}
                        onClick={() => setSolutionsOpen(false)}
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

            {NAV_LINKS.filter((l) => l.to === "/contact").map((l) => (
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
                data-plain
                onClick={() => setTradesOpen((s) => !s)}
                className="inline-flex items-center gap-1 text-[14px] transition-opacity hover:opacity-70"
                style={{
                  color: BODY_GRAY,
                  whiteSpace: "nowrap",
                  background: "none",
                  border: "none",
                  padding: 0,
                  borderRadius: 0,
                  boxShadow: "none",
                  backdropFilter: "none",
                  WebkitBackdropFilter: "none",
                }}
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
                    style={{
                      background: NEAR_BLACK,
                      border: `1px solid ${BORDER}`,
                      minWidth: 280,
                    }}
                  >
                    {TRADES.map((t) => (
                      <Link
                        key={t.slug}
                        to="/trades/$slug"
                        params={{ slug: t.slug }}
                        onClick={() => setTradesOpen(false)}
                        className="block px-4 py-3 text-[14px] no-underline transition-opacity hover:opacity-70"
                        style={{ color: INK }}
                      >
                        {t.navLabel}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/pricing"
              className="text-[14px] no-underline transition-opacity hover:opacity-70"
              style={{ color: BODY_GRAY, whiteSpace: "nowrap", flexShrink: 0 }}
            >
              Pricing
            </Link>

            <Link
              to="/411"
              className="text-[14px] no-underline transition-opacity hover:opacity-70"
              style={{ color: BODY_GRAY, whiteSpace: "nowrap", flexShrink: 0 }}
            >
              411
            </Link>
          </nav>


        <div className="flex items-center justify-end gap-3" style={{ flexShrink: 0, gridColumn: 3 }}>
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
            className="cl-glass foil-sheen inline-flex items-center px-5 py-2 text-[13.5px] no-underline transition-transform duration-200 hover:scale-[1.03]"
            style={{
              backgroundImage: "var(--gradient-copper)",
              border: "1px solid color-mix(in oklab, var(--copper-deep) 70%, transparent)",
              color: "#FFF8EC",
              fontWeight: 600,
              whiteSpace: "nowrap",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45)",
            }}
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
                Solutions
              </div>
              <div className="mt-3 space-y-3">
                {SOLUTION_LINKS.map((t) => (
                  <Link
                    key={t.label}
                    to={t.to}
                    onClick={() => setOpen(false)}
                    className="block text-[15px] no-underline"
                    style={{ color: BODY_GRAY }}
                  >
                    {t.label}
                  </Link>
                ))}

              </div>
            </div>

            <div className="pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
              <div
                className="pt-3 text-[10.5px] uppercase tracking-[0.22em]"
                style={{ color: INK, fontWeight: 700 }}
              >
                Trades
              </div>
              <div className="mt-3 space-y-3">
                {TRADES.map((t) => (
                  <Link
                    key={t.slug}
                    to="/trades/$slug"
                    params={{ slug: t.slug }}
                    onClick={() => setOpen(false)}
                    className="block text-[15px] no-underline"
                    style={{ color: BODY_GRAY }}
                  >
                    {t.navLabel}
                  </Link>
                ))}
              </div>
            </div>

            <Link
              to="/join"
              hash="request"
              onClick={() => setOpen(false)}
              className="cl-glass foil-sheen inline-flex w-full items-center justify-center px-4 py-2.5 text-sm no-underline"
              style={{
                color: "#FFF8EC",
                backgroundImage: "var(--gradient-copper)",
                border: "1px solid color-mix(in oklab, var(--copper-deep) 70%, transparent)",
                fontWeight: 600,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45)",
              }}
            >
              Get early access
            </Link>

          </div>
        </div>
      )}
    </header>
  );
}



const FOOT_HEAD = "text-[10px] font-bold uppercase";
const FOOT_HEAD_STYLE = { letterSpacing: "0.18em", color: "rgba(255,255,255,0.45)" } as const;
const FOOT_LINK = "block text-[13px] no-underline";
const FOOT_LINK_STYLE = { color: "rgba(255,255,255,0.72)" } as const;

/** The single public footer — identical on every marketing page. */
export function MarketingFooter() {
  return (
    <footer style={{ background: INK, borderTop: "1px solid rgba(255,255,255,0.12)" }}>
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <div className="grid gap-12 py-16 md:grid-cols-[1.2fr_2.8fr]">
          <div>
            <Link to="/" className="no-underline">
              <span
                className="text-[22px] tracking-[-0.03em]"
                style={{ fontFamily: SERIF, fontWeight: 600, color: "#FAF3E6" }}
              >
                Cleard
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
              The operating system that runs everything behind your construction projects.
            </p>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className={FOOT_HEAD} style={FOOT_HEAD_STYLE}>Platform</div>
              <div className="mt-4 space-y-2.5">
                <Link to="/pricing" className={FOOT_LINK} style={FOOT_LINK_STYLE}>Pricing</Link>
                
                <Link to="/" hash="watch-it-run" className={FOOT_LINK} style={FOOT_LINK_STYLE}>How it works</Link>
              </div>
            </div>

            <div>
              <div className={FOOT_HEAD} style={FOOT_HEAD_STYLE}>Solutions</div>
              <div className="mt-4 space-y-2.5">
                {SOLUTION_LINKS.map((t) => (
                  <Link
                    key={t.label}
                    to={t.to}
                    className={FOOT_LINK}
                    style={FOOT_LINK_STYLE}
                  >
                    {t.label}
                  </Link>
                ))}

              </div>
            </div>

            <div>
              <div className={FOOT_HEAD} style={FOOT_HEAD_STYLE}>Company</div>
              <div className="mt-4 space-y-2.5">
                <Link to="/contact" className={FOOT_LINK} style={FOOT_LINK_STYLE}>Contact</Link>
                <Link to="/pitch-deck" className={FOOT_LINK} style={FOOT_LINK_STYLE}>Pitch Deck</Link>
                
              </div>
            </div>

            <div>
              <div className={FOOT_HEAD} style={FOOT_HEAD_STYLE}>Resources</div>
              <div className="mt-4 space-y-2.5">
                <Link to="/login" className={FOOT_LINK} style={FOOT_LINK_STYLE}>Client portal</Link>
                <Link to="/privacy" className={FOOT_LINK} style={FOOT_LINK_STYLE}>Privacy Policy</Link>
                <Link to="/terms" className={FOOT_LINK} style={FOOT_LINK_STYLE}>Terms of Service</Link>
              </div>
            </div>
          </div>
        </div>

        <div
          className="flex flex-wrap items-center gap-3 py-6"
          style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}
        >
          {[
            "[Insert actual security/compliance status here]",
            "Encrypted document storage",
            "Role-based access control",
          ].map((b) => (
            <span
              key={b}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-[11px] uppercase"
              style={{
                letterSpacing: "0.14em",
                color: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(255,255,255,0.18)",
              }}
            >
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.75} />
              {b}
            </span>
          ))}
        </div>

        <div className="pb-10 text-[12px]" style={{ color: "rgba(255,255,255,0.45)" }}>
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
