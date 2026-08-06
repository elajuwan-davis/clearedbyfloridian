import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { PortalShell } from "@/components/portal-shell";
import { BackendReconnecting } from "@/components/backend-reconnecting";
import { isMissingBackendEnvError } from "@/lib/env-error";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, EmptyState } from "@/components/ui-kit";

export const Route = createFileRoute("/admin/activity")({
  head: () => ({
    meta: [
      { title: "Activity Log · Admin — Cleard" },
      { name: "description", content: "Staff activity log of permit acceptances, corrections and submission events." },
      { property: "og:title", content: "Activity Log · Admin — Cleard" },
      { property: "og:description", content: "Staff activity log of permit acceptances, corrections and submission events." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ActivityPage,
});

type EventRow = {
  id: string;
  permit_id: string | null;
  event_type: string;
  actor_label: string | null;
  summary: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

function label(t: string) {
  return t.replace(/_/g, " ");
}

function ActivityPage() {
  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await (supabase.from("activity_events" as any) as any)
        .select("id, permit_id, event_type, actor_label, summary, details, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (!alive) return;
      if (error) setError(error.message);
      else setRows((data ?? []) as EventRow[]);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  return (
    <PortalShell>
      <PageShell
        crumbs={[{ label: "Admin" }]}
        title="Activity Log"
        meta={loading ? "Loading…" : `${rows.length} events`}
        width="narrow"
      >
        {loading ? (
          <div className="px-1 py-6 text-[12.5px] text-muted-foreground">Loading activity…</div>
        ) : error ? (
          isMissingBackendEnvError(error) ? (
            <BackendReconnecting />
          ) : (
            <div className="p-plate p-4 text-[12.5px] text-[var(--p-danger)]">{error}</div>
          )
        ) : rows.length === 0 ? (
          <EmptyState title="No activity recorded yet" />
        ) : (
          <ul className="p-plate p-divide overflow-hidden">
            {rows.map((r) => (
              <li key={r.id} className="px-3 py-2.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-[12.5px] font-medium capitalize">{label(r.event_type)}</span>
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </span>
                </div>
                {r.summary && <div className="mt-0.5 text-[12.5px] text-foreground/80">{r.summary}</div>}
                {typeof r.details?.message === "string" && (
                  <div className="mt-0.5 text-[12.5px] text-[var(--p-danger)]">“{r.details.message as string}”</div>
                )}
                <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                  <span>{r.actor_label ?? "Staff"}</span>
                  {r.permit_id && (
                    <Link to="/portal/permits/$id" params={{ id: r.permit_id }} className="hover:underline">
                      View permit
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </PageShell>
    </PortalShell>
  );
}
