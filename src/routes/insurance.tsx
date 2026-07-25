import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/insurance")({
  head: () => ({
    meta: [
      { title: "Insurance — Cleard by Flōridian" },
      {
        name: "description",
        content:
          "Preferred insurance partners for Cleard clients — WithCoverage and Harper Insurance, both specialists in construction coverage.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InsurancePage,
});

type Provider = {
  name: string;
  tagline: string;
  covers: string[];
  why: string;
  url: string;
  cta: string;
};

const PROVIDERS: Provider[] = [
  {
    name: "WithCoverage",
    tagline: "Modern brokerage purpose-built for construction.",
    covers: [
      "General Liability",
      "Workers' Compensation",
      "Builders Risk",
      "Commercial Auto & Inland Marine",
    ],
    why: "WithCoverage underwrites GCs and specialty trades every day, understands Florida-specific requirements, and delivers certificates fast enough to keep permits and closings on schedule. A-rated carriers quoted in parallel — typically within 24 business hours.",
    url: "https://www.withcoverage.com/",
    cta: "Visit WithCoverage",
  },
  {
    name: "Harper Insurance",
    tagline: "Specialized coverage for contractors and construction professionals.",
    covers: [
      "General Liability",
      "Workers' Compensation",
      "Builders Risk",
      "Commercial Umbrella",
    ],
    why: "Harper is a construction-focused agency with deep South Florida carrier relationships. They handle certificate turnarounds, additional insured endorsements, and renewal logistics with the same white-glove pace we hold ourselves to.",
    url: "https://www.harperinsure.com/",
    cta: "Visit Harper Insurance",
  },
];

function InsurancePage() {
  return (
    <PortalShell>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="border-b border-obsidian/10 pb-8">
          <div className="eyebrow text-obsidian/50 flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.5} />
            Referred Partners
          </div>
          <h1 className="display-serif mt-3 text-4xl sm:text-5xl text-obsidian">
            Insurance, built for builders.
          </h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-obsidian/65 leading-relaxed">
            Cleard clients receive a preferred introduction to two construction-first brokerages.
            Choose whichever fits — both know the trade and both move fast.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {PROVIDERS.map((p) => (
            <div
              key={p.name}
              className="flex flex-col p-6 rounded-[3px] border border-obsidian/12 bg-white"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="eyebrow text-obsidian/50">Featured Provider</div>
                  <div className="mt-2 font-display text-2xl text-obsidian">{p.name}</div>
                  <p className="mt-1.5 text-[13px] text-obsidian/65 leading-relaxed">
                    {p.tagline}
                  </p>
                </div>
                <div
                  className="h-12 w-12 rounded-[3px] grid place-items-center shrink-0"
                  style={{ backgroundColor: "var(--sky)" }}
                >
                  <ShieldCheck className="h-6 w-6 text-obsidian" strokeWidth={1.5} />
                </div>
              </div>

              <div className="mt-5">
                <div className="eyebrow text-obsidian/50">What They Cover</div>
                <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {p.covers.map((c) => (
                    <li key={c} className="text-[13px] text-obsidian/75">
                      · {c}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5">
                <div className="eyebrow text-obsidian/50">Why We Refer Them</div>
                <p className="mt-2 text-[13px] text-obsidian/70 leading-relaxed">{p.why}</p>
              </div>

              <div className="mt-auto pt-6">
                <Button
                  asChild
                  className="w-full rounded-[3px] gap-2 bg-obsidian text-paper hover:bg-obsidian/90"
                >
                  <a href={p.url} target="_blank" rel="noopener noreferrer">
                    {p.cta}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-[11px] font-mono uppercase tracking-[0.14em] text-obsidian/45 leading-relaxed">
          WithCoverage and Harper Insurance are independent brokerages. Cleard by Flōridian does
          not underwrite policies and receives no compensation for referrals. All coverage decisions
          rest with the applicant and the carrier.
        </p>
      </div>
    </PortalShell>
  );
}
