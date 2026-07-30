import { createFileRoute, redirect } from "@tanstack/react-router";

// Portal overview is merged into the single role-aware /dashboard.
export const Route = createFileRoute("/portal/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
