// GET /api/lien-releases/:id/download — signed URL for the notarized release
// (falls back to the unsigned generated form while notarization is pending).
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/lien-releases/$id/download")({
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

          const notarized = release.status === "notarized" || release.status === "complete";
          if (!notarized && !release.document_url) {
            throw new auth.ApiError(409, "No document generated for this release yet");
          }

          // The notarized copy is normally mirrored into our bucket by the
          // webhook; if that mirror failed we still hold BlueNotary's URL.
          let url: string;
          if (notarized) {
            try {
              url = await store.signedUrl(store.storagePath(release, "notarized"));
            } catch (err) {
              if (!release.signed_document_url) throw err;
              url = release.signed_document_url;
            }
          } else {
            url = await store.signedUrl(store.storagePath(release, "release"));
          }

          return Response.json({ download_url: url, notarized });
        } catch (err) {
          return auth.errorResponse(err);
        }
      },
    },
  },
});
