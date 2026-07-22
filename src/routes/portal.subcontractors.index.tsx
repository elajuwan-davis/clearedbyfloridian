import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Users, Plus, CheckCircle2, AlertTriangle, Link2, Copy, X, Trash2 } from "lucide-react";
import { listSubs, createSub, deleteSub, subIsComplete, subMissingFields, coiLifecycle, type SubRow } from "@/lib/subs-api";

export const Route = createFileRoute("/portal/subcontractors/")({
  head: () => ({
    meta: [
      { title: "Subcontractors — Cleared by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SubcontractorsListPage,
});

const coiTone: Record<ReturnType<typeof coiLifecycle>, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-emerald-600/10 text-emerald-700 border-emerald-600/30" },
  expiring_soon: { label: "Expiring", cls: "bg-amber-500/10 text-amber-700 border-amber-600/30" },
  expired: { label: "Expired", cls: "bg-red-500/10 text-red-700 border-red-600/30" },
  missing: { label: "Missing", cls: "bg-amber-500/10 text-amber-700 border-amber-600/30" },
};

function SubcontractorsListPage() {
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

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
            <Users className="h-3.5 w-3.5" strokeWidth={1.5} /> Projects
          </div>
          <h1 className="display-serif mt-3 text-4xl sm:text-5xl text-obsidian">Subcontractors</h1>
          <p className="mt-3 text-sm text-obsidian/60 max-w-xl">
            Central library of subcontractor profiles, backed by the database. Send a public intake link so subs can complete their own onboarding.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={generateIntakeLink} className="inline-flex items-center gap-2 border border-obsidian/25 bg-white px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian hover:bg-obsidian/5 rounded-[3px]">
            <Link2 className="h-3.5 w-3.5" /> Generate Intake Link
          </button>
          <Link to="/portal/subcontractors/new" className="inline-flex items-center gap-2 bg-obsidian px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-paper hover:bg-obsidian/90 rounded-[3px]">
            <Plus className="h-3.5 w-3.5" /> Add Subcontractor
          </Link>
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
        <div className="mt-8 border border-obsidian/10 bg-white rounded-[3px] overflow-hidden">
          <div className="hidden md:grid grid-cols-[1.5fr_0.8fr_0.9fr_0.9fr_0.9fr_0.8fr_0.6fr] gap-4 px-5 py-3 border-b border-obsidian/10 bg-obsidian/5 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60">
            <div>Company</div><div>Trade</div><div>License #</div><div>COI</div><div>Status</div><div>Link</div><div></div>
          </div>
          {subs.map((s) => {
            const coi = coiTone[coiLifecycle(s)];
            const complete = subIsComplete(s);
            const missing = subMissingFields(s);
            return (
              <div key={s.id} className="grid grid-cols-2 md:grid-cols-[1.5fr_0.8fr_0.9fr_0.9fr_0.9fr_0.8fr_0.6fr] gap-x-4 gap-y-2 px-5 py-4 border-b border-obsidian/10 last:border-b-0 items-center text-sm">
                <Link to="/portal/subcontractors/new" search={{ id: s.id } as never} className="hover:underline">
                  <div className="text-obsidian font-medium">{s.company_name}</div>
                  {s.qualifier_name && <div className="text-[11px] text-obsidian/50">{s.qualifier_name}</div>}
                </Link>
                <div className="text-obsidian/70 text-[13px]">{s.trade || "—"}</div>
                <div className="font-mono text-[12px] text-obsidian/70">{s.license_number || "—"}</div>
                <div>
                  <span className={`inline-block px-2 py-0.5 border rounded-[2px] font-mono text-[10px] uppercase tracking-[0.12em] ${coi.cls}`}>{coi.label}</span>
                  {s.coi_expiration && <div className="mt-1 text-[10px] text-obsidian/50 font-mono">exp {s.coi_expiration}</div>}
                </div>
                <div>
                  {complete ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 border rounded-[2px] font-mono text-[10px] uppercase tracking-[0.12em] bg-emerald-600/10 text-emerald-700 border-emerald-600/30">
                      <CheckCircle2 className="h-3 w-3" /> Complete
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 border rounded-[2px] font-mono text-[10px] uppercase tracking-[0.12em] bg-amber-500/10 text-amber-700 border-amber-600/30" title={missing.join(", ")}>
                      <AlertTriangle className="h-3 w-3" /> {missing.length} missing
                    </span>
                  )}
                </div>
                <button onClick={() => copySubLink(s.completion_token)} className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/70 hover:text-obsidian">
                  <Copy className="h-3 w-3" /> Copy
                </button>
                <button onClick={() => remove(s.id, s.company_name)} className="text-red-600 hover:text-red-800 justify-self-end">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

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
