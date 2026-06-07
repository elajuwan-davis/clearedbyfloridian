import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { permits } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "./portal.index";

export const Route = createFileRoute("/portal/projects")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const [q, setQ] = useState("");
  const filtered = permits.filter(
    (p) =>
      p.address.toLowerCase().includes(q.toLowerCase()) ||
      p.number.toLowerCase().includes(q.toLowerCase()) ||
      p.scope.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <div className="label-eyebrow">◇ Projects</div>
        <h1 className="mt-4 font-display text-4xl tracking-tight">All permits</h1>
      </div>

      <Input
        placeholder="Search by address, permit number, or scope…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="h-11 rounded-sm max-w-md"
      />

      <div className="border hairline overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b hairline bg-secondary/40 label-eyebrow">
          <div className="col-span-2">Permit</div>
          <div className="col-span-4">Project</div>
          <div className="col-span-2">Jurisdiction</div>
          <div className="col-span-2">Valuation</div>
          <div className="col-span-2 text-right">Status</div>
        </div>
        <div className="divide-y">
          {filtered.map((p) => (
            <div key={p.id} className="grid grid-cols-12 gap-4 p-5 items-center hover:bg-secondary/40 transition-colors">
              <div className="col-span-2 font-mono text-xs">{p.number}</div>
              <div className="col-span-4">
                <div className="font-medium">{p.address}</div>
                <div className="text-xs text-muted-foreground mt-1">{p.scope}</div>
                <div className="mt-2 h-0.5 bg-secondary overflow-hidden max-w-xs">
                  <div className="h-full bg-accent" style={{ width: `${p.progress}%` }} />
                </div>
              </div>
              <div className="col-span-2 font-mono text-xs text-muted-foreground">{p.jurisdiction}</div>
              <div className="col-span-2 font-mono text-sm">${p.valuation.toLocaleString()}</div>
              <div className="col-span-2 text-right">
                <StatusBadge status={p.status} />
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-10 text-center text-sm text-muted-foreground">No permits match.</div>
          )}
        </div>
      </div>
    </div>
  );
}
