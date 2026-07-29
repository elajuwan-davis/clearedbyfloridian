import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PortalShell } from "@/components/portal-shell";
import { listInvitePipelineFn, type InvitePipelineRow } from "@/lib/invite-pipeline.functions";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/invites")({
  head: () => ({
    meta: [
      { title: "Invite Pipeline · Admin — Cleard" },
      { name: "description", content: "Track prospects from access request through invite, signup, and first permits." },
      { property: "og:title", content: "Invite Pipeline · Admin — Cleard" },
      { property: "og:description", content: "Track prospects from access request through invite, signup, and first permits." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InvitePipelinePage,
});

function fmt(d: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

const inviteBadge: Record<string, string> = {
  not_invited: "bg-muted text-muted-foreground",
  pending: "bg-amber-100 text-amber-900",
  accepted: "bg-emerald-100 text-emerald-900",
  revoked: "bg-red-100 text-red-900",
};

const inviteLabel: Record<string, string> = {
  not_invited: "Not invited",
  pending: "Pending",
  accepted: "Accepted",
  revoked: "Expired / revoked",
};

function InvitePipelinePage() {
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

  return (
    <PortalShell>
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <div className="label-eyebrow text-obsidian/50">Admin</div>
        <h1 className="display-serif mt-2 text-4xl leading-tight text-obsidian">Invite Pipeline</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          One row per prospect — access request, invite, account creation, and permits created since signup.
          Sorted by most recent activity.
        </p>

        {loading ? (
          <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading pipeline…
          </div>
        ) : error ? (
          <div className="mt-8 rounded-[3px] border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</div>
        ) : rows.length === 0 ? (
          <div className="mt-8 rounded-[3px] border border-border p-8 text-center text-sm text-muted-foreground">
            No access requests yet.
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-[3px] border border-border">
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="px-4 py-3">Name / Email</th>
                  <th className="px-4 py-3">Requested</th>
                  <th className="px-4 py-3">Invited by</th>
                  <th className="px-4 py-3">Invited</th>
                  <th className="px-4 py-3">Invite</th>
                  <th className="px-4 py-3">Signup</th>
                  <th className="px-4 py-3 text-right">Permits</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <Fragment key={r.request_id}>
                    <tr className="border-b border-border/60 align-top">
                      <td className="px-4 py-3">
                        <div className="font-medium">{r.name}</div>
                        <div className="text-xs text-muted-foreground">{r.email}</div>
                        {r.company ? <div className="text-xs text-muted-foreground">{r.company}</div> : null}
                        {r.tenant_name ? (
                          <div className="mt-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                            {r.tenant_name}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{fmt(r.requested_at)}</td>
                      <td className="px-4 py-3">{r.invited_by ?? "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{fmt(r.invited_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-[3px] px-2 py-0.5 text-[11px] ${inviteBadge[r.invite_status]}`}>
                          {inviteLabel[r.invite_status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.signup_status === "account_created" ? (
                          <>
                            <span className="inline-block rounded-[3px] bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-900">
                              Account created
                            </span>
                            <div className="mt-1 text-xs text-muted-foreground">{fmt(r.signed_up_at)}</div>
                          </>
                        ) : (
                          <span className="inline-block rounded-[3px] bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                            No account
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {r.permit_count > 0 ? (
                          <button
                            type="button"
                            className="font-medium underline underline-offset-4"
                            onClick={() => setOpen(open === r.request_id ? null : r.request_id)}
                          >
                            {r.permit_count}
                          </button>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                    </tr>
                    {open === r.request_id && r.permits.length > 0 ? (
                      <tr className="border-b border-border/60 bg-muted/20">
                        <td colSpan={7} className="px-4 py-3">
                          <ul className="space-y-1">
                            {r.permits.map((p) => (
                              <li key={p.id} className="text-xs">
                                <Link
                                  to="/portal/permits/$id"
                                  params={{ id: p.id }}
                                  className="underline underline-offset-4"
                                >
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
            </table>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
