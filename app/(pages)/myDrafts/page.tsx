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

export default function MyDraftsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { projects } = useAppSelector((state) => state.project);
  const { user } = useAppSelector((state) => state.auth);

  const [viewType, setViewType] = useState<ViewType>("card");

  useEffect(() => {
    dispatch(getProjects());
  }, [dispatch]);

  const myDrafts = useMemo(() => {
    const list = projects || [];
    return list.filter((p: any) => p.ownerId === user?.id && p.status === "DRAFT");
  }, [projects, user?.id]);

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
                My Drafts
              </Typography>
              <Typography sx={{ color: "#6b7280", fontSize: 14 }}>
                Draft projects saved by you and ready to continue
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

          <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
            <Chip label={`Drafts: ${myDrafts.length}`} sx={{ fontWeight: 600, bgcolor: "#f3f4f6", color: "#374151" }} />
          </Stack>

          <ProjectsGrid
            projects={myDrafts}
            actions={actions}
            viewType={viewType}
            emptyMessage="No draft projects"
            emptySubtext="Start a new project or save a setup as draft to see it here"
            showCreateButton
          />
        </Box>
      </Guard>
    </Layout>
  );
}
