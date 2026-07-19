import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/portal/profile")({
  beforeLoad: () => {
    throw redirect({ to: "/profile" });
  },
});
