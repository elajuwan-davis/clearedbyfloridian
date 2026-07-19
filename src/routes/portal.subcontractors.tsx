import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Plus, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  loadSubLibrary,
  coiStatus,
  licenseStatus,
  isComplete,
  type SubRecord,
} from "@/lib/subcontractor-library";

export const Route = createFileRoute("/portal/subcontractors")({
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

  useEffect(() => {
    setSubs(loadSubLibrary());
  }, []);

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
        <Link
          to="/portal/subcontractors/new"
          className="inline-flex items-center gap-2 bg-obsidian px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-paper hover:bg-obsidian/90 rounded-[3px]"
        >
          <Plus className="h-3.5 w-3.5" /> Add Subcontractor
        </Link>
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
          <div className="hidden md:grid grid-cols-[1.5fr_0.9fr_1fr_0.9fr_0.7fr_0.9fr] gap-4 px-5 py-3 border-b border-obsidian/10 bg-obsidian/5 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60">
            <div>Company</div><div>Trade</div><div>License #</div><div>COI</div><div>W-9</div><div>Status</div>
          </div>
          {subs.map((s) => {
            const coi = coiTone[coiStatus(s)];
            const complete = isComplete(s);
            return (
              <Link
                key={s.id}
                to="/portal/subcontractors/new"
                search={{ id: s.id } as never}
                className="grid grid-cols-2 md:grid-cols-[1.5fr_0.9fr_1fr_0.9fr_0.7fr_0.9fr] gap-x-4 gap-y-2 px-5 py-4 border-b border-obsidian/10 last:border-b-0 items-center text-sm hover:bg-obsidian/[0.02]"
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
                  <span className={`inline-block px-2 py-0.5 border rounded-[2px] font-mono text-[10px] uppercase tracking-[0.12em] ${s.w9FileName ? "bg-emerald-600/10 text-emerald-700 border-emerald-600/30" : "bg-amber-500/10 text-amber-700 border-amber-600/30"}`}>
                    {s.w9FileName ? "On File" : "Missing"}
                  </span>
                </div>
                <div>
                  {complete ? (
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
    </div>
  );
}
