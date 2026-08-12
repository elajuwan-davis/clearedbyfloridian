import { createFileRoute, redirect } from "@tanstack/react-router";

// Consolidated into the canonical Subcontractors & Compliance page.
export const Route = createFileRoute("/forms/subcontractors")({
  beforeLoad: () => {
    throw redirect({ to: "/portal/subcontractors" });
  },
});
