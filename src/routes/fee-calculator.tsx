import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, AlertTriangle, Copy, Check, Search } from "lucide-react";

export const Route = createFileRoute("/fee-calculator")({
  head: () => ({
    meta: [
      { title: "Fee Calculator — Cleared by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FeeCalculatorPage,
});

const MUNICIPALITIES = [
  "Palm Beach County",
  "Town of Palm Beach",
  "Town of Manalapan",
  "Town of Gulf Stream",
  "Town of Ocean Ridge",
  "Town of Highland Beach",
  "Town of Jupiter",
  "Town of Jupiter Island",
  "City of West Palm Beach",
  "City of Boca Raton",
  "City of Delray Beach",
  "City of Boynton Beach",
  "City of Lake Worth Beach",
  "City of Wellington",
  "Village of Tequesta",
  "Village of North Palm Beach",
  "Martin County",
  "City of Stuart",
  "Town of Sewall's Point",
  "Town of Jupiter Island (Martin)",
  "City of Hobe Sound",
  "St. Lucie County",
  "City of Port St. Lucie",
  "City of Fort Pierce",
  "Indian River County",
  "City of Vero Beach",
  "Town of Indian River Shores",
  "Town of Orchid",
  "Broward County",
  "City of Fort Lauderdale",
  "City of Coral Springs",
  "City of Hollywood",
  "City of Pompano Beach",
  "City of Deerfield Beach",
];

type FeeRow = { id: string; description: string; amount: string };

const fmt = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function FeeCalculatorPage() {
  const [permitNo, setPermitNo] = useState("");
  const [muniQuery, setMuniQuery] = useState("");
  const [muni, setMuni] = useState("");
  const [muniOpen, setMuniOpen] = useState(false);
  const [valueStr, setValueStr] = useState("");
  const [ppOnFile, setPpOnFile] = useState(true);
  const [rows, setRows] = useState<FeeRow[]>([{ id: uid(), description: "", amount: "" }]);
  const [letterOpen, setLetterOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const value = Number(valueStr) || 0;
  const expected = useMemo(() => value * 0.015 * (ppOnFile ? 0.5 : 1), [value, ppOnFile]);
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

  const canGenerate = permitNo.trim().length > 0 && rows.some((r) => Number(r.amount) > 0);

  const updateRow = (id: string, patch: Partial<FeeRow>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const addRow = () => setRows((rs) => [...rs, { id: uid(), description: "", amount: "" }]);
  const removeRow = (id: string) => setRows((rs) => rs.filter((r) => r.id !== id));

  const letter = useMemo(() => {
    const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const next = new Date();
    do { next.setDate(next.getDate() + 1); } while (next.getDay() === 0 || next.getDay() === 6);
    const nextBiz = next.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const feeLines = rows
      .filter((r) => Number(r.amount) > 0)
      .map((r) => `  • ${r.description || "(unlabeled)"} — ${fmt(Number(r.amount))}`)
      .join("\n");
    return `${today}

${muni || "[Municipality Name]"} Building Department

Re: Permit No. ${permitNo} | ${muni || "[Municipality]"} | Private Provider Fee Inquiry

To Whom It May Concern:

We are writing on behalf of the permit applicant regarding the fee assessment on Permit No. ${permitNo}. We have identified a potential discrepancy between the fees assessed and those required under Florida Statute §553.791(2)(b).

FEES ASSESSED:
${feeLines}
  Total charged: ${fmt(totalCharged)}

EXPECTED FEE (with Private Provider):
Expected permit fee: ${fmt(expected)}
Basis: ${fmt(value)} × 1.5% × 50% private provider reduction per FS §553.791(2)(b)

DISCREPANCY: ${fmt(Math.max(0, discrepancy))}

Under F.S. §553.791(2)(b), when a licensed private provider performs plan review and/or inspections, the local government must reduce the building permit fee accordingly. The statutory review clock under F.S. §553.791 is currently running and is not tolled by this inquiry.

We respectfully request: (1) confirmation that the private provider fee reduction was applied to this permit, and (2) a complete itemized fee breakdown showing each component and the basis for calculation.

We would appreciate a response no later than close of business ${nextBiz}.

Respectfully,

Cleared by Flōridian
Private Provider Services
permits@floridianinc.com`;
  }, [permitNo, muni, rows, totalCharged, expected, value, discrepancy]);

  async function copyLetter() {
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <PortalShell>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="border-b border-obsidian/10 pb-8">
          <div className="eyebrow text-obsidian/50">FS §553.791(2)(b) · Audit Tool</div>
          <h1 className="display-serif mt-3 text-4xl sm:text-5xl text-obsidian">Permit Fee Calculator</h1>
          <p className="mt-2 text-sm text-obsidian/60">
            Verify the county charged you correctly and generate a dispute letter if needed.
          </p>
        </div>

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
                  <p className="mt-2 text-xs text-obsidian/55">50% fee reduction required under FS §553.791(2)(b).</p>
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

            <Button
              variant="dark"
              disabled={!canGenerate}
              onClick={() => setLetterOpen(true)}
              className="rounded-[3px]"
            >
              Generate Contest Letter
            </Button>
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
      </div>

      {/* Letter modal */}
      <Dialog open={letterOpen} onOpenChange={setLetterOpen}>
        <DialogContent className="max-w-2xl rounded-[3px]">
          <DialogHeader>
            <DialogTitle className="display-serif text-2xl">Contest Letter — Private Provider Fee Inquiry</DialogTitle>
          </DialogHeader>
          <pre className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap border border-obsidian/15 bg-paper-warm/60 p-5 text-sm leading-relaxed text-obsidian font-sans rounded-[3px]">
{letter}
          </pre>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setLetterOpen(false)} className="rounded-[3px]">
              Close
            </Button>
            <Button variant="dark" onClick={copyLetter} className="rounded-[3px] gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy to clipboard"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalShell>
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
