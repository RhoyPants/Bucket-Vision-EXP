"use client";

import { Box, Typography } from "@mui/material";
import ProjectsGrid from "./ProjectsGrid";
import { ProjectCardActions, ViewType } from "./types";

interface ArchivedProjectsTabProps {
  projects: any[];
  actions: ProjectCardActions;
  viewType: ViewType;
}

export default function ArchivedProjectsTab({ projects, actions, viewType }: ArchivedProjectsTabProps) {
  const filtered = projects.filter((p: any) => p.status === "ARCHIVED");

  return (
    <>
      {filtered.length > 0 && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 2,
          }}
        >
          <Typography variant="body2" sx={{ color: "#6b7280" }}>
            🗄️ Archived projects are read-only. They were superseded by newer approved versions and are preserved for historical reference.
          </Typography>
        </Box>
      )}
      <ProjectsGrid
        projects={filtered}
        actions={actions}
        viewType={viewType}
        emptyMessage="No archived projects"
        emptySubtext="When a new project version is approved, older versions are archived here"
      />
    </>
  );
}
