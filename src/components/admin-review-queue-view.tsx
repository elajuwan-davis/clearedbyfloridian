import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { BackendReconnecting } from "@/components/backend-reconnecting";
import { isMissingBackendEnvError } from "@/lib/env-error";
import { listReviewQueueFn, type ReviewQueueRow } from "@/lib/review-queue.functions";
import { isVendorManaged } from "@/lib/project-vendors";
import { TableShell, EmptyState } from "@/components/ui-kit";

function fmt(d: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

/** Client self-submitted permits awaiting internal review. */
export function AdminReviewQueueView() {
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

  if (loading) {
    return <div className="px-1 py-6 text-[12.5px] text-muted-foreground">Loading queue…</div>;
  }
  if (error) {
    return isMissingBackendEnvError(error) ? (
      <BackendReconnecting />
    ) : (
      <div className="p-plate p-4 text-[12.5px] text-[var(--p-danger)]">{error}</div>
    );
  }
  if (rows.length === 0) {
    return (
      <EmptyState title="Nothing awaiting review" description="Client self-submitted permits will appear here." />
    );
  }

  return (
    <>
      <div className="mb-2 text-[11.5px] text-muted-foreground">{rows.length} awaiting review</div>
      <TableShell>
        <thead>
          <tr>
            <th>Project</th>
            <th>Jurisdiction</th>
            <th>Type</th>
            <th>Submitted by</th>
            <th>Submitted</th>
            <th className="w-[1%]" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="min-w-0">
                <Link
                  to="/portal/permits/$id"
                  params={{ id: r.id }}
                  className="truncate text-[12.5px] font-medium text-foreground hover:underline"
                >
                  {r.project_name}
                </Link>
                {r.job_address ? (
                  <div className="truncate text-[11.5px] text-muted-foreground">{r.job_address}</div>
                ) : null}
                {r.contractor_company ? (
                  <div className="truncate text-[11.5px] text-muted-foreground">{r.contractor_company}</div>
                ) : null}
              </td>
              <td className="text-[12.5px] text-muted-foreground">{r.municipality ?? r.city ?? "—"}</td>
              <td className="text-[12.5px] text-muted-foreground">{r.permit_type ?? "—"}</td>
              <td>
                <div className="text-[12.5px]">{r.submitted_by ?? "—"}</div>
                {r.tenant_name ? <div className="text-[11px] text-muted-foreground">{r.tenant_name}</div> : null}
              </td>
              <td className="whitespace-nowrap text-[11.5px] tabular-nums text-muted-foreground">
                {fmt(r.created_at)}
              </td>
              <td className="text-right">
                <Link to="/portal/permits/$id" params={{ id: r.id }} className="p-btn p-btn-ghost p-btn-sm">
                  Review
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </>
  );
}
