"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Button,
  Grid,
  Card,
  TextField,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useRouter } from "next/navigation";

import Layout from "@/app/components/shared/Layout";
import Guard from "@/app/components/shared/Guard";
import ProjectsGrid from "@/app/(pages)/projects/components/ProjectsGrid";
import { ProjectCardActions, ViewType } from "@/app/(pages)/projects/components/types";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { getMyRequestsProjects } from "@/app/redux/controllers/projectController";

export default function MyRequestsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { projects } = useAppSelector((state) => state.project);

  const [viewType, setViewType] = useState<ViewType>("card");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [businessUnitFilter, setBusinessUnitFilter] = useState("ALL");

  useEffect(() => {
    dispatch(getMyRequestsProjects());
  }, [dispatch]);

  const myRequests = useMemo(() => {
    return projects || [];
  }, [projects]);

  const businessUnitOptions = useMemo(() => {
    const buSet = new Set<string>();
    myRequests.forEach((project: any) => {
      const buName = project?.businessUnitDetails?.name;
      if (buName) buSet.add(buName);
    });
    return Array.from(buSet).sort((a, b) => a.localeCompare(b));
  }, [myRequests]);

  const filteredRequests = useMemo(() => {
    return myRequests.filter((project: any) => {
      const matchesSearch =
        !searchQuery ||
        String(project?.name || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || project?.status === statusFilter;

      const projectBusinessUnit = project?.businessUnitDetails?.name || "";
      const matchesBusinessUnit =
        businessUnitFilter === "ALL" || projectBusinessUnit === businessUnitFilter;

      return matchesSearch && matchesStatus && matchesBusinessUnit;
    });
  }, [myRequests, searchQuery, statusFilter, businessUnitFilter]);

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
    onViewApproval: (project) => router.push(`/approvals/${project.id}?source=my-requests`),
    onSubmitForApproval: (project) => router.push(`/approvals/${project.id}?source=my-requests`),
    onTeamManage: () => undefined,
    onVersion: (project) => router.push(`/versioning?projectId=${project.id}`),
    onSprint: (projectId) => router.push(`/sprintManagement?projectId=${projectId}`),
    onCreateProject: () => router.push("/projects/new/setup"),
  };

  return (
    <Layout>
      <Guard module="PROJECTS" action="READ">
        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
            {[
              { label: "Total", value: counts.total, bg: "#f8fafc", color: "#334155" },
              { label: "For Review", value: counts.forReview, bg: "#fffbeb", color: "#92400e" },
              { label: "For Approval", value: counts.forApproval, bg: "#eff6ff", color: "#1e40af" },
              { label: "Needs Revision", value: counts.needsRevision, bg: "#fff7ed", color: "#9a3412" },
              { label: "Approved", value: counts.approved, bg: "#ecfdf5", color: "#065f46" },
              { label: "Rejected", value: counts.rejected, bg: "#fef2f2", color: "#991b1b" },
            ].map((item) => (
              <Grid key={item.label} size={{ xs: 6, md: 4, lg: 2 }}>
                <Card
                  sx={{
                    px: 1.5,
                    py: 1.25,
                    border: "1px solid #e5e7eb",
                    backgroundColor: item.bg,
                  }}
                >
                  <Typography sx={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>
                    {item.label}
                  </Typography>
                  <Typography sx={{ fontSize: 24, lineHeight: 1.2, fontWeight: 800, color: item.color }}>
                    {item.value}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            sx={{ mb: 3 }}
          >
            <TextField
              label="Search Request"
              placeholder="Search by project name"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ minWidth: { xs: "100%", md: 260 } }}
            />
            <TextField
              select
              label="Status"
              size="small"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: { xs: "100%", md: 220 } }}
            >
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="FOR_REVIEW">For Review</MenuItem>
              <MenuItem value="FOR_APPROVAL">For Approval</MenuItem>
              <MenuItem value="NEEDS_REVISION">Needs Revision</MenuItem>
              <MenuItem value="ACTIVE">Approved</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
            </TextField>
            <TextField
              select
              label="Business Unit"
              size="small"
              value={businessUnitFilter}
              onChange={(e) => setBusinessUnitFilter(e.target.value)}
              sx={{ minWidth: { xs: "100%", md: 240 } }}
            >
              <MenuItem value="ALL">All Business Units</MenuItem>
              {businessUnitOptions.map((bu) => (
                <MenuItem key={bu} value={bu}>
                  {bu}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <ProjectsGrid
            projects={filteredRequests}
            actions={actions}
            viewType={viewType}
            onViewTypeChange={setViewType}
            headerAction={(
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => router.push("/projects/new/setup")}
                sx={{
                  bgcolor: "#210e64",
                  "&:hover": { bgcolor: "#1a0b4f" },
                }}
              >
                New Request
              </Button>
            )}
            emptyMessage="No submitted requests yet"
            emptySubtext="Try adjusting your filters or submit a new request to see data here"
          />
        </Box>
      </Guard>
    </Layout>
  );
}
