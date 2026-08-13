import { createFileRoute } from "@tanstack/react-router";
import { SubcontractorsManager } from "@/components/subcontractors-manager";

export const Route = createFileRoute("/portal/subcontractors/")({
  head: () => ({
    meta: [{ title: "Subcontractors — Cleard" }, { name: "robots", content: "noindex" }],
  }),
  component: SubcontractorsPage,
});

function SubcontractorsPage() {
  return <SubcontractorsManager />;
}
