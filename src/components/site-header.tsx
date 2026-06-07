import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/services", label: "Services" },
  { to: "/process", label: "Process" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b hairline bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3 group">
          <LogoMark />
          <div className="flex flex-col leading-none">
            <span className="font-display text-base tracking-tight">Flōridian</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Private Provider · FL
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-sm text-foreground/75 hover:text-foreground transition-colors"
              activeProps={{ className: "text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/portal">Client portal</Link>
          </Button>
          <Button asChild size="sm" className="rounded-sm">
            <Link to="/contact">Request review</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function LogoMark() {
  return (
    <div className="relative h-9 w-9 border hairline bg-card flex items-center justify-center">
      <div className="absolute inset-1 border hairline opacity-60" />
      <span className="relative font-display text-base leading-none">F</span>
      <span className="absolute -top-1 -right-1 h-1.5 w-1.5 bg-accent rounded-full" />
    </div>
  );
}
