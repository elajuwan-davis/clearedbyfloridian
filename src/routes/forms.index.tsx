import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/forms/")({
  beforeLoad: () => {
    throw redirect({ to: "/forms/payment-authorization" });
  },
});
