import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal-shell";
import { PageShell, Panel, StatusChip, KV } from "@/components/ui-kit";
import { useSession } from "@/lib/use-session";
import { Check } from "lucide-react";

export const Route = createFileRoute("/admin/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing Tiers · Admin — Cleard" },
      {
        name: "description",
        content: "Internal reference for Cleard service tiers, inclusions and cost breakdown.",
      },
      { property: "og:title", content: "Pricing Tiers · Admin — Cleard" },
      {
        property: "og:description",
        content: "Internal reference for Cleard service tiers, inclusions and cost breakdown.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPricingPage,
});

type Tier = {
  name: string;
  price: string;
  status: "active" | "coming_soon";
  included: string[];
  note?: string;
  audience: string;
  cost?: { labor: string; overhead: string; total: string; margin: string };
};

const TIERS: Tier[] = [
  {
    name: "Single-Trade Permit Admin",
    price: "$300 / trade",
    status: "active",
    included: [
      "Application prep & portal submission",
      "ICC-trained offshore permit tech (~3 hrs)",
      "Director of Permitting final QC",
      "Status monitoring & correction management",
      "AI-assisted document processing",
    ],
    note: "Municipal permit fees and plan review fees billed to GC separately as pass-throughs",
    audience:
      "GC pulling a single trade permit (pool, HVAC, roofing, electrical, plumbing)",
    cost: { labor: "$54", overhead: "$50", total: "$104", margin: "65%" },
  },
  {
    name: "Full SFR Permit Admin (All Trades)",
    price: "$1,000 flat",
    status: "active",
    included: [
      "All trades under one flat fee",
      "Application prep & submission for every trade (pool, structural, MEP)",
      "ICC-trained offshore permit tech (~6 hrs)",
      "Director of Permitting final QC",
      "Full monitoring & correction management across all trades",
      "AI-assisted document processing",
    ],
    note: "Municipal permit fees and plan review fees billed to GC separately as pass-throughs",
    audience:
      "GC building a full custom home — wants one vendor, one fee, all permits handled",
    cost: { labor: "$108", overhead: "$100", total: "$208", margin: "79%" },
  },
  {
    name: "Full Bundle (Permit + Plan Review + Inspections)",
    price: "$6,500 – $10,500 / project",
    status: "coming_soon",
    included: [
      "Everything in Full SFR Permit Admin",
      "Private provider plan review (F.S. 553.791)",
      "All inspections (pool + GC milestone batching)",
      "ICI or in-house licensed inspector",
      "Full lifecycle from permit application to final sign-off",
    ],
    note: "Inspection fees recognized as project stages are reached over 1–3 years",
    audience: "GC who wants Cleard to own the entire permit lifecycle end to end",
  },
];

function AdminPricingPage() {
  const session = useSession();
  const navigate = useNavigate();

  if (session.loading) return null;
  if (!session.isAdmin) {
    navigate({ to: "/dashboard", replace: true });
    return null;
  }

  return (
    <PortalShell>
      <PageShell
        crumbs={[{ label: "Admin" }]}
        title="Pricing Tiers"
        meta="Internal reference · service fees and cost breakdown · not visible to GC users"
      >
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {TIERS.map((t) => {
            const dim = t.status === "coming_soon";
            return (
              <Panel
                key={t.name}
                className={dim ? "opacity-70" : undefined}
                title={t.name}
                action={
                  <StatusChip tone={dim ? "neutral" : "success"}>
                    {dim ? "Coming Soon" : "Active"}
                  </StatusChip>
                }
              >
                <div className="space-y-3">
                  <div>
                    <div className="text-[19px] font-semibold tracking-[-0.02em]">{t.price}</div>
                    <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      Service fee only
                    </div>
                  </div>

                  <ul className="space-y-1.5">
                    {t.included.map((i) => (
                      <li key={i} className="flex gap-2 text-[12.5px] leading-snug">
                        <Check
                          className="mt-[3px] h-3.5 w-3.5 shrink-0"
                          strokeWidth={2}
                          style={{ color: "var(--p-success)" }}
                        />
                        <span>{i}</span>
                      </li>
                    ))}
                  </ul>

                  {t.note && (
                    <p className="text-[11.5px] leading-snug text-muted-foreground">{t.note}</p>
                  )}

                  <div
                    className="border-t pt-2.5"
                    style={{ borderColor: "var(--p-border)" }}
                  >
                    <KV label="Who it's for">
                      <span className="text-[12.5px]">{t.audience}</span>
                    </KV>
                  </div>

                  <div
                    className="border-t pt-2.5"
                    style={{ borderColor: "var(--p-border)" }}
                  >
                    <div className="mb-1.5 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
                      Internal cost breakdown
                    </div>
                    {t.cost ? (
                      <dl className="space-y-1">
                        <CostRow label="Labor" value={t.cost.labor} />
                        <CostRow label="Overhead" value={t.cost.overhead} />
                        <CostRow label="Total cost" value={t.cost.total} />
                        <CostRow label="Gross margin" value={t.cost.margin} />
                      </dl>
                    ) : (
                      <div className="text-[11.5px] italic text-muted-foreground">
                        Not yet modeled — pending inspection cost inputs.
                      </div>
                    )}
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      </PageShell>
    </PortalShell>
  );
}

function CostRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-[11.5px] text-muted-foreground">
      <dt>{label}</dt>
      <dd className="font-mono tabular-nums">{value}</dd>
    </div>
  );
}
