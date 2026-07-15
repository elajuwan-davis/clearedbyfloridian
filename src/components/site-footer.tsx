import { Link } from "@tanstack/react-router";
import { Apple, Smartphone } from "lucide-react";

function AppDownloadBanner() {
  // Dummy QR code — decorative SVG matrix, not a real scannable code
  const cells = Array.from({ length: 21 * 21 }, (_, i) => {
    const x = i % 21;
    const y = Math.floor(i / 21);
    // Finder patterns in three corners
    const inFinder =
      (x < 7 && y < 7) ||
      (x > 13 && y < 7) ||
      (x < 7 && y > 13);
    if (inFinder) {
      const fx = x < 7 ? x : x - 14;
      const fy = y < 7 ? y : y - 14;
      const ring = fx === 0 || fx === 6 || fy === 0 || fy === 6;
      const inner = fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4;
      return ring || inner;
    }
    // Deterministic pseudo-random pattern
    return ((x * 13 + y * 7 + x * y) % 3) === 0;
  });

  return (
    <div className="border-b hairline bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="bg-background p-2 rounded-sm shrink-0">
            <svg viewBox="0 0 21 21" className="w-24 h-24" shapeRendering="crispEdges">
              {cells.map((on, i) => on ? (
                <rect
                  key={i}
                  x={i % 21}
                  y={Math.floor(i / 21)}
                  width="1"
                  height="1"
                  fill="#000"
                />
              ) : null)}
            </svg>
          </div>
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] opacity-60">
              Mobile
            </div>
            <div className="mt-2 display-serif text-3xl md:text-4xl tracking-tight">
              Download our app.
            </div>
            <p className="mt-2 text-sm opacity-70 max-w-sm">
              Scan the code to install Cleared on iOS or Android — permits,
              inspections, and messages from the jobsite.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <a
            href="#"
            className="flex items-center gap-3 border border-background/25 hover:bg-background/10 px-5 py-3 rounded-sm transition-colors"
          >
            <Apple className="h-6 w-6" />
            <div className="text-left">
              <div className="font-mono text-[9px] uppercase tracking-widest opacity-60">
                Download on the
              </div>
              <div className="font-display text-sm">App Store</div>
            </div>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 border border-background/25 hover:bg-background/10 px-5 py-3 rounded-sm transition-colors"
          >
            <Smartphone className="h-6 w-6" />
            <div className="text-left">
              <div className="font-mono text-[9px] uppercase tracking-widest opacity-60">
                Get it on
              </div>
              <div className="font-display text-sm">Google Play</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t hairline mt-32">
      <AppDownloadBanner />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="wordmark text-6xl leading-none">Cleared</div>
          <div className="wordmark-subline mt-2">by Flōridian</div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Private-provider permitting for South Florida's elite general
            contractors — plan review, inspections, and permit coordination
            on a statutory clock.
          </p>
        </div>

        <div>
          <div className="label-eyebrow mb-4">Coverage</div>
          <p className="text-sm leading-relaxed">
            Broward · Palm Beach<br />
            Martin · St. Lucie<br />
            Indian River
          </p>
          <p className="mt-3 text-sm font-mono">permits@floridianinc.com</p>
        </div>

        <div>
          <div className="label-eyebrow mb-4">Navigate</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/services" className="hover:text-accent">Services</Link></li>
            <li><Link to="/process" className="hover:text-accent">Process</Link></li>
            <li><Link to="/about" className="hover:text-accent">About</Link></li>
            <li><Link to="/contact" className="hover:text-accent">Contact</Link></li>
            <li><Link to="/portal" className="hover:text-accent">Client portal</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t hairline">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Cleared by Flōridian.</span>
          <span className="font-mono">FBC 2023 · 8th Edition · HVHZ</span>
        </div>
      </div>
    </footer>
  );
}
