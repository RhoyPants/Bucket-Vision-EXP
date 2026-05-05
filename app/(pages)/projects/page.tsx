"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  Stack,
  Chip,
  Tooltip,
  Dialog,
  Tabs,
  Tab,
  Badge,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SettingsIcon from "@mui/icons-material/Settings";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AssignmentIcon from "@mui/icons-material/Assignment";

import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { useRouter } from "next/navigation";

import {
  getProjects,
  deleteProject,
} from "@/app/redux/controllers/projectController";

import ProjectModal from "@/app/components/shared/modals/ProjectModal";
import Layout from "@/app/components/shared/Layout";
import { ProjectApprovalStatusCard } from "@/app/components/shared/modals/ApprovalModals";
import { ApprovalDetailModal, ApprovalSubmitModal } from "@/app/components/shared/modals/ApprovalModals";
import { getPendingProjectsForApproval, getProjectApprovals, getApprovalAuditTrail, approveProject, rejectProject, submitProjectForApproval } from "@/app/redux/controllers/approvalController";

export default function ProjectsPage() {
  const dispatch = useAppDispatch();
  const { projects, loading } = useAppSelector((state) => state.project);
  const { allApprovals, auditTrail, pendingApprovals } = useAppSelector((state) => state.approval);
  const { user } = useAppSelector((state) => state.auth);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"my-projects" | "pending-approvals">("my-projects");
  
  // Approval modal states
  const [approvalDetailOpen, setApprovalDetailOpen] = useState(false);
  const [approvalSubmitOpen, setApprovalSubmitOpen] = useState(false);
  const [selectedProjectForApproval, setSelectedProjectForApproval] = useState<any>(null);

  const router = useRouter();

  const [approvalProjects, setApprovalProjects] = useState<any[]>([]);

  useEffect(() => {
    dispatch(getProjects());
    (dispatch(getPendingProjectsForApproval() as any) as Promise<any>)
      .then((pendingProjects: any) => {
        console.log("📥 [Projects Page] Pending projects result:", pendingProjects);
        setApprovalProjects(pendingProjects || []);
      })
      .catch((err: any) => {
        console.error("❌ [Projects Page] Failed to fetch pending projects:", err);
        setApprovalProjects([]);
      });
  }, [dispatch]);

  // Determine user role
  const userRole = typeof user?.role === "string" ? user.role : (user?.role as any)?.name || "PIC";

  // Get projects awaiting current user's approval
  const getProjectsPendingMyApproval = () => {
    // Use fetched approval projects which have full data + approval level info
    if (approvalProjects && approvalProjects.length > 0) {
      console.log("✅ Pending projects for approval:", approvalProjects.map((p: any) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        pendingApprovalLevel: p.pendingApprovalLevel,
      })));
      return approvalProjects;
    }
    
    // Fallback: If endpoint fails, try filtering by status
    if (userRole === "BU_HEAD") {
      const pending = projects?.filter((p: any) => p.status === "FOR_REVIEW") || [];
      return pending;
    } else if (userRole === "OP" || userRole === "DIRECTOR" || userRole === "ADMIN" || userRole === "SUPER_ADMIN") {
      const pending = projects?.filter((p: any) => p.status === "FOR_APPROVAL" || p.status === "FOR_REVIEW") || [];
      return pending;
    }
    return [];
  };

  const projectsPendingApproval = getProjectsPendingMyApproval();
  
  // Debug: Log current state
  useEffect(() => {
    console.log("📊 Current user role:", userRole);
    console.log("📊 Approval projects count:", approvalProjects?.length);
  }, [approvalProjects, userRole]);

  // Refresh pending approval projects and update local state
  const refreshPendingApprovals = () => {
    (dispatch(getPendingProjectsForApproval() as any) as Promise<any>)
      .then((pendingProjects: any) => {
        setApprovalProjects(pendingProjects || []);
      })
      .catch(() => setApprovalProjects([]));
  };

  // 🔥 SAFE LOCATION FORMATTER
  const formatLocation = (location: any) => {
    if (!location) return "No location";

    const {
      street,
      barangayName,
      cityName,
      provinceName,
    } = location;

    const parts = [
      street,
      barangayName,
      cityName,
      provinceName,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(", ") : "No location";
  };

  // Handle viewing approval details - navigate to approval page
  const handleViewApproval = (project: any) => {
    router.push(`/approvals/${project.id}`);
  };

  // Handle submit for approval
  const handleSubmitForApproval = (project: any) => {
    setSelectedProjectForApproval(project);
    setApprovalSubmitOpen(true);
  };

  return (
    <Layout>
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        {/* HEADER WITH VIEW TABS */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
              Projects
            </Typography>
            <Typography sx={{ color: "#6b7280", fontSize: 14 }}>
              Manage and approve your projects
            </Typography>
          </Box>

          <Button
            variant="contained"
            sx={{ 
              borderRadius: 2, 
              textTransform: "none",
              backgroundColor: "#4B2E83",
              "&:hover": { backgroundColor: "#3d2363" }
            }}
            onClick={() => {
              setMode("create");
              setSelectedProject(null);
              setOpen(true);
            }}
          >
            + New Project
          </Button>
        </Stack>

        {/* VIEW TABS */}
        <Box sx={{ borderBottom: "1px solid #e5e7eb", mb: 3 }}>
          <Tabs
            value={viewMode}
            onChange={(e, newValue) => setViewMode(newValue as "my-projects" | "pending-approvals")}
            sx={{
              "& .MuiTab-root": {
                textTransform: "none",
                fontSize: 14,
                fontWeight: 500,
              },
              "& .Mui-selected": {
                color: "#4B2E83",
                fontWeight: 600,
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "#4B2E83",
              },
            }}
          >
            <Tab label="📂 My Projects" value="my-projects" />
            <Tab
              label={
                <Badge badgeContent={projectsPendingApproval.length} color="error">
                  <span>⏳ Pending Approval</span>
                </Badge>
              }
              value="pending-approvals"
            />
          </Tabs>
        </Box>

        {/* MY PROJECTS VIEW */}
        {viewMode === "my-projects" && (
          <>
            <Grid container spacing={3}>
              {projects && projects.length > 0 ? (
                projects.map((project: any) => (
              <Grid
                size={{ xs: 12, sm: 6, lg: 4 }}
                key={project.id}
              >
                <Card
                  sx={{
                    borderRadius: 2,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    transition: "all 0.25s ease",
                    border: project.status === "FOR_APPROVAL" || project.status === "FOR_REVIEW" ? "2px solid #ff9800" : "1px solid #e5e7eb",
                    backgroundColor: project.status === "FOR_APPROVAL" || project.status === "FOR_REVIEW" ? "#fffbf0" : "#fff",
                    "&:hover": {
                      boxShadow: "0 8px 16px rgba(75, 46, 131, 0.12)",
                      borderColor: "#4B2E83",
                    },
                  }}
                >
                  {/* PROJECT HEADER */}
                  <CardContent sx={{ pb: 0 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="start" gap={2} mb={2}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                          {project.name}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            minHeight: 40,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {project.description || "No description"}
                        </Typography>
                      </Box>

                      {project.priority && (
                        <Chip
                          size="small"
                          label={project.priority}
                          sx={{
                            bgcolor:
                              project.priority === "High"
                                ? "#ef4444"
                                : project.priority === "Medium"
                                ? "#f59e0b"
                                : "#22c55e",
                            color: "#fff",
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </Box>

                    {/* PROJECT DETAILS */}
                    <Stack spacing={1} sx={{ mb: 2, fontSize: 12, color: "#6b7280" }}>
                      <Typography variant="caption" display="block">
                        📍 {formatLocation(project.location)}
                      </Typography>
                      <Typography variant="caption" display="block">
                        📅 {project.startDate?.slice(0, 10) || "Not set"} → {project.expectedEndDate?.slice(0, 10) || "Not set"}
                      </Typography>
                      <Typography variant="caption" display="block">
                        🏢 {project.businessUnit || "No BU"}
                      </Typography>
                    </Stack>
                  </CardContent>

                  {/* APPROVAL STATUS CARD */}
                  <Box sx={{ px: 2, py: 1.5 }}>
                    <ProjectApprovalStatusCard
                      project={project}
                      onViewApproval={() => handleViewApproval(project)}
                      onResubmit={() => handleSubmitForApproval(project)}
                      compact={false}
                    />
                  </Box>

                  {/* ACTIONS */}
                  <Box sx={{ px: 2, py: 2, borderTop: "1px solid #e5e7eb", mt: "auto" }}>
                    <Stack direction="row" spacing={1}>
                      {/* SETUP BUTTON - Only show for DRAFT/PENDING projects */}
                      {(!project.status || 
                        project.status === "DRAFT" || 
                        project.status === "FOR_REVIEW" || 
                        project.status === "NEEDS_REVISION") && (
                        <Tooltip title="Configure team, scopes, and tasks">
                          <Button
                            size="small"
                            fullWidth
                            variant="outlined"
                            startIcon={<SettingsIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/projects/${project.id}/setup`);
                            }}
                            sx={{ 
                              textTransform: "none",
                              borderColor: "#f59e0b",
                              color: "#f59e0b",
                              "&:hover": {
                                borderColor: "#d97706",
                                backgroundColor: "#fef3c7"
                              }
                            }}
                          >
                            ⚙️ Setup
                          </Button>
                        </Tooltip>
                      )}

                      <Tooltip title="Edit Project">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMode("edit");
                            setSelectedProject(project);
                            setOpen(true);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Sprint Management">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/sprintManagement?projectId=${project.id}`);
                          }}
                        >
                          <AssignmentIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch(deleteProject(project.id));
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid size={{ xs: 12 }}>
              <Card sx={{ textAlign: "center", p: 4, border: "2px dashed #e5e7eb" }}>
                <AssignmentIcon sx={{ fontSize: 48, color: "#d1d5db", mb: 2 }} />
                <Typography sx={{ fontWeight: 600, color: "#6b7280", mb: 1 }}>
                  No projects yet
                </Typography>
                <Typography sx={{ color: "#9ca3af", mb: 3, fontSize: 14 }}>
                  Create your first project to get started
                </Typography>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "#4B2E83",
                    "&:hover": { backgroundColor: "#3d2363" },
                  }}
                  onClick={() => {
                    setMode("create");
                    setSelectedProject(null);
                    setOpen(true);
                  }}
                >
                  Create Project
                </Button>
              </Card>
            </Grid>
          )}
            </Grid>
          </>
        )}

        {/* PENDING APPROVALS VIEW */}
        {viewMode === "pending-approvals" && (
          <>
            <Grid container spacing={3}>
              {projectsPendingApproval && projectsPendingApproval.length > 0 ? (
                projectsPendingApproval.map((project: any) => (
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={project.id}>
                    <Card
                      sx={{
                        borderRadius: 2,
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        boxShadow: "0 4px 12px rgba(255, 152, 0, 0.15)",
                        transition: "all 0.25s ease",
                        border: "2px solid #ff9800",
                        backgroundColor: "#fffbf0",
                        "&:hover": {
                          boxShadow: "0 8px 24px rgba(255, 152, 0, 0.25)",
                          borderColor: "#f57c00",
                        },
                      }}
                    >
                      {/* STATUS BADGE */}
                      <Box sx={{ p: 2, pb: 0 }}>
                        <Stack spacing={1}>
                          <Chip
                            label={project.status === "FOR_REVIEW" ? "⏳ Awaiting Your Review" : "🔴 Awaiting Your Approval"}
                            color="warning"
                            sx={{ width: "100%", fontWeight: 600 }}
                          />
                          {project.pendingApprovalLevel && (
                            <Chip
                              label={`Level: ${project.pendingApprovalLevel}`}
                              size="small"
                              variant="outlined"
                              sx={{ width: "100%", fontWeight: 500 }}
                            />
                          )}
                        </Stack>
                      </Box>

                      {/* PROJECT HEADER */}
                      <CardContent sx={{ pb: 0 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="start" gap={2} mb={2}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                              {project.name}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ 
                                minHeight: 40,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {project.description || "No description"}
                            </Typography>
                          </Box>

                          {project.priority && (
                            <Chip
                              size="small"
                              label={project.priority}
                              sx={{
                                bgcolor:
                                  project.priority === "High"
                                    ? "#ef4444"
                                    : project.priority === "Medium"
                                    ? "#f59e0b"
                                    : "#22c55e",
                                color: "#fff",
                                fontWeight: 600,
                                flexShrink: 0,
                              }}
                            />
                          )}
                        </Box>

                        {/* PROJECT DETAILS */}
                        <Stack spacing={1} sx={{ mb: 2, fontSize: 12, color: "#6b7280" }}>
                          <Typography variant="caption" display="block">
                            📍 {formatLocation(project.location)}
                          </Typography>
                          <Typography variant="caption" display="block">
                            📅 {project.startDate?.slice(0, 10) || "Not set"} → {project.expectedEndDate?.slice(0, 10) || "Not set"}
                          </Typography>
                          <Typography variant="caption" display="block">
                            🏢 {project.businessUnit || "No BU"}
                          </Typography>
                          {project.submittedBy && (
                            <Typography variant="caption" display="block">
                              📝 Submitted by: <strong>{project.submittedBy}</strong>
                            </Typography>
                          )}
                        </Stack>
                      </CardContent>

                      {/* APPROVAL STATUS */}
                      <Box sx={{ px: 2, py: 1.5 }}>
                        <ProjectApprovalStatusCard
                          project={project}
                          onViewApproval={() => handleViewApproval(project)}
                          onResubmit={() => handleSubmitForApproval(project)}
                          compact={false}
                        />
                      </Box>

                      {/* ACTIONS */}
                      <Box sx={{ px: 2, py: 2, borderTop: "1px solid #ffe0b2", mt: "auto" }}>
                        <Button
                          fullWidth
                          variant="contained"
                          sx={{
                            backgroundColor: "#ff9800",
                            textTransform: "none",
                            fontWeight: 600,
                            "&:hover": {
                              backgroundColor: "#f57c00",
                            },
                          }}
                          onClick={() => handleViewApproval(project)}
                        >
                          👁️ Review & Decide
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Grid size={{ xs: 12 }}>
                  <Card sx={{ textAlign: "center", p: 4, border: "2px dashed #e5e7eb" }}>
                    <Typography sx={{ fontWeight: 600, color: "#6b7280", mb: 1 }}>
                      ✅ All clear!
                    </Typography>
                    <Typography sx={{ color: "#9ca3af", fontSize: 14 }}>
                      No projects pending your approval at the moment
                    </Typography>
                  </Card>
                </Grid>
              )}
            </Grid>
          </>
        )}

        {/* MODALS */}
        <ProjectModal
          open={open}
          onClose={() => setOpen(false)}
          mode={mode}
          project={selectedProject}
        />

        {/* APPROVAL DETAIL MODAL */}
        <ApprovalDetailModal
          open={approvalDetailOpen}
          onClose={() => setApprovalDetailOpen(false)}
          project={selectedProjectForApproval}
          approval={
            allApprovals[selectedProjectForApproval?.id]?.find(
              (a) => a.approverId === user?.id && a.status === "PENDING"
            ) ||
            allApprovals[selectedProjectForApproval?.id]?.find(
              (a) => a.status === "PENDING"
            ) ||
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
              refreshPendingApprovals();
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
              refreshPendingApprovals();
            } catch (err) {
              console.error("Failed to reject project:", err);
            }
          }}
        />

        {/* APPROVAL SUBMIT MODAL */}
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
              refreshPendingApprovals();
            } catch (err) {
              console.error("Failed to submit project for approval:", err);
            }
          }}
        />
      </Box>
    </Layout>
  );
}