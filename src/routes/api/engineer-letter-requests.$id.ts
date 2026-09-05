// GET /api/engineer-letter-requests/:id — contractor reads one of their own requests
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/engineer-letter-requests/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const auth = await import("@/lib/api-auth.server");
        try {
          const caller = await auth.requireCaller(request);
          const id = auth.requireUuid(params.id);

          const market = await import("@/lib/engineer-marketplace.server");
          const row = await market.loadRequest(id);
          if (!caller.isAdmin && row.tenant_id !== caller.tenantId) {
            throw new auth.ApiError(404, "Request not found");
          }

          return Response.json({ request: row });
        } catch (err) {
          return auth.errorResponse(err);
        }
      },
    },
  },
});
