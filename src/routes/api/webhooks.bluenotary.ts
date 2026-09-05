// POST /api/webhooks/bluenotary — BlueNotary session completion callback.
//
// Configure the webhook URL in BlueNotary as
//   https://<host>/api/webhooks/bluenotary?token=<BLUENOTARY_WEBHOOK_SECRET>
// (or send the same value in an `x-bluenotary-secret` header). Requests are
// rejected when the secret is missing or wrong: without that check anyone could
// mark a lien release notarized.
import { createFileRoute } from "@tanstack/react-router";
import type { LienReleaseDocument } from "@/lib/lien-release-documents.server";

function authorized(request: Request): boolean {
  const secret = process.env.BLUENOTARY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[bluenotary-webhook] BLUENOTARY_WEBHOOK_SECRET not set — rejecting request");
    return false;
  }
  const provided =
    request.headers.get("x-bluenotary-secret") ?? new URL(request.url).searchParams.get("token");
  return provided === secret;
}

export const Route = createFileRoute("/api/webhooks/bluenotary")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!authorized(request)) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const auth = await import("@/lib/api-auth.server");
        try {
          const payload = await auth.readJson(request);
          const bluenotary = await import("@/lib/bluenotary.server");
          const event = bluenotary.parseWebhook(payload);
          if (!event.sessionId) {
            throw new auth.ApiError(400, "Missing session id");
          }

          const store = await import("@/lib/lien-release-documents.server");
          const { data: release, error } = await auth
            .adminDb()
            .from("lien_release_documents")
            .select("*")
            .eq("bluenotary_session_id", event.sessionId)
            .maybeSingle<LienReleaseDocument>();
          if (error) throw new auth.ApiError(500, error.message);
          if (!release) {
            // Unknown session (another integration, or a replay after deletion):
            // acknowledge so BlueNotary stops retrying.
            return Response.json({ ok: true, matched: false });
          }

          if (!bluenotary.isCompletedStatus(event.status)) {
            return Response.json({ ok: true, matched: true, status: release.status });
          }

          const providerUrl = event.signedDocumentUrl ?? release.signed_document_url;
          if (!providerUrl || !bluenotary.isFetchableDocumentUrl(providerUrl)) {
            // A "complete" event with no usable document would leave a release
            // marked notarized with nothing to download. Stay pending and let
            // BlueNotary retry.
            console.error(
              "[bluenotary-webhook] completion without a usable signed document",
              release.id,
            );
            return Response.json(
              { ok: false, matched: true, error: "No usable signed document URL" },
              { status: 422 },
            );
          }

          // Mirror the notarized PDF into our own bucket so the download link
          // does not depend on BlueNotary's URL lifetime.
          let signedDocumentUrl = providerUrl;
          try {
            const fetched = await fetch(providerUrl);
            if (fetched.ok) {
              const bytes = new Uint8Array(await fetched.arrayBuffer());
              signedDocumentUrl = await store.uploadPdf(
                store.storagePath(release, "notarized"),
                bytes,
              );
            }
          } catch (err) {
            console.error("[bluenotary-webhook] could not mirror notarized document", err);
          }

          const updated = await store.updateRelease(release.id, {
            status: "notarized",
            signed_document_url: signedDocumentUrl,
          });

          return Response.json({ ok: true, matched: true, status: updated.status });
        } catch (err) {
          return auth.errorResponse(err);
        }
      },
    },
  },
});
