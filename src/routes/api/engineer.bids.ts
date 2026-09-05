// GET /api/engineer/bids — an engineer's own bids. Bid rows carry request_id
// only, so nothing identifying about the project comes back with them.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/engineer/bids")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await import("@/lib/api-auth.server");
        try {
          const engineer = await auth.requireEngineer(request);
          const { data, error } = await auth
            .adminDb()
            .from("engineer_bids")
            .select("id, request_id, fee_amount, turnaround_days, notes, status, created_at")
            .eq("engineer_id", engineer.engineerId)
            .order("created_at", { ascending: false });
          if (error) throw new auth.ApiError(500, error.message);
          return Response.json({ bids: data ?? [] });
        } catch (err) {
          return auth.errorResponse(err);
        }
      },
    },
  },
});
