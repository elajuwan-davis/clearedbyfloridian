// Public read behind the QR code on the printed permit card.
//
// The card is posted at a job site and read by inspectors and passers-by, so it
// is unauthenticated. It is keyed by permits.id (gen_random_uuid), which acts as
// the capability, and this handler returns only the fields that already appear
// on a physical permit card — never owner PII, pricing, or intake_payload.
import { createFileRoute } from "@tanstack/react-router";

const PERMIT_FIELDS =
  "id, project_name, job_address, city, municipality, permit_type, permit_number, submitted_date, description, contractor_company, contractor_qualifier";

const INSPECTION_FIELDS = "id, inspection_type, result, scheduled_date, requested_date";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const Route = createFileRoute("/api/public/permit-card/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = params.id;
        if (!UUID_RE.test(id)) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: permit, error } = await supabaseAdmin
          .from("permits")
          .select(PERMIT_FIELDS)
          .eq("id", id)
          .maybeSingle();

        if (error) {
          return Response.json({ error: "Lookup failed" }, { status: 500 });
        }
        if (!permit) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }

        const { data: inspections } = await supabaseAdmin
          .from("permit_inspections")
          .select(INSPECTION_FIELDS)
          .eq("permit_id", id)
          .order("created_at", { ascending: true });

        return Response.json(
          { permit, inspections: inspections ?? [] },
          { headers: { "Cache-Control": "public, max-age=60" } },
        );
      },
    },
  },
});
