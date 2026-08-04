import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { refreshSignatureRequest, type SignatureRequest } from "@/lib/signature-requests";

/**
 * SignWell embedded signing. The signing session is rendered in an iframe inside the portal
 * — signers are never redirected to signwell.com.
 *
 * Closing the iframe proves nothing: completion arrives via the HMAC-verified
 * document_completed webhook, so this only re-reads the ledger row and reports whatever the
 * provider has confirmed so far.
 *
 * The URL comes out of the database, so it is checked against SignWell's own origins before
 * it is framed — an unexpected origin is refused rather than handed the iframe permissions.
 */
const SIGNWELL_ORIGIN = /^([a-z0-9-]+\.)*signwell\.com$/;

export function signwellEmbedUrl(raw: string | undefined | null): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    return SIGNWELL_ORIGIN.test(url.hostname) ? url.toString() : null;
  } catch {
    return null;
  }
}

export function EmbeddedSigningDialog({
  open,
  onOpenChange,
  request,
  onCompleted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  request: SignatureRequest & { embeddedSigningUrl?: string };
  onCompleted?: (row: SignatureRequest | undefined) => void;
}) {
  const [checking, setChecking] = useState(false);
  const [latest, setLatest] = useState<SignatureRequest>(request);

  useEffect(() => setLatest(request), [request]);

  async function recheck() {
    setChecking(true);
    try {
      const row = await refreshSignatureRequest(request.id);
      if (row) setLatest(row);
      onCompleted?.(row);
    } finally {
      setChecking(false);
    }
  }

  const rawUrl = request.embeddedSigningUrl ?? latest.embeddedSigningUrl;
  const url = signwellEmbedUrl(rawUrl);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl rounded-[3px]">
        <DialogTitle className="display-serif text-2xl text-obsidian">
          Sign — {request.documentName}
        </DialogTitle>
        <DialogDescription className="text-sm text-obsidian/70">
          {request.recipientEmail}
          {latest.testMode ? " · SignWell test mode (not legally binding)" : ""}
        </DialogDescription>

        {url ? (
          <iframe
            title="SignWell embedded signing"
            src={url}
            className="mt-3 h-[70vh] w-full rounded-[3px] border border-obsidian/12"
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-downloads"
            allow="clipboard-write"
          />
        ) : (
          <div className="mt-3 rounded-[3px] border border-amber-500/40 bg-amber-50 px-3 py-2 text-sm text-obsidian/80">
            {rawUrl
              ? "The stored signing URL is not a SignWell address, so it was not opened. Re-send the document for signature."
              : "SignWell did not return an embedded signing URL for this recipient. Re-send the document, or check the SignWell dashboard for the document status."}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/55">
            Status: {latest.status}
            {latest.status === "signed" && latest.statusSource !== "provider_confirmed"
              ? " · awaiting SignWell confirmation"
              : ""}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="rounded-[3px]"
              onClick={recheck}
              disabled={checking}
            >
              {checking ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Check status
            </Button>
            <Button variant="dark" className="rounded-[3px]" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
