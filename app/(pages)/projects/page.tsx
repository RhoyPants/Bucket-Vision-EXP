"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Card,
  Grid,
  TextField,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { useRouter } from "next/navigation";

import { getProjects, deleteProject } from "@/app/redux/controllers/projectController";
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

export default function ProjectsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { projects } = useAppSelector((state) => state.project);
  const { allApprovals, auditTrail } = useAppSelector((state) => state.approval);
  const { user } = useAppSelector((state) => state.auth);
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const canCreateProject = canCreate("projects");
  const canUpdateProject = canUpdate("projects");
  const canDeleteProject = canDelete("projects");

  const [viewType, setViewType] = useState<ViewType>("card");
  const [searchQuery, setSearchQuery] = useState("");
  const [businessUnitFilter, setBusinessUnitFilter] = useState("ALL");

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
      dispatch(getProjects());
    } catch (err) {
      console.error("Failed to delete project:", err);
    } finally {
      setDeletingProject(false);
    }
  };

  useEffect(() => {
    dispatch(getProjects());
  }, [dispatch]);

  const counts = useMemo(() => {
    const list = projects || [];
    return {
      active: list.filter((p: any) => p.status === "ACTIVE" || p.status === "APPROVED").length,
    };
  }, [projects]);

  const activeProjects = useMemo(() => {
    return (projects || []).filter((p: any) => p.status === "ACTIVE" || p.status === "APPROVED");
  }, [projects]);

  const businessUnitOptions = useMemo(() => {
    const buSet = new Set<string>();
    activeProjects.forEach((p: any) => {
      const buName = p?.businessUnitDetails?.name;
      if (buName) buSet.add(buName);
    });
    return Array.from(buSet).sort((a, b) => a.localeCompare(b));
  }, [activeProjects]);

  const filteredProjects = useMemo(() => {
    return activeProjects.filter((p: any) => {
      const matchesSearch =
        !searchQuery ||
        String(p?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBusinessUnit =
        businessUnitFilter === "ALL" ||
        (p?.businessUnitDetails?.name || "") === businessUnitFilter;
      return matchesSearch && matchesBusinessUnit;
    });
  }, [activeProjects, searchQuery, businessUnitFilter]);

  const actions: ProjectCardActions = {
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
      setSelectedProjectForApproval(project);
      setApprovalDetailOpen(true);

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
    onSprint: (projectId) => router.push(`/sprintManagement?projectId=${projectId}`),
    onCreateProject: () => {
      if (!canCreateProject) return;
      router.push("/projects/new/setup");
    },
  };

  return (
    <Layout>
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        {/* KPI CARDS */}
        <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
          {[
            { label: "Total Active Projects", value: counts.active, bg: "#ecfdf5", color: "#065f46" },
          ].map((item) => (
            <Grid key={item.label} size={{ xs: 12, sm: 6, md: 3 }}>
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

        {/* SEARCH + FILTER */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          sx={{ mb: 3 }}
        >
          <TextField
            label="Search Project"
            placeholder="Search by project name"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ minWidth: { xs: "100%", md: 260 } }}
          />
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
          projects={filteredProjects}
          actions={actions}
          viewType={viewType}
          onViewTypeChange={setViewType}
          headerAction={
            canCreateProject ? (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={actions.onCreateProject}
                sx={{
                  bgcolor: "#210e64",
                  "&:hover": { bgcolor: "#1a0b4f" },
                }}
              >
                Create Project
              </Button>
            ) : null
          }
          emptyMessage="No active projects"
          emptySubtext="Projects appear here once they are approved and activated"
          showCreateButton={canCreateProject && activeProjects.length === 0}
          createButtonLabel="Create Project"
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
          onApprove={async () => {
            if (!selectedProjectForApproval?.id) return;
            try {
              await dispatch(approveProject(selectedProjectForApproval.id));
              setApprovalDetailOpen(false);
              dispatch(getProjects());
            } catch (err) {
              console.error("Failed to approve project:", err);
            }
          }}
          onReject={async (remarks: string) => {
            if (!selectedProjectForApproval?.id) return;
            try {
              await dispatch(rejectProject(selectedProjectForApproval.id, remarks));
              setApprovalDetailOpen(false);
              dispatch(getProjects());
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
              setApprovalSubmitOpen(false);
              dispatch(getProjects());
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


