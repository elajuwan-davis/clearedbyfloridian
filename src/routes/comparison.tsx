import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell, PageHeader } from "@/components/marketing-shell";
import { ClearedDifferenceTable } from "@/components/cleard-difference-table";

export const Route = createFileRoute("/comparison")({
  head: () => ({
    meta: [
      { title: "Comparison — Cleard vs Expediters & Private Providers" },
      {
        name: "description",
        content:
          "See how Cleard compares to permit expediters and standalone private providers across plan review, inspections, compliance tracking, and lien rights.",
      },
      { property: "og:title", content: "How Cleard compares" },
      {
        property: "og:description",
        content:
          "Permit expediter vs private provider vs Cleard — side by side across ten capabilities.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ComparisonPage,
});

const INK = "#000000";
const OAT = "#FFFFFF";
const MONO = "'JetBrains Mono', ui-monospace, monospace";

function ComparisonPage() {
  return (
    <MarketingShell>
      <PageHeader
        eyebrow="Comparison"
        title="How Cleard compares."
        intro="Most contractors are choosing between an expediter who files paperwork and a private provider who reviews plans. Cleard does both, and keeps the compliance record behind them."
      />
      <ClearedDifferenceTable />
      <section style={{ background: INK }}>
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <Link
            to="/join"
            hash="request"
            className="inline-flex items-center px-8 h-14 no-underline font-mono text-[11px] uppercase"
            style={{
              background: OAT,
              color: INK,
              letterSpacing: "0.24em",
              borderRadius: 0,
              fontFamily: MONO,
            }}
          >
            Get started
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
