import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowRight, Check, X, ShieldCheck, Sparkles, Layers } from "lucide-react";

import { MarketingShell } from "@/components/marketing-shell";
import {
  findVersusCompetitor,
  type VersusCompetitor,
  type VersusRow,
} from "@/lib/versus-competitors";

export const Route = createFileRoute("/versus/$slug")({
  loader: ({ params }) => {
    const competitor = findVersusCompetitor(params.slug);
    if (!competitor) throw redirect({ to: "/versus" });
    return { competitor };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Comparison — Cleard" }, { name: "robots", content: "noindex" }] };
    }
    const c = loaderData.competitor;
    const url = `https://cleared.floridianinc.com/versus/${params.slug}`;
    const title = `Cleard vs ${c.name} — Florida Permit Management Compared`;
    return {
      meta: [
        { title },
        { name: "description", content: c.sub.slice(0, 158) },
        { property: "og:title", content: `Cleard vs ${c.name}` },
        { property: "og:description", content: c.sub.slice(0, 158) },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: VersusDetail,
});

const ICONS = { shield: ShieldCheck, sparkles: Sparkles, layers: Layers } as const;

function Yes() {
  return (
    <span
      className="inline-flex items-center justify-center h-5 w-5 rounded-full"
      style={{ background: "color-mix(in oklab, var(--green, #12A05C) 18%, transparent)" }}
      aria-label="Included"
    >
      <Check className="h-3 w-3" style={{ color: "var(--green, #12A05C)" }} strokeWidth={3} />
    </span>
  );
}

function No() {
  return (
    <span className="inline-flex items-center justify-center h-5 w-5" aria-label="Not included">
      <X className="h-3.5 w-3.5" style={{ color: "#DC2626", opacity: 0.7 }} strokeWidth={2.5} />
    </span>
  );
}

function Cell({ value }: { value: VersusRow["competitor"] }) {
  if (value === true) return <Yes />;
  if (value === false) return <No />;
  return (
    <span className="text-[11px] uppercase tracking-[0.16em] md-muted">{value}</span>
  );
}

function VersusDetail() {
  const { competitor: c } = Route.useLoaderData() as { competitor: VersusCompetitor };

  return (
    <MarketingShell>
      {/* Hero */}
      <section className="relative overflow-hidden border-b md-hairline">
        <div className="absolute inset-0 md-grain opacity-40" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-10 py-24 md:py-32">
          <div className="md-eyebrow md-in md-in-1">Cleard vs {c.name}</div>
          <h1
            className="mt-6 md-serif md-in md-in-2 max-w-4xl whitespace-pre-line"
            style={{
              color: "var(--md-text)",
              fontSize: "clamp(2.25rem, 5.5vw, 4.5rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
            }}
          >
            {c.headline}
          </h1>
          <p className="mt-7 max-w-2xl text-base sm:text-lg md-muted md-in md-in-3">{c.sub}</p>
          <div className="mt-9 flex flex-col sm:flex-row gap-3 md-in md-in-4">
            <Link to="/join" hash="request" className="md-btn-primary">
              Get early access <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/process" className="md-btn-ghost">
              See a demo
            </Link>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="mx-auto max-w-5xl px-6 lg:px-10 py-20 md:py-24">
        <div className="md-eyebrow">Feature comparison</div>

        {/* Desktop table */}
        <div className="mt-8 hidden md:block overflow-hidden rounded-lg border md-hairline">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="px-5 py-4 text-[11px] uppercase tracking-[0.2em] md-muted font-normal">
                  Feature
                </th>
                <th
                  className="px-5 py-4 text-[12px] uppercase tracking-[0.16em] text-center"
                  style={{ background: "var(--brand, #1B84D4)", color: "#FFFFFF" }}
                >
                  Cleard
                </th>
                <th
                  className="px-5 py-4 text-[12px] uppercase tracking-[0.16em] text-center md-muted"
                  style={{ background: "color-mix(in oklab, #6B8299 12%, transparent)" }}
                >
                  {c.name}
                </th>
              </tr>
            </thead>
            <tbody>
              {c.rows.map((r, i) => (
                <tr
                  key={r.feature}
                  style={{
                    background:
                      i % 2 === 1 ? "color-mix(in oklab, #6B8299 6%, transparent)" : "transparent",
                  }}
                >
                  <td className="px-5 py-3.5 text-sm" style={{ color: "var(--md-text)" }}>
                    {r.feature}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <div className="flex justify-center">{r.cleard ? <Yes /> : <No />}</div>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <div className="flex justify-center">
                      <Cell value={r.competitor} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card-per-feature */}
        <div className="mt-8 md:hidden space-y-2">
          {c.rows.map((r) => (
            <div key={r.feature} className="rounded-lg border md-hairline p-4">
              <div className="text-sm" style={{ color: "var(--md-text)" }}>
                {r.feature}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-[0.16em]" style={{ color: "var(--brand, #1B84D4)" }}>
                    Cleard
                  </span>
                  {r.cleard ? <Yes /> : <No />}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-[0.16em] md-muted">{c.name}</span>
                  <Cell value={r.competitor} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Differentiators */}
      <section className="mx-auto max-w-7xl px-6 lg:px-10 pb-20 md:pb-24">
        <div className="grid gap-10 md:grid-cols-3">
          {c.diffs.map((d) => {
            const Icon = ICONS[d.icon];
            return (
              <div key={d.headline}>
                <Icon className="h-5 w-5" style={{ color: "var(--brand, #1B84D4)" }} strokeWidth={1.5} />
                <h3 className="mt-4 md-serif text-2xl" style={{ color: "var(--md-text)" }}>
                  {d.headline}
                </h3>
                <p className="mt-3 text-sm md-muted leading-relaxed">{d.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA strip */}
      <section className="md-section-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-20 text-center">
          <h2 className="md-serif text-3xl md:text-5xl" style={{ color: "#FFFFFF" }}>
            Ready to switch?
          </h2>
          <div className="mt-8">
            <Link to="/join" hash="request" className="md-btn-primary">
              Get early access to Cleard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
