import { createClient } from "@supabase/supabase-js";
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

function getDeckClient() {
  const url = process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Pitch deck sharing is temporarily unavailable.");

  return createClient(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export function assertDeckAdmin(password: string) {
  if (password !== INVESTOR_ADMIN_PASSWORD) throw new Error("Unauthorized");
}

export async function createInvite(label: string) {
  const { data, error } = await getDeckClient().rpc("deck_invites_admin_create", {
    _password: INVESTOR_ADMIN_PASSWORD,
    _label: label,
  });
  if (error) throw new Error(error.message);
  return data as unknown as { token: string; passcode: string; expires_at: string; label: string };
}

export async function listInvites(): Promise<DeckInvite[]> {
  const { data, error } = await getDeckClient().rpc("deck_invites_admin_list", {
    _password: INVESTOR_ADMIN_PASSWORD,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as DeckInvite[];
}

export async function revokeInvite(id: string) {
  const { error } = await getDeckClient().rpc("deck_invites_admin_revoke", {
    _password: INVESTOR_ADMIN_PASSWORD,
    _id: id,
  });
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

type Row = { id: string; passcode: string; label: string; expires_at: string; revoked: boolean; view_count: number; first_opened_at: string | null };

async function loadByToken(token: string): Promise<Row | null> {
  const { data, error } = await getDeckClient().rpc("deck_invites_peek", { _token: token });
  if (error) throw new Error(error.message);
  const result = Array.isArray(data) ? data[0] : data;
  if (!result || result.status === "invalid") return null;
  return {
    id: token,
    passcode: result.passcode ?? "",
    label: result.label ?? "",
    expires_at: result.expires_at ?? new Date(0).toISOString(),
    revoked: result.status === "revoked",
    view_count: 0,
    first_opened_at: null,
  };
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
  const { data, error } = await getDeckClient().rpc("deck_invites_verify", {
    _token: token,
    _passcode: passcode,
  });
  if (error) throw new Error(error.message);
  const result = Array.isArray(data) ? data[0] : data;
  return result?.ok ? { ok: true } : { ok: false, reason: result?.reason ?? "This link is not valid." };
}
