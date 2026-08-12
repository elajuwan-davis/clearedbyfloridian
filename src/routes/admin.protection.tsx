import { createFileRoute, redirect } from "@tanstack/react-router";

// Merged into /portal/utility-locates (Utility Locates & Protection).
export const Route = createFileRoute("/admin/protection")({
  beforeLoad: () => {
    throw redirect({ to: "/portal/utility-locates" });
  },
});
