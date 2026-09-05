// GET /api/lien-releases/:id
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/lien-releases/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const auth = await import("@/lib/api-auth.server");
        try {
          const caller = await auth.requireLienReleaseCaller(request);
          const id = auth.requireUuid(params.id);
          const store = await import("@/lib/lien-release-documents.server");
          const release = await store.loadRelease(id);
          store.assertReleaseAccess(release, caller);
          return Response.json({ release });
        } catch (err) {
          return auth.errorResponse(err);
        }
      },
    },
  },
});
