"use client";

import ProjectsGrid from "./ProjectsGrid";
import { ProjectCardActions, ViewType } from "./types";

interface ActiveProjectsTabProps {
  projects: any[];
  actions: ProjectCardActions;
  viewType: ViewType;
}

export default function ActiveProjectsTab({ projects, actions, viewType }: ActiveProjectsTabProps) {
  const filtered = projects.filter((p: any) => p.status === "ACTIVE");

  return (
    <ProjectsGrid
      projects={filtered}
      actions={actions}
      viewType={viewType}
      emptyMessage="No active projects"
      emptySubtext="Projects appear here once they are approved and activated"
    />
  );
}
