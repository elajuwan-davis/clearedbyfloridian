import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { refreshSignatureRequest, type SignatureRequest } from "@/lib/signature-requests";

/**
 * SignWell embedded signing. The signing session is rendered inside the portal — signers are
 * never redirected to signwell.com.
 *
 * SignWell serves the embedded signing URL with `X-Frame-Options: SAMEORIGIN`, so it cannot be
 * put in an iframe directly; it is only frameable through SignWell's own embedded.js, which is
 * loaded on demand and mounted into the container below.
 *
 * The provider's `completed` event proves nothing on its own: completion is recorded by the
 * HMAC-verified document_completed webhook, so the event only triggers a re-read of the ledger
 * row and reports whatever the provider has confirmed so far.
 *
 * The URL comes out of the database, so it is checked against SignWell's own origins before it
 * is handed to the embed — an unexpected origin is refused rather than loaded.
 */
const SIGNWELL_ORIGIN = /^([a-z0-9-]+\.)*signwell\.com$/;
const EMBED_SCRIPT_SRC = "https://static.signwell.com/assets/embedded.js";
const CONTAINER_ID = "signwell-embed-container";

type SignWellEmbedInstance = { open: () => void; close?: () => void };
type SignWellEmbedOptions = {
  url: string;
  containerId?: string;
  allowClose?: boolean;
  allowDecline?: boolean;
  events?: {
    completed?: (e: unknown) => void;
    declined?: (e: unknown) => void;
    closed?: (e: unknown) => void;
    error?: (e: unknown) => void;
  };
};

declare global {
  interface Window {
    SignWellEmbed?: new (options: SignWellEmbedOptions) => SignWellEmbedInstance;
  }
}

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

let embedScript: Promise<void> | null = null;

function loadEmbedScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.SignWellEmbed) return Promise.resolve();
  if (embedScript) return embedScript;
  embedScript = new Promise<void>((resolve, reject) => {
    const el = document.createElement("script");
    el.src = EMBED_SCRIPT_SRC;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => {
      embedScript = null;
      reject(new Error("SignWell's signing library could not be loaded."));
    };
    document.head.appendChild(el);
  });
  return embedScript;
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
  const [embedError, setEmbedError] = useState<string | null>(null);
  const embedRef = useRef<SignWellEmbedInstance | null>(null);
  const recheckRef = useRef<() => void>(() => {});

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
  recheckRef.current = () => void recheck();

  const rawUrl = request.embeddedSigningUrl ?? latest.embeddedSigningUrl;
  const url = signwellEmbedUrl(rawUrl);

  useEffect(() => {
    if (!open || !url) return;
    let cancelled = false;
    setEmbedError(null);

    loadEmbedScript()
      .then(() => {
        if (cancelled) return;
        const Embed = window.SignWellEmbed;
        if (!Embed) throw new Error("SignWell's signing library could not be loaded.");
        const embed = new Embed({
          url,
          containerId: CONTAINER_ID,
          allowClose: false,
          events: {
            // The webhook is the only thing that can mark this signed; re-read the ledger.
            completed: () => recheckRef.current(),
            declined: () => recheckRef.current(),
            error: () => setEmbedError("SignWell reported an error loading the document."),
          },
        });
        embedRef.current = embed;
        embed.open();
      })
      .catch((err: unknown) => {
        if (!cancelled) setEmbedError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      cancelled = true;
      embedRef.current?.close?.();
      embedRef.current = null;
    };
  }, [open, url]);

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
          <>
            <div
              id={CONTAINER_ID}
              className="mt-3 h-[70vh] w-full overflow-hidden rounded-[3px] border border-obsidian/12"
            />
            {embedError ? (
              <div className="mt-2 rounded-[3px] border border-amber-500/40 bg-amber-50 px-3 py-2 text-sm text-obsidian/80">
                {embedError}{" "}
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2"
                >
                  Open the document on SignWell
                </a>{" "}
                instead.
              </div>
            ) : null}
          </>
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
