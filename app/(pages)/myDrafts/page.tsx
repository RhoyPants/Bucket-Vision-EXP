"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Tab,
  Tabs,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useRouter } from "next/navigation";

import Layout from "@/app/components/shared/Layout";
import Guard from "@/app/components/shared/Guard";
import ProjectsGrid from "@/app/(pages)/projects/components/ProjectsGrid";
import { ProjectCardActions, ViewType } from "@/app/(pages)/projects/components/types";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import {
  getMyDraftsProjects,
  getMyRequestsProjects,
} from "@/app/redux/controllers/projectController";
import { usePermissions } from "@/app/lib/usePermissions";

export default function MyDraftsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { canCreate } = usePermissions();
  const canCreateProject = canCreate("projects");

  const { projects, pagination } = useAppSelector((state) => state.project);

  const [viewType, setViewType] = useState<ViewType>("list");
  const [archiveTab, setArchiveTab] = useState<"draft" | "cancelled">("draft");
  const [page, setPage] = useState(1);
  const pageLimit = 10;
  const query = useMemo(
    () => ({
      page,
      limit: pageLimit,
      sortBy: "createdAt",
      sortOrder: "desc" as const,
      ...(archiveTab === "cancelled" ? { status: "CANCELLED" } : {}),
    }),
    [archiveTab, page]
  );

  useEffect(() => {
    if (archiveTab === "cancelled") {
      dispatch(getMyRequestsProjects(query));
    } else {
      dispatch(getMyDraftsProjects(query));
    }
  }, [archiveTab, dispatch, query]);

  const archivedProjects = useMemo(() => {
    return projects || [];
  }, [projects]);

  const actions: ProjectCardActions = {
    onOpenDashboard: (projectId) =>
      router.push(`/projectDashboard/${projectId}`),
    onEdit: (project) => router.push(`/projects/${project.id}/setup`),
    onDelete: () => undefined,
    onSetup: (projectId) => router.push(`/projects/${projectId}/setup`),
    onViewApproval: (project) => router.push(`/approvals/${project.id}`),
    onSubmitForApproval: (project) => router.push(`/projects/${project.id}/setup`),
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
          <Box sx={{ mb: 2, borderBottom: "1px solid #E2E8F0" }}>
            <Tabs
              value={archiveTab}
              onChange={(_, value: "draft" | "cancelled") => {
                setArchiveTab(value);
                setPage(1);
              }}
              aria-label="My archive project status"
              sx={{
                minHeight: 42,
                "& .MuiTab-root": {
                  minHeight: 42,
                  textTransform: "none",
                  fontWeight: 500,
                },
                "& .Mui-selected": { color: "#4B2E83 !important" },
                "& .MuiTabs-indicator": { bgcolor: "#4B2E83" },
              }}
            >
              <Tab value="draft" label="Draft" />
              <Tab value="cancelled" label="Cancelled" />
            </Tabs>
          </Box>

          <ProjectsGrid
            projects={archivedProjects}
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
            emptyMessage={
              archiveTab === "draft"
                ? "No draft projects"
                : "No cancelled project requests"
            }
            emptySubtext={
              archiveTab === "draft"
                ? "Start a new project or save a setup as draft to see it here"
                : "Cancelled requests will appear here and can be resumed later"
            }
            showCreateButton={archiveTab === "draft" && canCreateProject}
            pagination={pagination}
            onPageChange={(nextPage) => setPage((current) => current === nextPage ? current : nextPage)}
          />
        </Box>
      </Guard>
    </Layout>
  );
}
