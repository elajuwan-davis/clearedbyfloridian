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

import { projectStatusMeta as statusMeta, toneClass } from "@/lib/status-badges";
import { PROJECTS, fullAddress } from "@/lib/projects-data";

const projects = PROJECTS.map((p) => ({
  id: p.id,
  permit_no: p.permit_no,
  name: p.name,
  address: fullAddress(p),
  county: p.county,
  value_cents: p.value_cents,
  permit_types: p.permit_types,
  status: p.status,
  submitted_at: p.submitted_at,
}));


const fmtMoney = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

function ProjectsPage() {
  return (
    <PortalShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-obsidian/10 pb-8">
          <div>
            <div className="eyebrow text-obsidian/50">FL Statute 553.791 · Active Portfolio</div>
            <h1 className="display-serif mt-3 text-5xl text-obsidian">Projects</h1>
            <p className="mt-2 text-sm text-obsidian/60">
              All permits filed through Cleared on behalf of your firm.
            </p>
          </div>
          <Button asChild variant="dark">
            <Link to="/portal/permits/new">
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
          {projects.length} projects · Broward through the Treasure Coast
        </p>
      </div>
    </PortalShell>
  );
}
