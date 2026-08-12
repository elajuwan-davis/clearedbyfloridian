import { Fragment, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { BackendReconnecting } from "@/components/backend-reconnecting";
import { isMissingBackendEnvError } from "@/lib/env-error";
import { listInvitePipelineFn, type InvitePipelineRow } from "@/lib/invite-pipeline.functions";
import { TableShell, EmptyState, StatusChip } from "@/components/ui-kit";
import type { MetricTone } from "@/components/ui-kit";

function fmt(d: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

const inviteTone: Record<string, MetricTone> = {
  not_invited: "neutral",
  pending: "warning",
  accepted: "success",
  revoked: "danger",
};

const inviteLabel: Record<string, string> = {
  not_invited: "Not invited",
  pending: "Pending",
  accepted: "Accepted",
  revoked: "Expired / revoked",
};

/** Prospect pipeline from access request through invite, signup and first permits. */
export function AdminInvitePipelineView() {
  const load = useServerFn(listInvitePipelineFn);
  const [rows, setRows] = useState<InvitePipelineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = (await load({} as any)) as InvitePipelineRow[];
        if (alive) setRows(data);
      } catch (e: any) {
        if (alive) setError(e?.message ?? "Failed to load invite pipeline");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [load]);

  if (loading) {
    return <div className="px-1 py-6 text-[12.5px] text-muted-foreground">Loading pipeline…</div>;
  }
  if (error) {
    return isMissingBackendEnvError(error) ? (
      <BackendReconnecting />
    ) : (
      <div className="p-plate p-4 text-[12.5px] text-[var(--p-danger)]">{error}</div>
    );
  }
  if (rows.length === 0) return <EmptyState title="No access requests yet" />;

  return (
    <>
      <div className="mb-2 text-[11.5px] text-muted-foreground">
        {rows.length} prospects · sorted by recent activity
      </div>
      <TableShell>
        <thead>
          <tr>
            <th>Name / Email</th>
            <th>Requested</th>
            <th>Invited by</th>
            <th>Invited</th>
            <th>Invite</th>
            <th>Signup</th>
            <th className="text-right">Permits</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Fragment key={r.request_id}>
              <tr>
                <td className="min-w-0">
                  <div className="truncate text-[12.5px] font-medium">{r.name}</div>
                  <div className="truncate text-[11.5px] text-muted-foreground">{r.email}</div>
                  {r.company ? <div className="truncate text-[11.5px] text-muted-foreground">{r.company}</div> : null}
                  {r.tenant_name ? (
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{r.tenant_name}</div>
                  ) : null}
                </td>
                <td className="whitespace-nowrap text-[11.5px] tabular-nums text-muted-foreground">{fmt(r.requested_at)}</td>
                <td className="text-[12.5px] text-muted-foreground">{r.invited_by ?? "—"}</td>
                <td className="whitespace-nowrap text-[11.5px] tabular-nums text-muted-foreground">{fmt(r.invited_at)}</td>
                <td>
                  <StatusChip tone={inviteTone[r.invite_status]}>{inviteLabel[r.invite_status]}</StatusChip>
                </td>
                <td>
                  {r.signup_status === "account_created" ? (
                    <>
                      <StatusChip tone="success">Account created</StatusChip>
                      <div className="mt-1 text-[11px] text-muted-foreground">{fmt(r.signed_up_at)}</div>
                    </>
                  ) : (
                    <StatusChip tone="neutral">No account</StatusChip>
                  )}
                </td>
                <td className="text-right">
                  {r.permit_count > 0 ? (
                    <button
                      type="button"
                      className="text-[12.5px] font-medium tabular-nums hover:underline"
                      onClick={() => setOpen(open === r.request_id ? null : r.request_id)}
                    >
                      {r.permit_count}
                    </button>
                  ) : (
                    <span className="text-[12.5px] text-muted-foreground">0</span>
                  )}
                </td>
              </tr>
              {open === r.request_id && r.permits.length > 0 ? (
                <tr>
                  <td colSpan={7} className="bg-[var(--p-card-2)]">
                    <ul className="space-y-1 py-1">
                      {r.permits.map((p) => (
                        <li key={p.id} className="text-[11.5px]">
                          <Link to="/portal/permits/$id" params={{ id: p.id }} className="hover:underline">
                            {p.label}
                          </Link>
                          <span className="ml-2 text-muted-foreground">{fmt(p.created_at)}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ) : null}
            </Fragment>
          ))}
        </tbody>
      </TableShell>
    </>
  );
}
