import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { FileText, MapPin, Loader2 } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { listMySubPermitsFn, type SubPermitRow } from "@/lib/sub-portal-authed.functions";

export const Route = createFileRoute("/sub-portal")({
  head: () => ({
    meta: [
      { title: "My Projects — Cleard Subcontractor Portal" },
      { name: "description", content: "Projects you are attached to on Cleard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <PortalShell>
      <SubPortalIndex />
    </PortalShell>
  ),
});

function statusLabel(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function SubPortalIndex() {
  const list = useServerFn(listMySubPermitsFn);
  const [rows, setRows] = useState<SubPermitRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    list()
      .then((data) => setRows(data as SubPermitRow[]))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [list]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-obsidian/55">
          Subcontractor Portal
        </div>
        <h1 className="display-serif text-3xl md:text-4xl text-obsidian mt-1">My Projects</h1>
        <p className="mt-2 text-sm text-obsidian/60 max-w-2xl">
          Projects where you're listed as an attached subcontractor. Open a project to view
          shared documents like the permit copy and NOC once issued.
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-obsidian/50 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your projects…
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div className="border border-obsidian/10 bg-white rounded-[3px] p-8 text-center">
          <FileText className="mx-auto h-6 w-6 text-obsidian/30" />
          <div className="mt-3 text-sm text-obsidian/60">
            No projects yet. When a general contractor adds you to a permit and confirms
            your details, it will appear here.
          </div>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div className="border border-obsidian/10 bg-white rounded-[3px] divide-y divide-obsidian/10">
          {rows.map((r) => (
            <div key={r.permitId} className="flex items-start gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-medium text-obsidian truncate">
                  {r.projectName}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-obsidian/55 truncate">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {r.jobAddress}
                  {r.city ? `, ${r.city}` : ""}
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-[11px] text-obsidian/55">
                  <span className="font-mono uppercase tracking-[0.14em]">
                    {r.self.trade}
                  </span>
                  <span aria-hidden>·</span>
                  <span>{r.self.companyName}</span>
                  {r.permitNumber && (
                    <>
                      <span aria-hidden>·</span>
                      <span className="font-mono">{r.permitNumber}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="inline-flex items-center border border-obsidian/15 bg-paper-warm px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.12em] text-obsidian/70 rounded-[2px]">
                  {statusLabel(r.status)}
                </span>
                <Link
                  to={"/sub-portal/$token" as never}
                  params={{ token: r.permitId } as never}
                  className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian underline underline-offset-2 hover:opacity-80"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
