import { createFileRoute, notFound } from "@tanstack/react-router";
import { getProjectById } from "@/lib/projects-data";
import { ProjectDetail, ProjectDetailNotFound } from "@/components/project-detail";

export const Route = createFileRoute("/portal/projects/$id")({
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.project?.name ?? "Project"} — Cleared by Flōridian` },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ params }) => {
    const project = getProjectById(params.id);
    if (!project) throw notFound();
    return { project };
  },
  notFoundComponent: ProjectDetailNotFound,
  component: RouteComponent,
});

function RouteComponent() {
  const { project } = Route.useLoaderData();
  return <ProjectDetail project={project} />;
}
