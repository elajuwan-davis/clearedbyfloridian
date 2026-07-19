import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { PROJECTS, fullAddress } from "@/lib/projects-data";
import { projectStatusMeta, toneClass } from "@/lib/status-badges";

export const Route = createFileRoute("/portal/projects")({
  component: ProjectsPage,
});

const fmtMoney = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

function ProjectsPage() {
  const [q, setQ] = useState("");
  const query = q.toLowerCase();
  const filtered = PROJECTS.filter(
    (p) =>
      p.name.toLowerCase().includes(query) ||
      p.client.toLowerCase().includes(query) ||
      p.address.toLowerCase().includes(query) ||
      p.permit_no.toLowerCase().includes(query) ||
      p.county.toLowerCase().includes(query),
  );

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <div className="label-eyebrow">◇ Projects</div>
        <h1 className="mt-4 font-display text-4xl tracking-tight">All permits</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {PROJECTS.length} of 32 active Flōridian jobs currently visible.
        </p>
      </div>

      <Input
        placeholder="Search by project, client, address, county, or permit number…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="h-11 rounded-sm max-w-md"
      />

      <div className="border hairline overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b hairline bg-secondary/40 label-eyebrow">
          <div className="col-span-2">Permit</div>
          <div className="col-span-4">Project</div>
          <div className="col-span-2">Client</div>
          <div className="col-span-2">Value</div>
          <div className="col-span-2 text-right">Status</div>
        </div>
        <div className="divide-y">
          {filtered.map((p) => {
            const meta = projectStatusMeta[p.status];
            return (
              <Link
                key={p.id}
                to="/portal/projects/$id"
                params={{ id: p.id }}
                className="grid grid-cols-12 gap-4 p-5 items-center hover:bg-secondary/40 transition-colors"
              >
                <div className="col-span-2 font-mono text-xs">{p.permit_no}</div>
                <div className="col-span-4">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{fullAddress(p)}</div>
                  {p.scope && (
                    <div className="text-[11px] text-muted-foreground/80 mt-0.5 italic">{p.scope}</div>
                  )}
                </div>
                <div className="col-span-2 text-sm text-obsidian/80">{p.client}</div>
                <div className="col-span-2 font-mono text-sm">{fmtMoney(p.value_cents)}</div>
                <div className="col-span-2 text-right">
                  <span className={`inline-flex items-center border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] ${toneClass[meta.tone]}`}>
                    {meta.label}
                  </span>
                </div>
              </Link>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-10 text-center text-sm text-muted-foreground">No permits match.</div>
          )}
        </div>
      </div>
    </div>
  );
}
