// GET /api/engineer/requests/:id — same blind view as the list.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/engineer/requests/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const auth = await import("@/lib/api-auth.server");
        try {
          const engineer = await auth.requireEngineer(request);
          const id = auth.requireUuid(params.id);
          const market = await import("@/lib/engineer-marketplace.server");
          return Response.json({ request: await market.blindRequest(engineer.engineerId, id) });
        } catch (err) {
          return auth.errorResponse(err);
        }
      },
    },
  },
});
