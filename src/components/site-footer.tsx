import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t hairline mt-32">
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
