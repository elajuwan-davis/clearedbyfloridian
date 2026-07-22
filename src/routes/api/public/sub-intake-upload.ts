import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const BUCKET = "permit-files";

const UploadFields = z.object({
  token: z.string().uuid(),
  field: z.enum(["license", "coi", "w9"]),
});

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 180);
}

export const Route = createFileRoute("/api/public/sub-intake-upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const form = await request.formData();
          const parsed = UploadFields.parse({
            token: form.get("token"),
            field: form.get("field"),
          });
          const file = form.get("file");
          if (!(file instanceof File)) {
            return Response.json({ error: "Missing file" }, { status: 400 });
          }
          if (file.size <= 0) {
            return Response.json({ error: "File is empty" }, { status: 400 });
          }
          if (file.size > 20 * 1024 * 1024) {
            return Response.json({ error: "File must be under 20MB" }, { status: 400 });
          }

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

          const path = `subs/${parsed.token}/${parsed.field}/${Date.now()}-${safeName(file.name)}`;
          const { error: uploadError } = await supabaseAdmin.storage
            .from(BUCKET)
            .upload(path, file, {
              contentType: file.type || "application/octet-stream",
              upsert: false,
            });
          if (uploadError) throw new Error(uploadError.message);

          return Response.json({ path, name: file.name });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Upload failed";
          return Response.json({ error: message }, { status: 400 });
        }
      },
    },
  },
});