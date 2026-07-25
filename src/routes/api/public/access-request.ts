import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const AccessRequestSchema = z.object({
  name: z.string().trim().min(1).max(120),
  company: z.string().trim().max(160).optional().nullable(),
  license_number: z.string().trim().max(60).optional().nullable(),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().nullable(),
});

export const Route = createFileRoute("/api/public/access-request")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        const parsed = AccessRequestSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json({ error: parsed.error.flatten() }, { status: 400 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("access_requests" as any)
          .insert(parsed.data)
          .select("id")
          .single();
        if (error) {
          return Response.json({ error: error.message }, { status: 500 });
        }
        return Response.json({ ok: true, id: (data as any)?.id });
      },
    },
  },
});
