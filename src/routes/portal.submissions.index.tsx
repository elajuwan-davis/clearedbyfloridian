import { createFileRoute, redirect } from "@tanstack/react-router";

// The Submissions list is retired — every submission is visible on My Permits.
// Submission detail pages (/portal/submissions/$id) remain reachable from the
// bundle submission flow.
export const Route = createFileRoute("/portal/submissions/")({
  beforeLoad: () => {
    throw redirect({ to: "/portal/permits" });
  },
});
