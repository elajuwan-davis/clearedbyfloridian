import { createFileRoute, Link } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Plus, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — Cleared by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProjectsPage,
});

type ProjectStatus =
  | "submitted"
  | "in_review"
  | "corrections_required"
  | "correction_response_under_review"
  | "resubmitted_to_county"
  | "approved"
  | "inspection_scheduled"
  | "inspection_complete"
  | "permit_issued";

const statusMeta: Record<ProjectStatus, { label: string; tone: "neutral" | "sky" | "warn" | "ok" }> = {
  submitted: { label: "Submitted", tone: "neutral" },
  in_review: { label: "In review", tone: "sky" },
  corrections_required: { label: "Corrections required", tone: "warn" },
  correction_response_under_review: { label: "Response under review", tone: "sky" },
  resubmitted_to_county: { label: "Resubmitted", tone: "sky" },
  approved: { label: "Approved", tone: "ok" },
  inspection_scheduled: { label: "Inspection scheduled", tone: "sky" },
  inspection_complete: { label: "Inspection complete", tone: "ok" },
  permit_issued: { label: "Permit issued", tone: "ok" },
};

const toneClass: Record<"neutral" | "sky" | "warn" | "ok", string> = {
  neutral: "bg-paper-warm text-obsidian/70 border-obsidian/10",
  sky: "bg-sky/10 text-sky border-sky/30",
  warn: "bg-oxblood/10 text-oxblood border-oxblood/30",
  ok: "bg-emerald-600/10 text-emerald-700 border-emerald-600/30",
};

const projects: Array<{
  id: string;
  permit_no: string;
  name: string;
  address: string;
  county: string;
  value_cents: number;
  permit_types: string[];
  status: ProjectStatus;
  submitted_at: string;
}> = [
  { id: "1", permit_no: "CLR-2026-0142", name: "Ocean Ridge Estate", address: "1247 Banyan Trail, Ocean Ridge", county: "Palm Beach", value_cents: 412_500_000, permit_types: ["Building", "Electrical", "Plumbing"], status: "in_review", submitted_at: "May 28, 2026" },
  { id: "2", permit_no: "CLR-2026-0138", name: "Jupiter Island Residence", address: "88 Beach Rd, Jupiter Island", county: "Martin", value_cents: 687_200_000, permit_types: ["Building", "Mechanical"], status: "corrections_required", submitted_at: "May 21, 2026" },
  { id: "3", permit_no: "CLR-2026-0131", name: "Manalapan Bayfront", address: "1812 S Ocean Blvd, Manalapan", county: "Palm Beach", value_cents: 1_240_000_000, permit_types: ["Building", "Electrical", "Plumbing", "Mechanical"], status: "permit_issued", submitted_at: "May 12, 2026" },
  { id: "4", permit_no: "CLR-2026-0127", name: "Hobe Sound Compound", address: "5440 SE Gomez Ave, Hobe Sound", county: "Martin", value_cents: 298_400_000, permit_types: ["Building"], status: "approved", submitted_at: "May 06, 2026" },
  { id: "5", permit_no: "CLR-2026-0119", name: "Vero Beach Oceanfront", address: "2100 Ocean Dr, Vero Beach", county: "Indian River", value_cents: 524_900_000, permit_types: ["Building", "Electrical"], status: "submitted", submitted_at: "Apr 29, 2026" },
  { id: "6", permit_no: "CLR-2026-0112", name: "Stuart Riverhouse", address: "320 SW St Lucie Cres, Stuart", county: "Martin", value_cents: 186_300_000, permit_types: ["Building", "Plumbing"], status: "inspection_scheduled", submitted_at: "Apr 22, 2026" },
  { id: "7", permit_no: "CLR-2026-0104", name: "Palm Beach Landmark", address: "412 N County Rd, Palm Beach", county: "Palm Beach", value_cents: 2_180_000_000, permit_types: ["Building", "Electrical", "Plumbing", "Mechanical"], status: "resubmitted_to_county", submitted_at: "Apr 14, 2026" },
];

const fmtMoney = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

function ProjectsPage() {
  return (
    <PortalShell>
      <div className="mx-auto max-w-7xl px-8 py-12">
        {/* Header */}
        <div className="flex items-end justify-between gap-6 border-b border-obsidian/10 pb-8">
          <div>
            <div className="eyebrow text-obsidian/50">FL Statute 553.791 · Active Portfolio</div>
            <h1 className="display-serif mt-3 text-5xl text-obsidian">Projects</h1>
            <p className="mt-2 text-sm text-obsidian/60">
              All permits filed through Cleared on behalf of your firm.
            </p>
          </div>
          <Button asChild variant="dark">
            <Link to="/portal/new-permit">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>

        {/* Table */}
        <div className="mt-8 overflow-hidden border border-obsidian/10 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-obsidian/10 bg-paper-warm">
                  <th className="px-6 py-4 text-left font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-obsidian/50">Project / Address</th>
                  <th className="px-6 py-4 text-left font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-obsidian/50">County</th>
                  <th className="px-6 py-4 text-right font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-obsidian/50">Construction Value</th>
                  <th className="px-6 py-4 text-left font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-obsidian/50">Permit Types</th>
                  <th className="px-6 py-4 text-left font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-obsidian/50">Status</th>
                  <th className="px-6 py-4 text-left font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-obsidian/50">Submitted</th>
                  <th className="px-6 py-4 text-right font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-obsidian/50"></th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => {
                  const meta = statusMeta[p.status];
                  return (
                    <tr key={p.id} className="border-b border-obsidian/5 transition-colors hover:bg-paper-warm/50">
                      <td className="px-6 py-5">
                        <div className="font-medium text-obsidian">{p.name}</div>
                        <div className="mt-1 text-xs text-obsidian/55">{p.address}</div>
                        <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/40">{p.permit_no}</div>
                      </td>
                      <td className="px-6 py-5 text-obsidian/75">{p.county}</td>
                      <td className="px-6 py-5 text-right font-mono tabular-nums text-obsidian">{fmtMoney(p.value_cents)}</td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-1">
                          {p.permit_types.map((t) => (
                            <span key={t} className="border border-obsidian/15 bg-paper-warm px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-obsidian/70">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] ${toneClass[meta.tone]}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-6 py-5 font-mono text-xs tabular-nums text-obsidian/65">{p.submitted_at}</td>
                      <td className="px-6 py-5 text-right">
                        <Link
                          to="/projects/$id"
                          params={{ id: p.id }}
                          className="inline-flex items-center gap-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-sky transition-opacity hover:opacity-70"
                        >
                          View
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/40">
          {projects.length} projects · Palm Beach County + Treasure Coast
        </p>
      </div>
    </PortalShell>
  );
}
