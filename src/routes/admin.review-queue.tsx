import { createFileRoute, redirect } from "@tanstack/react-router";

// Merged into /admin/invites (Review Queue tab).
export const Route = createFileRoute("/admin/review-queue")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/invites" });
  },
});
