import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Send,
  Save,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Package,
  Loader2,
  Copy,
  Plus,
  UserPlus,
  Trash2,
} from "lucide-react";
import {
  getPermit,
  updatePermit,
  getEffectiveDocs,
  type PermitRow,
  type PermitSub,
} from "@/lib/permits-api";
import {
  getBundle,
  bundleFromSubs,
  bundleProgress,
  tradeRowStatus,
  buildBundlePrefill,
  withBundle,
  newEmptyTrade,
  tradeCardState,
  bundleBudgetedTotal,
  subToSnapshot,
  type Bundle,
  type BundleTrade,
  type TradeCardState,
} from "@/lib/bundle";
import { createSubmission, type ManifestEntry } from "@/lib/submissions-api";
import { BundlePartialSubmitDialog } from "@/components/bundle-partial-submit-dialog";
import { FLORIDIAN_FIRM } from "@/lib/floridian-firm";

export const Route = createFileRoute("/portal/permits/$id/bundle")({
  head: () => ({
    meta: [
      { title: "Bundle Submission — Cleared by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BundleManagementPage,
});

function fmtUsd(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function BundleManagementPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [row, setRow] = useState<PermitRow | null>(null);
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feeInput, setFeeInput] = useState("");
  const [partialOpen, setPartialOpen] = useState(false);

  useEffect(() => {
    getPermit(id)
      .then((r) => {
        if (!r) throw notFound();
        setRow(r);
        let b = getBundle(r);
        if (!b || !b.enabled) {
          b = bundleFromSubs(r.subs);
        }
        setBundle(b);
        setFeeInput(b.gc_fee_cents ? (b.gc_fee_cents / 100).toFixed(2) : "");
      })
      .catch(() => toast.error("Could not load permit"))
      .finally(() => setLoading(false));
  }, [id]);

  const docs = useMemo(() => (row ? getEffectiveDocs(row) : []), [row]);
  const progress = useMemo(() => bundleProgress(bundle), [bundle]);

  async function persist(next: Bundle, opts?: { silent?: boolean }): Promise<PermitRow | null> {
    if (!row) return null;
    setSaving(true);
    try {
      const updated = await updatePermit(row.id, { intake_payload: withBundle(row, next) });
      setRow(updated);
      setBundle(getBundle(updated));
      if (!opts?.silent) toast.success("Bundle saved");
      return updated;
    } catch (e) {
      toast.error("Save failed: " + (e instanceof Error ? e.message : String(e)));
      return null;
    } finally {
      setSaving(false);
    }
  }

  function updateTrade(key: string, patch: Partial<BundleTrade>) {
    if (!bundle) return;
    const next: Bundle = {
      ...bundle,
      trades: bundle.trades.map((t) => (t.key === key ? { ...t, ...patch } : t)),
    };
    setBundle(next);
  }

  function commitFee() {
    if (!bundle) return;
    const cents = Math.max(0, Math.round(parseFloat(feeInput || "0") * 100)) || 0;
    if (cents === bundle.gc_fee_cents) return;
    setBundle({ ...bundle, gc_fee_cents: cents });
  }

  async function saveBundle() {
    if (!bundle) return;
    await persist(bundle);
  }

  async function sendToSub(trade: BundleTrade) {
    if (!row || !bundle) return;
    if (!trade.sub_snapshot?.email) {
      toast.error(`No email on file for ${trade.label} sub`);
      return;
    }
    const prefill = buildBundlePrefill(row, trade, bundle);
    const nextTrades = bundle.trades.map((t) =>
      t.key === trade.key
        ? { ...t, signature_status: "sent" as const, signature_sent_at: new Date().toISOString() }
        : t,
    );
    const bundleStatus: Bundle["status"] = nextTrades.some((t) => t.signature_status !== "pending")
      ? "subs_signing"
      : "draft";
    const next: Bundle = { ...bundle, trades: nextTrades, status: bundleStatus };
    await persist(next, { silent: true });
    // Signwell mock — log prefill locally so user can see what was sent
    try {
      const store = JSON.parse(localStorage.getItem("bundle_signature_log") || "[]");
      store.unshift({ permit_id: row.id, trade: trade.label, sent_at: new Date().toISOString(), prefill });
      localStorage.setItem("bundle_signature_log", JSON.stringify(store.slice(0, 100)));
    } catch { /* noop */ }
    toast.success(`Signature request sent to ${trade.label} sub`);
  }

  function markSigned(trade: BundleTrade) {
    if (!bundle) return;
    const nextTrades = bundle.trades.map((t) =>
      t.key === trade.key
        ? { ...t, signature_status: "signed" as const, signature_signed_at: new Date().toISOString() }
        : t,
    );
    const allSigned = nextTrades.every((t) => t.signature_status === "signed");
    const next: Bundle = { ...bundle, trades: nextTrades, status: allSigned ? "ready" : "subs_signing" };
    persist(next, { silent: true });
  }

  function resetTrade(trade: BundleTrade) {
    if (!bundle) return;
    const nextTrades = bundle.trades.map((t) =>
      t.key === trade.key ? { ...t, signature_status: "pending" as const, signature_sent_at: null, signature_signed_at: null } : t,
    );
    setBundle({ ...bundle, trades: nextTrades });
  }

  function buildManifest(includeKeys: string[]): { manifest: ManifestEntry[]; includedLabels: string[] } {
    if (!bundle) return { manifest: [], includedLabels: [] };
    const includedTrades = bundle.trades.filter((t) => includeKeys.includes(t.key));
    const manifest: ManifestEntry[] = [];
    for (const trade of includedTrades) {
      const tradeDocs = docs.filter((d) => trade.doc_keys.length === 0 || trade.doc_keys.includes(d.key));
      for (const d of tradeDocs) {
        if (d.status !== "uploaded" && !d.external_url) continue;
        manifest.push({
          trade: trade.label,
          trade_key: trade.key,
          doc_key: d.key,
          doc_label: d.label,
          filename: d.filename ?? d.label,
          storage_path: d.path ?? null,
          external_url: d.external_url ?? null,
          required: !!d.required,
        });
      }
    }
    return { manifest, includedLabels: includedTrades.map((t) => t.label) };
  }

  async function submitFull() {
    if (!row || !bundle) return;
    if (!progress.allSigned) {
      toast.error("All trades must be signed before full submit");
      return;
    }
    const includeKeys = bundle.trades.map((t) => t.key);
    const { manifest, includedLabels } = buildManifest(includeKeys);
    try {
      const sub = await createSubmission({
        permit_id: row.id,
        type: "full",
        trades_included: includedLabels,
        trades_pending: [],
        fee_cents: bundle.gc_fee_cents,
        package_manifest: manifest,
        notes: null,
        status: "received",
      });
      const next: Bundle = { ...bundle, status: "submitted" };
      await persist(next, { silent: true });
      toast.success("Full package submitted to Ops");
      navigate({ to: "/portal/submissions/$id", params: { id: sub.id } });
    } catch (e) {
      toast.error("Submission failed: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  async function submitPartial(opts: { selectedKeys: string[]; note: string }) {
    if (!row || !bundle) return;
    const { manifest, includedLabels } = buildManifest(opts.selectedKeys);
    const pendingLabels = bundle.trades
      .filter((t) => !opts.selectedKeys.includes(t.key))
      .map((t) => t.label);
    try {
      const sub = await createSubmission({
        permit_id: row.id,
        type: "partial",
        trades_included: includedLabels,
        trades_pending: pendingLabels,
        fee_cents: bundle.gc_fee_cents,
        package_manifest: manifest,
        notes: opts.note,
        status: "received",
      });
      const next: Bundle = { ...bundle, status: "partial" };
      await persist(next, { silent: true });
      setPartialOpen(false);
      toast.success("Partial package submitted");
      navigate({ to: "/portal/submissions/$id", params: { id: sub.id } });
    } catch (e) {
      toast.error("Submission failed: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  function copyPrefill(trade: BundleTrade) {
    if (!row || !bundle) return;
    const prefill = buildBundlePrefill(row, trade, bundle);
    const text = Object.entries(prefill).map(([k, v]) => `${k}: ${v}`).join("\n");
    navigator.clipboard.writeText(text).then(
      () => toast.success("Pre-fill data copied"),
      () => toast.error("Copy failed"),
    );
  }

  if (loading) return <div className="mx-auto max-w-5xl px-6 py-12 text-obsidian/60">Loading…</div>;
  if (!row || !bundle) return <div className="mx-auto max-w-5xl px-6 py-12 text-obsidian/60">Bundle not available.</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <Link to="/portal/permits/$id" params={{ id: row.id }} className="inline-flex items-center gap-1.5 text-[12px] font-mono uppercase tracking-[0.14em] text-obsidian/60 hover:text-obsidian">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Permit
      </Link>

      {/* Master header */}
      <div className="mt-4 border-b border-obsidian/10 pb-6">
        <div className="eyebrow text-obsidian/50 flex items-center gap-2"><Package className="h-3.5 w-3.5" /> Bundle Submission</div>
        <h1 className="display-serif mt-2 text-4xl text-obsidian">{row.project_name}</h1>
        <div className="mt-2 text-sm text-obsidian/60">{row.job_address}</div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-mono uppercase tracking-[0.14em] text-obsidian/60">
          <span>GC: <span className="text-obsidian">Flōridian</span></span>
          <span>·</span>
          <span>{row.municipality || "—"}</span>
          <span>·</span>
          <span>{row.permit_type || "—"}</span>
          <span>·</span>
          <span>Status: <span className="text-obsidian">{bundle.status.replace("_", " ")}</span></span>
        </div>
      </div>

      {/* Fee */}
      <div className="mt-6 bg-white border border-obsidian/10 rounded-[3px] p-6 grid gap-4 sm:grid-cols-[1fr_auto]">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-obsidian/75">GC Permit Fee</div>
          <div className="mt-1 text-sm text-obsidian/65">
            Single consolidated fee covering all {bundle.trades.length} trades. Replaces per-trade fees.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="absolute inset-y-0 left-3 grid place-items-center text-obsidian/40">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={feeInput}
              onChange={(e) => setFeeInput(e.target.value)}
              onBlur={commitFee}
              placeholder="0.00"
              className="w-40 border border-obsidian/15 bg-white pl-6 pr-3 py-2 text-sm text-obsidian rounded-[3px] focus:border-obsidian/40 focus:outline-none"
            />
          </div>
          <button
            onClick={saveBundle}
            disabled={saving}
            className="inline-flex items-center gap-2 border border-obsidian/20 bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5 disabled:opacity-60"
          >
            <Save className="h-3.5 w-3.5" /> Save
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-6 bg-white border border-obsidian/10 rounded-[3px] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-obsidian/75">Bundle Progress</div>
            <div className="mt-1 text-sm text-obsidian/70">
              <span className="font-medium text-obsidian">{progress.signed}</span> of {progress.total} trades signed
            </div>
          </div>
          <div className="flex gap-4 text-[11px] font-mono uppercase tracking-[0.12em] text-obsidian/60">
            <span>Signed: <span className="text-emerald-700 tabular-nums">{progress.signed}</span></span>
            <span>Sent: <span className="text-amber-700 tabular-nums">{progress.sent}</span></span>
            <span>Pending: <span className="text-red-700 tabular-nums">{progress.pending}</span></span>
          </div>
        </div>
        <div className="mt-4 h-2 bg-obsidian/10 rounded-full overflow-hidden">
          <div
            className="h-full transition-all"
            style={{
              width: `${progress.percent}%`,
              background: progress.percent === 100 ? "#16a34a" : "#153157",
            }}
          />
        </div>
      </div>

      {/* Trade cards */}
      <div className="mt-6 space-y-4">
        {bundle.trades.length === 0 && (
          <div className="border border-obsidian/12 rounded-[3px] p-6 text-sm text-obsidian/60 bg-white">
            No trades attached to this bundle. Return to the permit and add subs.
          </div>
        )}
        {bundle.trades.map((trade) => {
          const rowStatus = tradeRowStatus(trade, docs);
          const tradeDocs = docs.filter((d) => trade.doc_keys.length === 0 || trade.doc_keys.includes(d.key));
          const uploadedCount = tradeDocs.filter((d) => d.status === "uploaded").length;
          const iconMap: Record<string, React.ReactNode> = {
            not_contacted: <XCircle className="h-4 w-4 text-red-600" />,
            sent: <Loader2 className="h-4 w-4 text-amber-600 animate-spin" />,
            signed_docs_missing: <AlertTriangle className="h-4 w-4 text-amber-700" />,
            signed_complete: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
          };
          const statusLabel: Record<string, string> = {
            not_contacted: "Not contacted",
            sent: "Awaiting signature",
            signed_docs_missing: "Signed · docs incomplete",
            signed_complete: "Ready",
          };
          return (
            <div key={trade.key} className="bg-white border border-obsidian/10 rounded-[3px] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{iconMap[rowStatus]}</div>
                  <div>
                    <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-obsidian">{trade.label}</div>
                    <div className="mt-1 text-sm text-obsidian">
                      {trade.sub_snapshot?.company ?? <span className="text-obsidian/50 italic">No sub assigned</span>}
                    </div>
                    <div className="mt-0.5 text-[12px] text-obsidian/60">
                      {trade.sub_snapshot?.contact ? `${trade.sub_snapshot.contact} · ` : ""}
                      {trade.sub_snapshot?.email ?? "no email"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60">{statusLabel[rowStatus]}</div>
                  <div className="mt-1 text-[12px] text-obsidian/60">
                    Docs: <span className="tabular-nums text-obsidian">{uploadedCount}</span>/{tradeDocs.length}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {trade.signature_status === "pending" && (
                  <button
                    onClick={() => sendToSub(trade)}
                    className="inline-flex items-center gap-2 bg-obsidian px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-paper rounded-[3px]"
                  >
                    <Send className="h-3.5 w-3.5" /> Send to Sub
                  </button>
                )}
                {trade.signature_status === "sent" && (
                  <button
                    onClick={() => markSigned(trade)}
                    className="inline-flex items-center gap-2 border border-emerald-600/40 text-emerald-700 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] rounded-[3px] hover:bg-emerald-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Mark Signed
                  </button>
                )}
                {trade.signature_status !== "pending" && (
                  <button
                    onClick={() => resetTrade(trade)}
                    className="inline-flex items-center gap-2 border border-obsidian/20 bg-white px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5"
                  >
                    Reset
                  </button>
                )}
                <button
                  onClick={() => copyPrefill(trade)}
                  className="inline-flex items-center gap-2 border border-obsidian/20 bg-white px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5"
                  title="Copy pre-fill data for this sub's forms"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy Pre-fill
                </button>
              </div>

              <div className="mt-3 text-[11px] text-obsidian/50 font-mono uppercase tracking-[0.14em]">
                Pre-fill: {row.job_address} · {row.municipality || "—"} · GC {FLORIDIAN_FIRM.firmName} · Lic {bundle.gc_license_number}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-obsidian/10">
        <div className="text-[12px] text-obsidian/60">
          Fee: <span className="text-obsidian font-medium">{fmtUsd(bundle.gc_fee_cents)}</span>
          <span className="mx-2">·</span>
          {progress.allSigned ? "All trades signed — ready to submit" : "Full submit unlocks when all trades are signed"}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={saveBundle}
            disabled={saving}
            className="inline-flex items-center gap-2 border border-obsidian/20 bg-white px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5 disabled:opacity-60"
          >
            <Save className="h-3.5 w-3.5" /> Save Draft
          </button>
          <button
            onClick={() => setPartialOpen(true)}
            className="inline-flex items-center gap-2 border border-obsidian/20 bg-white px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5"
          >
            Partial Submit
          </button>
          <button
            onClick={submitFull}
            disabled={!progress.allSigned}
            className="inline-flex items-center gap-2 bg-obsidian px-5 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-paper rounded-[3px] disabled:opacity-40"
          >
            <Package className="h-3.5 w-3.5" /> Submit Full Package
          </button>
        </div>
      </div>

      <BundlePartialSubmitDialog
        open={partialOpen}
        bundle={bundle}
        onClose={() => setPartialOpen(false)}
        onSubmit={submitPartial}
      />
    </div>
  );
}
