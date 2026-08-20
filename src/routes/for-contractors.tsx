import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/for-contractors")({
  beforeLoad: () => {
    throw redirect({ to: "/join" });
  },
});
