import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  ExternalLink,
  HardHat,
  Building2,
  Truck,
  Wrench,
  FileCheck2,
  Clock,
  BadgeCheck,
} from "lucide-react";

export const Route = createFileRoute("/insurance")({
  head: () => ({
    meta: [
      { title: "Insurance — Cleared by Flōridian" },
      {
        name: "description",
        content:
          "Coverage built for builders. Cleared clients receive a preferred introduction to Coverage for general liability, workers' comp, builders risk, and commercial auto.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InsurancePage,
});

const COVERAGE_URL = "https://www.withcoverage.com/";

const coverages = [
  {
    icon: HardHat,
    title: "General Liability",
    body: "Third-party bodily injury and property damage coverage tailored to custom residential GCs.",
  },
  {
    icon: Building2,
    title: "Builders Risk",
    body: "Course-of-construction protection for the structure, materials, and site improvements.",
  },
  {
    icon: Wrench,
    title: "Workers' Compensation",
    body: "Florida-compliant workers' comp with pay-as-you-go options for variable payrolls.",
  },
  {
    icon: Truck,
    title: "Commercial Auto & Inland Marine",
    body: "Fleets, tools, and equipment coverage that follows the job — not the yard.",
  },
];

const perks = [
  { icon: FileCheck2, label: "Certificates of Insurance in hours, not days" },
  { icon: Clock, label: "Quotes typically returned within 24 business hours" },
  { icon: BadgeCheck, label: "Referred partner — no fee to Cleared clients" },
];

function InsurancePage() {
  return (
    <PortalShell>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="border-b border-obsidian/10 pb-8">
          <div className="eyebrow text-obsidian/50 flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.5} />
            Referred Partner
          </div>
          <h1 className="display-serif mt-3 text-4xl sm:text-5xl text-obsidian">
            Insurance, built for builders.
          </h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-obsidian/65 leading-relaxed">
            Cleared clients receive a preferred introduction to{" "}
            <span className="font-medium text-obsidian">Coverage</span> — a modern brokerage
            purpose-built for construction. General liability, workers' comp, builders risk, and
            commercial auto, quoted in parallel by A-rated carriers.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          {/* Left column */}
          <div className="space-y-8">
            {/* Coverage grid */}
            <div>
              <div className="eyebrow text-obsidian/50">What They Cover</div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {coverages.map((c) => {
                  const Icon = c.icon;
                  return (
                    <div
                      key={c.title}
                      className="p-5 rounded-[3px] border border-obsidian/12 bg-paper-warm/40"
                    >
                      <Icon className="h-5 w-5 text-obsidian" strokeWidth={1.5} />
                      <div className="mt-3 font-display text-lg text-obsidian">{c.title}</div>
                      <p className="mt-1.5 text-[13px] text-obsidian/65 leading-relaxed">
                        {c.body}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Why Coverage */}
            <div className="p-6 rounded-[3px] border border-obsidian/12">
              <div className="eyebrow text-obsidian/50">Why We Refer Them</div>
              <p className="mt-3 text-sm text-obsidian/70 leading-relaxed">
                Most brokers treat construction as a side line of business. Coverage does not — their
                team underwrites GCs and specialty trades every day, understands Florida-specific
                requirements, and delivers certificates fast enough to keep permits and closings on
                schedule. It's the same standard of white-glove service we hold ourselves to.
              </p>
              <ul className="mt-5 space-y-2.5">
                {perks.map((p) => {
                  const Icon = p.icon;
                  return (
                    <li key={p.label} className="flex items-start gap-3">
                      <Icon
                        className="h-4 w-4 mt-0.5 shrink-0 text-obsidian"
                        strokeWidth={1.5}
                      />
                      <span className="text-[13px] text-obsidian/75">{p.label}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Disclosure */}
            <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-obsidian/45 leading-relaxed">
              Coverage is an independent insurance brokerage. Cleared by Flōridian does not
              underwrite policies and receives no compensation for referrals. All coverage decisions
              rest with the applicant and the carrier.
            </p>
          </div>

          {/* Right rail — CTA */}
          <aside className="lg:sticky lg:top-20 self-start">
            <div
              className="p-6 rounded-[3px]"
              style={{ backgroundColor: "var(--obsidian)", color: "var(--paper)" }}
            >
              <div
                className="eyebrow"
                style={{ color: "color-mix(in oklab, var(--paper) 55%, transparent)" }}
              >
                Start a Quote
              </div>
              <div className="mt-3 font-display text-2xl leading-tight">
                Get quoted by Coverage.
              </div>
              <p
                className="mt-2 text-[13px] leading-relaxed"
                style={{ color: "color-mix(in oklab, var(--paper) 70%, transparent)" }}
              >
                Mention you were referred by Cleared by Flōridian to route directly to their
                construction desk.
              </p>

              <Button
                variant="outline"
                asChild
                className="mt-5 w-full rounded-[3px] gap-2 bg-transparent text-paper border-paper/30 hover:bg-paper/10 hover:text-paper"
              >
                <a href={COVERAGE_URL} target="_blank" rel="noopener noreferrer">
                  Visit withcoverage.com
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>

              <div
                className="mt-6 pt-5 border-t space-y-2"
                style={{ borderColor: "color-mix(in oklab, var(--paper) 12%, transparent)" }}
              >
                <div
                  className="font-mono text-[10px] uppercase tracking-[0.18em]"
                  style={{ color: "color-mix(in oklab, var(--paper) 55%, transparent)" }}
                >
                  Have on hand
                </div>
                <ul
                  className="text-[12px] space-y-1.5"
                  style={{ color: "color-mix(in oklab, var(--paper) 78%, transparent)" }}
                >
                  <li>· Legal entity name & FEIN</li>
                  <li>· Prior 3 years of loss runs (if any)</li>
                  <li>· Estimated annual payroll & receipts</li>
                  <li>· Project schedule / active job addresses</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </PortalShell>
  );
}
