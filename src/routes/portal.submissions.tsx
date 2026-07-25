import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";

export const Route = createFileRoute("/portal/submissions")({
  head: () => ({
    meta: [
      { title: "Submissions — Cleared by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SubmissionsLayout,
});

function SubmissionsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Layout is just an Outlet — index and $id are children.
  void pathname;
  void Link;
  return <Outlet />;
}
