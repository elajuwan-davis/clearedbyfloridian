/**
 * Client-safe App User Connector helper. No secrets — safe in browser bundles.
 */

export interface AppUserOAuthResult {
  success: boolean;
  connectorId: string;
  connectionAPIKey?: string;
  offlineAccessAllowed?: boolean;
  requiresTopLevel?: boolean;
  error?: string;
}

const OAUTH_MESSAGE_TYPE = "appUserConnectorOAuth";

export function isEmbeddedAppView(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function getTopLevelAppUrl(): string {
  if (typeof window === "undefined") return "/";
  const url = new URL(window.location.href);
  if (url.hostname.endsWith(".lovableproject.com")) {
    const previewId = url.hostname.split(".")[0];
    url.hostname = `id-preview--${previewId}.lovable.app`;
    url.protocol = "https:";
  }
  return url.toString();
}

export function openAppInTopLevelTab(): boolean {
  if (typeof window === "undefined") return false;
  const opened = window.open(getTopLevelAppUrl(), "_blank", "noopener,noreferrer");
  return Boolean(opened);
}

export async function connectAppUser(opts: {
  connectorId: string;
  gatewayBaseUrl: string;
  start: (targetOrigin: string) => Promise<{ authorizationUrl: string }>;
}): Promise<AppUserOAuthResult> {
  const { connectorId, gatewayBaseUrl, start } = opts;
  const gatewayOrigin = new URL(gatewayBaseUrl).origin;
  const targetOrigin = window.location.origin;

  if (isEmbeddedAppView()) {
    const opened = openAppInTopLevelTab();
    return {
      success: false,
      connectorId,
      requiresTopLevel: true,
      error: opened
        ? "Google blocks sign-in inside the embedded preview. I opened the full preview in a new tab — connect Google Drive there."
        : "Google blocks sign-in inside the embedded preview. Open the full preview in a new browser tab, then connect Google Drive.",
    };
  }

  const popup = window.open("", "lovable-oauth", "width=600,height=720");
  if (!popup) {
    return { success: false, connectorId, error: "Popup blocked. Allow popups and try again." };
  }

  let authorizationUrl: string;
  try {
    authorizationUrl = (await start(targetOrigin)).authorizationUrl;
  } catch (e) {
    popup.close();
    return { success: false, connectorId, error: e instanceof Error ? e.message : "Failed to start OAuth" };
  }
  popup.location.href = authorizationUrl;

  return await new Promise<AppUserOAuthResult>((resolve) => {
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      clearInterval(timer);
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== gatewayOrigin) return;
      const data = event.data;
      if (!data || data.type !== OAUTH_MESSAGE_TYPE || data.connector_id !== connectorId) return;
      cleanup();
      popup.close();
      if (data.success && data.offline_access_allowed === false) {
        resolve({ success: true, connectorId, offlineAccessAllowed: false });
        return;
      }
      if (data.success && data.api_key) {
        resolve({ success: true, connectorId, connectionAPIKey: data.api_key, offlineAccessAllowed: true });
        return;
      }
      resolve({ success: false, connectorId, error: data.error ?? "OAuth failed" });
    };
    window.addEventListener("message", onMessage);
    const timer = setInterval(() => {
      if (popup.closed) {
        cleanup();
        resolve({ success: false, connectorId, error: "Sign in was cancelled" });
      }
    }, 500);
  });
}
