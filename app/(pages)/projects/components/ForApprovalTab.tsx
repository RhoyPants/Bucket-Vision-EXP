"use client";

import { Box, Typography, Chip } from "@mui/material";
import ProjectsGrid from "./ProjectsGrid";
import { ProjectCardActions, ViewType } from "./types";

interface ForApprovalTabProps {
  projects: any[];
  actions: ProjectCardActions;
  viewType: ViewType;
  /** Projects pending the current user's approval action (from approval endpoint) */
  approvalProjects?: any[];
}

export default function ForApprovalTab({
  projects,
  actions,
  viewType,
  approvalProjects = [],
}: ForApprovalTabProps) {
  const filtered = approvalProjects.filter((p: any) => p.status === "FOR_APPROVAL");
  const needsMyAction = approvalProjects.filter(
    (p: any) => p.status === "FOR_APPROVAL" || p.status === "FOR_REVIEW"
  );

  return (
    <>
      {needsMyAction.length > 0 && (
        <Box
          sx={{
            mb: 3,
            p: 2,
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Typography variant="body2" sx={{ color: "#1e40af", fontWeight: 600 }}>
            🔔 You have
          </Typography>
          <Chip
            size="small"
            label={`${needsMyAction.length} project${needsMyAction.length > 1 ? "s" : ""}`}
            sx={{ backgroundColor: "#3b82f6", color: "#fff", fontWeight: 700 }}
          />
          <Typography variant="body2" sx={{ color: "#1e40af", fontWeight: 600 }}>
            awaiting your approval decision
          </Typography>
        </Box>
      )}

      <ProjectsGrid
        projects={filtered}
        actions={actions}
        viewType={viewType}
        emptyMessage="No projects awaiting approval"
        emptySubtext="Projects submitted for OP/Director approval will appear here"
      />
    </>
  );
}
