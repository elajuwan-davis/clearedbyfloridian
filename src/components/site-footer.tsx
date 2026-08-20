import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t hairline mt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-base"
              style={{ background: "linear-gradient(135deg, #673147, #4E6B5C)" }}
            >
              C
            </div>
            <span className="wordmark text-3xl">Cleard</span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Private-provider permitting for leading general contractors —
            plan review, inspections, and permit coordination on a
            documented clock.
          </p>
          <Link
            to="/portal"
            className="inline-flex items-center gap-2 mt-5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--green, #4E6B5C)" }}
          >
            Get early access →
          </Link>
        </div>

        <div>
          <div className="label-eyebrow mb-4">Coverage</div>
          <p className="text-sm leading-relaxed">
            Nationwide coverage.
          </p>
          <p className="mt-4 text-sm font-mono">info@cleard.com</p>
        </div>

        <div>
          <div className="label-eyebrow mb-4">Navigate</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/join" className="hover:opacity-70 transition-opacity">For Contractors</Link></li>
            
            <li><Link to="/contact" className="hover:opacity-70 transition-opacity">Contact</Link></li>
            <li><Link to="/portal" className="hover:opacity-70 transition-opacity">Client portal</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t hairline">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Cleard.</span>
          <span className="font-mono">FBC 2023 · 8th Edition · HVHZ</span>
        </div>
      </div>
    </footer>
  );
}
