import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Notify submitter + all voters when a request ships. Admin-only.
export const notifyShippedFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { requestId: string }) => {
    if (!input?.requestId || typeof input.requestId !== "string") {
      throw new Error("requestId required");
    }
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: reqRow, error: reqErr } = await supabaseAdmin
      .from("feature_requests")
      .select("id, title, created_by, status, shipped_notified_at")
      .eq("id", data.requestId)
      .single();
    if (reqErr) throw reqErr;
    if (!reqRow) throw new Error("Request not found");
    if (reqRow.status !== "shipped") return { notified: 0, skipped: "not_shipped" };
    if (reqRow.shipped_notified_at) return { notified: 0, skipped: "already_notified" };

    const { data: votes } = await supabaseAdmin
      .from("feature_request_votes")
      .select("user_id")
      .eq("request_id", reqRow.id);

    const recipients = new Set<string>();
    if (reqRow.created_by) recipients.add(reqRow.created_by);
    for (const v of votes ?? []) if (v.user_id) recipients.add(v.user_id);

    if (recipients.size === 0) {
      await supabaseAdmin
        .from("feature_requests")
        .update({ shipped_notified_at: new Date().toISOString() })
        .eq("id", reqRow.id);
      return { notified: 0, actor: userId };
    }

    const rows = Array.from(recipients).map((uid) => ({
      user_id: uid,
      kind: "feature_shipped",
      title: "A feature you requested has shipped",
      body: `Good news — a feature you requested or voted for has shipped: ${reqRow.title}.`,
    }));

    const { error: insErr } = await supabaseAdmin.from("notifications").insert(rows);
    if (insErr) throw insErr;

    await supabaseAdmin
      .from("feature_requests")
      .update({ shipped_notified_at: new Date().toISOString() })
      .eq("id", reqRow.id);

    return { notified: rows.length, actor: userId };
  });
