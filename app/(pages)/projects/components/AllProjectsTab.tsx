"use client";

import ProjectsGrid from "./ProjectsGrid";
import { ProjectCardActions, ViewType } from "./types";

interface AllProjectsTabProps {
  projects: any[];
  actions: ProjectCardActions;
  viewType: ViewType;
}

export default function AllProjectsTab({ projects, actions, viewType }: AllProjectsTabProps) {
  const filtered = projects.filter((p: any) => p.status !== "DRAFT" && p.status !== "ARCHIVED");
  return (
    <ProjectsGrid
      projects={filtered}
      actions={actions}
      viewType={viewType}
      emptyMessage="No projects yet"
      emptySubtext="Create your first project to get started"
      showCreateButton
    />
  );
}
