import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const BUCKET = "id-documents";
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];

const Fields = z.object({
  token: z.string().uuid(),
  documentType: z.enum(["drivers_license", "passport"]),
  action: z.enum(["upload", "preview"]).default("upload"),
  path: z.string().min(1).optional(),
});

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 180);
}

export const Route = createFileRoute("/api/public/id-upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const form = await request.formData();
          const parsed = Fields.parse({
            token: form.get("token"),
            documentType: form.get("documentType"),
            action: form.get("action") ?? "upload",
            path: form.get("path") ?? undefined,
          });

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const table = supabaseAdmin.from("subcontractors" as never) as any;
          const { data: sub, error: lookupError } = await table
            .select("id")
            .eq("completion_token", parsed.token)
            .maybeSingle();
          if (lookupError) throw new Error(lookupError.message);
          if (!sub) {
            return Response.json({ error: "Invalid or expired intake link" }, { status: 404 });
          }

          const prefix = `id-verification/subs/${sub.id}/`;

          if (parsed.action === "preview") {
            if (!parsed.path || !parsed.path.startsWith(prefix)) {
              return Response.json({ error: "Forbidden" }, { status: 403 });
            }
            const { data: signed, error } = await supabaseAdmin.storage
              .from(BUCKET)
              .createSignedUrl(parsed.path, 120);
            if (error) throw new Error(error.message);
            return Response.json({ url: signed.signedUrl });
          }

          const file = form.get("file");
          if (!(file instanceof File)) {
            return Response.json({ error: "Missing file" }, { status: 400 });
          }
          if (file.size <= 0) {
            return Response.json({ error: "File is empty" }, { status: 400 });
          }
          if (file.size > MAX_BYTES) {
            return Response.json({ error: "File must be 10MB or smaller" }, { status: 400 });
          }
          const type = (file.type || "").toLowerCase();
          const extOk = /\.(jpe?g|png|pdf)$/i.test(file.name);
          if (!extOk || (type && !ALLOWED.includes(type))) {
            return Response.json(
              { error: "Only JPG, JPEG, PNG, or PDF files are accepted" },
              { status: 400 },
            );
          }

          const path = `${prefix}${Date.now()}-${safeName(file.name)}`;
          const { error: uploadError } = await supabaseAdmin.storage
            .from(BUCKET)
            .upload(path, file, {
              contentType: file.type || "application/octet-stream",
              upsert: false,
            });
          if (uploadError) throw new Error(uploadError.message);

          return Response.json({ path, name: file.name, documentType: parsed.documentType });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Upload failed";
          return Response.json({ error: message }, { status: 400 });
        }
      },
    },
  },
});
