import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t hairline mt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="wordmark text-6xl leading-none">Cleared</div>
          <div className="wordmark-subline mt-2">by Flōridian · Exclusive to GC Clients</div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            The private-provider permitting arm of Flōridian LLC — offered
            exclusively to active Flōridian luxury pool and hardscape clients
            and their licensed general contractors.
          </p>
          <p className="mt-6 label-eyebrow">License · CGC 1530218 / SI 0001284</p>
        </div>

        <div>
          <div className="label-eyebrow mb-4">Office</div>
          <p className="text-sm leading-relaxed">
            215 Clematis Street<br />
            Suite 400<br />
            West Palm Beach, FL 33401
          </p>
          <p className="mt-3 text-sm font-mono">+1 (561) 555-0144</p>
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
          <span>© {new Date().getFullYear()} Flōridian LLC · Established 1998, West Palm Beach.</span>
          <span className="font-mono">FBC 2023 · 8th Edition · HVHZ</span>
        </div>
      </div>
    </footer>
  );
}
