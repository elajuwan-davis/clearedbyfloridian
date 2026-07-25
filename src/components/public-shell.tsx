import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export const OBSIDIAN = "#153157";
export const MUTED = `color-mix(in oklab, ${OBSIDIAN} 55%, transparent)`;
export const HAIRLINE = `color-mix(in oklab, ${OBSIDIAN} 12%, transparent)`;

export function PublicNav() {
  return (
    <header
      className="sticky top-0 z-40 bg-white"
      style={{ borderBottom: `1px solid ${HAIRLINE}` }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link to="/" className="wordmark text-2xl leading-none" style={{ color: OBSIDIAN }}>
          Cleared
        </Link>
        <Link
          to="/join"
          hash="request"
          className="inline-flex items-center px-5 h-10 text-[11px] font-mono uppercase tracking-[0.2em] transition-opacity hover:opacity-85"
          style={{ backgroundColor: OBSIDIAN, color: "#fff", borderRadius: 0 }}
        >
          Get Started
        </Link>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="py-10 px-6 text-center">
      <div
        className="text-[12px]"
        style={{ color: "color-mix(in oklab, " + OBSIDIAN + " 40%, transparent)" }}
      >
        Cléared by Flōridian · © 2026 ·{" "}
        <a href="https://floridianinc.com" className="hover:underline">
          floridianinc.com
        </a>
      </div>
    </footer>
  );
}

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div style={{ backgroundColor: "#ffffff", color: OBSIDIAN, fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
      <PublicNav />
      {children}
      <PublicFooter />
    </div>
  );
}
