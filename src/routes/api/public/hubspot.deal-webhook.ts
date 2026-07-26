// HubSpot deal → Cleard project webhook.
//
// Configure in HubSpot Developer Portal (floridianinc.com account):
//   1. Create a webhook subscription for `deal.propertyChange` on `dealstage`.
//   2. Target URL: https://clearedbyfloridian.lovable.app/api/public/hubspot/deal-webhook
//   3. Store signing secret in Project Settings → Secrets as HUBSPOT_WEBHOOK_SECRET.
//
// This scaffold accepts the payload, filters for Closed Won, and returns a
// mapped project. Eman: swap the mock response with a Supabase insert into
// the `projects` table once the schema migration lands.

import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

const CLOSED_WON_STAGE_IDS = new Set(["closedwon", "closed_won", "closed-won"]);

type IncomingDeal = {
  hubspot_deal_id?: string;
  dealId?: string;
  properties?: Record<string, string | number | undefined>;
  dealstage?: string;
  // Direct-field convenience shape (also accepted):
  deal_name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  deal_amount?: number;
  project_type?: string;
};

function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.HUBSPOT_WEBHOOK_SECRET;
  if (!secret) {
    // Signing not configured yet — allow in scaffold mode. Log for Eman.
    console.warn("[hubspot-webhook] HUBSPOT_WEBHOOK_SECRET not set — skipping signature check");
    return true;
  }
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function mapDeal(raw: IncomingDeal) {
  const p = raw.properties ?? {};
  const stage = String(raw.dealstage ?? p.dealstage ?? "").toLowerCase().replace(/\s+/g, "");
  const dealId = String(raw.hubspot_deal_id ?? raw.dealId ?? p.hs_object_id ?? "");
  return {
    stage,
    project: {
      hubspot_deal_id: dealId,
      deal_name: String(raw.deal_name ?? p.dealname ?? p.deal_name ?? ""),
      address: String(raw.address ?? p.address ?? p.property_address ?? "") || undefined,
      city: String(raw.city ?? p.city ?? "") || undefined,
      state: String(raw.state ?? p.state ?? "FL") || undefined,
      zip: String(raw.zip ?? p.zip ?? "") || undefined,
      contact_name: String(raw.contact_name ?? p.contact_name ?? "") || undefined,
      contact_email: String(raw.contact_email ?? p.contact_email ?? p.email ?? "") || undefined,
      contact_phone: String(raw.contact_phone ?? p.contact_phone ?? p.phone ?? "") || undefined,
      deal_amount: Number(raw.deal_amount ?? p.amount ?? 0) || undefined,
      project_type: String(raw.project_type ?? p.project_type ?? "") || undefined,
    },
  };
}

export const Route = createFileRoute("/api/public/hubspot/deal-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const sig =
          request.headers.get("x-hubspot-signature-v3") ??
          request.headers.get("x-hubspot-signature");
        if (!verifySignature(raw, sig)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let body: IncomingDeal | IncomingDeal[];
        try {
          body = JSON.parse(raw);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const items = Array.isArray(body) ? body : [body];
        const created: unknown[] = [];
        const skipped: unknown[] = [];

        for (const item of items) {
          const { stage, project } = mapDeal(item);
          if (!CLOSED_WON_STAGE_IDS.has(stage)) {
            skipped.push({ hubspot_deal_id: project.hubspot_deal_id, reason: `stage=${stage}` });
            continue;
          }
          if (!project.hubspot_deal_id) {
            skipped.push({ reason: "missing hubspot_deal_id" });
            continue;
          }
          // Auto-create a draft Cleard permit in Pre-Check for admin intake.
          try {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const addressParts = [project.address, project.city, project.state, project.zip].filter(Boolean);
            const { data: inserted, error: insErr } = await (supabaseAdmin.from("permits" as any) as any)
              .insert({
                project_name: project.deal_name || `HubSpot Deal ${project.hubspot_deal_id}`,
                job_address: addressParts.join(", ") || "TBD",
                city: project.city ?? null,
                contractor_company: project.contact_name ?? null,
                poc: project.contact_name ?? null,
                poc_email: project.contact_email ?? null,
                poc_phone: project.contact_phone ?? null,
                construction_value_cents: project.deal_amount ? Math.round(project.deal_amount * 100) : null,
                estimated_fee_cents: project.deal_amount ? Math.round(project.deal_amount * 1.5) : null,
                permit_type: project.project_type ?? null,
                status: "on_hold", // Pre-Check equivalent — flagged for admin intake.
                intake_payload: {
                  source: "hubspot",
                  hubspot_deal_id: project.hubspot_deal_id,
                  needs_admin_intake: true,
                  imported_at: new Date().toISOString(),
                },
              })
              .select("id")
              .single();
            if (insErr) {
              console.error("[hubspot-webhook] insert failed", insErr);
              skipped.push({ hubspot_deal_id: project.hubspot_deal_id, reason: insErr.message });
              continue;
            }
            created.push({ ...project, cleard_permit_id: (inserted as any)?.id });
          } catch (e) {
            console.error("[hubspot-webhook] exception", e);
            skipped.push({ hubspot_deal_id: project.hubspot_deal_id, reason: "insert exception" });
          }
        }

        return Response.json({
          ok: true,
          created_count: created.length,
          skipped_count: skipped.length,
          created,
          skipped,
        });
      },
    },
  },
});
