import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getProjectById, type Project } from "@/lib/projects-data";
import { ProjectDetail, ProjectDetailNotFound } from "@/components/project-detail";

export const Route = createFileRoute("/portal/projects/$id")({
  head: () => ({
    meta: [
      { title: "Project — Cleared by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  notFoundComponent: ProjectDetailNotFound,
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  // Seeded projects resolve immediately; hs- ids resolve client-side after mount.
  const initial = getProjectById(id);
  const [project, setProject] = useState<Project | null>(initial);
  const [resolved, setResolved] = useState<boolean>(Boolean(initial) || !id.startsWith("hs-"));

  useEffect(() => {
    if (initial) return;
    setProject(getProjectById(id));
    setResolved(true);
  }, [id, initial]);

  if (!resolved) return null;
  if (!project) return <ProjectDetailNotFound />;
  return <ProjectDetail project={project} />;
}
