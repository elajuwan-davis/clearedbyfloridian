import { createFileRoute, redirect } from "@tanstack/react-router";

// Merged into the single Insurance Requests page (COI + Sub Insurance tabs).
export const Route = createFileRoute("/portal/request-sub-insurance")({
  beforeLoad: () => {
    throw redirect({ to: "/portal/request-coi", search: { tab: "sub" } as never });
  },
});
