// POST /api/lien-releases/:id/generate-pdf
// Renders the pre-filled statutory form, stores it in the private
// `lien-releases` bucket, and returns a signed URL.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/lien-releases/$id/generate-pdf")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const auth = await import("@/lib/api-auth.server");
        try {
          const caller = await auth.requireLienReleaseCaller(request);
          const id = auth.requireUuid(params.id);

          const store = await import("@/lib/lien-release-documents.server");
          const release = await store.loadRelease(id);
          store.assertReleaseAccess(release, caller);
          // Draft only: a pending release has already been handed to the notary,
          // and overwriting the stored object would notarize different content
          // than what was submitted.
          if (release.status !== "draft") {
            throw new auth.ApiError(409, `Cannot regenerate a ${release.status} release`);
          }

          const forms = await import("@/lib/lien-release-forms.server");
          const bytes = await forms.renderReleasePdf({
            release_type: release.release_type,
            claimant_name: release.claimant_name,
            claimant_address: release.claimant_address,
            owner_name: release.owner_name,
            property_address: release.property_address,
            through_date: release.through_date,
            amount: release.amount === null ? null : Number(release.amount),
          });

          const url = await store.uploadPdf(store.storagePath(release, "release"), bytes);
          const updated = await store.updateRelease(release.id, { document_url: url });
          return Response.json({ release: updated, document_url: url });
        } catch (err) {
          return auth.errorResponse(err);
        }
      },
    },
  },
});
