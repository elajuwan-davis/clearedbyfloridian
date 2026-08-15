import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-shell";

/* Homepage-matching brand tokens */
const OBSIDIAN = "#111110";
const MUTED = "#6B6860";
const HAIRLINE = "#E4E2DE";
const TEAL = "#00B4A8";
import {
  FileStack,
  ShieldCheck,
  Building2,
  FileSignature,
  CalendarClock,
  PenTool,
  FileCheck2,
  Users,
  BadgeCheck,
  RefreshCw,
  GraduationCap,
  UserCheck,
  ShieldAlert,
  Leaf,
  Gavel,
  Hammer,
  Search,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/products")({
  component: ProductsPage,
  head: () => ({
    meta: [
      { title: "Products — Cleard" },
      {
        name: "description",
        content:
          "Permits, private provider services, lien rights, COI compliance, license administration, and compliance monitoring — built for all licensed Florida contractors.",
      },
      { property: "og:title", content: "Every tool your operation needs." },
      {
        property: "og:description",
        content:
          "Permitting, lien rights, insurance, license administration, and compliance monitoring in one platform.",
      },
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

type Group = { section: string; products: Product[] };

const GROUPS: Group[] = [
  {
    section: "Permitting",
    products: [
      {
        name: "Permit Administration",
        tagline: "End-to-end permit management for every trade, every jurisdiction, every job.",
        bullets: [
          "Smart document checklists per municipality",
          "Real-time status tracking from submission to issuance",
          "Full permit history and fee ledger",
          "Supports all trade types: Pool/Spa, Roofing, Electrical, Plumbing, HVAC, General/Residential, Foundation, Commercial",
        ],
        Icon: FileStack,
      },
      {
        name: "Private Provider Services",
        tagline: "Florida's private provider compliance layer, built in.",
        bullets: [
          "Private provider docs per jurisdiction",
          "Inspection coordination and tracking",
          "Approval workflows for ICI-compatible submissions",
        ],
        Icon: ShieldCheck,
      },
      {
        name: "Building Dept Portal Hub",
        tagline: "400+ Florida jurisdictions. One place to find them all.",
        bullets: [
          "Every city's building dept portal linked and searchable",
          "Municipality-specific document requirements pre-loaded",
          "Region → County → City hierarchy for fast navigation",
        ],
        Icon: Building2,
      },
    ],
  },
  {
    section: "Lien Rights",
    products: [
      {
        name: "Lien Document Generation",
        tagline: "Generate every document FL Statute 713 requires.",
        bullets: [
          "Notice of Commencement",
          "Preliminary Notice",
          "Conditional and Unconditional Lien Waivers",
        ],
        Icon: FileSignature,
      },
      {
        name: "Deadline Tracker",
        tagline: "Never miss a lien deadline.",
        bullets: [
          "FL Statute 713 rules engine",
          "45-day preliminary notice gate",
          "90-day claim of lien gate",
          "1-year enforcement window and NOC validity alerts",
        ],
        Icon: CalendarClock,
      },
      {
        name: "E-Recording & E-Sign",
        tagline: "Close the loop without leaving the platform.",
        bullets: [
          "Electronic lien waiver signing via SignWell",
          "E-recording request flow",
          "Full audit trail",
        ],
        Icon: PenTool,
      },
    ],
  },
  {
    section: "Insurance & Subcontractors",
    products: [
      {
        name: "COI Compliance",
        tagline: "Stop chasing certificates. Start tracking compliance.",
        bullets: [
          "Send COI requests to subs with required coverage specs",
          "Vendor portal — unique link per sub",
          "Coverage validation: types, limits, expiration, additional insured",
          "Automated follow-up reminders at day 3, 7, 14",
          "Expiration alerts at 90/60/30 days",
        ],
        Icon: FileCheck2,
      },
      {
        name: "Subcontractor Coordination",
        tagline: "Get your subs signed, verified, and ready.",
        bullets: [
          "Digital signature requests via SignWell",
          "DBPR license verification built in",
          "Budgeted fees per trade from day one",
        ],
        Icon: Users,
      },
    ],
  },
  {
    section: "License Administration",
    products: [
      {
        name: "License Verification Dashboard",
        tagline: "Live DBPR status for your license and all your subs.",
        bullets: [
          "Active, delinquent, suspended, renewal-due — all in one view",
          "Renewal alerts at 90/60/30 days",
        ],
        Icon: BadgeCheck,
      },
      {
        name: "License Renewal Management",
        tagline: "Cleard submits your DBPR renewal on your behalf. Available on Back Office plan.",
        bullets: [
          "48-hour turnaround",
          "No paperwork on your end",
          "Renewal confirmation in your dashboard",
        ],
        Icon: RefreshCw,
      },
      {
        name: "Continuing Education (CE) Tracking",
        tagline: "Florida requires 14 CE hours per renewal cycle.",
        bullets: [
          "Hours completed tracked automatically",
          "Accredited course directory",
          "Alert when falling short of requirements",
        ],
        Icon: GraduationCap,
      },
      {
        name: "Qualifying Agent Monitoring",
        tagline: "Tracks QA status per company.",
        bullets: [
          "Alerts when your qualifying agent is at risk",
          "Facilitates DBPR change-of-status filing",
        ],
        Icon: UserCheck,
      },
      {
        name: "Worker's Comp Exemption Tracking",
        tagline: "FL exemptions expire annually.",
        bullets: [
          "Expiration tracking for all exemptions",
          "DFS renewal facilitation",
          "Dashboard view across all trades",
        ],
        Icon: ShieldAlert,
      },
    ],
  },
  {
    section: "Compliance Monitoring",
    products: [
      {
        name: "FDEP Permit Tracking",
        tagline: "Environmental permits tracked alongside building permits.",
        bullets: [
          "Septic, stormwater, and wetlands permits",
          "Independent expiration timelines",
          "County-by-county coverage",
        ],
        Icon: Leaf,
      },
      {
        name: "Code Violation & Lien Monitoring",
        tagline: "Monitors active project properties.",
        bullets: [
          "Open county code enforcement violations",
          "Active liens on project properties",
          "Monthly monitoring subscription",
        ],
        Icon: Gavel,
      },
    ],
  },
  {
    section: "Specialty Services",
    products: [
      {
        name: "After-the-Fact Permits",
        tagline: "Work done without a permit? We handle it.",
        bullets: [
          "As-built documentation management",
          "Inspection coordination",
          "County negotiation and case management",
          "Pricing per case",
        ],
        Icon: Hammer,
      },
      {
        name: "Real Estate Transaction Permit Search",
        tagline: "Open permit verification for closings.",
        bullets: [
          "$75–$150 per search",
          "For Realtors, title companies, and contractors",
          "Results in 24 hours",
        ],
        Icon: Search,
      },
      {
        name: "Victoria (AI Agent)",
        tagline: "Your permit operations assistant, always on.",
        bullets: [
          "Answers jurisdiction requirement questions",
          "Flags missing docs and expiring items",
          "Learns your project history over time",
        ],
        Icon: Sparkles,
        comingSoon: true,
      },
    ],
  },
];

function ProductsPage() {
  let index = 0;
  return (
    <PublicShell>
      {/* HERO */}
      <section className="px-6 lg:px-10 py-24 lg:py-32">
        <div className="max-w-7xl mx-auto">
          <div
            className="font-mono text-[10px] uppercase mb-8"
            style={{ color: OBSIDIAN, letterSpacing: "0.32em" }}
          >
            What's Inside Cleard
          </div>
          <h1
            className="font-bold leading-[1.02] mb-8 max-w-3xl"
            style={{ color: OBSIDIAN, fontSize: "clamp(2.5rem, 6vw, 5rem)", letterSpacing: "-0.02em" }}
          >
            Every tool your operation needs.
          </h1>
          <p className="text-lg max-w-2xl" style={{ color: MUTED, lineHeight: 1.55 }}>
            Built for all licensed Florida contractors — pool, roofing, electrical, plumbing, HVAC,
            general, foundation, and commercial.
          </p>
        </div>
      </section>

      {/* PRODUCT SECTIONS */}
      <div>
        {GROUPS.map((group) => (
          <div key={group.section}>
            <div
              className="px-6 lg:px-10 py-6"
              style={{ borderTop: `1px solid ${HAIRLINE}`, backgroundColor: OBSIDIAN }}
            >
              <div className="max-w-7xl mx-auto">
                <h2
                  className="font-mono text-[11px] uppercase"
                  style={{ color: "#fff", letterSpacing: "0.3em" }}
                >
                  {group.section}
                </h2>
              </div>
            </div>

            {group.products.map((p) => {
              index += 1;
              const i = index;
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
                          {String(i).padStart(2, "0")} · {group.section}
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
                      <h3
                        className="font-bold leading-[1.05] mb-6"
                        style={{
                          color: OBSIDIAN,
                          fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {p.name}
                      </h3>
                      <p className="text-lg mb-8" style={{ color: MUTED, lineHeight: 1.55 }}>
                        {p.tagline}
                      </p>
                      <ul className="space-y-4">
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
        ))}
      </div>

      {/* CTA */}
      <section className="px-6 lg:px-10 py-24" style={{ backgroundColor: OBSIDIAN }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="font-bold leading-[1.05] mb-6"
            style={{ color: "#fff", fontSize: "clamp(1.75rem, 4vw, 3rem)", letterSpacing: "-0.02em" }}
          >
            One platform. Your entire back office.
          </h2>
          <p className="text-lg mb-10" style={{ color: "rgba(255,255,255,0.7)" }}>
            See how Cleard runs permits, lien rights, insurance, and licensing for your operation.
          </p>
          <Link
            to="/join"
            hash="request"
            className="inline-flex items-center px-8 h-14 text-[12px] font-mono uppercase tracking-[0.24em] transition-opacity hover:opacity-85"
            style={{ backgroundColor: TEAL, color: OBSIDIAN, borderRadius: 0 }}
          >
            Get early access
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
