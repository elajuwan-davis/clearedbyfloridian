// POST /api/engineer/requests/:id/bid — engineer bids on a blind request.
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const BidSchema = z.object({
  fee_amount: z.number().positive().max(1_000_000),
  turnaround_days: z.number().int().positive().max(365),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const Route = createFileRoute("/api/engineer/requests/$id/bid")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const auth = await import("@/lib/api-auth.server");
        try {
          const engineer = await auth.requireEngineer(request);
          const id = auth.requireUuid(params.id);
          const parsed = BidSchema.safeParse(await auth.readJson(request));
          if (!parsed.success) {
            return Response.json({ error: parsed.error.flatten() }, { status: 400 });
          }

          // Blind lookup doubles as the authorization check: an engineer can
          // only bid on a request they are allowed to see, and only while open.
          const market = await import("@/lib/engineer-marketplace.server");
          const blind = await market.blindRequest(engineer.engineerId, id);
          if (blind.status !== "open") {
            throw new auth.ApiError(409, "Request is no longer open for bids");
          }

          const { data, error } = await auth
            .adminDb()
            .from("engineer_bids")
            .upsert(
              {
                request_id: id,
                engineer_id: engineer.engineerId,
                fee_amount: parsed.data.fee_amount,
                turnaround_days: parsed.data.turnaround_days,
                notes: parsed.data.notes ?? null,
                status: "submitted",
              },
              { onConflict: "request_id,engineer_id" },
            )
            .select("*")
            .single();
          if (error) throw new auth.ApiError(500, error.message);

          return Response.json({ bid: data }, { status: 201 });
        } catch (err) {
          return auth.errorResponse(err);
        }
      },
    },
  },
});
