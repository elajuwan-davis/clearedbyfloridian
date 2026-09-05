// POST /api/admin/engineer-requests/:id/complete — attach the signed/sealed letter.
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const CompleteSchema = z.object({
  final_document_url: z.string().url(),
  admin_notes: z.string().trim().max(4000).optional().nullable(),
});

export const Route = createFileRoute("/api/admin/engineer-requests/$id/complete")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const auth = await import("@/lib/api-auth.server");
        try {
          await auth.requireAdmin(request);
          const id = auth.requireUuid(params.id);
          const parsed = CompleteSchema.safeParse(await auth.readJson(request));
          if (!parsed.success) {
            return Response.json({ error: parsed.error.flatten() }, { status: 400 });
          }

          const market = await import("@/lib/engineer-marketplace.server");
          const existing = await market.loadRequest(id);
          if (existing.status === "cancelled") {
            throw new auth.ApiError(409, "Request is cancelled");
          }

          const updated = await market.updateRequest(id, {
            status: "complete",
            final_document_url: parsed.data.final_document_url,
            ...(parsed.data.admin_notes === undefined
              ? {}
              : { admin_notes: parsed.data.admin_notes }),
          });

          return Response.json({ request: updated });
        } catch (err) {
          return auth.errorResponse(err);
        }
      },
    },
  },
});
