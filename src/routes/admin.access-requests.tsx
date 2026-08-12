import { createFileRoute, redirect } from "@tanstack/react-router";

// Merged into /admin/invites (Access Requests tab).
export const Route = createFileRoute("/admin/access-requests")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/invites" });
  },
});
