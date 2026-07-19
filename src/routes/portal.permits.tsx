import { createFileRoute } from "@tanstack/react-router";
import MyPermitsRoute from "./my-permits";

// /portal/permits mirrors the full historical My Permits list (all statuses).
export const Route = createFileRoute("/portal/permits")({
  head: () => ({
    meta: [
      { title: "My Permits — Cleared by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: (MyPermitsRoute as any).options?.component ?? (MyPermitsRoute as any).component,
});
