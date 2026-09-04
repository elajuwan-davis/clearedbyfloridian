import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import wordmarkCopper from "@/assets/cleard-wordmark-copper.png.asset.json";

function LogoMark() {
  return <img src={wordmarkCopper.url} alt="CLEARD" className="h-7 w-auto object-contain" />;
}

const navLinks = [
  { to: "/join", label: "For Contractors" },
  
  { to: "/municipalities", label: "Coverage" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b hairline bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/" className="flex items-center group min-w-0">
          <LogoMark />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm hover:text-accent transition-colors">
              {l.label}
            </Link>
          ))}
          <Link
            to="/portal"
            className="p-btn p-btn-secondary p-btn-sm"
          >
            Client portal
          </Link>
        </nav>

        {/* Mobile menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="md:hidden p-2 -mr-2 rounded-[3px] hover:bg-secondary"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] p-0">
            <SheetTitle className="sr-only">Site navigation</SheetTitle>
            <div className="flex h-full flex-col">
              <div className="px-6 py-6 border-b hairline">
                <img src={wordmarkCopper.url} alt="CLEARD" className="h-6 w-auto object-contain" />
              </div>
              <nav className="flex-1 px-3 py-4">
                {navLinks.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-3 text-sm font-subline tracking-wide hover:bg-secondary rounded-[3px]"
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
              <div className="p-4 border-t hairline space-y-3">
                <div className="flex justify-center">
                </div>
                <Link
                  to="/portal"
                  onClick={() => setOpen(false)}
                  className="block text-center text-sm font-mono uppercase tracking-[0.18em] border hairline px-3 py-2.5 hover:bg-secondary transition-colors"
                >
                  Client portal
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
