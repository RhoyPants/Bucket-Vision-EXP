"use client";

import { Box, Typography } from "@mui/material";
import ProjectsGrid from "./ProjectsGrid";
import { ProjectCardActions, ViewType } from "./types";

interface PendingProjectsTabProps {
  projects: any[];
  actions: ProjectCardActions;
  viewType: ViewType;
}

export default function PendingProjectsTab({ projects, actions, viewType }: PendingProjectsTabProps) {
  const filtered = projects.filter(
    (p: any) =>
      !p.status || p.status === "DRAFT" || p.status === "NEEDS_REVISION"
  );

  return (
    <>
      {filtered.some((p: any) => p.status === "NEEDS_REVISION") && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 2,
          }}
        >
          <Typography variant="body2" sx={{ color: "#dc2626", fontWeight: 600 }}>
            ⚠️ Some projects require revisions before they can be resubmitted for approval.
          </Typography>
        </Box>
      )}
      <ProjectsGrid
        projects={filtered}
        actions={actions}
        viewType={viewType}
        emptyMessage="No pending projects"
        emptySubtext="Draft and projects needing revision will appear here"
        showCreateButton
      />
    </>
  );
}
