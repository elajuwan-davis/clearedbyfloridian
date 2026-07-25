import { createFileRoute } from "@tanstack/react-router";
import { MyPermitsPage } from "@/components/my-permits-page";

export const Route = createFileRoute("/my-permits")({
  head: () => ({
    meta: [
      { title: "My Permits — Cleard by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyPermitsPage,
});
