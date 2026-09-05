// POST /api/admin/engineer-requests/:id/assign — assign an engineer and notify them.
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const AssignSchema = z.object({
  engineer_id: z.string().uuid(),
  bid_id: z.string().uuid().optional(),
  admin_notes: z.string().trim().max(4000).optional().nullable(),
});

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

          const db = auth.adminDb();
          const market = await import("@/lib/engineer-marketplace.server");
          const existing = await market.loadRequest(id);
          if (existing.status === "complete" || existing.status === "cancelled") {
            throw new auth.ApiError(409, `Request is ${existing.status}`);
          }

          const { data: engineer } = await db
            .from("engineer_profiles")
            .select("id, is_active")
            .eq("id", input.engineer_id)
            .maybeSingle<{ id: string; is_active: boolean }>();
          if (!engineer) throw new auth.ApiError(404, "Engineer not found");
          if (!engineer.is_active) throw new auth.ApiError(409, "Engineer is not active");

          const updated = await market.updateRequest(id, {
            assigned_engineer_id: input.engineer_id,
            status: "assigned",
            ...(input.admin_notes === undefined ? {} : { admin_notes: input.admin_notes }),
          });

          // Accept the winning bid, reject the rest.
          const { error: rejectErr } = await db
            .from("engineer_bids")
            .update({ status: "rejected" })
            .eq("request_id", id)
            .eq("status", "submitted");
          if (rejectErr) throw new auth.ApiError(500, rejectErr.message);

          let acceptQuery = db
            .from("engineer_bids")
            .update({ status: "accepted" })
            .eq("request_id", id);
          acceptQuery = input.bid_id
            ? acceptQuery.eq("id", input.bid_id)
            : acceptQuery.eq("engineer_id", input.engineer_id);
          const { error: acceptErr } = await acceptQuery;
          if (acceptErr) throw new auth.ApiError(500, acceptErr.message);

          await market.notifyEngineer(
            input.engineer_id,
            "You have been assigned an engineer's letter",
            "A request you bid on has been assigned to you. Open your engineer queue for the scope and inspection photos.",
          );

          return Response.json({ request: updated });
        } catch (err) {
          return auth.errorResponse(err);
        }
      },
    },
  },
});
