// GET /api/admin/engineer-requests — every request with its bids.
// Admin brokers the marketplace, so this view is deliberately unredacted.
import { createFileRoute } from "@tanstack/react-router";

type BidRow = { request_id: string } & Record<string, unknown>;

export const Route = createFileRoute("/api/admin/engineer-requests")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await import("@/lib/api-auth.server");
        try {
          await auth.requireAdmin(request);
          const db = auth.adminDb();

          const status = new URL(request.url).searchParams.get("status");
          let query = db
            .from("engineer_letter_requests")
            .select("*")
            .order("created_at", { ascending: false });
          if (status) query = query.eq("status", status);

          const { data: requests, error } = await query;
          if (error) throw new auth.ApiError(500, error.message);

          const ids = (requests ?? []).map((r) => (r as { id: string }).id);
          let bids: BidRow[] = [];
          if (ids.length > 0) {
            const { data: bidRows, error: bidErr } = await db
              .from("engineer_bids")
              .select("*, engineer:engineer_profiles(id, name, license_number, license_state)")
              .in("request_id", ids)
              .order("created_at", { ascending: false });
            if (bidErr) throw new auth.ApiError(500, bidErr.message);
            bids = (bidRows ?? []) as unknown as BidRow[];
          }

          const byRequest = new Map<string, BidRow[]>();
          for (const bid of bids) {
            const list = byRequest.get(bid.request_id) ?? [];
            list.push(bid);
            byRequest.set(bid.request_id, list);
          }

          return Response.json({
            requests: (requests ?? []).map((r) => ({
              ...(r as Record<string, unknown>),
              bids: byRequest.get((r as { id: string }).id) ?? [],
            })),
          });
        } catch (err) {
          return auth.errorResponse(err);
        }
      },
    },
  },
});
