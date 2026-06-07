import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jilhwkhsbpvylkfflszg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_p1lycnwbbrEUxKmoFyPtPA_qcSN7DZZ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});
