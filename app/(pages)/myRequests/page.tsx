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
} from "@mui/material";
import GridViewIcon from "@mui/icons-material/GridView";
import ViewListIcon from "@mui/icons-material/ViewList";
import { useRouter } from "next/navigation";

import Layout from "@/app/components/shared/Layout";
import Guard from "@/app/components/shared/Guard";
import ProjectsGrid from "@/app/(pages)/projects/components/ProjectsGrid";
import { ProjectCardActions, ViewType } from "@/app/(pages)/projects/components/types";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { getProjects } from "@/app/redux/controllers/projectController";

export default function MyRequestsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { projects } = useAppSelector((state) => state.project);
  const { user } = useAppSelector((state) => state.auth);

  const [viewType, setViewType] = useState<ViewType>("card");

  useEffect(() => {
    dispatch(getProjects());
  }, [dispatch]);

  const myRequests = useMemo(() => {
    const list = projects || [];

    return list.filter((p: any) => {
      const isMine = p.ownerId === user?.id;
      const isTrackedStatus = [
        "FOR_REVIEW",
        "FOR_APPROVAL",
        "NEEDS_REVISION",
        "REJECTED",
        "ACTIVE",
      ].includes(p.status);

      return isMine && isTrackedStatus;
    });
  }, [projects, user?.id]);

  const counts = useMemo(() => {
    return {
      total: myRequests.length,
      forReview: myRequests.filter((p: any) => p.status === "FOR_REVIEW").length,
      forApproval: myRequests.filter((p: any) => p.status === "FOR_APPROVAL").length,
      needsRevision: myRequests.filter((p: any) => p.status === "NEEDS_REVISION").length,
      approved: myRequests.filter((p: any) => p.status === "ACTIVE").length,
      rejected: myRequests.filter((p: any) => p.status === "REJECTED").length,
    };
  }, [myRequests]);

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
                My Requests
              </Typography>
              <Typography sx={{ color: "#6b7280", fontSize: 14 }}>
                Track submitted projects and current approval status
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

          <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: "wrap", rowGap: 1 }}>
            <Chip label={`Total: ${counts.total}`} sx={{ fontWeight: 600 }} />
            <Chip label={`For Review: ${counts.forReview}`} sx={{ fontWeight: 600, bgcolor: "#fffbeb", color: "#92400e" }} />
            <Chip label={`For Approval: ${counts.forApproval}`} sx={{ fontWeight: 600, bgcolor: "#eff6ff", color: "#1e40af" }} />
            <Chip label={`Needs Revision: ${counts.needsRevision}`} sx={{ fontWeight: 600, bgcolor: "#fff7ed", color: "#9a3412" }} />
            <Chip label={`Approved: ${counts.approved}`} sx={{ fontWeight: 600, bgcolor: "#ecfdf5", color: "#065f46" }} />
            <Chip label={`Rejected: ${counts.rejected}`} sx={{ fontWeight: 600, bgcolor: "#fef2f2", color: "#991b1b" }} />
          </Stack>

          <ProjectsGrid
            projects={myRequests}
            actions={actions}
            viewType={viewType}
            emptyMessage="No submitted requests yet"
            emptySubtext="Once you submit a project for review or approval, it will appear here"
          />
        </Box>
      </Guard>
    </Layout>
  );
}
