import { createFileRoute, redirect } from "@tanstack/react-router";

// Invoices now live as a tab on Billing & Invoices (/portal/billing).
export const Route = createFileRoute("/invoices")({
  beforeLoad: () => {
    throw redirect({ to: "/portal/billing" });
  },
});
