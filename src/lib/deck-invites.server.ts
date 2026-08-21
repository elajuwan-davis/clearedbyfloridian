import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { INVESTOR_ADMIN_PASSWORD } from "./investor-admin-password";

export type DeckInvite = {
  id: string;
  token: string;
  passcode: string;
  label: string;
  expires_at: string;
  revoked: boolean;
  view_count: number;
  first_opened_at: string | null;
  last_viewed_at: string | null;
  created_at: string;
};

export const DECK_INVITE_DAYS = 7;

export function assertDeckAdmin(password: string) {
  if (password !== INVESTOR_ADMIN_PASSWORD) throw new Error("Unauthorized");
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomString(len: number) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export async function createInvite(label: string) {
  const expires = new Date(Date.now() + DECK_INVITE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  for (let attempt = 0; attempt < 6; attempt++) {
    const token = crypto.randomUUID().replace(/-/g, "");
    const passcode = randomString(8);
    const { data, error } = await supabaseAdmin
      .from("deck_invites" as never)
      .insert({ token, passcode, label, expires_at: expires } as never)
      .select("token, passcode, expires_at, label")
      .single();
    if (!error && data) return data as unknown as { token: string; passcode: string; expires_at: string; label: string };
    if (!error?.message?.toLowerCase().includes("duplicate")) throw new Error(error?.message ?? "Insert failed");
  }
  throw new Error("Could not generate a unique invite, please try again.");
}

export async function listInvites(): Promise<DeckInvite[]> {
  const { data, error } = await supabaseAdmin
    .from("deck_invites" as never)
    .select("id, token, passcode, label, expires_at, revoked, view_count, first_opened_at, last_viewed_at, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as DeckInvite[];
}

export async function revokeInvite(id: string) {
  const { error } = await supabaseAdmin
    .from("deck_invites" as never)
    .update({ revoked: true } as never)
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

type Row = { id: string; passcode: string; label: string; expires_at: string; revoked: boolean; view_count: number; first_opened_at: string | null };

async function loadByToken(token: string): Promise<Row | null> {
  const { data } = await supabaseAdmin
    .from("deck_invites" as never)
    .select("id, passcode, label, expires_at, revoked, view_count, first_opened_at")
    .eq("token", token)
    .maybeSingle();
  return (data as unknown as Row | null) ?? null;
}

export type InviteState =
  | { status: "invalid" }
  | { status: "revoked" }
  | { status: "expired"; expiresAt: string }
  | { status: "active"; passcode: string; expiresAt: string; label: string };

/** Reveals the one-time passcode to whoever holds the link, while the link is still valid. */
export async function peekInvite(token: string): Promise<InviteState> {
  const row = await loadByToken(token);
  if (!row) return { status: "invalid" };
  if (row.revoked) return { status: "revoked" };
  if (new Date(row.expires_at).getTime() <= Date.now()) return { status: "expired", expiresAt: row.expires_at };
  return { status: "active", passcode: row.passcode, expiresAt: row.expires_at, label: row.label };
}

export async function verifyInvite(token: string, passcode: string): Promise<{ ok: boolean; reason?: string }> {
  const row = await loadByToken(token);
  if (!row) return { ok: false, reason: "This link is not valid." };
  if (row.revoked) return { ok: false, reason: "Access to this link has been revoked." };
  if (new Date(row.expires_at).getTime() <= Date.now()) return { ok: false, reason: "This link has expired." };
  if (passcode.trim().toUpperCase() !== row.passcode.toUpperCase()) return { ok: false, reason: "Incorrect passcode." };

  const now = new Date().toISOString();
  await supabaseAdmin
    .from("deck_invites" as never)
    .update({
      view_count: (row.view_count ?? 0) + 1,
      last_viewed_at: now,
      first_opened_at: row.first_opened_at ?? now,
    } as never)
    .eq("id", row.id);
  return { ok: true };
}
