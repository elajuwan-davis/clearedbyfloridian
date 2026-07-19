import { toast } from "sonner";

/**
 * Google Drive + OneDrive picker buttons.
 * Full OAuth wiring (Google Picker API, OneDrive File Picker v8) requires
 * Cloud storage + registered OAuth clients. Buttons are rendered platform-wide
 * so the UX is consistent; clicking surfaces a setup-required toast until
 * connectors are configured.
 */
export function CloudUploadButtons({ compact = false }: { compact?: boolean }) {
  const cls =
    "inline-flex items-center gap-2 border border-obsidian/20 bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5";
  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? "" : "mt-2"}`}>
      <button
        type="button"
        className={cls}
        onClick={() =>
          toast.message("Google Drive", {
            description: "Connect Google Drive in Settings → Integrations to import files.",
          })
        }
      >
        <GoogleDriveIcon /> Google Drive
      </button>
      <button
        type="button"
        className={cls}
        onClick={() =>
          toast.message("OneDrive", {
            description: "Connect Microsoft OneDrive in Settings → Integrations to import files.",
          })
        }
      >
        <OneDriveIcon /> OneDrive
      </button>
    </div>
  );
}

function GoogleDriveIcon() {
  return (
    <svg viewBox="0 0 87.3 78" className="h-3.5 w-3.5" aria-hidden>
      <path fill="#0066da" d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" />
      <path fill="#00ac47" d="M43.65 25L30.05 1.55c-1.35.8-2.5 1.9-3.3 3.3L1.2 48.5c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" />
      <path fill="#ea4335" d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8L65.65 66.4z" />
      <path fill="#00832d" d="M43.65 25L57.25 1.55C55.9.75 54.35.3 52.75.3H34.55c-1.6 0-3.15.5-4.5 1.25z" />
      <path fill="#2684fc" d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.6c1.6 0 3.15-.45 4.5-1.2z" />
      <path fill="#ffba00" d="M73.4 26.5L60.75 4.85c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" />
    </svg>
  );
}
function OneDriveIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-3.5 w-3.5" aria-hidden>
      <path fill="#0364b8" d="M12.2 15.2l6.6-6.3a10.5 10.5 0 00-16.6 4.7 7.5 7.5 0 011.6-.2 7.4 7.4 0 018.4 1.8z" />
      <path fill="#0078d4" d="M20.4 13a7.5 7.5 0 00-1.6.2l-6.6 2 5.9 7.2 10.4-2A7.5 7.5 0 0020.4 13z" />
      <path fill="#1490df" d="M12.2 15.2a7.4 7.4 0 00-8.4-1.8A6.5 6.5 0 000 19.5l10.4 3z" />
      <path fill="#28a8ea" d="M10.4 22.5l7.7 5.5 10.4-5.6-.4-2.8-10.4-.2z" />
    </svg>
  );
}
