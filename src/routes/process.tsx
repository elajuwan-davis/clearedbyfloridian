import { createFileRoute, redirect } from "@tanstack/react-router";

/** Consolidated into the unified /product page. */
export const Route = createFileRoute("/process")({
  beforeLoad: () => {
    throw redirect({ to: "/for-contractors" });
  },
});
