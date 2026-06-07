import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t hairline mt-32">
      <div className="mx-auto max-w-7xl px-6 py-16 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="font-display text-2xl tracking-tight">Flōridian</div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            A licensed private provider of permitting, plan review, and inspection
            services for residential general contractors across South Florida.
          </p>
          <p className="mt-6 label-eyebrow">License · CGC 1530218 / SI 0001284</p>
        </div>

        <div>
          <div className="label-eyebrow mb-4">Office</div>
          <p className="text-sm leading-relaxed">
            2601 South Bayshore Dr<br />
            Suite 740<br />
            Miami, FL 33133
          </p>
          <p className="mt-3 text-sm font-mono">+1 (305) 555-0144</p>
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
        <div className="mx-auto max-w-7xl px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Flōridian LLC. All rights reserved.</span>
          <span className="font-mono">FBC 2023 · 8th Edition · HVHZ</span>
        </div>
      </div>
    </footer>
  );
}
