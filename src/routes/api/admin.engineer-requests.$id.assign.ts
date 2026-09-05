// POST /api/admin/engineer-requests/:id/assign — assign an engineer and notify them.
//
// The request row, the winning bid and the losing bids move together inside
// assign_engineer_letter_request(); a partial assignment would leave bids
// contradicting the request status.
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const AssignSchema = z.object({
  engineer_id: z.string().uuid(),
  bid_id: z.string().uuid().optional(),
  admin_notes: z.string().trim().max(4000).optional().nullable(),
});

/** Map the RPC's raised exceptions onto HTTP statuses. */
function assignError(message: string): { status: number; message: string } {
  if (message.includes("request_not_found")) return { status: 404, message: "Request not found" };
  if (message.includes("request_status_")) {
    const status = message.slice(message.indexOf("request_status_") + "request_status_".length);
    return { status: 409, message: `Request is ${status.trim()}` };
  }
  if (message.includes("engineer_unavailable")) {
    return { status: 409, message: "Engineer not found or not active" };
  }
  if (message.includes("bid_mismatch")) {
    return { status: 422, message: "bid_id does not belong to this request and engineer" };
  }
  return { status: 500, message };
}

export const Route = createFileRoute("/api/admin/engineer-requests/$id/assign")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const auth = await import("@/lib/api-auth.server");
        try {
          await auth.requireAdmin(request);
          const id = auth.requireUuid(params.id);
          const parsed = AssignSchema.safeParse(await auth.readJson(request));
          if (!parsed.success) {
            return Response.json({ error: parsed.error.flatten() }, { status: 400 });
          }
          const input = parsed.data;

          const { data, error } = await auth.adminDb().rpc("assign_engineer_letter_request", {
            _request_id: id,
            _engineer_id: input.engineer_id,
            _bid_id: input.bid_id ?? null,
            _admin_notes: input.admin_notes ?? null,
          });
          if (error) {
            const mapped = assignError(error.message);
            throw new auth.ApiError(mapped.status, mapped.message);
          }

          const market = await import("@/lib/engineer-marketplace.server");
          await market.notifyEngineer(
            input.engineer_id,
            "You have been assigned an engineer's letter",
            "A request you bid on has been assigned to you. Open your engineer queue for the scope and inspection photos.",
          );

          return Response.json({ request: data });
        } catch (err) {
          return auth.errorResponse(err);
        }
      },
    },
  },
});
