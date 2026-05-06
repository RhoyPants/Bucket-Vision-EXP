"use client";

import { Box, Typography, Chip } from "@mui/material";
import ProjectsGrid from "./ProjectsGrid";
import { ProjectCardActions, ViewType } from "./types";

interface ForReviewTabProps {
  projects: any[];
  actions: ProjectCardActions;
  viewType: ViewType;
  /** Projects pending the current user's review action (from approval endpoint) */
  approvalProjects?: any[];
}

export default function ForReviewTab({
  projects,
  actions,
  viewType,
  approvalProjects = [],
}: ForReviewTabProps) {
  const filtered = approvalProjects.filter((p: any) => p.status === "FOR_REVIEW");
  const needsMyAction = approvalProjects.filter((p: any) => p.status === "FOR_REVIEW");

  return (
    <>
      {needsMyAction.length > 0 && (
        <Box
          sx={{
            mb: 3,
            p: 2,
            backgroundColor: "#fffbeb",
            border: "1px solid #fcd34d",
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Typography variant="body2" sx={{ color: "#92400e", fontWeight: 600 }}>
            ⏳ You have
          </Typography>
          <Chip
            size="small"
            label={`${needsMyAction.length} project${needsMyAction.length > 1 ? "s" : ""}`}
            sx={{ backgroundColor: "#f59e0b", color: "#fff", fontWeight: 700 }}
          />
          <Typography variant="body2" sx={{ color: "#92400e", fontWeight: 600 }}>
            awaiting your review
          </Typography>
        </Box>
      )}

      <ProjectsGrid
        projects={filtered}
        actions={actions}
        viewType={viewType}
        emptyMessage="No projects under review"
        emptySubtext="Projects submitted for BU Head review will appear here"
      />
    </>
  );
}
