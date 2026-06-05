"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box, Typography, Grid, Card } from "@mui/material";
import { useRouter } from "next/navigation";

import Layout from "@/app/components/shared/Layout";
import Guard from "@/app/components/shared/Guard";
import ProjectsGrid from "@/app/(pages)/projects/components/ProjectsGrid";
import {
  ProjectCardActions,
  ViewType,
} from "@/app/(pages)/projects/components/types";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { getMyApprovalsProjects } from "@/app/redux/controllers/projectController";

export default function MyApprovalsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { projects: approvalProjects } = useAppSelector(
    (state) => state.project,
  );

  const [viewType, setViewType] = useState<ViewType>("card");

  useEffect(() => {
    dispatch(getMyApprovalsProjects());
  }, [dispatch]);

  const counts = useMemo(() => {
    return {
      total: approvalProjects.length,
      forReview: approvalProjects.filter((p: any) => p.status === "FOR_REVIEW")
        .length,
      forApproval: approvalProjects.filter(
        (p: any) => p.status === "FOR_APPROVAL",
      ).length,
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
    onSprint: (projectId) =>
      router.push(`/sprintManagement?projectId=${projectId}`),
    onCreateProject: () => router.push("/projects/new/setup"),
  };

  return (
    <Layout>
      <Guard module="PROJECTS" action="READ">
        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <Grid container spacing={1.5} sx={{ mb: 3 }}>
            {[
              {
                label: "Total Queue",
                value: counts.total,
                bg: "#f8fafc",
                color: "#334155",
              },
              {
                label: "For Review",
                value: counts.forReview,
                bg: "#fffbeb",
                color: "#92400e",
              },
              {
                label: "For Approval",
                value: counts.forApproval,
                bg: "#eff6ff",
                color: "#1e40af",
              },
            ].map((item) => (
              <Grid key={item.label} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  sx={{
                    px: 1.5,
                    py: 1.25,
                    border: "1px solid #e5e7eb",
                    backgroundColor: item.bg,
                  }}
                >
                  <Typography
                    sx={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}
                  >
                    {item.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 24,
                      lineHeight: 1.2,
                      fontWeight: 800,
                      color: item.color,
                    }}
                  >
                    {item.value}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>

          <ProjectsGrid
            projects={approvalProjects}
            actions={actions}
            viewType={viewType}
            onViewTypeChange={setViewType}
            emptyMessage="No requests waiting for your action"
            emptySubtext="New review or approval requests assigned to you will appear here"
          />
        </Box>
      </Guard>
    </Layout>
  );
}
