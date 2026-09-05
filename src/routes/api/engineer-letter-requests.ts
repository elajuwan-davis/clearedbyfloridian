// POST /api/engineer-letter-requests — contractor submits an engineer's letter request
// GET  /api/engineer-letter-requests — contractor lists their own requests
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

// `path` is an object path in the private `engineer-letter-photos` bucket; a
// Storage URL on our own project is accepted and reduced to its path. External
// URLs are refused — see normalizePhotoPath().
const PhotoSchema = z.object({
  path: z.string().trim().min(1).max(1000).optional(),
  url: z.string().trim().min(1).max(2000).optional(),
  caption: z.string().trim().max(300).optional().default(""),
});

const CreateSchema = z.object({
  project_id: z.string().uuid(),
  requested_inspections: z.array(z.string().trim().min(1).max(120)).min(1),
  inspection_photos: z.array(PhotoSchema).max(50).optional().default([]),
  scope_description: z.string().trim().min(1).max(5000),
});

export const Route = createFileRoute("/api/engineer-letter-requests")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await import("@/lib/api-auth.server");
        try {
          const caller = await auth.requireTenant(request);
          const parsed = CreateSchema.safeParse(await auth.readJson(request));
          if (!parsed.success) {
            return Response.json({ error: parsed.error.flatten() }, { status: 400 });
          }
          const input = parsed.data;

          const projects = await import("@/lib/api-projects.server");
          const project = await projects.loadOwnProject(input.project_id, caller);

          const market = await import("@/lib/engineer-marketplace.server");
          const tenantId = project.tenant_id ?? caller.tenantId;
          const photos = input.inspection_photos.map((photo) => {
            const source = photo.path ?? photo.url;
            if (!source) {
              throw new auth.ApiError(422, "inspection_photos: path is required");
            }
            return {
              path: market.normalizePhotoPath(source, tenantId),
              caption: photo.caption,
            };
          });

          const { data, error } = await auth
            .adminDb()
            .from("engineer_letter_requests")
            .insert({
              project_id: project.id,
              tenant_id: tenantId,
              requested_inspections: input.requested_inspections,
              inspection_photos: photos,
              scope_description: input.scope_description,
              status: "open",
              created_by: caller.userId,
            })
            .select("*")
            .single();
          if (error) throw new auth.ApiError(500, error.message);

          const [withPhotos] = await market.withSignedPhotos([data]);
          return Response.json({ request: withPhotos }, { status: 201 });
        } catch (err) {
          return auth.errorResponse(err);
        }
      },

      GET: async ({ request }) => {
        const auth = await import("@/lib/api-auth.server");
        try {
          const caller = await auth.requireTenant(request);
          const { data, error } = await auth
            .adminDb()
            .from("engineer_letter_requests")
            .select("*")
            .eq("tenant_id", caller.tenantId)
            .order("created_at", { ascending: false });
          if (error) throw new auth.ApiError(500, error.message);
          const market = await import("@/lib/engineer-marketplace.server");
          return Response.json({ requests: await market.withSignedPhotos(data ?? []) });
        } catch (err) {
          return auth.errorResponse(err);
        }
      },
    },
  },
});
