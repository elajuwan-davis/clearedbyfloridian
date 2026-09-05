// GET /api/engineer/requests — blind list of open requests (+ own assignments).
// Scope and photos only; see engineer-marketplace.server.ts BLIND_COLUMNS.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/engineer/requests")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await import("@/lib/api-auth.server");
        try {
          const engineer = await auth.requireEngineer(request);
          const market = await import("@/lib/engineer-marketplace.server");
          const requests = await market.blindRequests(engineer.engineerId);
          return Response.json({ requests });
        } catch (err) {
          return auth.errorResponse(err);
        }
      },
    },
  },
});
