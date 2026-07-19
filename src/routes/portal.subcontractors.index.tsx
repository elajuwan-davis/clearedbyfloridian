import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Users, Plus, CheckCircle2, AlertTriangle, Link2, Copy, X, Clock } from "lucide-react";
import {
  loadSubLibrary,
  coiStatus,
  licenseStatus,
  isComplete,
  ensureToken,
  upsertSub,
  type SubRecord,
} from "@/lib/subcontractor-library";

export const Route = createFileRoute("/portal/subcontractors/")({
  head: () => ({
    meta: [
      { title: "Subcontractors — Cleared by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SubcontractorsListPage,
});

const coiTone: Record<ReturnType<typeof coiStatus>, { label: string; cls: string }> = {
  "on-file": { label: "On File", cls: "bg-emerald-600/10 text-emerald-700 border-emerald-600/30" },
  expired: { label: "Expired", cls: "bg-oxblood/10 text-oxblood border-oxblood/30" },
  missing: { label: "Missing", cls: "bg-amber-500/10 text-amber-700 border-amber-600/30" },
};

function SubcontractorsListPage() {
  const [subs, setSubs] = useState<SubRecord[]>([]);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  useEffect(() => {
    setSubs(loadSubLibrary());
  }, []);

  function generateBlankIntakeLink() {
    // Create a lightweight placeholder sub carrying only a completion token so
    // the recipient can complete the full profile. Company name is filled in
    // during intake completion.
    const rec = upsertSub({ companyName: `Pending Invite ${new Date().toLocaleDateString()}`, trade: "" });
    const token = ensureToken(rec.id);
    const url = `${window.location.origin}/sub-intake/${token}`;
    setShareUrl(url);
    setSubs(loadSubLibrary());
    toast.success("Intake link generated");
  }

  function copyLink() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => toast.success("Link copied"));
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
            Central library of subcontractor profiles. Complete profiles power COI requests, Sub Insurance updates, and Permit Intake auto-fill.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={generateBlankIntakeLink}
            className="inline-flex items-center gap-2 border border-obsidian/25 bg-white px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian hover:bg-obsidian/5 rounded-[3px]"
          >
            <Link2 className="h-3.5 w-3.5" /> Generate Intake Link
          </button>
          <Link
            to="/portal/subcontractors/new"
            className="inline-flex items-center gap-2 bg-obsidian px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-paper hover:bg-obsidian/90 rounded-[3px]"
          >
            <Plus className="h-3.5 w-3.5" /> Add Subcontractor
          </Link>
        </div>
      </div>

      {subs.length === 0 ? (
        <div className="mt-10 border border-dashed border-obsidian/20 rounded-[3px] p-12 text-center">
          <Users className="h-8 w-8 mx-auto text-obsidian/30" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-obsidian/60">No subcontractors saved yet.</p>
          <Link
            to="/portal/subcontractors/new"
            className="mt-4 inline-flex items-center gap-2 bg-obsidian px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-paper rounded-[3px]"
          >
            <Plus className="h-3.5 w-3.5" /> Add your first sub
          </Link>
        </div>
      ) : (
        <div className="mt-8 border border-obsidian/10 bg-white rounded-[3px] overflow-hidden">
          <div className="hidden md:grid grid-cols-[1.5fr_0.8fr_0.9fr_0.8fr_0.9fr_0.6fr_0.8fr] gap-4 px-5 py-3 border-b border-obsidian/10 bg-obsidian/5 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60">
            <div>Company</div><div>Trade</div><div>License #</div><div>COI</div><div>License Exp</div><div>W-9</div><div>Status</div>
          </div>
          {subs.map((s) => {
            const coi = coiTone[coiStatus(s)];
            const lic = licenseStatus(s);
            const licDot =
              lic === "expired" ? "bg-oxblood" : lic === "expiring" ? "bg-amber-500" : lic === "ok" ? "bg-emerald-600" : "bg-obsidian/20";
            const licLabel =
              lic === "expired" ? "Expired" : lic === "expiring" ? "Expiring" : lic === "ok" ? "Current" : "—";
            const complete = isComplete(s);
            const pendingInvite = !!s.completionToken && !complete;
            return (
              <Link
                key={s.id}
                to="/portal/subcontractors/new"
                search={{ id: s.id } as never}
                className="grid grid-cols-2 md:grid-cols-[1.5fr_0.8fr_0.9fr_0.8fr_0.9fr_0.6fr_0.8fr] gap-x-4 gap-y-2 px-5 py-4 border-b border-obsidian/10 last:border-b-0 items-center text-sm hover:bg-obsidian/[0.02]"
              >
                <div>
                  <div className="text-obsidian font-medium">{s.companyName}</div>
                  {s.qualifierName && <div className="text-[11px] text-obsidian/50">{s.qualifierName}</div>}
                </div>
                <div className="text-obsidian/70 text-[13px]">{s.trade || "—"}</div>
                <div className="font-mono text-[12px] text-obsidian/70">{s.licenseNumber || "—"}</div>
                <div>
                  <span className={`inline-block px-2 py-0.5 border rounded-[2px] font-mono text-[10px] uppercase tracking-[0.12em] ${coi.cls}`}>
                    {coi.label}
                  </span>
                  {s.coiExpiration && (
                    <div className="mt-1 text-[10px] text-obsidian/50 font-mono">exp {s.coiExpiration}</div>
                  )}
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[12px] text-obsidian/80">
                    <span className={`h-2 w-2 rounded-full ${licDot}`} />
                    {licLabel}
                  </span>
                  {s.licenseExpiration && (
                    <div className="mt-1 text-[10px] text-obsidian/50 font-mono">exp {s.licenseExpiration}</div>
                  )}
                </div>
                <div>
                  <span className={`inline-block px-2 py-0.5 border rounded-[2px] font-mono text-[10px] uppercase tracking-[0.12em] ${s.w9FileName ? "bg-emerald-600/10 text-emerald-700 border-emerald-600/30" : "bg-amber-500/10 text-amber-700 border-amber-600/30"}`}>
                    {s.w9FileName ? "On File" : "Missing"}
                  </span>
                </div>
                <div>
                  {pendingInvite ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 border rounded-[2px] font-mono text-[10px] uppercase tracking-[0.12em] bg-sky-500/10 text-sky-800 border-sky-600/30">
                      <Clock className="h-3 w-3" /> Pending Invite
                    </span>
                  ) : complete ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 border rounded-[2px] font-mono text-[10px] uppercase tracking-[0.12em] bg-emerald-600/10 text-emerald-700 border-emerald-600/30">
                      <CheckCircle2 className="h-3 w-3" /> Complete
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 border rounded-[2px] font-mono text-[10px] uppercase tracking-[0.12em] bg-amber-500/10 text-amber-700 border-amber-600/30">
                      <AlertTriangle className="h-3 w-3" /> Incomplete
                    </span>
                  )}
                </div>
              </Link>
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
            <p className="mt-3 text-sm text-obsidian/65">
              Copy this link and share it with your subcontractor via text, email, WhatsApp, or however you prefer:
            </p>
            <div className="mt-3 flex items-stretch gap-2">
              <input
                readOnly
                value={shareUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="block w-full border border-obsidian/15 bg-white px-3 py-2 font-mono text-[12px] text-obsidian focus:border-obsidian/40 focus:outline-none rounded-[3px]"
              />
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center gap-1.5 bg-obsidian px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-paper rounded-[3px]"
              >
                <Copy className="h-3.5 w-3.5" /> Copy Link
              </button>
            </div>
            <p className="mt-3 text-[11px] text-obsidian/50">
              The sub will complete their full profile through the intake form.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
