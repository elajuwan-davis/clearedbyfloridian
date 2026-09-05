// POST /api/lien-releases          — create a draft statutory release
// GET  /api/lien-releases?project_id=… — list releases for a project
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const CreateSchema = z.object({
  project_id: z.string().uuid(),
  release_type: z.enum([
    "partial_conditional",
    "partial_unconditional",
    "final_conditional",
    "final_unconditional",
  ]),
  through_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  amount: z.number().nonnegative().optional().nullable(),
});

export const Route = createFileRoute("/api/lien-releases")({
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

          const store = await import("@/lib/lien-release-documents.server");
          const projects = await import("@/lib/api-projects.server");
          const project = await projects.loadOwnProject(input.project_id, caller);

          const isConditional =
            input.release_type === "partial_conditional" ||
            input.release_type === "final_conditional";
          if (isConditional && (input.amount === null || input.amount === undefined)) {
            throw new auth.ApiError(422, "amount is required for a conditional release");
          }

          const { data, error } = await auth
            .adminDb()
            .from("lien_release_documents")
            .insert({
              project_id: project.id,
              tenant_id: project.tenant_id ?? caller.tenantId,
              release_type: input.release_type,
              through_date: input.through_date ?? null,
              amount: input.amount ?? null,
              status: "draft",
              created_by: caller.userId,
              ...store.releaseFieldsFromProject(project),
            })
            .select("*")
            .single();
          if (error) throw new auth.ApiError(500, error.message);

          return Response.json({ release: data }, { status: 201 });
        } catch (err) {
          return auth.errorResponse(err);
        }
      },

      GET: async ({ request }) => {
        const auth = await import("@/lib/api-auth.server");
        try {
          const caller = await auth.requireCaller(request);
          const projectId = new URL(request.url).searchParams.get("project_id");
          if (!projectId) throw new auth.ApiError(400, "project_id is required");
          auth.requireUuid(projectId, "project_id");

          let query = auth
            .adminDb()
            .from("lien_release_documents")
            .select("*")
            .eq("project_id", projectId)
            .order("created_at", { ascending: false });
          if (!caller.isAdmin) {
            if (!caller.tenantId) throw new auth.ApiError(403, "No tenant for this account");
            query = query.eq("tenant_id", caller.tenantId);
          }

          const { data, error } = await query;
          if (error) throw new auth.ApiError(500, error.message);
          return Response.json({ releases: data ?? [] });
        } catch (err) {
          return auth.errorResponse(err);
        }
      },
    },
  },
});
