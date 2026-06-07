import type { ReactNode } from "react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
}) {
  return (
    <section className="relative border-b hairline overflow-hidden">
      <div className="absolute inset-0 blueprint-grid-fine opacity-60" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 md:py-32">
        <div className="label-eyebrow">{eyebrow}</div>
        <h1 className="mt-6 font-display text-3xl sm:text-5xl md:text-7xl tracking-tight text-balance max-w-4xl">
          {title}
        </h1>
        {intro && (
          <p className="mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground text-pretty">
            {intro}
          </p>
        )}
      </div>
    </section>

  );
}
