import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Scale, Plus, Trophy, Award, ChevronRight } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { PermitPicker } from "@/components/permit-picker";
import { listPermits, type PermitRow } from "@/lib/permits-api";
import {
  BidComparisonDialog,
  type BidComparisonRecord,
} from "@/components/bid-comparison-dialog";

export const Route = createFileRoute("/portal/bid-review")({
  head: () => ({
    meta: [
      { title: "Bid Review — Cleard" },
      {
        name: "description",
        content:
          "Compare subcontractor bids across every active permit and award winners from one place.",
      },
      { property: "og:title", content: "Bid Review — Cleard" },
      {
        property: "og:description",
        content:
          "Compare subcontractor bids across every active permit and award winners from one place.",
      },
    ],
  }),
  component: BidReviewPage,
});

type Row = {
  permit: PermitRow;
  record: BidComparisonRecord;
};

type AwardedStamp = {
  permit: PermitRow;
  sub_id: string | null;
  company_name: string;
  trade: string | null;
  bid_cents: number | null;
  awarded_at: string;
  comparison_id?: string | null;
};

function fmtMoney(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return `$${Math.round(cents / 100).toLocaleString()}`;
}

function BidReviewPage() {
  const [permits, setPermits] = useState<PermitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [picker, setPicker] = useState(false);
  const [activePermit, setActivePermit] = useState<PermitRow | null>(null);

  useEffect(() => {
    listPermits()
      .then(setPermits)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const comparisons: Row[] = useMemo(() => {
    const out: Row[] = [];
    for (const p of permits) {
      const ip = (p.intake_payload ?? {}) as Record<string, unknown>;
      const list = Array.isArray(ip.bid_comparisons)
        ? (ip.bid_comparisons as BidComparisonRecord[])
        : [];
      for (const r of list) out.push({ permit: p, record: r });
    }
    return out.sort(
      (a, b) =>
        new Date(b.record.created_at).getTime() -
        new Date(a.record.created_at).getTime(),
    );
  }, [permits]);

  const awarded: AwardedStamp[] = useMemo(() => {
    const out: AwardedStamp[] = [];
    for (const p of permits) {
      const ip = (p.intake_payload ?? {}) as Record<string, unknown>;
      const a = ip.awarded_bid as
        | {
            sub_id?: string | null;
            company_name?: string;
            trade?: string | null;
            bid_cents?: number | null;
            awarded_at?: string;
            comparison_id?: string | null;
          }
        | undefined;
      if (a && a.company_name) {
        out.push({
          permit: p,
          sub_id: a.sub_id ?? null,
          company_name: a.company_name,
          trade: a.trade ?? null,
          bid_cents: a.bid_cents ?? null,
          awarded_at: a.awarded_at ?? "",
          comparison_id: a.comparison_id ?? null,
        });
      }
    }
    return out.sort(
      (a, b) =>
        new Date(b.awarded_at).getTime() - new Date(a.awarded_at).getTime(),
    );
  }, [permits]);

  function refresh(updated: PermitRow) {
    setPermits((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setActivePermit(null);
  }

  return (
    <PortalShell>
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div className="eyebrow text-obsidian/50">Bid Review</div>
            <h1 className="display-serif text-4xl text-obsidian mt-1">
              Bid Review
            </h1>
            <p className="text-sm text-obsidian/60 mt-2 max-w-2xl">
              Compare subcontractor bids side-by-side across every active
              permit. Award a winner and Cleard stamps them on the associated
              permit record.
            </p>
          </div>
          <button
            onClick={() => setPicker(true)}
            className="inline-flex items-center gap-2 bg-obsidian text-white rounded-[3px] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em]"
          >
            <Plus className="h-3.5 w-3.5" /> New Comparison
          </button>
        </div>

        {/* Awarded Subs */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-3.5 w-3.5 text-obsidian/70" />
            <div className="eyebrow text-obsidian/50">Awarded Subcontractors</div>
          </div>
          <div className="bg-white border border-obsidian/15 rounded-[3px] overflow-hidden">
            {awarded.length === 0 ? (
              <div className="px-5 py-8 text-sm text-obsidian/50 italic text-center">
                No subs awarded yet. Winners you select from a comparison appear
                here.
              </div>
            ) : (
              <div className="divide-y divide-obsidian/5">
                {awarded.map((a, i) => (
                  <div
                    key={`${a.permit.id}-${i}`}
                    className="flex items-center gap-4 px-5 py-3"
                  >
                    <Award className="h-4 w-4 text-emerald-700 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-obsidian truncate">
                        {a.company_name}
                        {a.trade && (
                          <span className="ml-2 text-xs text-obsidian/50">
                            · {a.trade}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-obsidian/60 truncate">
                        {a.permit.project_name} — {a.permit.job_address}
                      </div>
                    </div>
                    <div className="text-sm text-obsidian shrink-0">
                      {fmtMoney(a.bid_cents)}
                    </div>
                    <Link
                      to="/portal/permits/$id"
                      params={{ id: a.permit.id }}
                      className="text-obsidian/60 hover:text-obsidian shrink-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* All Comparisons */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Scale className="h-3.5 w-3.5 text-obsidian/70" />
            <div className="eyebrow text-obsidian/50">Saved Comparisons</div>
          </div>
          <div className="bg-white border border-obsidian/15 rounded-[3px] overflow-hidden">
            {loading ? (
              <div className="px-5 py-8 text-sm text-obsidian/50 italic text-center">
                Loading…
              </div>
            ) : comparisons.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <div className="text-sm text-obsidian/60 mb-4">
                  No bid comparisons yet.
                </div>
                <button
                  onClick={() => setPicker(true)}
                  className="inline-flex items-center gap-2 bg-obsidian text-white rounded-[3px] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em]"
                >
                  <Plus className="h-3.5 w-3.5" /> Start a Comparison
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-obsidian/[0.03]">
                  <tr>
                    <th className="text-left px-4 py-3 eyebrow text-obsidian/50 border-b border-obsidian/10">
                      Trade
                    </th>
                    <th className="text-left px-4 py-3 eyebrow text-obsidian/50 border-b border-obsidian/10">
                      Project
                    </th>
                    <th className="text-left px-4 py-3 eyebrow text-obsidian/50 border-b border-obsidian/10">
                      Subs
                    </th>
                    <th className="text-left px-4 py-3 eyebrow text-obsidian/50 border-b border-obsidian/10">
                      Awarded
                    </th>
                    <th className="text-left px-4 py-3 eyebrow text-obsidian/50 border-b border-obsidian/10">
                      Created
                    </th>
                    <th className="border-b border-obsidian/10" />
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map(({ permit, record }) => (
                    <tr
                      key={record.id}
                      className="border-b border-obsidian/5 last:border-0"
                    >
                      <td className="px-4 py-3 text-sm text-obsidian">
                        {record.trade || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="text-obsidian truncate max-w-[220px]">
                          {permit.project_name}
                        </div>
                        <div className="text-xs text-obsidian/50 truncate max-w-[220px]">
                          {permit.job_address}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-obsidian/70">
                        {record.entries
                          .map((e) => e.company_name || "—")
                          .filter(Boolean)
                          .join(", ")}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {record.awarded_company_name ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <Award className="h-3 w-3" />
                            {record.awarded_company_name}
                          </span>
                        ) : (
                          <button
                            onClick={() => setActivePermit(permit)}
                            className="text-xs font-mono uppercase tracking-[0.14em] text-obsidian/60 hover:text-obsidian"
                          >
                            Review →
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-obsidian/50">
                        {new Date(record.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to="/portal/permits/$id"
                          params={{ id: permit.id }}
                          className="text-obsidian/60 hover:text-obsidian"
                        >
                          <ChevronRight className="h-4 w-4 inline" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Permit picker */}
        {picker && (
          <PermitPicker
            permits={permits}
            eyebrow="New Comparison"
            title="Select a Permit"
            onClose={() => setPicker(false)}
            onPick={(p) => {
              setPicker(false);
              setActivePermit(p);
            }}
          />
        )}

        {activePermit && (
          <BidComparisonDialog
            permit={activePermit}
            onClose={() => setActivePermit(null)}
            onSaved={refresh}
          />
        )}
      </div>
    </PortalShell>
  );
}
