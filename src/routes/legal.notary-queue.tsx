import { createFileRoute, redirect } from "@tanstack/react-router";

// Consolidated: the Remote Notary Queue now lives at the canonical
// Notary Queue page (role-aware — admins get scheduling controls).
export const Route = createFileRoute("/legal/notary-queue")({
  beforeLoad: () => {
    throw redirect({ to: "/portal/notary-queue" });
  },
});
