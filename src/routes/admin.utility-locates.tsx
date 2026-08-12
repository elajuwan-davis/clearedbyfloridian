import { createFileRoute, redirect } from "@tanstack/react-router";

// Merged into /portal/utility-locates (Utility Locates tab).
export const Route = createFileRoute("/admin/utility-locates")({
  beforeLoad: () => {
    throw redirect({ to: "/portal/utility-locates" });
  },
});
