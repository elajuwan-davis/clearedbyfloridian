import { createFileRoute, redirect } from "@tanstack/react-router";

// Consolidated: Compliance now lives as a tab on the canonical
// Subcontractors & Compliance page.
export const Route = createFileRoute("/portal/compliance")({
  beforeLoad: () => {
    throw redirect({ to: "/portal/subcontractors" });
  },
});
