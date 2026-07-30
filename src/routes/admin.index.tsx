import { createFileRoute, redirect } from "@tanstack/react-router";

// The admin dashboard is merged into the single role-aware /dashboard.
export const Route = createFileRoute("/admin/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
