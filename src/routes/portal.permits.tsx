import { createFileRoute } from "@tanstack/react-router";
import { MyPermitsPage } from "./my-permits";

export const Route = createFileRoute("/portal/permits")({
  head: () => ({
    meta: [
      { title: "My Permits — Cleared by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyPermitsPage,
});
