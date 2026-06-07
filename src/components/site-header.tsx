import { Link } from "@tanstack/react-router";

function LogoMark() {
  return (
    <div className="relative h-9 w-9 border hairline bg-card flex items-center justify-center">
      <div className="absolute inset-1 border hairline opacity-60" />
      <span className="relative font-display text-base leading-none">C</span>
      <span className="absolute -top-1 -right-1 h-1.5 w-1.5 bg-accent rounded-full" />
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b hairline bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3 group">
          <LogoMark />
          <div className="flex flex-col leading-[1]">
            <span className="wordmark text-2xl">Cleared</span>
            <span className="wordmark-subline mt-1">
              by Flōridian · Exclusive to GC Clients
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link to="/services" className="text-sm hover:text-accent transition-colors">Services</Link>
          <Link to="/process" className="text-sm hover:text-accent transition-colors">Process</Link>
          <Link to="/about" className="text-sm hover:text-accent transition-colors">About</Link>
          <Link to="/contact" className="text-sm hover:text-accent transition-colors">Contact</Link>
          <Link
            to="/portal"
            className="text-sm font-mono uppercase tracking-[0.18em] text-foreground border hairline px-3 py-1.5 hover:bg-secondary transition-colors"
          >
            Client portal
          </Link>
        </nav>
      </div>
    </header>
  );
}
