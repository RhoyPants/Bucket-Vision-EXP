"use client";

import ProjectsGrid from "./ProjectsGrid";
import { ProjectCardActions, ViewType } from "./types";

interface DraftProjectsTabProps {
  projects: any[];
  actions: ProjectCardActions;
  viewType: ViewType;
}

export default function DraftProjectsTab({ projects, actions, viewType }: DraftProjectsTabProps) {
  const filtered = projects.filter((p: any) => p.status === "DRAFT");
  return (
    <ProjectsGrid
      projects={filtered}
      actions={actions}
      viewType={viewType}
      emptyMessage="No draft projects"
      emptySubtext="Create a new project to get started"
      showCreateButton
    />
  );
}
