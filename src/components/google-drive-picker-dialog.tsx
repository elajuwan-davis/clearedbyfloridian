import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Search, FileText, Cloud, RefreshCw, LogOut } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { connectAppUser, getTopLevelAppUrl, isEmbeddedAppView, openAppInTopLevelTab } from "@/integrations/lovable/appUserConnectorClient";
import {
  startGoogleDriveConnect,
  saveGoogleDriveConnection,
  getGoogleDriveStatus,
  listGoogleDriveFiles,
  disconnectGoogleDrive,
  importGoogleDriveFileToPermit,
} from "@/lib/google-drive.functions";

const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  iconLink?: string;
};

type ImportResult = { path: string; filename: string; mime: string; size: number };

export function GoogleDrivePickerDialog({
  open,
  onOpenChange,
  permitId,
  docKey,
  onImported,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  permitId: string;
  docKey: string;
  onImported: (result: ImportResult) => Promise<void> | void;
}) {
  const [status, setStatus] = useState<
    | { state: "checking" }
    | { state: "disconnected" }
    | { state: "connected"; email: string | null; name: string | null }
  >({ state: "checking" });
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [query, setQuery] = useState("");
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);

  async function refreshStatus() {
    setStatus({ state: "checking" });
    try {
      const s = await getGoogleDriveStatus();
      if (s.connected) setStatus({ state: "connected", email: s.email ?? null, name: s.name ?? null });
      else setStatus({ state: "disconnected" });
    } catch (e) {
      toast.error("Could not check Google Drive status");
      setStatus({ state: "disconnected" });
    }
  }

  async function loadFiles(q: string) {
    setLoadingFiles(true);
    try {
      const { files } = await listGoogleDriveFiles({ data: { query: q, pageSize: 30 } });
      setFiles(files);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load files");
    } finally {
      setLoadingFiles(false);
    }
  }

  useEffect(() => {
    if (open) void refreshStatus();
  }, [open]);

  useEffect(() => {
    if (status.state === "connected") void loadFiles("");
  }, [status.state]);

  async function handleConnect() {
    setConnecting(true);
    try {
      const result = await connectAppUser({
        connectorId: "google_drive",
        gatewayBaseUrl: GATEWAY_BASE_URL,
        start: async (targetOrigin) => startGoogleDriveConnect({ data: targetOrigin }),
      });
      if (!result.success) {
        if (result.requiresTopLevel) toast.info(result.error ?? "Open the portal in a new tab to connect Google Drive");
        else toast.error(result.error ?? "Google sign-in failed");
        return;
      }
      if (!result.connectionAPIKey) {
        toast.error("Google returned no offline access — cannot import files");
        return;
      }
      await saveGoogleDriveConnection({ data: { connectionAPIKey: result.connectionAPIKey } });
      toast.success("Google Drive connected");
      await refreshStatus();
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm("Disconnect Google Drive?")) return;
    await disconnectGoogleDrive();
    toast.success("Google Drive disconnected");
    setFiles([]);
    setStatus({ state: "disconnected" });
  }

  async function handleImport(f: DriveFile) {
    setImportingId(f.id);
    try {
      const result = await importGoogleDriveFileToPermit({
        data: { fileId: f.id, permitId, docKey },
      });
      await onImported(result);
      toast.success(`Imported ${result.filename}`);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImportingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="h-4 w-4" /> Import from Google Drive
          </DialogTitle>
        </DialogHeader>

        {status.state === "checking" && (
          <div className="py-10 grid place-items-center text-obsidian/60">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}

        {status.state === "disconnected" && (
          <div className="py-8 text-center space-y-4">
            <p className="text-sm text-obsidian/70 max-w-md mx-auto">
              {isEmbeddedAppView()
                ? "Google blocks sign-in inside the embedded preview. Open the full preview in a new tab, then connect Google Drive there."
                : "Sign in with your Google account to import files directly from your Drive."}
            </p>
            {isEmbeddedAppView() && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!openAppInTopLevelTab()) toast.error("Popup blocked. Use the full preview link shown below.");
                  }}
                  className="inline-flex items-center gap-2 border border-obsidian/20 bg-white px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5"
                >
                  Open full preview
                </button>
                <div className="break-all font-mono text-[10px] text-obsidian/50">{getTopLevelAppUrl()}</div>
              </div>
            )}
            <button
              type="button"
              onClick={handleConnect}
              disabled={connecting}
              className="inline-flex items-center gap-2 bg-obsidian text-paper px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] rounded-[3px] disabled:opacity-60"
            >
              {connecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Cloud className="h-3.5 w-3.5" />}
              Connect Google Drive
            </button>
          </div>
        )}

        {status.state === "connected" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[12px]">
              <div className="text-obsidian/70">
                Connected as{" "}
                <span className="font-medium text-obsidian">{status.email ?? status.name ?? "Google account"}</span>
              </div>
              <button
                type="button"
                onClick={handleDisconnect}
                className="inline-flex items-center gap-1 text-obsidian/60 hover:text-obsidian font-mono text-[10px] uppercase tracking-[0.14em]"
              >
                <LogOut className="h-3 w-3" /> Disconnect
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void loadFiles(query);
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-obsidian/40" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search your Drive"
                  className="w-full border border-obsidian/20 rounded-[3px] pl-8 pr-3 py-2 text-sm bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={loadingFiles}
                className="inline-flex items-center gap-1.5 border border-obsidian/20 bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5 disabled:opacity-60"
              >
                {loadingFiles ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Search
              </button>
            </form>

            <div className="max-h-80 overflow-y-auto divide-y divide-obsidian/10 border border-obsidian/10 rounded-[3px]">
              {loadingFiles && files.length === 0 ? (
                <div className="py-10 grid place-items-center text-obsidian/60">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : files.length === 0 ? (
                <div className="py-10 text-center text-sm text-obsidian/60">No files found</div>
              ) : (
                files.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    disabled={importingId !== null}
                    onClick={() => handleImport(f)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-obsidian/5 disabled:opacity-60"
                  >
                    <FileText className="h-4 w-4 text-obsidian/60 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-obsidian truncate">{f.name}</div>
                      <div className="text-[11px] text-obsidian/50 font-mono">
                        {f.mimeType.replace("application/vnd.google-apps.", "google.")}
                        {f.size ? ` · ${(Number(f.size) / 1024).toFixed(0)} KB` : ""}
                      </div>
                    </div>
                    {importingId === f.id && <Loader2 className="h-4 w-4 animate-spin text-obsidian/60" />}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
