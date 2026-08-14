import { createFileRoute, redirect } from "@tanstack/react-router";

// Documents is a single sidebar entry; its categories are tabs rendered by the
// portal shell. Landing here opens the first tab (Payment Authorization).
export const Route = createFileRoute("/portal/documents")({
  beforeLoad: () => {
    throw redirect({ to: "/forms/payment-authorization" });
  },
});
