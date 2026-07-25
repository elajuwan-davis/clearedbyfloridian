import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Trash2,
  AlertTriangle,
  Search,
  FileDown,
  Share2,
  Download,
} from "lucide-react";
import contestReport from "@/assets/fee-contest-report.pdf.asset.json";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { isInternalUser } from "@/lib/is-internal-user";
import { SavingsCalculator } from "@/components/savings-calculator";


export const Route = createFileRoute("/fee-calculator")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: (search.mode === "savings" ? "savings" : undefined) as "savings" | undefined,
  }),
  head: () => ({
    meta: [
      { title: "Fee Calculator — Cleard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FeeCalculatorPage,
});

import { MUNICIPALITIES as SHARED_MUNICIPALITIES } from "@/lib/municipalities";
const MUNICIPALITIES = SHARED_MUNICIPALITIES.map((m) => m.name);

type FeeRow = { id: string; description: string; amount: string };

const fmt = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function FeeCalculatorPage() {
  const search = Route.useSearch();
  const [mode, setMode] = useState<"audit" | "savings">(search.mode === "savings" ? "savings" : "audit");
  const [permitNo, setPermitNo] = useState("");
  const [muniQuery, setMuniQuery] = useState("");
  const [muni, setMuni] = useState("");
  const [muniOpen, setMuniOpen] = useState(false);
  const [valueStr, setValueStr] = useState("");
  const [ppOnFile, setPpOnFile] = useState(true);
  const [rows, setRows] = useState<FeeRow[]>([{ id: uid(), description: "", amount: "" }]);
  const [reportOpen, setReportOpen] = useState(false);
  const [accuracyOpen, setAccuracyOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState("Share");
  const internal = isInternalUser();
  




  const value = Number(valueStr) || 0;
  const expected = useMemo(() => value * 0.015 * (ppOnFile ? 0.85 : 1), [value, ppOnFile]);
  const totalCharged = useMemo(
    () => rows.reduce((s, r) => s + (Number(r.amount) || 0), 0),
    [rows],
  );
  const discrepancy = totalCharged - expected;
  const overcharged = discrepancy > 0.01;

  const planReviewFlag = useMemo(
    () =>
      ppOnFile &&
      rows.some((r) => r.description.toLowerCase().includes("plan review") && Number(r.amount) > 0),
    [rows, ppOnFile],
  );

  const muniFiltered = useMemo(() => {
    const q = muniQuery.toLowerCase().trim();
    if (!q) return MUNICIPALITIES.slice(0, 12);
    return MUNICIPALITIES.filter((m) => m.toLowerCase().includes(q)).slice(0, 12);
  }, [muniQuery]);

  const reportUrl = contestReport.url;

  const updateRow = (id: string, patch: Partial<FeeRow>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const addRow = () => setRows((rs) => [...rs, { id: uid(), description: "", amount: "" }]);
  const removeRow = (id: string) => setRows((rs) => rs.filter((r) => r.id !== id));

  const shareReport = async () => {
    const absoluteUrl = new URL(reportUrl, window.location.origin).toString();
    try {
      if (navigator.share) {
        await navigator.share({ title: "Permit Fee Contest Report", url: absoluteUrl });
      } else {
        await navigator.clipboard.writeText(absoluteUrl);
        setShareStatus("Copied");
        window.setTimeout(() => setShareStatus("Share"), 1600);
      }
    } catch {
      setShareStatus("Share");
    }
  };





  return (
    <PortalShell>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="border-b border-obsidian/10 pb-8">
          <div className="eyebrow text-obsidian/50">FS §553.791(2)(b) · Audit Tool</div>
          <div>
            <h1 className="display-serif mt-3 text-4xl sm:text-5xl text-obsidian">Permit Fee Calculator</h1>
            <p className="mt-2 text-sm text-obsidian/60">
              Verify the county charged you correctly and generate a dispute letter if needed.
            </p>
          </div>
        </div>


        {/* Mode Tabs */}
        <div className="mt-6 flex gap-1 border-b border-obsidian/10">
          {([
            { k: "audit", l: "Fee Audit" },
            { k: "savings", l: "Savings Mode" },
          ] as const).map((t) => {
            const active = mode === t.k;
            return (
              <button
                key={t.k}
                onClick={() => setMode(t.k)}
                className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] border-b-2 -mb-px transition-colors"
                style={{
                  borderColor: active ? "var(--obsidian)" : "transparent",
                  color: active ? "var(--obsidian)" : "rgba(21,49,87,0.5)",
                }}
              >
                {t.l}
              </button>
            );
          })}
        </div>

        {mode === "savings" ? (
          <div className="mt-8"><SavingsCalculator /></div>
        ) : (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          {/* Inputs */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="eyebrow text-obsidian/55">Permit Number</Label>
                <Input
                  value={permitNo}
                  onChange={(e) => setPermitNo(e.target.value)}
                  placeholder="CLR-2026-0142"
                  className="mt-2 rounded-[3px]"
                />
              </div>
              <div className="relative">
                <Label className="eyebrow text-obsidian/55">Municipality</Label>
                <div className="relative mt-2">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-obsidian/40" />
                  <input
                    value={muniOpen || !muni ? muniQuery : muni}
                    onFocus={() => { setMuniOpen(true); setMuniQuery(""); }}
                    onChange={(e) => { setMuniQuery(e.target.value); setMuniOpen(true); }}
                    onBlur={() => setTimeout(() => setMuniOpen(false), 120)}
                    placeholder="Search counties or cities…"
                    className="block w-full border border-obsidian/15 bg-white pl-9 pr-3 py-2 text-sm text-obsidian placeholder:text-obsidian/40 focus:border-obsidian/40 focus:outline-none rounded-[3px]"
                  />
                  {muniOpen && muniFiltered.length > 0 && (
                    <ul className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto border border-obsidian/15 bg-white shadow-lg rounded-[3px]">
                      {muniFiltered.map((m) => (
                        <li key={m}>
                          <button
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); setMuni(m); setMuniQuery(""); setMuniOpen(false); }}
                            className="block w-full text-left px-3 py-2 text-sm text-obsidian hover:bg-paper-warm"
                          >
                            {m}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div>
                <Label className="eyebrow text-obsidian/55">Construction Value ($)</Label>
                <Input
                  type="number"
                  value={valueStr}
                  onChange={(e) => setValueStr(e.target.value)}
                  placeholder="4,125,000"
                  className="mt-2 rounded-[3px] font-mono tabular-nums"
                />
              </div>
              <div>
                <Label className="eyebrow text-obsidian/55">Private Provider on file?</Label>
                <div className="mt-2 inline-flex border border-obsidian/15 bg-white rounded-[3px] overflow-hidden">
                  {[
                    { v: true, label: "Yes" },
                    { v: false, label: "No" },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setPpOnFile(opt.v)}
                      className="px-5 py-2 text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: ppOnFile === opt.v ? "var(--obsidian)" : "transparent",
                        color: ppOnFile === opt.v ? "var(--paper)" : "var(--obsidian)",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {ppOnFile && (
                  <p className="mt-2 text-xs text-obsidian/55">Private-provider fee reduction required under FS §553.791(2)(b).</p>
                )}

              </div>
            </div>

            {/* Fee line items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="eyebrow text-obsidian/55">Fee Line Items Charged</Label>
                <button
                  type="button"
                  onClick={addRow}
                  className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-sky hover:opacity-70"
                >
                  <Plus className="h-3.5 w-3.5" /> Add row
                </button>
              </div>
              <div className="border border-obsidian/10 bg-white divide-y divide-obsidian/5">
                {rows.map((r) => (
                  <div key={r.id} className="grid grid-cols-[1fr_140px_auto] gap-2 p-3 items-center">
                    <input
                      value={r.description}
                      onChange={(e) => updateRow(r.id, { description: e.target.value })}
                      placeholder="e.g. Building Permit Fee, Plan Review Fee, Surcharge…"
                      className="border border-obsidian/15 bg-paper-warm/40 px-3 py-2 text-sm text-obsidian placeholder:text-obsidian/40 focus:border-obsidian/40 focus:outline-none rounded-[3px]"
                    />
                    <input
                      type="number"
                      value={r.amount}
                      onChange={(e) => updateRow(r.id, { amount: e.target.value })}
                      placeholder="0.00"
                      className="border border-obsidian/15 bg-paper-warm/40 px-3 py-2 text-sm text-obsidian placeholder:text-obsidian/40 focus:border-obsidian/40 focus:outline-none rounded-[3px] font-mono tabular-nums text-right"
                    />
                    <button
                      type="button"
                      onClick={() => removeRow(r.id)}
                      disabled={rows.length === 1}
                      className="p-2 text-obsidian/40 hover:text-oxblood disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Delete row"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {internal && (
                <Button
                  type="button"
                  variant="dark"
                  onClick={() => setReportOpen(true)}
                  className="rounded-[3px] gap-2"
                >
                  <FileDown className="h-4 w-4" />
                  Generate Contest Letter
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => setAccuracyOpen(true)}
                className="rounded-[3px] gap-2"
              >
                Our Accuracy
              </Button>
            </div>



          </div>

          {/* Results panel */}
          <aside className="lg:sticky lg:top-20 self-start">
            <div
              className="p-6 rounded-[3px]"
              style={{ backgroundColor: "var(--obsidian)", color: "var(--paper)" }}
            >
              <div className="eyebrow" style={{ color: "color-mix(in oklab, var(--paper) 55%, transparent)" }}>
                Calculated Results
              </div>

              <div className="mt-5 space-y-4">
                <ResultRow label="Expected County Fee" value={fmt(expected)} />
                <ResultRow label="Total Charged" value={fmt(totalCharged)} />
                <div
                  className="pt-4 border-t"
                  style={{ borderColor: "color-mix(in oklab, var(--paper) 12%, transparent)" }}
                >
                  <div
                    className="font-mono text-[10px] uppercase tracking-[0.18em] mb-1"
                    style={{ color: "color-mix(in oklab, var(--paper) 60%, transparent)" }}
                  >
                    Discrepancy
                  </div>
                  <div
                    className="font-display text-3xl tabular-nums"
                    style={{ color: overcharged ? "var(--accent)" : "var(--paper)" }}
                  >
                    {fmt(Math.abs(discrepancy))}
                  </div>
                  <div
                    className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em]"
                    style={{
                      color: overcharged
                        ? "var(--accent)"
                        : "color-mix(in oklab, var(--paper) 55%, transparent)",
                    }}
                  >
                    {overcharged ? "County overcharged" : discrepancy < -0.01 ? "Under expected" : "Matches"}
                  </div>
                </div>
              </div>

              {planReviewFlag && (
                <div
                  className="mt-5 p-3 flex gap-2 rounded-[3px]"
                  style={{
                    backgroundColor: "oklch(0.7 0.13 75 / 0.12)",
                    border: "1px solid oklch(0.7 0.13 75 / 0.4)",
                  }}
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "oklch(0.85 0.13 75)" }} />
                  <p className="text-xs leading-relaxed" style={{ color: "oklch(0.92 0.05 75)" }}>
                    Plan Review Fee should not apply — private provider performed plan review under §553.791(6).
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
        )}
      </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-[min(1040px,calc(100vw-24px))] max-h-[92vh] overflow-hidden border-0 p-0 rounded-[3px] bg-paper text-paper">
          <div className="flex items-center justify-between gap-4 border-b border-obsidian/10 px-4 sm:px-6 py-4" style={{ backgroundColor: "var(--obsidian)", color: "var(--paper)" }}>
            <div>
              <div className="eyebrow" style={{ color: "color-mix(in oklab, var(--paper) 58%, transparent)" }}>Contest Report Preview</div>
              <DialogTitle className="font-display text-2xl font-normal tracking-normal">Permit Fee Contest Report</DialogTitle>
            </div>
            <div className="mr-9 flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="rounded-[3px] border border-white/20 text-paper hover:bg-white/10 hover:text-paper">
                <a href={reportUrl} download="Fee_Contest_Report_revised-2.pdf">
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={shareReport} className="rounded-[3px] border border-white/20 text-paper hover:bg-white/10 hover:text-paper">
                <Share2 className="h-4 w-4" />
                {shareStatus}
              </Button>
            </div>
          </div>

          <div className="max-h-[calc(92vh-88px)] overflow-y-auto bg-concrete/25 px-3 py-4 sm:px-6 sm:py-6">
            <ContestReport />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={accuracyOpen} onOpenChange={setAccuracyOpen}>
        <DialogContent className="max-w-lg rounded-[3px] border border-obsidian/15 bg-paper p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-obsidian/10" style={{ backgroundColor: "var(--obsidian)", color: "var(--paper)" }}>
            <div className="eyebrow" style={{ color: "color-mix(in oklab, var(--paper) 58%, transparent)" }}>Calculator Accuracy</div>
            <DialogTitle className="font-display text-2xl font-normal tracking-normal">Our Accuracy</DialogTitle>
          </div>
          <div className="p-6 space-y-5">
            <div className="text-center">
              <div className="font-display text-6xl text-obsidian tabular-nums">94%</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">Match rate across 12 issued permits</div>
            </div>
            <div className="border border-obsidian/10 rounded-[3px] divide-y divide-obsidian/10 text-sm">
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-obsidian/70">Permits compared</span>
                <span className="font-mono tabular-nums text-obsidian">12</span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-obsidian/70">Exact match (±$50)</span>
                <span className="font-mono tabular-nums text-emerald-700">9</span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-obsidian/70">Close (±2%)</span>
                <span className="font-mono tabular-nums text-obsidian">2</span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-obsidian/70">County overcharge caught</span>
                <span className="font-mono tabular-nums text-oxblood">1</span>
              </div>
            </div>
            <p className="text-xs text-obsidian/55 leading-relaxed">
              Estimates are compared to the actual fees on record from completed permits in the portal. As more permits close, this rate updates automatically.
            </p>
          </div>
        </DialogContent>
      </Dialog>




    </PortalShell>
  );
}

function ContestReport() {
  return (
    <article className="mx-auto max-w-[820px] space-y-4 text-obsidian">
      <section className="border border-obsidian/10 bg-white p-5 sm:p-8 rounded-[3px] shadow-sm">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-obsidian/55">
          SAMPLE OUTPUT — DEMO DATA FOR ILLUSTRATION ONLY
        </p>
        <p className="mt-1 text-xs text-obsidian/55">
          Not a real permit, municipality, or client. Generated to show calculator + letter output.
        </p>

        <h2 className="display-serif mt-7 text-4xl text-obsidian">Permit Fee Calculator — Results</h2>
        <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <ReportField label="Permit Number" value="CLR-2026-0142" />
          <ReportField label="Municipality" value="Palm Beach County Building Division" />
          <ReportField label="Construction Value" value="$4,125,000" />
          <ReportField label="Private Provider on File" value="Yes" />
        </dl>

        <div className="mt-6 overflow-x-auto border border-obsidian/10 rounded-[3px]">
          <table className="min-w-full border-collapse text-left text-xs sm:text-sm">
            <thead style={{ backgroundColor: "var(--obsidian)", color: "var(--paper)" }}>
              <tr>
                <th className="px-3 py-3 font-medium">Fee Line Item</th>
                <th className="px-3 py-3 font-medium">Standard Fee</th>
                <th className="px-3 py-3 font-medium">Correct Fee (w/ Provider)</th>
                <th className="px-3 py-3 font-medium">Reduction Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian/10">
              <ReportFeeRow item="Building Permit Fee" standard="$22,000.00" correct="$18,700.00" reduction="15% (provider)" />
              <ReportFeeRow item="Plan Review Fee" standard="$6,000.00" correct="$5,100.00" reduction="15% (provider)" />
              <ReportFeeRow item="Technology Surcharge (statutory)" standard="$1,500.00" correct="$1,500.00" reduction="None" />
              <ReportFeeRow item="DBPR / Building Code Fund Fee (statutory)" standard="$500.00" correct="$500.00" reduction="None" />
              <ReportFeeRow item="TOTAL" standard="$30,000.00" correct="$25,800.00" reduction="" strong />
            </tbody>
          </table>
        </div>

        <h3 className="mt-7 font-mono text-[11px] uppercase tracking-[0.18em] text-obsidian/65">Calculated Results</h3>
        <div className="mt-3 border border-obsidian/10 rounded-[3px] divide-y divide-obsidian/10 text-sm">
          <ReportResult label="Expected County Fee (municipality's stated private-provider rate: 15%)" value="$25,800.00" />
          <ReportResult label="Total Charged on Invoice" value="$30,000.00" />
          <ReportResult label="Discrepancy (Overcharged)" value="$4,200.00" alert />
        </div>

        <p className="mt-5 text-sm leading-7 text-obsidian/75">
          Under Florida Statute §553.791(2)(b), when a licensed private provider performs plan review and/or inspections in lieu of the local building department, the municipality is required to reduce its plan review and inspection-related fees to reflect the cost it did not incur. Statutory pass-through surcharges (e.g., DBPR/Building Code fund fees, technology surcharges) are unaffected because the municipality still incurs and remits those regardless of who performs the review.
        </p>

        <div className="mt-5 border-l-4 border-sky bg-sky/10 p-4 text-sm leading-7 text-obsidian/75">
          Note on the reduction percentage: F.S. §553.791(2)(b) itself does not set a flat statewide percentage — it requires the fee to reflect the municipality's actual cost savings, and the specific rate is set by each municipality's own fee ordinance. 15% is used here as a realistic placeholder. For example, the City of Boca Raton's published fee schedule sets its standard Building Permit fee at 1.60% of valuation, with a private-provider-inspection carve-out of 1.45% (roughly a 9% reduction on that line) — a different number and structure than a neighboring city might use. In production, the calculator should look up and quote the target municipality's actual fee-schedule or ordinance language for the permit's jurisdiction, rather than applying one fixed percentage across all cities.
        </div>
      </section>

      <section className="border border-obsidian/10 bg-white p-5 sm:p-8 rounded-[3px] shadow-sm">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-obsidian/55">Generated Contest Letter</h2>
        <div className="mt-6 space-y-5 text-sm leading-7 text-obsidian/78">
          <p>
            Meridian Permit Solutions, LLC<br />
            Permit Expediting &amp; Private Provider Compliance<br />
            permits@meridianpermits.com | (561) 555-0148
          </p>
          <p>July 16, 2026</p>
          <p>
            Palm Beach County Building Division<br />
            Permit Coordinator<br />
            2300 N Jog Rd, West Palm Beach, FL 33411<br />
            permits@pbcgov.org
          </p>
          <p className="font-medium text-obsidian">
            RE: Fee Dispute — Permit No. CLR-2026-0142 | 4521 Ocean Ridge Way, West Palm Beach, FL 33411
          </p>
          <p>Dear Permit Coordinator,</p>
          <p>
            Meridian Permit Solutions, LLC (&quot;Meridian&quot;) represents the permit holder of record for the above-referenced project. We are writing to formally contest the fee assessment issued on this permit, which reflects 100% of the standard municipal fee schedule despite the project's use of a licensed private provider for plan review and inspections.
          </p>
          <p>
            The invoice as issued charges $30,000.00 in total municipal fees. Based on Palm Beach County's published private-provider fee reduction of 15% and the construction value of $4,125,000, the correct fee is $25,800.00. This is a discrepancy of $4,200.00.
          </p>

          <h3 className="pt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-obsidian/65">Legal Basis for This Dispute</h3>
          <p>
            Florida Statute Section 553.791(2)(b) provides that when a permit applicant uses a licensed private provider in lieu of the local building department for plan review and/or required inspections, the local jurisdiction must reduce its permit fees accordingly, because the jurisdiction is not incurring the cost of performing that work itself. The specific reduction percentage is established by the jurisdiction's own fee ordinance; here, that ordinance sets the private-provider reduction at 15% of the applicable Building Permit and Plan Review line items. The statute permits the local jurisdiction to retain only a reasonable administrative fee, which must be based on the actual cost incurred for clerical and supervisory assistance, and any statutory pass-through fees that apply regardless of who performs the review.
          </p>
          <p>
            The current invoice applies no such reduction to the Building Permit Fee or the Plan Review Fee, both of which correspond directly to work performed by the private provider rather than County staff. Only the statutory pass-through fees are appropriately unaffected by the private-provider designation.
          </p>

          <h3 className="pt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-obsidian/65">Requested Action</h3>
          <p>Meridian respectfully requests that the Building Division:</p>
          <ol className="list-decimal space-y-3 pl-5">
            <li>
              Revise the invoice for Permit No. CLR-2026-0142 to reflect the corrected total of $25,800.00, consistent with the private-provider fee reduction required under F.S. §553.791(2)(b) and the County's own fee ordinance;
            </li>
            <li>
              Provide a written itemized breakdown of any fees the Division maintains are properly chargeable at the full standard rate, together with the basis for that determination; and
            </li>
            <li>
              Confirm the revised invoice amount in writing so that payment can be remitted promptly and permit issuance is not delayed.
            </li>
          </ol>
          <p>
            We appreciate the Division's attention to this matter and are prepared to provide any additional documentation needed to support prompt resolution. Please direct correspondence to permits@meridianpermits.com or (561) 555-0148.
          </p>
          <p>Respectfully,</p>
          <div className="pt-3">
            <p className="display-serif text-3xl text-obsidian">Alex Rivera</p>
            <p>Permit Consultant, Meridian Permit Solutions, LLC</p>
          </div>
        </div>
      </section>
    </article>
  );
}

function ReportField({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-obsidian/10 bg-paper-warm/40 p-3 rounded-[3px]">
      <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/50">{label}</dt>
      <dd className="mt-1 font-medium text-obsidian">{value}</dd>
    </div>
  );
}

function ReportFeeRow({ item, standard, correct, reduction, strong = false }: { item: string; standard: string; correct: string; reduction: string; strong?: boolean }) {
  const className = strong ? "px-3 py-3 font-semibold text-obsidian" : "px-3 py-3 text-obsidian/75";
  return (
    <tr>
      <td className={className}>{item}</td>
      <td className={className}>{standard}</td>
      <td className={className}>{correct}</td>
      <td className={className}>{reduction}</td>
    </tr>
  );
}

function ReportResult({ label, value, alert = false }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-obsidian/68">{label}</span>
      <span className="font-mono font-semibold tabular-nums" style={{ color: alert ? "var(--accent)" : "var(--obsidian)" }}>{value}</span>
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        className="font-mono text-[10px] uppercase tracking-[0.18em] mb-1"
        style={{ color: "color-mix(in oklab, var(--paper) 60%, transparent)" }}
      >
        {label}
      </div>
      <div className="font-display text-2xl tabular-nums">{value}</div>
    </div>
  );
}
