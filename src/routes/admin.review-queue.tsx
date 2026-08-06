import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";

import { PortalShell } from "@/components/portal-shell";
import { BackendReconnecting } from "@/components/backend-reconnecting";
import { isMissingBackendEnvError } from "@/lib/env-error";
import { listReviewQueueFn, type ReviewQueueRow } from "@/lib/review-queue.functions";
import { isVendorManaged } from "@/lib/project-vendors";


export const Route = createFileRoute("/admin/review-queue")({
  head: () => ({
    meta: [
      { title: "Review Queue · Admin — Cleard" },
      {
        name: "description",
        content: "Staff queue of client self-submitted permits awaiting internal review.",
      },
      { property: "og:title", content: "Review Queue · Admin — Cleard" },
      {
        property: "og:description",
        content: "Staff queue of client self-submitted permits awaiting internal review.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReviewQueuePage,
});

function fmt(d: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function ReviewQueuePage() {
  const load = useServerFn(listReviewQueueFn);
  const [rows, setRows] = useState<ReviewQueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = (await load({} as any)) as ReviewQueueRow[];
        // Vendor-managed permits are record copies only — not internal work items.
        if (alive) setRows(data.filter((r) => !isVendorManaged(r.project_name)));
      } catch (e: any) {

        if (alive) setError(e?.message ?? "Failed to load review queue");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [load]);

  return (
    <PortalShell>
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <div className="label-eyebrow text-obsidian/50">Admin</div>
        <h1 className="display-serif mt-2 text-4xl leading-tight text-obsidian">Review Queue</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Client self-submitted permits still in draft. Staff review each submission here before accepting it.
        </p>

        {loading ? (
          <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading queue…
          </div>
        ) : error ? (
          isMissingBackendEnvError(error) ? (
            <BackendReconnecting />
          ) : (
            <div className="mt-8 rounded-[3px] border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</div>
          )
        ) : rows.length === 0 ? (
          <div className="mt-8 rounded-[3px] border border-border p-8 text-center text-sm text-muted-foreground">
            Nothing awaiting review.
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-[3px] border border-border">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Jurisdiction</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Submitted by</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border/60 align-top">
                    <td className="px-4 py-3">
                      <Link
                        to="/portal/permits/$id"
                        params={{ id: r.id }}
                        className="font-medium underline underline-offset-4"
                      >
                        {r.project_name}
                      </Link>
                      {r.job_address ? (
                        <div className="text-xs text-muted-foreground">{r.job_address}</div>
                      ) : null}
                      {r.contractor_company ? (
                        <div className="text-xs text-muted-foreground">{r.contractor_company}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">{r.municipality ?? r.city ?? "—"}</td>
                    <td className="px-4 py-3">{r.permit_type ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div>{r.submitted_by ?? "—"}</div>
                      {r.tenant_name ? (
                        <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                          {r.tenant_name}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{fmt(r.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to="/portal/permits/$id"
                        params={{ id: r.id }}
                        className="font-mono text-[10px] uppercase tracking-[0.14em] underline underline-offset-4"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
