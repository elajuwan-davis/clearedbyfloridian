import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, Sun, Moon } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

function LogoMark() {
  return (
    <div
      className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
      style={{ background: "linear-gradient(135deg, var(--brand, #9C6B3F), var(--green, #4E6B5C))" }}
    >
      C
    </div>
  );
}

function ThemeToggle() {
  const [dark, setDark] = React.useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("cleard-theme", next ? "dark" : "light");
    } catch {
      /* storage unavailable */
    }
  };
  return (
    <button
      type="button"
      onClick={toggle}
      className="grid place-items-center h-8 w-8 rounded-md border transition-colors hover:bg-secondary"
      style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
      title={dark ? "Light mode" : "Dark mode"}
      aria-label={dark ? "Light mode" : "Dark mode"}
    >
      {dark ? <Sun className="h-4 w-4" strokeWidth={1.5} /> : <Moon className="h-4 w-4" strokeWidth={1.5} />}
    </button>
  );
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
        <Link to="/" className="flex items-center gap-3 group min-w-0">
          <LogoMark />
          <div className="flex flex-col leading-[1] min-w-0">
            <span className="wordmark text-2xl">Cleard</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm hover:text-accent transition-colors">
              {l.label}
            </Link>
          ))}
          <ThemeToggle />
          <Link
            to="/portal"
            className="text-sm font-mono uppercase tracking-[0.18em] text-foreground border hairline px-3 py-1.5 hover:bg-secondary transition-colors"
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
                <div className="wordmark text-2xl">Cleard</div>
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
                  <ThemeToggle />
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
