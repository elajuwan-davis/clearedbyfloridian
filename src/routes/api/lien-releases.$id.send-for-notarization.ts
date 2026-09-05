// POST /api/lien-releases/:id/send-for-notarization
// Opens a BlueNotary notarize-now (gnw) session for the generated PDF.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/lien-releases/$id/send-for-notarization")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const auth = await import("@/lib/api-auth.server");
        try {
          const caller = await auth.requireCaller(request);
          const id = auth.requireUuid(params.id);

          const store = await import("@/lib/lien-release-documents.server");
          const release = await store.loadRelease(id);
          store.assertReleaseAccess(release, caller);
          if (!release.document_url) {
            throw new auth.ApiError(409, "Generate the release PDF before sending it to a notary");
          }
          if (release.status === "notarized" || release.status === "complete") {
            throw new auth.ApiError(409, "Release is already notarized");
          }

          const projects = await import("@/lib/api-projects.server");
          const project = await projects.loadProject(release.project_id);
          const signer = store.signerFromProject(project);

          // Re-sign rather than trust a stored URL that may have expired.
          const documentUrl = await store.signedUrl(store.storagePath(release, "release"));

          const forms = await import("@/lib/lien-release-forms.server");
          const bluenotary = await import("@/lib/bluenotary.server");
          let session;
          try {
            session = await bluenotary.createNotarySession({
              documentUrl,
              documentName: `${forms.RELEASE_TITLE[release.release_type]}.pdf`,
              signer,
            });
          } catch (err) {
            throw new auth.ApiError(502, err instanceof Error ? err.message : "BlueNotary error");
          }

          const updated = await store.updateRelease(release.id, {
            bluenotary_session_id: session.sessionId,
            document_url: documentUrl,
            status: "pending_notarization",
          });

          return Response.json({
            release: updated,
            bluenotary_session_id: session.sessionId,
            signer_url: session.signerUrl,
          });
        } catch (err) {
          return auth.errorResponse(err);
        }
      },
    },
  },
});
