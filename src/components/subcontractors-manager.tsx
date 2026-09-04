import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Users,
  Plus,
  AlertTriangle,
  Link2,
  Copy,
  X,
  Trash2,
  Loader2,
  ShieldCheck,
  ExternalLink,
  Lock,
} from "lucide-react";
import { listSubs, createSub, deleteSub, updateSubApi, subIsComplete, subMissingFields, coiLifecycle, type SubRow } from "@/lib/subs-api";
import { verifyDbprLicense, dbprLookupUrl, type DbprResult } from "@/lib/dbpr-api";
import { MarketplacePanel } from "@/components/marketplace-panel";
import { LockedFeatureButton } from "@/components/feature-lock";
import { usePlanAccess } from "@/lib/plan-access";
import { StatusChip, type MetricTone } from "@/components/ui-kit";

const dbprTone: Record<string, { label: string; tone: MetricTone }> = {
  active: { label: "Verified · Active", tone: "success" },
  expired: { label: "Expired", tone: "danger" },
  inactive: { label: "Inactive", tone: "danger" },
  not_found: { label: "Not Found", tone: "warning" },
  unknown: { label: "Unverified", tone: "info" },
};

const coiTone: Record<ReturnType<typeof coiLifecycle>, { label: string; tone: MetricTone }> = {
  active: { label: "Active", tone: "success" },
  expiring_soon: { label: "Expiring", tone: "warning" },
  expired: { label: "Expired", tone: "danger" },
  missing: { label: "Missing", tone: "warning" },
};

export function SubcontractorsManager() {
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<Record<string, boolean>>({});
  const plan = usePlanAccess();
  const invitesLocked = plan.locked("sub_invites");
  const verifyLocked = plan.locked("license_verification");

  const needsAttention = subs.filter((s) => {
    const c = coiLifecycle(s);
    return c === "expired" || c === "expiring_soon" || c === "missing";
  });
  const expiredCount = subs.filter((s) => coiLifecycle(s) === "expired").length;

  async function verify(sub: SubRow) {
    if (!sub.license_number) {
      toast.error("No license number on file");
      return;
    }
    setVerifying((v) => ({ ...v, [sub.id]: true }));
    try {
      const r: DbprResult = await verifyDbprLicense(sub.license_number);
      const patch = {
        dbpr_verified_at: r.checked_at,
        dbpr_status: r.status,
        dbpr_holder_name: r.holder_name ?? null,
        dbpr_license_type: r.license_type ?? null,
        dbpr_expiration: r.expiration ?? null,
      };
      await updateSubApi(sub.id, { ...(patch as any) });
      setSubs((prev) =>
        prev.map((s) => (s.id === sub.id ? ({ ...s, ...patch } as unknown as SubRow) : s)),
      );
      toast.success(`DBPR: ${r.status}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verify failed");
    } finally {
      setVerifying((v) => ({ ...v, [sub.id]: false }));
    }
  }


  async function refresh() {
    setLoading(true);
    try { setSubs(await listSubs()); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);

  async function generateIntakeLink() {
    try {
      const stamp = new Date().toLocaleDateString();
      const rec = await createSub({ company_name: `Pending Invite ${stamp}`, status: "invited" });
      const url = `https://cleared.floridianinc.com/sub-intake/${rec.completion_token}`;
      setShareUrl(url);
      await refresh();
      toast.success("Intake link generated");
    } catch (e) {
      toast.error("Failed: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  function copyLink() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => toast.success("Link copied"));
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    try { await deleteSub(id); toast.success("Deleted"); await refresh(); }
    catch (e) { toast.error("Delete failed: " + (e instanceof Error ? e.message : String(e))); }
  }

  async function copySubLink(token: string) {
    const url = `https://cleared.floridianinc.com/sub-intake/${token}`;
    await navigator.clipboard.writeText(url);
    toast.success("Intake link copied");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex items-end justify-between gap-4 flex-wrap border-b border-obsidian/10 pb-8">
        <div>
          <div className="eyebrow text-obsidian/50 flex items-center gap-2">
            <Users className="h-3.5 w-3.5" strokeWidth={1.5} /> Documents / Forms
          </div>
          <h1 className="display-serif mt-3 text-4xl sm:text-5xl text-obsidian">Subcontractors</h1>
          <p className="mt-3 text-sm text-obsidian/60 max-w-xl">
            Central library of subcontractor profiles, backed by the database. Send a public intake link so subs can complete their own onboarding.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {invitesLocked ? (
            <LockedFeatureButton feature="sub_invites" label="Generate Intake Link" />
          ) : (
            <button type="button" data-tour="generate-intake-link" onClick={generateIntakeLink} className="inline-flex items-center gap-2 border border-obsidian/25 bg-white px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian hover:bg-obsidian/5 rounded-[3px]">
              <Link2 className="h-3.5 w-3.5" /> Generate Intake Link
            </button>
          )}
          {invitesLocked ? (
            <LockedFeatureButton feature="sub_invites" label="Add Subcontractor" />
          ) : (
            <Link to="/portal/subcontractors/new" className="inline-flex items-center gap-2 bg-obsidian px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-paper hover:bg-obsidian/90 rounded-[3px]">
              <Plus className="h-3.5 w-3.5" /> Add Subcontractor
            </Link>
          )}
        </div>
      </div>

      {loading && subs.length === 0 ? (
        <div className="mt-10 text-center text-obsidian/50">Loading…</div>
      ) : subs.length === 0 ? (
        <div className="mt-10 border border-dashed border-obsidian/20 rounded-[3px] p-12 text-center">
          <Users className="h-8 w-8 mx-auto text-obsidian/30" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-obsidian/60">No subcontractors saved yet.</p>
        </div>
      ) : (
        <div className="mt-8 border border-obsidian/10 bg-white rounded-[3px] overflow-x-auto">
          <div className="hidden min-w-[1080px] md:grid grid-cols-[1.4fr_0.8fr_0.85fr_0.85fr_0.9fr_0.85fr_0.95fr] gap-4 px-5 py-3 border-b border-obsidian/10 bg-obsidian/5 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60">
            <div>Company</div><div>Trade</div><div>License #</div><div>COI</div><div>Docs</div><div>DBPR Status</div><div className="text-right">Verify / Link</div>
          </div>
          {subs.map((s) => {
            const coi = coiTone[coiLifecycle(s)];
            const complete = subIsComplete(s);
            const missing = subMissingFields(s);
            const dbpr = dbprTone[(s as any).dbpr_status ?? "unknown"] ?? dbprTone.unknown;
            const isVerifying = !!verifying[s.id];
            return (
              <div key={s.id} className="grid min-w-[1080px] grid-cols-2 md:grid-cols-[1.4fr_0.8fr_0.85fr_0.85fr_0.9fr_0.85fr_0.95fr] gap-x-4 gap-y-2 px-5 py-4 border-b border-obsidian/10 last:border-b-0 items-center text-sm">
                <Link to="/portal/subcontractors/new" search={{ id: s.id } as never} className="hover:underline">
                  <div className="text-obsidian font-medium">{s.company_name}</div>
                  {s.qualifier_name && <div className="text-[11px] text-obsidian/50">{s.qualifier_name}</div>}
                </Link>
                <div className="text-obsidian/70 text-[13px]">{s.trade || "—"}</div>
                <div className="font-mono text-[12px] text-obsidian/70">{s.license_number || "—"}</div>
                <div>
                  <StatusChip tone={coi.tone}>{coi.label}</StatusChip>
                  {s.coi_expiration && <div className="mt-1 text-[10px] text-obsidian/50 font-mono">exp {s.coi_expiration}</div>}
                </div>
                <div>
                  {complete ? (
                    <StatusChip tone="success">Complete</StatusChip>
                  ) : (
                    <StatusChip tone="warning" className="whitespace-nowrap" >{missing.length} missing</StatusChip>
                  )}
                </div>
                <div>
                  <StatusChip tone={dbpr.tone}>{dbpr.label}</StatusChip>
                  {(s as any).dbpr_expiration && (
                    <div className="mt-1 text-[10px] text-obsidian/50 font-mono">exp {(s as any).dbpr_expiration}</div>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => verify(s)}
                    disabled={verifyLocked || !s.license_number || isVerifying}
                    title={
                      verifyLocked
                        ? "Licence verification isn't on your plan"
                        : s.license_number
                          ? "Verify with DBPR"
                          : "No license number on file yet"
                    }
                    className="inline-flex items-center gap-1 border border-obsidian/25 bg-white px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian rounded-[3px] hover:bg-obsidian/5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isVerifying ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : verifyLocked ? (
                      <Lock className="h-3 w-3" />
                    ) : (
                      <ShieldCheck className="h-3 w-3" />
                    )}{" "}
                    Verify
                  </button>
                  {s.license_number && (
                    <a
                      href={dbprLookupUrl(s.license_number)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open DBPR lookup"
                      className="text-obsidian/60 hover:text-obsidian"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {!invitesLocked && (
                    <button onClick={() => copySubLink(s.completion_token)} title="Copy intake link" className="text-obsidian/60 hover:text-obsidian">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button onClick={() => remove(s.id, s.company_name)} title="Delete" className="text-red-600 hover:text-red-800">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* COI & license compliance summary */}
      <div className="mt-10 grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          <div className="border border-obsidian/10 bg-white rounded-[3px] p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50">Needs Attention</div>
            <div className={`mt-2 text-3xl ${needsAttention.length ? "text-amber-700" : "text-obsidian"}`}>{needsAttention.length}</div>
          </div>
          <div className="border border-obsidian/10 bg-white rounded-[3px] p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50">Expired COIs</div>
            <div className={`mt-2 text-3xl ${expiredCount ? "text-red-700" : "text-obsidian"}`}>{expiredCount}</div>
          </div>
        </div>
        <div className="border border-obsidian/10 bg-white rounded-[3px]">
          <div className="flex items-center justify-between border-b border-obsidian/10 px-4 py-2.5">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60">COI Alerts</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/40">{needsAttention.length} needs attention</div>
          </div>
          {loading ? (
            <div className="px-4 py-4 text-[12px] text-obsidian/50">Loading…</div>
          ) : needsAttention.length === 0 ? (
            <div className="flex items-center gap-2.5 px-4 py-4">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              <div className="text-[12.5px] text-obsidian/60">All COIs on file are 30+ days from expiration.</div>
            </div>
          ) : (
            <div>
              {needsAttention.map((s) => {
                const c = coiLifecycle(s);
                return (
                  <div key={s.id} className="flex items-center gap-3 border-b border-obsidian/10 px-4 py-2.5 last:border-b-0">
                    <AlertTriangle className={`h-4 w-4 shrink-0 ${c === "expired" ? "text-red-600" : "text-amber-600"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12.5px] font-medium text-obsidian">{s.company_name}</div>
                      <div className="truncate text-[11px] text-obsidian/50">{s.trade || "—"} · Exp {s.coi_expiration || "—"}</div>
                    </div>
                    <StatusChip tone={coiTone[c].tone}>{coiTone[c].label}</StatusChip>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <MarketplacePanel />

      {shareUrl && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-obsidian/40 p-4" onClick={() => setShareUrl(null)}>
          <div className="w-full max-w-lg bg-white rounded-[3px] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="font-display text-xl text-obsidian">Intake Link Generated</div>
              <button onClick={() => setShareUrl(null)}><X className="h-4 w-4" /></button>
            </div>
            <p className="mt-3 text-sm text-obsidian/65">Share this link with the subcontractor. Their submission will save directly to the database.</p>
            <div className="mt-3 flex items-stretch gap-2">
              <input readOnly value={shareUrl} onFocus={(e) => e.currentTarget.select()} className="block w-full border border-obsidian/15 bg-white px-3 py-2 font-mono text-[12px] text-obsidian focus:border-obsidian/40 focus:outline-none rounded-[3px]" />
              <button type="button" onClick={copyLink} className="inline-flex items-center gap-1.5 bg-obsidian px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-paper rounded-[3px]">
                <Copy className="h-3.5 w-3.5" /> Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
