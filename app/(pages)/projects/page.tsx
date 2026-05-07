"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Tabs,
  Tab,
  Badge,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
} from "@mui/material";
import GridViewIcon from "@mui/icons-material/GridView";
import ViewListIcon from "@mui/icons-material/ViewList";

import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { useRouter } from "next/navigation";

import { getProjects, deleteProject } from "@/app/redux/controllers/projectController";
import {
  getPendingProjectsForApproval,
  approveProject,
  rejectProject,
  submitProjectForApproval,
} from "@/app/redux/controllers/approvalController";

import Layout from "@/app/components/shared/Layout";
import Guard from "@/app/components/shared/Guard";
import ProjectModal from "@/app/components/shared/modals/ProjectModal";
import { ApprovalDetailModal, ApprovalSubmitModal } from "@/app/components/shared/modals/ApprovalModals";
import VersioningActionModal from "@/app/components/shared/modals/VersioningActionModal";
import TeamManagementModal from "@/app/components/shared/modals/TeamManagementModal";

import ActiveProjectsTab from "./components/ActiveProjectsTab";
import PendingProjectsTab from "./components/PendingProjectsTab";
import DraftProjectsTab from "./components/DraftProjectsTab";
import ForReviewTab from "./components/ForReviewTab";
import ForApprovalTab from "./components/ForApprovalTab";
import ArchivedProjectsTab from "./components/ArchivedProjectsTab";
import { ProjectCardActions, ProjectTab, ViewType } from "./components/types";

export default function ProjectsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { projects } = useAppSelector((state) => state.project);
  const { allApprovals, auditTrail } = useAppSelector((state) => state.approval);
  const { user } = useAppSelector((state) => state.auth);

const [activeTab, setActiveTab] = useState<ProjectTab>("active");
  const [viewType, setViewType] = useState<ViewType>("card");

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectModalMode, setProjectModalMode] = useState<"create" | "edit">("create");
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const [approvalDetailOpen, setApprovalDetailOpen] = useState(false);
  const [approvalSubmitOpen, setApprovalSubmitOpen] = useState(false);
  const [selectedProjectForApproval, setSelectedProjectForApproval] = useState<any>(null);

  const [versioningModalOpen, setVersioningModalOpen] = useState(false);
  const [selectedProjectForVersioning, setSelectedProjectForVersioning] = useState<any>(null);

  const [teamManagementModalOpen, setTeamManagementModalOpen] = useState(false);
  const [selectedProjectForTeam, setSelectedProjectForTeam] = useState<any>(null);

   const [approvalProjects, setApprovalProjects] = useState<any[]>([]);

  useEffect(() => {
    dispatch(getProjects());
    (dispatch(getPendingProjectsForApproval() as any) as Promise<any>)
      .then((res: any) => setApprovalProjects(res || []))
      .catch(() => setApprovalProjects([]));
  }, [dispatch]);

  const refreshApprovals = () => {
    (dispatch(getPendingProjectsForApproval() as any) as Promise<any>)
      .then((res: any) => setApprovalProjects(res || []))
      .catch(() => setApprovalProjects([]));
  };

 const counts = useMemo(() => {
    const list = projects || [];
    return {
      all: list.filter((p: any) => p.status !== "DRAFT" && p.status !== "ARCHIVED").length,
      active: list.filter((p: any) => p.status === "ACTIVE").length,
      pending: list.filter((p: any) => !p.status || p.status === "DRAFT" || p.status === "NEEDS_REVISION").length,
      draft: list.filter((p: any) => p.status === "DRAFT").length,
      "for-review": list.filter((p: any) => p.status === "FOR_REVIEW").length,
      "for-approval": list.filter((p: any) => p.status === "FOR_APPROVAL").length,
      archived: list.filter((p: any) => p.status === "ARCHIVED").length,
    };
  }, [projects]);

   const actions: ProjectCardActions = {
    onEdit: (project) => {
      setProjectModalMode("edit");
      setSelectedProject(project);
      setProjectModalOpen(true);
    },
    onDelete: (projectId) => dispatch(deleteProject(projectId)),
    onSetup: (projectId) => router.push(`/projects/${projectId}/setup`),
    onViewApproval: (project) => router.push(`/approvals/${project.id}`),
    onSubmitForApproval: (project) => {
      setSelectedProjectForApproval(project);
      setApprovalSubmitOpen(true);
    },
    onTeamManage: (project) => {
      setSelectedProjectForTeam(project);
      setTeamManagementModalOpen(true);
    },
    onVersion: (project) => {
      setSelectedProjectForVersioning(project);
      setVersioningModalOpen(true);
    },
    onSprint: (projectId) => router.push(`/sprintManagement?projectId=${projectId}`),
    onCreateProject: () => {
      setProjectModalMode("create");
      setSelectedProject(null);
      setProjectModalOpen(true);
    },
  };

  const allProjects = projects || [];

  const tabDef: { value: ProjectTab; label: string }[] = [
    { value: "active", label: "Active" },
    { value: "pending", label: "Pending" },
    { value: "draft", label: "Draft" },
    { value: "for-review", label: "For Review" },
    { value: "for-approval", label: "For Approval" },
    { value: "archived", label: "Archived" },
  ];

  const tabContent: Record<ProjectTab, React.JSX.Element> = {
    active: <ActiveProjectsTab projects={allProjects} actions={actions} viewType={viewType} />,
    pending: <PendingProjectsTab projects={allProjects} actions={actions} viewType={viewType} />,
    draft: <DraftProjectsTab projects={allProjects} actions={actions} viewType={viewType} />,
    "for-review": (
      <ForReviewTab projects={allProjects} actions={actions} viewType={viewType} approvalProjects={approvalProjects} />
    ),
    "for-approval": (
      <ForApprovalTab projects={allProjects} actions={actions} viewType={viewType} approvalProjects={approvalProjects} />
    ),
    archived: <ArchivedProjectsTab projects={allProjects} actions={actions} viewType={viewType} />,
  };

   return (
    <Layout>
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
              Projects
            </Typography>
            <Typography sx={{ color: "#6b7280", fontSize: 14 }}>
              {counts.all} project{counts.all !== 1 ? "s" : ""} total
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <ToggleButtonGroup
              value={viewType}
              exclusive
              onChange={(_, v) => v && setViewType(v)}
              size="small"
              sx={{ "& .MuiToggleButton-root": { border: "1px solid #e5e7eb" } }}
            >
              <Tooltip title="Card view">
                <ToggleButton value="card"><GridViewIcon fontSize="small" /></ToggleButton>
              </Tooltip>
              <Tooltip title="List view">
                <ToggleButton value="list"><ViewListIcon fontSize="small" /></ToggleButton>
              </Tooltip>
            </ToggleButtonGroup>

            <Guard module="PROJECTS" action="CREATE">
              <Button
                variant="contained"
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  backgroundColor: "#4B2E83",
                  "&:hover": { backgroundColor: "#3d2363" },
                }}
                onClick={actions.onCreateProject}
              >
                + New Project
              </Button>
            </Guard>
          </Stack>
        </Stack>

        <Box sx={{ borderBottom: "1px solid #e5e7eb", mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v as ProjectTab)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              "& .MuiTab-root": { textTransform: "none", fontSize: 13, fontWeight: 500, minHeight: 44 },
              "& .Mui-selected": { color: "#4B2E83", fontWeight: 700 },
              "& .MuiTabs-indicator": { backgroundColor: "#4B2E83" },
            }}
          >
            {tabDef.map(({ value, label }) => {
              const count = counts[value];
              const needsAttention =
                (value === "for-review" || value === "for-approval") &&
                approvalProjects.some((p: any) =>
                  value === "for-review" ? p.status === "FOR_REVIEW" : p.status === "FOR_APPROVAL"
                );
              return (
                <Tab
                  key={value}
                  value={value}
                  label={
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <span>{label}</span>
                      {count > 0 && (
                        <Box
                          sx={{
                            fontSize: 10,
                            fontWeight: 700,
                            minWidth: 18,
                            height: 18,
                            borderRadius: 9,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            px: 0.75,
                            backgroundColor: needsAttention ? "#ef4444" : "#e5e7eb",
                            color: needsAttention ? "#fff" : "#374151",
                          }}
                        >
                          {count}
                        </Box>
                      )}
                    </Stack>
                  }
                />
              );
            })}
          </Tabs>
        </Box>

        {tabContent[activeTab]}

        {/* â”€â”€â”€ MODALS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <ProjectModal
          open={projectModalOpen}
          onClose={() => setProjectModalOpen(false)}
          mode={projectModalMode}
          project={selectedProject}
        />

        <VersioningActionModal
          open={versioningModalOpen}
          onClose={() => {
            setVersioningModalOpen(false);
            setSelectedProjectForVersioning(null);
          }}
          projectId={selectedProjectForVersioning?.id}
          projectName={selectedProjectForVersioning?.name}
          activeVersion={{
            versionLabel: "v1",
            expectedEndDate: selectedProjectForVersioning?.expectedEndDate,
            totalBudget: selectedProjectForVersioning?.totalBudget,
          }}
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
              refreshApprovals();
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
              refreshApprovals();
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
              refreshApprovals();
            } catch (err) {
              console.error("Failed to submit project for approval:", err);
            }
          }}
        />
      </Box>
    </Layout>
  );
}


