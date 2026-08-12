import { createFileRoute, redirect } from "@tanstack/react-router";

// Merged into /admin/protection (Utility Locates tab).
export const Route = createFileRoute("/admin/utility-locates")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/protection" });
  },
});
