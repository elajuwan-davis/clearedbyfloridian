import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  authorizeAppUserOAuth,
  callAsAppUser,
  disconnectAppUser,
} from "@/integrations/lovable/appUserConnector";
import {
  getConnectionKeyForUser,
  saveConnectionKeyForUser,
  deleteConnectionForUser,
} from "@/lib/appUserConnections.server";

const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";
const CONNECTOR_ID = "google_drive";
const SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/drive.file",
];

export const startGoogleDriveConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((targetOrigin: string) => z.string().url().parse(targetOrigin))
  .handler(async ({ data: targetOrigin, context }) => {
    const clientKey = process.env.GOOGLE_DRIVE_APP_USER_CONNECTOR_CLIENT_API_KEY;
    if (!clientKey) throw new Error("Google Drive connector client is not configured");
    const { authorizationUrl } = await authorizeAppUserOAuth({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectorId: CONNECTOR_ID,
      appUserId: context.userId,
      clientAPIKey: clientKey,
      returnUrl: targetOrigin,
      responseMode: "web_message",
      webMessageTargetOrigin: targetOrigin,
      credentialsConfiguration: { scopes: SCOPES },
    });
    return { authorizationUrl };
  });

export const saveGoogleDriveConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { connectionAPIKey: string }) =>
    z.object({ connectionAPIKey: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await saveConnectionKeyForUser(context.userId, CONNECTOR_ID, data.connectionAPIKey);
    return { ok: true };
  });

export const getGoogleDriveStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const key = await getConnectionKeyForUser(context.userId, CONNECTOR_ID);
    if (!key) return { connected: false as const };
    // Best-effort identity fetch so the UI can show the connected account.
    try {
      const res = await callAsAppUser({
        gatewayBaseUrl: GATEWAY_BASE_URL,
        connectionAPIKey: key,
        connectorId: CONNECTOR_ID,
        path: "/drive/v3/about?fields=user(displayName,emailAddress)",
      });
      if (res.ok) {
        const body = (await res.json()) as { user?: { displayName?: string; emailAddress?: string } };
        return { connected: true as const, email: body.user?.emailAddress ?? null, name: body.user?.displayName ?? null };
      }
    } catch {
      /* ignore */
    }
    return { connected: true as const, email: null, name: null };
  });

export const disconnectGoogleDrive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const key = await getConnectionKeyForUser(context.userId, CONNECTOR_ID);
    if (key) {
      try {
        await disconnectAppUser({
          gatewayBaseUrl: GATEWAY_BASE_URL,
          connectionAPIKey: key,
          connectorId: CONNECTOR_ID,
        });
      } catch {
        /* ignore gateway failure — still purge local */
      }
    }
    await deleteConnectionForUser(context.userId, CONNECTOR_ID);
    return { ok: true };
  });

export const listGoogleDriveFiles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { query?: string; pageSize?: number }) =>
    z
      .object({
        query: z.string().optional(),
        pageSize: z.number().int().min(1).max(50).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const key = await getConnectionKeyForUser(context.userId, CONNECTOR_ID);
    if (!key) throw new Error("Google Drive is not connected");
    const pageSize = data.pageSize ?? 25;
    const q = data.query?.trim()
      ? `name contains '${data.query.replace(/'/g, "\\'")}' and trashed = false`
      : "trashed = false";
    const params = new URLSearchParams({
      q,
      pageSize: String(pageSize),
      fields: "files(id,name,mimeType,size,modifiedTime,iconLink)",
      orderBy: "modifiedTime desc",
    });
    const res = await callAsAppUser({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectionAPIKey: key,
      connectorId: CONNECTOR_ID,
      path: `/drive/v3/files?${params.toString()}`,
    });
    if (!res.ok) throw new Error(`Google Drive list failed (${res.status}): ${await res.text()}`);
    const body = (await res.json()) as {
      files?: Array<{ id: string; name: string; mimeType: string; size?: string; modifiedTime?: string; iconLink?: string }>;
    };
    return { files: body.files ?? [] };
  });

// Import a Drive file into the permit-files Supabase bucket for a given permit + doc key.
export const importGoogleDriveFileToPermit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { fileId: string; permitId: string; docKey: string }) =>
      z
        .object({
          fileId: z.string().min(1),
          permitId: z.string().uuid(),
          docKey: z.string().min(1),
        })
        .parse(input),
  )
  .handler(async ({ data, context }) => {
    const key = await getConnectionKeyForUser(context.userId, CONNECTOR_ID);
    if (!key) throw new Error("Google Drive is not connected");

    // 1. Metadata for filename + mime.
    const metaRes = await callAsAppUser({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectionAPIKey: key,
      connectorId: CONNECTOR_ID,
      path: `/drive/v3/files/${encodeURIComponent(data.fileId)}?fields=id,name,mimeType,size`,
    });
    if (!metaRes.ok) throw new Error(`Drive meta failed (${metaRes.status}): ${await metaRes.text()}`);
    const meta = (await metaRes.json()) as { name: string; mimeType: string; size?: string };

    // 2. Download bytes. Google-native docs need export; regular files use alt=media.
    const nativeExportMap: Record<string, { mime: string; ext: string }> = {
      "application/vnd.google-apps.document": { mime: "application/pdf", ext: ".pdf" },
      "application/vnd.google-apps.spreadsheet": {
        mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ext: ".xlsx",
      },
      "application/vnd.google-apps.presentation": { mime: "application/pdf", ext: ".pdf" },
      "application/vnd.google-apps.drawing": { mime: "application/pdf", ext: ".pdf" },
    };
    const native = nativeExportMap[meta.mimeType];
    const downloadPath = native
      ? `/drive/v3/files/${encodeURIComponent(data.fileId)}/export?mimeType=${encodeURIComponent(native.mime)}`
      : `/drive/v3/files/${encodeURIComponent(data.fileId)}?alt=media`;
    const dl = await callAsAppUser({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectionAPIKey: key,
      connectorId: CONNECTOR_ID,
      path: downloadPath,
    });
    if (!dl.ok) throw new Error(`Drive download failed (${dl.status}): ${await dl.text()}`);
    const bytes = new Uint8Array(await dl.arrayBuffer());
    const filename = native && !meta.name.toLowerCase().endsWith(native.ext) ? `${meta.name}${native.ext}` : meta.name;
    const mime = native?.mime ?? meta.mimeType;

    // 3. Upload to Supabase storage.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const safe = filename.replace(/[^a-zA-Z0-9._-]+/g, "_");
    const path = `${data.permitId}/${data.docKey}/${Date.now()}-${safe}`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("permit-files")
      .upload(path, bytes, { contentType: mime, upsert: false });
    if (upErr) throw upErr;

    return { path, filename, mime, size: bytes.byteLength };
  });

// Upload a base64-encoded file (usually a PDF) to the user's Google Drive root.
export const uploadFileToGoogleDrive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { filename: string; mime: string; base64: string }) =>
    z.object({
      filename: z.string().min(1),
      mime: z.string().min(1),
      base64: z.string().min(1),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const key = await getConnectionKeyForUser(context.userId, CONNECTOR_ID);
    if (!key) throw new Error("Google Drive is not connected");

    const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    const boundary = `----clr${Math.random().toString(36).slice(2)}${Date.now()}`;
    const meta = { name: data.filename, mimeType: data.mime };
    const enc = new TextEncoder();
    const head = enc.encode(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n` +
      `--${boundary}\r\nContent-Type: ${data.mime}\r\n\r\n`,
    );
    const tail = enc.encode(`\r\n--${boundary}--`);
    const body = new Uint8Array(head.length + bytes.length + tail.length);
    body.set(head, 0);
    body.set(bytes, head.length);
    body.set(tail, head.length + bytes.length);

    const res = await callAsAppUser({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectionAPIKey: key,
      connectorId: CONNECTOR_ID,
      path: "/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Drive upload failed (${res.status}): ${text}`);
    }
    const out = (await res.json()) as { id: string; name: string; webViewLink?: string };
    return out;
  });

