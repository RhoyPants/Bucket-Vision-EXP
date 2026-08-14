"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Paper,
  TextField,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { useRouter } from "next/navigation";

import { getProjectDirectory, deleteProject } from "@/app/redux/controllers/projectController";
import { getBusinessUnitsDropdown } from "@/app/api-service/businessUnitService";
import {
  getProjectApprovals,
  getApprovalAuditTrail,
  approveProject,
  rejectProject,
  submitProjectForApproval,
} from "@/app/redux/controllers/approvalController";

import Layout from "@/app/components/shared/Layout";
import ProjectModal from "@/app/components/shared/modals/ProjectModal";
import { ApprovalDetailModal, ApprovalSubmitModal } from "@/app/components/shared/modals/ApprovalModals";
import TeamManagementModal from "@/app/components/shared/modals/TeamManagementModal";
import ConfirmationModal from "@/app/components/shared/modals/ConfirmationModal";
import NeedsRevisionModal from "@/app/components/shared/modals/NeedsRevisionModal";

import ProjectsGrid from "./components/ProjectsGrid";
import { ProjectCardActions, ViewType } from "./components/types";
import { usePermissions } from "@/app/lib/usePermissions";
import { notifyFirstApprovalStep } from "@/app/utils/approvalEmailNotification";
import { brandColors } from "@/app/lib/theme";

type PageLimit = 6 | 12 | 24 | 48;

const projectStatuses = [
  { value: "DRAFT", label: "Draft", bg: "#f3f4f6", color: "#4b5563" },
  { value: "FOR_REVIEW", label: "For Review", bg: "#fffbeb", color: "#92400e" },
  { value: "FOR_APPROVAL", label: "For Approval", bg: "#eff6ff", color: "#1d4ed8" },
  { value: "NEEDS_REVISION", label: "Needs Revision", bg: "#fff7ed", color: "#9a3412" },
  { value: "ACTIVE", label: "Active", bg: "#ecfdf5", color: "#047857" },
  { value: "COMPLETED", label: "Completed", bg: "#eef2ff", color: "#4338ca" },
] as const;

export default function ProjectsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { projectDirectory: projects, directoryPagination: pagination } = useAppSelector((state) => state.project);
  const { allApprovals, auditTrail } = useAppSelector((state) => state.approval);
  const { user, permissionRole } = useAppSelector((state) => state.auth);
  const { canUpdate, canDelete } = usePermissions();
  const canUpdateProject = canUpdate("projects");
  const normalizedRole = String(permissionRole || user?.role || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const isSuperAdmin = normalizedRole === "SUPERADMIN";
  const canDeleteProject = canDelete("projects") && isSuperAdmin;
  const canViewAllProjectStatuses =
    normalizedRole === "BUHEAD" || isSuperAdmin;

  const [viewType, setViewType] = useState<ViewType>("card");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [businessUnitFilter, setBusinessUnitFilter] = useState("ALL");
  const [businessUnitOptions, setBusinessUnitOptions] = useState<Array<{ id: string; code?: string; name: string }>>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<PageLimit>(12);

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectModalMode, setProjectModalMode] = useState<"create" | "edit">("create");
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const [approvalDetailOpen, setApprovalDetailOpen] = useState(false);
  const [approvalSubmitOpen, setApprovalSubmitOpen] = useState(false);
  const [selectedProjectForApproval, setSelectedProjectForApproval] = useState<any>(null);

  const [teamManagementModalOpen, setTeamManagementModalOpen] = useState(false);
  const [selectedProjectForTeam, setSelectedProjectForTeam] = useState<any>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<any>(null);
  const [deletingProject, setDeletingProject] = useState(false);
  const [needsRevisionOpen, setNeedsRevisionOpen] = useState(false);
  const [needsRevisionInfo, setNeedsRevisionInfo] = useState<any>(null);

  const loadDirectory = useCallback(() => dispatch(getProjectDirectory({
    page,
    limit,
    search: debouncedSearch || undefined,
    status: canViewAllProjectStatuses
      ? (statusFilter === "ALL" ? undefined : statusFilter)
      : "ACTIVE",
    businessUnitId: businessUnitFilter === "ALL" ? undefined : businessUnitFilter,
    sortBy: "createdAt",
    sortOrder: "desc",
  })), [dispatch, page, limit, debouncedSearch, statusFilter, businessUnitFilter, canViewAllProjectStatuses]);

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

  const handleDeleteClick = (projectId: string) => {
    const targetProject = (projects || []).find((p: any) => p.id === projectId) || { id: projectId };
    setProjectToDelete(targetProject);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete?.id) return;
    try {
      setDeletingProject(true);
      await dispatch(deleteProject(projectToDelete.id) as any);
      setDeleteConfirmOpen(false);
      setProjectToDelete(null);
      loadDirectory();
    } catch (err) {
      console.error("Failed to delete project:", err);
    } finally {
      setDeletingProject(false);
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
    getBusinessUnitsDropdown()
      .then((data) => setBusinessUnitOptions(Array.isArray(data) ? data : []))
      .catch(() => setBusinessUnitOptions([]));
  }, []);

  useEffect(() => {
    loadDirectory();
  }, [loadDirectory]);

  useEffect(() => {
    if (page > pagination.totalPages) setPage(Math.max(1, pagination.totalPages));
  }, [page, pagination.totalPages]);

  const actions: ProjectCardActions = {
    onOpenDashboard: (projectId) => router.push(`/projectDashboard/${projectId}`),
    onEdit: (project) => {
      if (!canUpdateProject) return;
      setProjectModalMode("edit");
      setSelectedProject(project);
      setProjectModalOpen(true);
    },
    onDelete: (projectId) => {
      if (!canDeleteProject) return;
      handleDeleteClick(projectId);
    },
    onSetup: (projectId) => router.push(`/projects/${projectId}/setup`),
    onViewApproval: async (project) => {
      if (!project?.id) return;
      if (project.status === "NEEDS_REVISION") {
        await openNeedsRevisionModal(project);
        return;
      }
      // setSelectedProjectForApproval(project);
      // setApprovalDetailOpen(true);
      router.push(`/approvals/${project.id}`);

      try {
        await Promise.all([
          dispatch(getProjectApprovals(project.id) as any),
          dispatch(getApprovalAuditTrail(project.id) as any),
        ]);
      } catch (err) {
        console.error("Failed to load approval details:", err);
      }
    },
    onSubmitForApproval: async (project) => {
      if (project?.status === "NEEDS_REVISION") {
        await openNeedsRevisionModal(project);
        return;
      }
      router.push(`/projects/${project.id}/setup`);
    },
    onTeamManage: (project) => {
      setSelectedProjectForTeam(project);
      setTeamManagementModalOpen(true);
    },
    onVersion: (project) => {
      router.push(`/versioning?projectId=${project.id}`);
    },
    onSprint: (projectId) => router.push(`/projectDashboard/${projectId}?view=sprint-management`),
    onCreateProject: () => {
      router.push("/projects/new/setup");
    },
  };

  return (
    <Layout>
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
                Project directory
              </Typography>
              <Typography sx={{ color: "#6B6880", fontSize: 13, mt: 0.25 }}>
                {pagination.total} {pagination.total === 1 ? "project" : "projects"}
              </Typography>
            </Box>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField
              placeholder="Search projects"
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
            >
            </TextField>
            <TextField
              select
              label="Business Unit"
              size="small"
              value={businessUnitFilter}
              onChange={(e) => {
                setBusinessUnitFilter(e.target.value);
                setPage(1);
              }}
              sx={{ minWidth: { xs: "100%", md: 240 } }}
            >
              <MenuItem value="ALL">All Business Units</MenuItem>
              {businessUnitOptions.map((bu) => (
                <MenuItem key={bu.id} value={bu.id}>
                  {bu.name}
                </MenuItem>
              ))}
            </TextField>
            {canViewAllProjectStatuses ? (
              <TextField
                select
                label="Status"
                size="small"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                sx={{ minWidth: { xs: "100%", md: 190 } }}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                {projectStatuses.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
          </Stack>
        </Paper>

        <ProjectsGrid
          projects={projects || []}
          actions={actions}
          viewType={viewType}
          onViewTypeChange={setViewType}
          emptyMessage={canViewAllProjectStatuses ? "No projects found" : "No active projects"}
          emptySubtext={
            canViewAllProjectStatuses
              ? "Create a project to get started"
              : "Projects appear here once they are approved and activated"
          }
          pagination={{
            ...pagination,
            page,
            limit,
          }}
          onPageChange={setPage}
          onLimitChange={(nextLimit) => {
            setLimit(nextLimit);
            setPage(1);
          }}
        />

        
        <ProjectModal
          open={projectModalOpen}
          onClose={() => setProjectModalOpen(false)}
          mode={projectModalMode}
          project={selectedProject}
        />

        <TeamManagementModal
          open={teamManagementModalOpen}
          onClose={() => {
            setTeamManagementModalOpen(false);
            setSelectedProjectForTeam(null);
          }}
          projectId={selectedProjectForTeam?.id}
        />

        <ApprovalDetailModal
          open={approvalDetailOpen}
          onClose={() => setApprovalDetailOpen(false)}
          project={selectedProjectForApproval}
          approval={
            allApprovals[selectedProjectForApproval?.id]?.find(
              (a) => a.approverId === user?.id && a.status === "PENDING"
            ) ||
            allApprovals[selectedProjectForApproval?.id]?.find((a) => a.status === "PENDING") ||
            allApprovals[selectedProjectForApproval?.id]?.[0] ||
            null
          }
          auditLogs={auditTrail[selectedProjectForApproval?.id] || []}
          onApprove={async (remarks: string) => {
            if (!selectedProjectForApproval?.id) return;
            try {
              await dispatch(approveProject(selectedProjectForApproval.id, remarks));
              await dispatch(getApprovalAuditTrail(selectedProjectForApproval.id));
              setApprovalDetailOpen(false);
              loadDirectory();
            } catch (err) {
              console.error("Failed to approve project:", err);
            }
          }}
          onReject={async (remarks: string) => {
            if (!selectedProjectForApproval?.id) return;
            try {
              await dispatch(rejectProject(selectedProjectForApproval.id, remarks));
              setApprovalDetailOpen(false);
              loadDirectory();
            } catch (err) {
              console.error("Failed to reject project:", err);
            }
          }}
        />

        <ApprovalSubmitModal
          open={approvalSubmitOpen}
          onClose={() => setApprovalSubmitOpen(false)}
          projectName={selectedProjectForApproval?.name}
          projectStatus={selectedProjectForApproval?.status}
          hasScopes={selectedProjectForApproval?.scopes?.length > 0}
          hasTasks={selectedProjectForApproval?.scopes?.some((s: any) => s.tasks?.length > 0)}
          requiresApproval={true}
          onConfirm={async () => {
            if (!selectedProjectForApproval?.id) return;
            try {
              await dispatch(submitProjectForApproval(selectedProjectForApproval.id));
              try {
                await notifyFirstApprovalStep(
                  selectedProjectForApproval.id,
                  selectedProjectForApproval,
                  user?.name
                );
              } catch (emailError) {
                console.warn("Could not send approval email notifications:", emailError);
              }
              setApprovalSubmitOpen(false);
              loadDirectory();
            } catch (err) {
              console.error("Failed to submit project for approval:", err);
            }
          }}
        />

        <ConfirmationModal
          open={deleteConfirmOpen}
          onClose={() => {
            if (deletingProject) return;
            setDeleteConfirmOpen(false);
            setProjectToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          loading={deletingProject}
          danger
          title="Delete Project?"
          message={`Are you sure you want to delete "${projectToDelete?.name || "this project"}"? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
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
    </Layout>
  );
}


