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
import { getApprovalAuditTrail } from "@/app/redux/controllers/approvalController";
import { usePermissions } from "@/app/lib/usePermissions";
import NeedsRevisionModal from "@/app/components/shared/modals/NeedsRevisionModal";

type MyRequestProject = {
  id: string;
  name?: string;
  status?: string;
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
    dispatch(getMyRequestsProjects({
      page,
      limit: pageLimit,
      search: searchQuery.trim(),
      status: statusFilter,
      businessUnitId: businessUnitFilter,
      sortBy: "createdAt",
      sortOrder: "desc",
    }));
  }, [businessUnitFilter, dispatch, page, searchQuery, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [businessUnitFilter, searchQuery, statusFilter]);

  const myRequests = useMemo<MyRequestProject[]>(() => {
    return (projects || []) as MyRequestProject[];
  }, [projects]);

  const businessUnitOptions = useMemo(() => {
    const buMap = new Map<string, string>();
    myRequests.forEach((project) => {
      const buId = project?.businessUnitDetails?.id;
      const buName = project?.businessUnitDetails?.name;
      if (buId && buName) buMap.set(buId, buName);
    });
    return Array.from(buMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [myRequests]);

  const filteredRequests = useMemo(() => {
    return myRequests;
  }, [myRequests, pagination.total]);

  const counts = useMemo(() => {
    return {
      total: pagination.total || myRequests.length,
      forReview: myRequests.filter((p) => p.status === "FOR_REVIEW").length,
      forApproval: myRequests.filter((p) => p.status === "FOR_APPROVAL").length,
      needsRevision: myRequests.filter((p) => p.status === "NEEDS_REVISION").length,
      approved: myRequests.filter((p) => p.status === "ACTIVE").length,
      rejected: myRequests.filter((p) => p.status === "REJECTED").length,
    };
  }, [myRequests]);

  const actions: ProjectCardActions = {
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
                <MenuItem key={bu.id} value={bu.id}>
                  {bu.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <ProjectsGrid
            projects={filteredRequests}
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
                New Request
              </Button>
            ) : null}
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
