import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell, OBSIDIAN, HAIRLINE, MUTED } from "@/components/public-shell";
import { FileStack, ShieldCheck, FileCheck2, Users, Building2, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/products")({
  component: ProductsPage,
  head: () => ({
    meta: [
      { title: "Products — Cléared" },
      { name: "description", content: "Six purpose-built products for Florida permit operations: administration, private provider, COI, sub coordination, jurisdictions, and Victoria AI." },
      { property: "og:title", content: "Every tool your permit operation needs." },
      { property: "og:description", content: "Six purpose-built products. One platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type Product = {
  name: string;
  tagline: string;
  bullets: string[];
  Icon: LucideIcon;
  comingSoon?: boolean;
};

const PRODUCTS: Product[] = [
  {
    name: "Permit Administration",
    tagline: "End-to-end permit management for every trade, every jurisdiction, every job.",
    bullets: [
      "Smart document checklists per municipality",
      "Real-time status tracking from submission to issuance",
      "Full permit history and fee ledger",
    ],
    Icon: FileStack,
  },
  {
    name: "Private Provider Services",
    tagline: "Florida's private provider compliance layer, built in.",
    bullets: [
      "Private provider docs attached to every jurisdiction",
      "Inspection coordination and tracking",
      "Approval workflows for ICI-compatible submissions",
    ],
    Icon: ShieldCheck,
  },
  {
    name: "COI Tracking",
    tagline: "Stop chasing certificates. Start tracking compliance.",
    bullets: [
      "Upload and store COIs per subcontractor",
      "Automatic expiration alerts at 60 and 30 days",
      "Compliance dashboard across all active projects",
    ],
    Icon: FileCheck2,
  },
  {
    name: "Subcontractor Coordination",
    tagline: "Get your subs signed, verified, and ready before you submit.",
    bullets: [
      "Digital signature requests via Signwell",
      "DBPR license verification built in",
      "Budgeted fees per trade from day one",
    ],
    Icon: Users,
  },
  {
    name: "Building Dept Portal Consolidation",
    tagline: "400+ Florida jurisdictions. One place to find them all.",
    bullets: [
      "Every city's building dept portal linked and searchable",
      "Municipality-specific document requirements pre-loaded",
      "Region → County → City hierarchy for fast navigation",
    ],
    Icon: Building2,
  },
  {
    name: "Victoria (AI Agent)",
    tagline: "Your permit operations assistant — always on, always current.",
    bullets: [
      "Answers questions about jurisdiction requirements",
      "Flags missing docs and expiring compliance items",
      "Learns your project history to get smarter over time",
    ],
    Icon: Sparkles,
    comingSoon: true,
  },
];

function ProductsPage() {
  return (
    <PublicShell>
      {/* HERO */}
      <section className="px-6 lg:px-10 py-24 lg:py-32">
        <div className="max-w-7xl mx-auto">
          <div
            className="font-mono text-[10px] uppercase mb-8"
            style={{ color: OBSIDIAN, letterSpacing: "0.32em" }}
          >
            What's Inside Cléared
          </div>
          <h1
            className="display-serif font-bold leading-[1.02] mb-8 max-w-3xl"
            style={{ color: OBSIDIAN, fontSize: "clamp(2.5rem, 6vw, 5rem)", letterSpacing: "-0.02em" }}
          >
            Every tool your permit operation needs.
          </h1>
          <p className="text-lg max-w-2xl" style={{ color: MUTED, lineHeight: 1.55 }}>
            Six purpose-built products. One platform.
          </p>
        </div>
      </section>

      {/* PRODUCT SECTIONS */}
      <div>
        {PRODUCTS.map((p, i) => {
          const reverse = i % 2 === 1;
          const stripe = i % 2 === 1;
          return (
            <section
              key={p.name}
              className="px-6 lg:px-10 py-20 lg:py-28"
              style={{
                backgroundColor: stripe ? "#fafafa" : "#ffffff",
                borderTop: `1px solid ${HAIRLINE}`,
              }}
            >
              <div
                className={`max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${
                  reverse ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                {/* Copy */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="font-mono text-[10px] uppercase"
                      style={{ color: MUTED, letterSpacing: "0.22em" }}
                    >
                      0{i + 1} · Product
                    </div>
                    {p.comingSoon && (
                      <span
                        className="text-[9px] font-mono uppercase px-2 py-1"
                        style={{
                          color: OBSIDIAN,
                          letterSpacing: "0.2em",
                          border: `1px solid ${HAIRLINE}`,
                          backgroundColor: "#fff",
                        }}
                      >
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <h2
                    className="display-serif font-bold leading-[1.05] mb-6"
                    style={{ color: OBSIDIAN, fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", letterSpacing: "-0.02em" }}
                  >
                    {p.name}
                  </h2>
                  <p className="text-lg mb-8" style={{ color: MUTED, lineHeight: 1.55 }}>
                    {p.tagline}
                  </p>
                  <ul className="space-y-4 mb-10">
                    {p.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-3">
                        <span
                          className="mt-2 w-1.5 h-1.5 shrink-0"
                          style={{ backgroundColor: OBSIDIAN }}
                        />
                        <span className="text-[15px]" style={{ color: OBSIDIAN, lineHeight: 1.55 }}>
                          {b}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <span
                    className="inline-block text-[11px] font-mono uppercase"
                    style={{ color: MUTED, letterSpacing: "0.22em" }}
                  >
                    Learn more →
                  </span>
                </div>

                {/* Visual */}
                <div
                  className="aspect-[4/3] bg-white flex items-center justify-center"
                  style={{
                    border: `1px solid ${HAIRLINE}`,
                    boxShadow: "0 30px 80px -30px rgba(21,49,87,0.15)",
                  }}
                >
                  <p.Icon
                    size={96}
                    strokeWidth={0.75}
                    style={{ color: `color-mix(in oklab, ${OBSIDIAN} 40%, transparent)` }}
                  />
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* CTA */}
      <section className="px-6 lg:px-10 py-24" style={{ backgroundColor: OBSIDIAN }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="display-serif font-bold leading-[1.05] mb-6"
            style={{ color: "#fff", fontSize: "clamp(1.75rem, 4vw, 3rem)", letterSpacing: "-0.02em" }}
          >
            One platform. Every permit.
          </h2>
          <p className="text-lg mb-10" style={{ color: "rgba(255,255,255,0.7)" }}>
            See how Cléared runs the permit side of your operation.
          </p>
          <Link
            to="/join"
            hash="request"
            className="inline-flex items-center px-8 h-14 text-[12px] font-mono uppercase tracking-[0.24em] transition-opacity hover:opacity-85"
            style={{ backgroundColor: "#fff", color: OBSIDIAN, borderRadius: 0 }}
          >
            Get Started
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
