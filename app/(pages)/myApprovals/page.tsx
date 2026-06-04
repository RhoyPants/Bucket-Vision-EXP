"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Tooltip,
  Alert,
} from "@mui/material";
import GridViewIcon from "@mui/icons-material/GridView";
import ViewListIcon from "@mui/icons-material/ViewList";
import { useRouter } from "next/navigation";

import Layout from "@/app/components/shared/Layout";
import Guard from "@/app/components/shared/Guard";
import ProjectsGrid from "@/app/(pages)/projects/components/ProjectsGrid";
import { ProjectCardActions, ViewType } from "@/app/(pages)/projects/components/types";
import { useAppDispatch } from "@/app/redux/hook";
import { getPendingProjectsForApproval } from "@/app/redux/controllers/approvalController";

export default function MyApprovalsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const [viewType, setViewType] = useState<ViewType>("card");
  const [approvalProjects, setApprovalProjects] = useState<any[]>([]);

  useEffect(() => {
    (dispatch(getPendingProjectsForApproval() as any) as Promise<any>)
      .then((res: any) => setApprovalProjects(res || []))
      .catch(() => setApprovalProjects([]));
  }, [dispatch]);

  const counts = useMemo(() => {
    return {
      total: approvalProjects.length,
      forReview: approvalProjects.filter((p: any) => p.status === "FOR_REVIEW").length,
      forApproval: approvalProjects.filter((p: any) => p.status === "FOR_APPROVAL").length,
    };
  }, [approvalProjects]);

  const actions: ProjectCardActions = {
    onEdit: (project) => router.push(`/projects/${project.id}/setup`),
    onDelete: () => undefined,
    onSetup: (projectId) => router.push(`/projects/${projectId}/setup`),
    onViewApproval: (project) => router.push(`/approvals/${project.id}`),
    onSubmitForApproval: (project) => router.push(`/approvals/${project.id}`),
    onTeamManage: () => undefined,
    onVersion: (project) => router.push(`/versioning?projectId=${project.id}`),
    onSprint: (projectId) => router.push(`/sprintManagement?projectId=${projectId}`),
    onCreateProject: () => router.push("/projects/new/setup"),
  };

  return (
    <Layout>
      <Guard module="PROJECTS" action="READ">
        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={2}
            sx={{ mb: 3 }}
          >
            <Box>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
                My Approvals
              </Typography>
              <Typography sx={{ color: "#6b7280", fontSize: 14 }}>
                Requests that need your review or approval decision
              </Typography>
            </Box>

            <ToggleButtonGroup
              value={viewType}
              exclusive
              onChange={(_, v) => v && setViewType(v)}
              size="small"
              sx={{ "& .MuiToggleButton-root": { border: "1px solid #e5e7eb" } }}
            >
              <Tooltip title="Card view">
                <ToggleButton value="card">
                  <GridViewIcon fontSize="small" />
                </ToggleButton>
              </Tooltip>
              <Tooltip title="List view">
                <ToggleButton value="list">
                  <ViewListIcon fontSize="small" />
                </ToggleButton>
              </Tooltip>
            </ToggleButtonGroup>
          </Stack>

          <Alert severity="info" sx={{ mb: 2 }}>
            Open any project to approve or reject via the approval review page.
          </Alert>

          <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: "wrap", rowGap: 1 }}>
            <Chip label={`Total Queue: ${counts.total}`} sx={{ fontWeight: 600 }} />
            <Chip label={`For Review: ${counts.forReview}`} sx={{ fontWeight: 600, bgcolor: "#fffbeb", color: "#92400e" }} />
            <Chip label={`For Approval: ${counts.forApproval}`} sx={{ fontWeight: 600, bgcolor: "#eff6ff", color: "#1e40af" }} />
          </Stack>

          <ProjectsGrid
            projects={approvalProjects}
            actions={actions}
            viewType={viewType}
            emptyMessage="No requests waiting for your action"
            emptySubtext="New review or approval requests assigned to you will appear here"
          />
        </Box>
      </Guard>
    </Layout>
  );
}
