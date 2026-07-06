"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useRouter } from "next/navigation";

import Layout from "@/app/components/shared/Layout";
import Guard from "@/app/components/shared/Guard";
import ProjectsGrid from "@/app/(pages)/projects/components/ProjectsGrid";
import { ProjectCardActions, ViewType } from "@/app/(pages)/projects/components/types";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { getMyDraftsProjects } from "@/app/redux/controllers/projectController";
import { usePermissions } from "@/app/lib/usePermissions";

export default function MyDraftsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { canCreate } = usePermissions();
  const canCreateProject = canCreate("projects");

  const { projects, pagination } = useAppSelector((state) => state.project);

  const [viewType, setViewType] = useState<ViewType>("list");
  const [page, setPage] = useState(1);
  const pageLimit = 10;
  const query = useMemo(
    () => ({
      page,
      limit: pageLimit,
      sortBy: "createdAt",
      sortOrder: "desc" as const,
    }),
    [page]
  );

  useEffect(() => {
    dispatch(getMyDraftsProjects(query));
  }, [dispatch, query]);

  const myDrafts = useMemo(() => {
    return projects || [];
  }, [projects]);

  const actions: ProjectCardActions = {
    onEdit: (project) => router.push(`/projects/${project.id}/setup`),
    onDelete: () => undefined,
    onSetup: (projectId) => router.push(`/projects/${projectId}/setup`),
    onViewApproval: (project) => router.push(`/approvals/${project.id}`),
    onSubmitForApproval: (project) => router.push(`/approvals/${project.id}`),
    onTeamManage: () => undefined,
    onVersion: (project) => router.push(`/versioning?projectId=${project.id}`),
    onSprint: (projectId) => router.push(`/sprintManagement?projectId=${projectId}`),
    onCreateProject: () => {
      if (!canCreateProject) return;
      router.push("/projects/new/setup");
    },
  };

  return (
    <Layout>
      <Guard module="PROJECTS" action="READ">
        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <Grid container spacing={1.5} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                sx={{
                  px: 1.5,
                  py: 1.25,
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#f8fafc",
                }}
              >
                <Typography sx={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>
                  Drafts
                </Typography>
                <Typography sx={{ fontSize: 24, lineHeight: 1.2, fontWeight: 800, color: "#334155" }}>
                  {myDrafts.length}
                </Typography>
              </Card>
            </Grid>
          </Grid>

          <ProjectsGrid
            projects={myDrafts}
            actions={actions}
            viewType={viewType}
            onViewTypeChange={setViewType}
            headerAction={canCreateProject ? ( 
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={actions.onCreateProject}
                sx={{
                  bgcolor: "#210e64",
                  "&:hover": { bgcolor: "#1a0b4f" },
                }}
              >
                New Project
              </Button>
            ) : null}
            emptyMessage="No draft projects"
            emptySubtext="Start a new project or save a setup as draft to see it here"
            showCreateButton={canCreateProject}
            pagination={pagination}
            onPageChange={(nextPage) => setPage((current) => current === nextPage ? current : nextPage)}
          />
        </Box>
      </Guard>
    </Layout>
  );
}
