// Server functions for the HOA submittal flow. HOA contact PII is resolved
// server-side only (see hoa-send.server.ts) and never returned to the browser.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const sendHoaSubmittalFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { submittalId: string }) => {
    if (!data?.submittalId || typeof data.submittalId !== "string") {
      throw new Error("submittalId is required");
    }
    return { submittalId: data.submittalId };
  })
  .handler(async ({ data, context }) => {
    const { sendHoaSubmittalServer } = await import("@/lib/hoa-send.server");
    return await sendHoaSubmittalServer(context.supabase as any, {
      submittalId: data.submittalId,
      userId: context.userId ?? null,
    });
  });

export const logHoaReplyFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      submittalId: string;
      subject: string;
      bodyText: string;
      direction?: "inbound" | "outbound";
      fromEmail?: string | null;
    }) => {
      if (!data?.submittalId || typeof data.submittalId !== "string") {
        throw new Error("submittalId is required");
      }
      const subject = (data.subject ?? "").trim();
      const bodyText = (data.bodyText ?? "").trim();
      if (!subject || !bodyText) throw new Error("Subject and body are required to log a reply.");
      return {
        submittalId: data.submittalId,
        subject,
        bodyText,
        direction: data.direction === "outbound" ? ("outbound" as const) : ("inbound" as const),
        fromEmail: data.fromEmail ? String(data.fromEmail) : null,
      };
    },
  )
  .handler(async ({ data, context }) => {
    const { logHoaReplyServer } = await import("@/lib/hoa-send.server");
    return await logHoaReplyServer(context.supabase as any, {
      submittalId: data.submittalId,
      subject: data.subject,
      bodyText: data.bodyText,
      direction: data.direction,
      fromEmail: data.fromEmail,
      userId: context.userId ?? null,
    });
  });
