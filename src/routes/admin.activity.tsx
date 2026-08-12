import { createFileRoute, redirect } from "@tanstack/react-router";

// Consolidated into the Audit Trail.
export const Route = createFileRoute("/admin/activity")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/audit" });
  },
});
