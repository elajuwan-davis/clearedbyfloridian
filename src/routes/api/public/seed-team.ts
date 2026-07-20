import { createFileRoute } from "@tanstack/react-router";

const TEAM = [
  { email: "elajuwan@cleared.com", name: "Elajuwan Davis" },
  { email: "eman@cleared.com", name: "Eman" },
  { email: "paul@cleared.com", name: "Paul" },
  { email: "jose@cleared.com", name: "Jose" },
];
const PASSWORD = "Cleared2026!";

export const Route = createFileRoute("/api/public/seed-team")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const results: Array<{ email: string; status: string; id?: string; error?: string }> = [];
        for (const u of TEAM) {
          try {
            const { data, error } = await supabaseAdmin.auth.admin.createUser({
              email: u.email,
              password: PASSWORD,
              email_confirm: true,
              user_metadata: { full_name: u.name },
            });
            if (error) {
              const msg = error.message || "";
              if (/already|registered|exists/i.test(msg)) {
                results.push({ email: u.email, status: "exists" });
              } else {
                results.push({ email: u.email, status: "error", error: msg });
              }
            } else {
              results.push({ email: u.email, status: "created", id: data.user?.id });
            }
          } catch (e) {
            results.push({ email: u.email, status: "error", error: e instanceof Error ? e.message : String(e) });
          }
        }
        return new Response(JSON.stringify({ password: PASSWORD, results }, null, 2), {
          headers: { "content-type": "application/json" },
        });
      },
      GET: async () => new Response("POST to seed team users", { status: 405 }),
    },
  },
});
