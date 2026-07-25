// Victoria proactive alert scanner — invoked on a schedule (daily) or on demand.
// Iterates every active permit and emits Victoria alerts for:
//   1. Stale permits (no status change in 14+ days)
//   2. Correction deadline warnings (7 and 14 days in corrections)
//   3. Lien release reminders (30 days after permit_issued if any release
//      is not yet filed)
//   4. Upcoming inspection (24h before inspection scheduled_at)
//
// Security: apikey header must match SUPABASE_PUBLISHABLE_KEY, matching the
// pattern used by other /api/public/* cron endpoints.
import { createFileRoute } from "@tanstack/react-router";

function unauthorized() { return new Response("Unauthorized", { status: 401 }); }

const DAY = 24 * 60 * 60 * 1000;

type PermitRow = {
  id: string;
  tenant_id: string | null;
  project_name: string;
  city: string | null;
  permit_type: string | null;
  status: string;
  updated_at: string;
  submitted_date: string | null;
  intake_payload: Record<string, unknown> | null;
};

async function loadJson(res: Response) {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export const Route = createFileRoute("/api/public/victoria-scan")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const publishable = process.env.SUPABASE_PUBLISHABLE_KEY;
        const url = process.env.SUPABASE_URL;
        if (!publishable || !url) return new Response("Missing env", { status: 500 });
        const apikey = request.headers.get("apikey");
        if (apikey !== publishable) return unauthorized();

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const emitted: string[] = [];

        async function insertAlert(a: {
          tenant_id: string | null;
          permit_id: string;
          kind: string;
          severity: "info" | "warning" | "critical" | "success";
          title: string;
          body: string;
          dedupe_key: string;
        }) {
          const { error } = await (supabaseAdmin.from("victoria_alerts" as any) as any).insert({
            tenant_id: a.tenant_id,
            permit_id: a.permit_id,
            kind: a.kind,
            severity: a.severity,
            title: a.title,
            body: a.body,
            action_url: `/portal/permits/${a.permit_id}`,
            dedupe_key: a.dedupe_key,
          });
          if (!error) emitted.push(a.dedupe_key);
        }

        // 1. Load permits (bounded).
        const { data: permits } = await (supabaseAdmin.from("permits" as any) as any)
          .select("id, tenant_id, project_name, city, permit_type, status, updated_at, submitted_date, intake_payload")
          .in("status", ["submitted", "in_review", "corrections_required", "on_hold", "permit_issued", "approved", "outsourced_permitting"])
          .limit(1000);

        const rows = (permits ?? []) as PermitRow[];
        const now = Date.now();

        for (const p of rows) {
          const scope = p.permit_type || "permit";
          const city = p.city || "the municipality";
          const daysSince = Math.floor((now - new Date(p.updated_at).getTime()) / DAY);

          // Stale permit — no update for 14+ days, only for in-flight statuses.
          if (["submitted", "in_review", "outsourced_permitting"].includes(p.status) && daysSince >= 14) {
            await insertAlert({
              tenant_id: p.tenant_id, permit_id: p.id, kind: "stale_permit", severity: "warning",
              title: `${p.project_name}: ${daysSince} days without status update`,
              body: `Your ${scope} permit in ${city} has been in ${p.status.replace("_", " ")} for ${daysSince} days. This is longer than typical. Cleard is following up.`,
              dedupe_key: `stale::${p.id}::${Math.floor(daysSince / 7)}`,
            });
          }

          // Correction deadlines — 7 and 14 day thresholds while in corrections_required.
          if (p.status === "corrections_required" && daysSince >= 7) {
            const bucket = daysSince >= 14 ? 14 : 7;
            await insertAlert({
              tenant_id: p.tenant_id, permit_id: p.id, kind: "correction_deadline",
              severity: bucket === 14 ? "critical" : "warning",
              title: `${p.project_name}: correction outstanding ${bucket}+ days`,
              body: `Your ${city} permit correction has been outstanding for ${daysSince} days. Unresolved corrections can lead to permit expiration.`,
              dedupe_key: `correction::${p.id}::${bucket}`,
            });
          }

          // Lien release reminder — 30 days after permit_issued if any release is not yet filed.
          if (p.status === "permit_issued") {
            const issuedAt = (p.intake_payload as any)?.permit_issued_at || p.updated_at;
            const issuedDays = Math.floor((now - new Date(issuedAt).getTime()) / DAY);
            if (issuedDays >= 30) {
              const { data: releases } = await (supabaseAdmin.from("lien_releases" as any) as any)
                .select("id, status").eq("permit_id", p.id);
              const list = (releases ?? []) as Array<{ status: string }>;
              const outstanding = list.filter((r) => r.status !== "filed").length;
              if (outstanding > 0) {
                await insertAlert({
                  tenant_id: p.tenant_id, permit_id: p.id, kind: "lien_release_reminder", severity: "warning",
                  title: `${outstanding} subcontractor lien release${outstanding === 1 ? "" : "s"} outstanding`,
                  body: `${outstanding} subcontractor${outstanding === 1 ? " has" : "s have"} not filed lien releases on ${p.project_name}. This must be resolved before CO.`,
                  dedupe_key: `lien::${p.id}::${Math.floor(issuedDays / 14)}`,
                });
              }
            }
          }
        }

        // 4. Upcoming inspections — placeholder. Inspection scheduling table
        //    is not yet in this project; wire up once inspections are stored.


        // 5. Lien release overdue — sub hasn't responded in 5+ business days.
        const { data: openReleases } = await (supabaseAdmin.from("lien_releases" as any) as any)
          .select("id, permit_id, sub_company, tenant_id, status, last_reminder_at, permits:permit_id ( project_name )")
          .eq("status", "requested");
        for (const r of (openReleases ?? []) as any[]) {
          const last = r.last_reminder_at ? new Date(r.last_reminder_at).getTime() : 0;
          if (!last) continue;
          const daysOut = Math.floor((now - last) / DAY);
          if (daysOut >= 7) {
            await insertAlert({
              tenant_id: r.tenant_id, permit_id: r.permit_id, kind: "lien_release_reminder", severity: "warning",
              title: `Lien release overdue — ${r.sub_company}`,
              body: `${r.sub_company} has not responded to their lien release request on ${r.permits?.project_name ?? "this project"}. Consider sending a follow-up.`,
              dedupe_key: `lien-overdue::${r.id}::${Math.floor(daysOut / 7)}`,
            });
          }
        }

        return Response.json({ ok: true, emitted: emitted.length });
      },
    },
  },
});
