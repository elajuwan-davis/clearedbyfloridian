// "Don't see your platform listed?" submissions from the public /integrations page.
// Written server-side so the table stays admin-read-only.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  platform: z.string().trim().min(1).max(160),
});

export const submitIntegrationRequestFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin.from("integration_requests" as never) as any).insert({
      name: data.name,
      email: data.email,
      platform: data.platform,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
