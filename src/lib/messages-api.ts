// In-portal messaging between GC clients and Cleard staff.
import { supabase } from "@/integrations/supabase/client";
import { getImpersonatedTenantId } from "@/lib/use-session";

/** All outbound staff replies are presented as coming from this address. */
export const CLEARD_SUPPORT_EMAIL = "help@cleardinc.com";
export const CLEARD_SUPPORT_LABEL = "Cleard Support";

export type ThreadRow = {
  id: string;
  tenant_id: string | null;
  permit_id: string | null;
  created_by: string | null;
  created_by_email: string | null;
  subject: string;
  status: "open" | "closed";
  last_message_at: string;
  last_message_from: "client" | "admin";
  client_unread: number;
  admin_unread: number;
  created_at: string;
};

export type PostRow = {
  id: string;
  thread_id: string;
  author_id: string | null;
  author_email: string | null;
  author_label: string | null;
  from_admin: boolean;
  body: string;
  created_at: string;
};

async function ctx(): Promise<{ userId: string | null; email: string | null; tenantId: string | null }> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id ?? null;
  const email = auth?.user?.email ?? null;
  if (!userId) return { userId: null, email: null, tenantId: null };
  const impersonated = getImpersonatedTenantId();
  if (impersonated) return { userId, email, tenantId: impersonated };
  const { data } = await (supabase.from("tenant_members" as any) as any)
    .select("tenant_id")
    .eq("user_id", userId)
    .maybeSingle();
  return { userId, email, tenantId: (data as any)?.tenant_id ?? null };
}

export async function listThreads(): Promise<ThreadRow[]> {
  const { data, error } = await (supabase.from("message_threads" as any) as any)
    .select("*")
    .order("last_message_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ThreadRow[];
}

export async function listPosts(threadId: string): Promise<PostRow[]> {
  const { data, error } = await (supabase.from("message_posts" as any) as any)
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as PostRow[];
}

/** Client (or staff) starts a new thread with its first message. */
export async function createThread(opts: {
  subject: string;
  body: string;
  authorLabel: string;
  isAdmin: boolean;
  permitId?: string | null;
}): Promise<ThreadRow> {
  const { userId, email, tenantId } = await ctx();
  if (!userId) throw new Error("Not signed in");
  const { data: thread, error } = await (supabase.from("message_threads" as any) as any)
    .insert({
      tenant_id: tenantId,
      permit_id: opts.permitId ?? null,
      created_by: userId,
      created_by_email: email,
      subject: opts.subject,
      last_message_from: opts.isAdmin ? "admin" : "client",
      admin_unread: opts.isAdmin ? 0 : 1,
      client_unread: opts.isAdmin ? 1 : 0,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const t = thread as ThreadRow;
  await insertPost(t.id, tenantId, userId, email, opts.authorLabel, opts.isAdmin, opts.body);
  await notifyOtherSide(t, opts.isAdmin, opts.subject, opts.body, tenantId);
  return t;
}

export async function postReply(opts: {
  thread: ThreadRow;
  body: string;
  authorLabel: string;
  isAdmin: boolean;
}): Promise<void> {
  const { userId, email } = await ctx();
  if (!userId) throw new Error("Not signed in");
  const tenantId = opts.thread.tenant_id;
  await insertPost(opts.thread.id, tenantId, userId, email, opts.authorLabel, opts.isAdmin, opts.body);
  const { error } = await (supabase.from("message_threads" as any) as any)
    .update({
      last_message_at: new Date().toISOString(),
      last_message_from: opts.isAdmin ? "admin" : "client",
      admin_unread: opts.isAdmin ? opts.thread.admin_unread : (opts.thread.admin_unread ?? 0) + 1,
      client_unread: opts.isAdmin ? (opts.thread.client_unread ?? 0) + 1 : opts.thread.client_unread,
    })
    .eq("id", opts.thread.id);
  if (error) throw new Error(error.message);
  await notifyOtherSide(opts.thread, opts.isAdmin, opts.thread.subject, opts.body, tenantId);
}

async function insertPost(
  threadId: string,
  tenantId: string | null,
  userId: string,
  email: string | null,
  label: string,
  isAdmin: boolean,
  body: string,
) {
  const { error } = await (supabase.from("message_posts" as any) as any).insert({
    thread_id: threadId,
    tenant_id: tenantId,
    author_id: userId,
    author_email: email,
    author_label: label,
    from_admin: isAdmin,
    body,
  });
  if (error) throw new Error(error.message);
}

/** Notification fan-out: staff get client messages, client team gets staff replies. */
async function notifyOtherSide(
  thread: ThreadRow,
  isAdmin: boolean,
  subject: string,
  body: string,
  tenantId: string | null,
) {
  try {
    let recipients: string[] = [];
    if (isAdmin) {
      if (!tenantId) return;
      const { data } = await (supabase.from("tenant_members" as any) as any)
        .select("user_id")
        .eq("tenant_id", tenantId);
      recipients = ((data ?? []) as any[]).map((r) => r.user_id);
    } else {
      const { data } = await (supabase.from("user_roles" as any) as any)
        .select("user_id")
        .eq("role", "admin");
      recipients = ((data ?? []) as any[]).map((r) => r.user_id);
    }
    const { data: auth } = await supabase.auth.getUser();
    const me = auth?.user?.id ?? null;
    const rows = recipients
      .filter((uid) => uid && uid !== me)
      .map((uid) => ({
        user_id: uid,
        kind: "message",
        title: isAdmin ? `Cleard replied: ${subject}` : `New message: ${subject}`,
        body: body.slice(0, 240),
        permit_id: thread.permit_id,
      }));
    if (rows.length === 0) return;
    await (supabase.from("notifications" as any) as any).insert(rows);
  } catch {
    /* notifications are best-effort */
  }
}

export async function markThreadRead(thread: ThreadRow, isAdmin: boolean): Promise<void> {
  const patch = isAdmin ? { admin_unread: 0 } : { client_unread: 0 };
  await (supabase.from("message_threads" as any) as any).update(patch).eq("id", thread.id);
}

export async function setThreadStatus(threadId: string, status: "open" | "closed"): Promise<void> {
  await (supabase.from("message_threads" as any) as any).update({ status }).eq("id", threadId);
}
