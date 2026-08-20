import { createFileRoute, redirect } from "@tanstack/react-router";

/** Consolidated into the unified /product page. */
export const Route = createFileRoute("/services")({
  beforeLoad: () => {
    throw redirect({ to: "/join" });
  },
});
