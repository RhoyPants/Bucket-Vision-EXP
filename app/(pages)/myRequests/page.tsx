"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Button,
  Paper,
  TextField,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import { useRouter } from "next/navigation";

import Layout from "@/app/components/shared/Layout";
import Guard from "@/app/components/shared/Guard";
import ProjectsGrid from "@/app/(pages)/projects/components/ProjectsGrid";
import { ProjectCardActions, ViewType } from "@/app/(pages)/projects/components/types";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { getMyRequestsProjects } from "@/app/redux/controllers/projectController";
import { getApprovalAuditTrail } from "@/app/redux/controllers/approvalController";
import { usePermissions } from "@/app/lib/usePermissions";
import NeedsRevisionModal from "@/app/components/shared/modals/NeedsRevisionModal";
import { brandColors } from "@/app/lib/theme";
import axiosApi from "@/app/lib/axios";

type MyRequestProject = {
  id: string;
  name?: string;
  status?: string;
  businessUnitName?: string;
  businessUnitDetails?: {
    id?: string;
    name?: string;
  } | null;
};

export default function MyRequestsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { canCreate } = usePermissions();
  const canCreateProject = canCreate("projects");

  const { projects, pagination } = useAppSelector((state) => state.project);

  const [viewType, setViewType] = useState<ViewType>("list");
  const [page, setPage] = useState(1);
  const pageLimit = 10;
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [businessUnitFilter, setBusinessUnitFilter] = useState("ALL");
  const [needsRevisionOpen, setNeedsRevisionOpen] = useState(false);
  const [needsRevisionInfo, setNeedsRevisionInfo] = useState<any>(null);

  const openNeedsRevisionModal = async (project: any) => {
    try {
      const logs = await dispatch(getApprovalAuditTrail(project.id) as any);
      const normalizedLogs = Array.isArray(logs) ? logs : [];
      const sorted = [...normalizedLogs].sort(
        (a: any, b: any) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()
      );
      const rejectLog =
        sorted.find(
          (log: any) =>
            log?.action === "REJECTED" ||
            log?.newStatus === "NEEDS_REVISION" ||
            log?.newStatus === "REJECTED"
        ) || sorted[0];

      const reason =
        rejectLog?.reason ||
        rejectLog?.rejectionReason ||
        (rejectLog?.action === "REJECTED"
          ? "Rejected during approval review and returned for revision."
          : "This request requires updates before resubmission.");

      setNeedsRevisionInfo({
        projectId: project.id,
        projectName: project.name,
        rejectedBy: rejectLog?.approverName,
        rejectedAt: rejectLog?.createdAt,
        reason,
        remarks: rejectLog?.remarks,
      });
      setNeedsRevisionOpen(true);
    } catch {
      setNeedsRevisionInfo({
        projectId: project.id,
        projectName: project.name,
        rejectedBy: "N/A",
        rejectedAt: "",
        reason: "This request requires updates before resubmission.",
        remarks: "No remarks provided.",
      });
      setNeedsRevisionOpen(true);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setDebouncedSearch(searchQuery.trim());
    }, 400);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    dispatch(getMyRequestsProjects({
      page,
      limit: pageLimit,
      search: debouncedSearch,
      status: statusFilter,
      businessUnitId: businessUnitFilter,
      sortBy: "createdAt",
      sortOrder: "desc",
    }));
  }, [businessUnitFilter, debouncedSearch, dispatch, page, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [businessUnitFilter, statusFilter]);

  const myRequests = useMemo<MyRequestProject[]>(() => {
    return (projects || []) as MyRequestProject[];
  }, [projects]);

  const businessUnitOptions = useMemo(() => {
    const buMap = new Map<string, string>();
    myRequests.forEach((project) => {
      const buId = project?.businessUnitDetails?.id;
      const buName = project?.businessUnitDetails?.name || project?.businessUnitName;
      if (buId && buName) buMap.set(buId, buName);
    });
    return Array.from(buMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [myRequests]);

  const actions: ProjectCardActions = {
    onOpenDashboard: async (projectId) => {
      const project = myRequests.find((request) => request.id === projectId);
      if (project?.status === "NEEDS_REVISION") {
        await openNeedsRevisionModal(project);
        return;
      }
      router.push(`/projectDashboard/${projectId}`);
    },
    onEdit: (project) => router.push(`/projects/${project.id}/setup`),
    onDelete: () => undefined,
    onSetup: (projectId) => router.push(`/projects/${projectId}/setup`),
    onViewApproval: async (project) => {
      if (project?.status === "NEEDS_REVISION") {
        await openNeedsRevisionModal(project);
        return;
      }
      router.push(`/approvals/${project.id}?source=my-requests`);
    },
    onSubmitForApproval: async (project) => {
      if (project?.status === "NEEDS_REVISION") {
        await openNeedsRevisionModal(project);
        return;
      }
      router.push(`/projects/${project.id}/setup`);
    },
    onTeamManage: () => undefined,
    onVersion: (project) => router.push(`/versioning?projectId=${project.id}`),
    onSprint: (projectId) => router.push(`/projectDashboard/${projectId}?view=sprint-management`),
    onCreateProject: () => {
      if (!canCreateProject) return;
      router.push("/projects/new/setup");
    },
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
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", sm: "center" }}
              spacing={1.5}
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography sx={{ color: brandColors.deepTwilight, fontSize: 16, fontWeight: 700 }}>
                  Request directory
                </Typography>
                <Typography sx={{ color: "#6B6880", fontSize: 13, mt: 0.25 }}>
                  {pagination.total || myRequests.length}{" "}
                  {(pagination.total || myRequests.length) === 1 ? "request" : "requests"}
                </Typography>
              </Box>
              {canCreateProject ? (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={actions.onCreateProject}
                  sx={{
                    bgcolor: brandColors.deepTwilightLight,
                    "&:hover": { bgcolor: brandColors.deepTwilight },
                  }}
                >
                  New request
                </Button>
              ) : null}
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <TextField
                placeholder="Search requests"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                label="Status"
                size="small"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ minWidth: { xs: "100%", md: 200 } }}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
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
                  <MenuItem key={bu.id} value={bu.id}>
                    {bu.name}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </Paper>

          <ProjectsGrid
            projects={myRequests}
            actions={actions}
            viewType={viewType}
            onViewTypeChange={setViewType}
            emptyMessage="No submitted requests yet"
            emptySubtext={
              myRequests.length === 0
                ? "Create a new project request to start tracking its review and approval status."
                : "Try adjusting your filters to find an existing request."
            }
            showCreateButton={canCreateProject && myRequests.length === 0}
            createButtonLabel="Create New Request"
            pagination={pagination}
            onPageChange={setPage}
            showActions={false}
            showRequestTrackingColumns
            activeStatus={statusFilter}
            onStatusLegendClick={(status) => { setStatusFilter(status); setPage(1); }}
            isFiltered={Boolean(debouncedSearch || statusFilter !== "ALL" || businessUnitFilter !== "ALL")}
            filteredEmptyMessage="No requests match the selected filters."
          />

          <NeedsRevisionModal
            open={needsRevisionOpen}
            onClose={() => setNeedsRevisionOpen(false)}
            onReviseResubmit={() => {
              setNeedsRevisionOpen(false);
              if (needsRevisionInfo?.projectId) {
                router.push(`/projects/${needsRevisionInfo.projectId}/setup`);
              }
            }}
            onCancelRequest={async (reason) => {
              if (!needsRevisionInfo?.projectId) return;
              await axiosApi.post(`/projects/${needsRevisionInfo.projectId}/cancel`, { reason });
              setNeedsRevisionOpen(false);
              setNeedsRevisionInfo(null);
              await dispatch(getMyRequestsProjects({
                page,
                limit: pageLimit,
                search: debouncedSearch,
                status: statusFilter,
                businessUnitId: businessUnitFilter,
                sortBy: "createdAt",
                sortOrder: "desc",
              }));
            }}
            projectName={needsRevisionInfo?.projectName}
            rejectedBy={needsRevisionInfo?.rejectedBy}
            rejectedAt={needsRevisionInfo?.rejectedAt}
            reason={needsRevisionInfo?.reason}
            remarks={needsRevisionInfo?.remarks}
          />
        </Box>
      </Guard>
    </Layout>
  );
}
