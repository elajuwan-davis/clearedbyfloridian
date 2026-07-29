import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { PortalShell } from "@/components/portal-shell";
import { supabase } from "@/integrations/supabase/client";

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
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="label-eyebrow text-obsidian/50">Admin</div>
        <h1 className="display-serif mt-2 text-4xl leading-tight text-obsidian">Activity Log</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Staff actions on permit submissions — acceptances, corrections and related events.
        </p>

        {loading ? (
          <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading activity…
          </div>
        ) : error ? (
          <div className="mt-8 rounded-[3px] border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</div>
        ) : rows.length === 0 ? (
          <div className="mt-8 rounded-[3px] border border-border p-8 text-center text-sm text-muted-foreground">
            No activity recorded yet.
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-border rounded-[3px] border border-border">
            {rows.map((r) => (
              <li key={r.id} className="px-4 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian">
                    {label(r.event_type)}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </span>
                </div>
                {r.summary && <div className="mt-1 text-sm text-obsidian/80">{r.summary}</div>}
                {typeof r.details?.message === "string" && (
                  <div className="mt-1 text-sm text-red-900/80">“{r.details.message as string}”</div>
                )}
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>{r.actor_label ?? "Staff"}</span>
                  {r.permit_id && (
                    <Link to="/portal/permits/$id" params={{ id: r.permit_id }} className="underline underline-offset-4">
                      View permit
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PortalShell>
  );
}
