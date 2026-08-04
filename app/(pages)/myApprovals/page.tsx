"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box, InputAdornment, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
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
import { brandColors } from "@/app/lib/theme";

export default function MyApprovalsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { projects: approvalProjects } = useAppSelector(
    (state) => state.project,
  );
  const { pagination } = useAppSelector((state) => state.project);

  const [viewType, setViewType] = useState<ViewType>("list");
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [businessUnitFilter, setBusinessUnitFilter] = useState("ALL");
  const pageLimit = 10;
  const query = useMemo(
    () => ({
      page,
      limit: pageLimit,
      search: searchQuery.trim(),
      status: statusFilter,
      businessUnitId: businessUnitFilter,
      sortBy: "createdAt",
      sortOrder: "desc" as const,
    }),
    [businessUnitFilter, page, searchQuery, statusFilter]
  );

  useEffect(() => {
    dispatch(getMyApprovalsProjects(query));
  }, [dispatch, query]);

  useEffect(() => {
    setPage(1);
  }, [businessUnitFilter, searchQuery, statusFilter]);

  const businessUnitOptions = useMemo(() => {
    const units = new Map<string, string>();
    approvalProjects.forEach((project) => {
      const details = project.businessUnitDetails;
      if (details?.id && details?.name) units.set(details.id, details.name);
    });
    return Array.from(units, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [approvalProjects]);

  const actions: ProjectCardActions = {
    onEdit: (project) => router.push(`/projects/${project.id}/setup`),
    onDelete: () => undefined,
    onSetup: (projectId) => router.push(`/projects/${projectId}/setup`),
    onViewApproval: (project) => router.push(`/approvals/${project.id}`),
    onSubmitForApproval: (project) => router.push(`/projects/${project.id}/setup`),
    onTeamManage: () => undefined,
    onVersion: (project) => router.push(`/versioning?projectId=${project.id}`),
    onSprint: (projectId) =>
      router.push(`/projectDashboard/${projectId}?view=sprint-management`),
    onCreateProject: () => router.push("/projects/new/setup"),
  };

  return (
    <Layout>
      <Guard module="PROJECTS" action="READ">
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1600, mx: "auto" }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 2.5 },
              mb: 2.5,
              border: `1px solid ${brandColors.lavender}`,
              borderRadius: 3,
              backgroundColor: "#FFFFFF",
            }}
          >
            <Typography sx={{ color: brandColors.deepTwilight, fontSize: 16, fontWeight: 700 }}>
              Approval queue
            </Typography>
            <Typography sx={{ color: "#6B6880", fontSize: 13, mt: 0.25 }}>
              {pagination.total || approvalProjects.length}{" "}
              {(pagination.total || approvalProjects.length) === 1 ? "request awaiting action" : "requests awaiting action"}
            </Typography>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mt: 2 }}>
              <TextField
                placeholder="Search approval requests"
                size="small"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: "#89859A", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{ flex: 1, minWidth: { xs: "100%", md: 280 } }}
              />
              <TextField
                select
                label="Approval Status"
                size="small"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                sx={{ minWidth: { xs: "100%", md: 210 } }}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="FOR_REVIEW">For Review</MenuItem>
                <MenuItem value="FOR_APPROVAL">For Approval</MenuItem>
              </TextField>
              <TextField
                select
                label="Business Unit"
                size="small"
                value={businessUnitFilter}
                onChange={(event) => setBusinessUnitFilter(event.target.value)}
                sx={{ minWidth: { xs: "100%", md: 240 } }}
              >
                <MenuItem value="ALL">All Business Units</MenuItem>
                {businessUnitOptions.map((unit) => (
                  <MenuItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </Paper>

          <ProjectsGrid
            projects={approvalProjects}
            actions={actions}
            viewType={viewType}
            onViewTypeChange={setViewType}
            emptyMessage="No requests waiting for your action"
            emptySubtext="New review or approval requests assigned to you will appear here"
            pagination={pagination}
            onPageChange={(nextPage) => setPage((current) => current === nextPage ? current : nextPage)}
            actionMode="approval"
            legendItems={[
              { label: "For Review", color: "#FBBF24" },
              { label: "For Approval", color: "#60A5FA" },
            ]}
          />
        </Box>
      </Guard>
    </Layout>
  );
}
