"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  IconButton,
  Stack,
  ButtonGroup,
} from "@mui/material";
import { useRouter, useParams } from "next/navigation";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BlockIcon from "@mui/icons-material/Block";
import ViewWeekIcon from "@mui/icons-material/ViewWeek";
import ViewAgendaIcon from "@mui/icons-material/ViewAgenda";
import axios from "@/app/lib/axios";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import {
  getApprovalAuditTrail,
  approveProject,
  rejectProject,
} from "@/app/redux/controllers/approvalController";
import ApprovalFlowUI from "@/app/components/shared/modals/ApprovalModals/ApprovalFlowUI";
import ApprovalAuditTrail from "@/app/components/shared/modals/ApprovalModals/ApprovalAuditTrail";
import ApprovalRejectDialog from "@/app/components/shared/modals/ApprovalModals/ApprovalRejectDialog";
import GanttGridView from "@/app/(pages)/sprintManagement/Components/GridTableView";
import ProjectSetupWizard from "@/app/components/ProjectSetupWizard";
import StructuredViewComponent from "./components/StructuredView";

type ViewMode = "structured" | "gantt";

export default function ApprovalReviewPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const dispatch = useAppDispatch();
  const { auditTrail } = useAppSelector((state) => state.approval);

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("structured");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjectForApproval = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(
          `/projects/${projectId}/view-for-approval`,
        );
        setProject(response.data.data);
      } catch (err: any) {
        setError(
          err.response?.data?.message || "Failed to load project details",
        );
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProjectForApproval();
      dispatch(getApprovalAuditTrail(projectId) as any);
    }
  }, [projectId, dispatch]);

  const handleApprove = async () => {
    try {
      setSubmitting(true);
      await dispatch(approveProject(projectId) as any);
      router.push("/projects?tab=pending-approvals");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to approve project");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectConfirm = async (remarks: string) => {
    try {
      setSubmitting(true);
      await dispatch(rejectProject(projectId, remarks) as any);
      setRejectDialogOpen(false);
      router.push("/projects?tab=pending-approvals");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reject project");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#f4f6f8",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !project) {
    return (
      <Box sx={{ p: 4, background: "#f4f6f8", minHeight: "100vh" }}>
        <Alert severity="error">{error || "Project not found"}</Alert>
        <Button variant="outlined" onClick={() => router.back()} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Box>
    );
  }

  const auditLogs = auditTrail[projectId] || [];

  return (
    <Box
      sx={{
        background: "#f4f6f8",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #4B2E83 0%, #6d40a0 100%)",
          color: "white",
          p: { xs: 1, sm: 1.5 },
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: "16px", sm: "20px" } }}>
            {project.name}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            label={project.status}
            size="small"
            sx={{
              backgroundColor:
                project.status === "FOR_APPROVAL" ? "#fbbf24" : "#93c5fd",
              color: project.status === "FOR_APPROVAL" ? "#78350f" : "#000",
              fontWeight: 700,
              fontSize: { xs: "11px", sm: "12px" },
            }}
          />
          <IconButton onClick={() => router.back()} sx={{ color: "white" }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* MAIN CONTENT */}
      <Box sx={{ display: "flex", flex: 1, gap: 2, p: { xs: 1, sm: 2 }, flexDirection: { xs: "column", md: "row" } }}>
        {/* LEFT PANEL */}
        <Box
          sx={{
            width: { xs: "100%", md: "25%" },
            display: "flex",
            flexDirection: "column",
            gap: 2,
            overflowY: "auto",
            maxHeight: { xs: "auto", md: "calc(100vh - 100px)" },
          }}
        >
          <Card sx={{ p: { xs: 1.5, sm: 2.5 }, border: "1px solid #e5e7eb" }}>
            <Typography
              sx={{ fontSize: { xs: 12, sm: 13 }, fontWeight: 700, color: "#1f2937", mb: 2 }}
            >
              📊 Approval Progress
            </Typography>
            <ApprovalFlowUI
              projectId={projectId}
              projectStatus={project.status}
            />
          </Card>
          <Card
            sx={{
              p: { xs: 1.5, sm: 2.5 },
              border: "1px solid #e5e7eb",
              flex: 1,
              overflowY: "auto",
              height: { xs: "auto", md: "calc(100% - 200px)" },
            }}
          >
            <ApprovalAuditTrail
              auditLogs={auditLogs}
              empty={auditLogs.length === 0}
            />
          </Card>
        </Box>

        {/* RIGHT PANEL */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          {/* PROJECT SUMMARY - IN UPPER PART */}
          <Card sx={{ p: { xs: 1.5, sm: 2.5 }, border: "1px solid #e5e7eb" }}>
            <Box
              sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 2 }}
            >
              <Box>
                <Typography
                  sx={{
                    fontSize: { xs: 10, sm: 11 },
                    color: "#6b7280",
                    fontWeight: 600,
                    mb: 0.5,
                  }}
                >
                  Owner
                </Typography>
                <Typography
                  sx={{ fontSize: { xs: 12, sm: 14 }, fontWeight: 700, color: "#1f2937" }}
                >
                  {project.owner?.name}
                </Typography>
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontSize: { xs: 10, sm: 11 },
                    color: "#6b7280",
                    fontWeight: 600,
                    mb: 0.5,
                  }}
                >
                  Total Budget
                </Typography>
                <Typography
                  sx={{ fontSize: { xs: 12, sm: 14 }, fontWeight: 700, color: "#1f2937" }}
                >
                  ₱{project.totalBudget?.toLocaleString() || "N/A"}
                </Typography>
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontSize: { xs: 10, sm: 11 },
                    color: "#6b7280",
                    fontWeight: 600,
                    mb: 0.5,
                  }}
                >
                  Status
                </Typography>
                <Typography
                  sx={{ fontSize: { xs: 12, sm: 14 }, fontWeight: 700, color: "#1f2937" }}
                >
                  {project.status}
                </Typography>
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontSize: { xs: 10, sm: 11 },
                    color: "#6b7280",
                    fontWeight: 600,
                    mb: 0.5,
                  }}
                >
                  Start Date
                </Typography>
                <Typography
                  sx={{ fontSize: { xs: 12, sm: 14 }, fontWeight: 700, color: "#1f2937" }}
                >
                  {project.startDate ? new Date(project.startDate).toLocaleDateString() : "N/A"}
                </Typography>
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontSize: { xs: 10, sm: 11 },
                    color: "#6b7280",
                    fontWeight: 600,
                    mb: 0.5,
                  }}
                >
                  Expected End Date
                </Typography>
                <Typography
                  sx={{ fontSize: { xs: 12, sm: 14 }, fontWeight: 700, color: "#1f2937" }}
                >
                  {project.expectedEndDate ? new Date(project.expectedEndDate).toLocaleDateString() : "N/A"}
                </Typography>
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontSize: { xs: 10, sm: 11 },
                    color: "#6b7280",
                    fontWeight: 600,
                    mb: 0.5,
                  }}
                >
                  Scopes
                </Typography>
                <Typography
                  sx={{ fontSize: { xs: 12, sm: 14 }, fontWeight: 700, color: "#1f2937" }}
                >
                  {project.scopes?.length || 0}
                </Typography>
              </Box>
              {project.description && (
                <Box sx={{ gridColumn: { xs: "1 / -1", sm: "1 / -1" } }}>
                  <Divider sx={{ my: 1 }} />
                  <Typography
                    sx={{
                      fontSize: { xs: 10, sm: 11 },
                      color: "#6b7280",
                      fontWeight: 600,
                      mb: 1,
                    }}
                  >
                    Description
                  </Typography>
                  <Typography
                    sx={{ fontSize: { xs: 12, sm: 13 }, color: "#374151", lineHeight: 1.6 }}
                  >
                    {project.description}
                  </Typography>
                </Box>
              )}
            </Box>
          </Card>

          {/* VIEW TOGGLE */}
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
            <Typography
              sx={{ fontWeight: 600, fontSize: { xs: "12px", sm: "14px" }, color: "#7D8693" }}
            >
              View:
            </Typography>
            <ButtonGroup variant="outlined" size="small">
              <Button
                onClick={() => setViewMode("structured")}
                variant={viewMode === "structured" ? "contained" : "outlined"}
                startIcon={<ViewWeekIcon />}
                sx={{ fontSize: { xs: "11px", sm: "12px" } }}
              >
                Structured
              </Button>
              <Button
                onClick={() => setViewMode("gantt")}
                variant={viewMode === "gantt" ? "contained" : "outlined"}
                startIcon={<ViewAgendaIcon />}
                sx={{ fontSize: { xs: "11px", sm: "12px" } }}
              >
                Gantt
              </Button>
            </ButtonGroup>
          </Box>

          {/* CONTENT AREA - STRUCTURED OR GANTT VIEW */}
          <Card
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              border: "1px solid #e5e7eb",
              p: { xs: 1.5, sm: 2.5 },
              overflow: "auto",
              minHeight: { xs: "300px", sm: "400px" },
            }}
          >
            {viewMode === "structured" ? (
              <StructuredView project={project} />
            ) : (
              <Box sx={{ overflowX: "auto" }}>
                <GanttGridView projectId={projectId} project={project} />
              </Box>
            )}
          </Card>
        </Box>
      </Box>

      {/* FOOTER */}
      <Box
        sx={{
          background: "white",
          borderTop: "1px solid #e5e7eb",
          p: { xs: 1, sm: 2 },
          display: "flex",
          justifyContent: { xs: "space-between", sm: "flex-end" },
          gap: { xs: 1, sm: 2 },
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="outlined"
          onClick={() => router.back()}
          disabled={submitting}
          sx={{ fontSize: { xs: "12px", sm: "14px" } }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          startIcon={<BlockIcon />}
          onClick={() => setRejectDialogOpen(true)}
          disabled={submitting}
          sx={{ fontSize: { xs: "12px", sm: "14px" } }}
        >
          Reject
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<CheckCircleIcon />}
          onClick={handleApprove}
          disabled={submitting}
          sx={{ fontSize: { xs: "12px", sm: "14px" } }}
        >
          {submitting ? "Approving..." : "Approve"}
        </Button>
      </Box>

      <ApprovalRejectDialog
        open={rejectDialogOpen}
        projectName={project.name}
        onClose={() => setRejectDialogOpen(false)}
        onConfirm={handleRejectConfirm}
        isSubmitting={submitting}
      />
    </Box>
  );
}

function StructuredView({ project }: { project: any }) {
  return (
    <Stack spacing={3}>
      {/* STRUCTURED VIEW COMPONENT */}
      <StructuredViewComponent
        project={{
          id: project.id,
          name: project.name,
          scopes: project.scopes || [],
        }}
      />
    </Stack>
  );
}
