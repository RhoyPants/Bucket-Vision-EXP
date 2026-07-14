"use client";

import { Suspense, useEffect, useState } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BlockIcon from "@mui/icons-material/Block";
import ViewWeekIcon from "@mui/icons-material/ViewWeek";
import ViewAgendaIcon from "@mui/icons-material/ViewAgenda";
import DownloadIcon from "@mui/icons-material/Download";
import LayersIcon from "@mui/icons-material/Layers";
import HistoryIcon from "@mui/icons-material/History";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import axios from "@/app/lib/axios";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import {
  getApprovalAuditTrail,
  approveProject,
  rejectProject,
} from "@/app/redux/controllers/approvalController";
import type { ApprovalAuditLog } from "@/app/redux/slices/approvalSlice";
import ApprovalFlowUI from "@/app/components/shared/modals/ApprovalModals/ApprovalFlowUI";
import ApprovalAuditTrail from "@/app/components/shared/modals/ApprovalModals/ApprovalAuditTrail";
import ApprovalRejectDialog from "@/app/components/shared/modals/ApprovalModals/ApprovalRejectDialog";
import GanttGridView from "@/app/(pages)/sprintManagement/Components/GridTableView";
import StructuredViewComponent from "./components/StructuredView";
import {
  ApiAttachment,
  getAttachmentFileName,
  getAttachmentFileUrl,
} from "@/app/api-service/attachmentService";
import type { Scope } from "./components/types";

type ViewMode = "structured" | "gantt";

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

type ProjectVersionSource = {
  version?: string | number;
  versionNumber?: string | number;
  versionLabel?: string;
  versionName?: string;
  versionNo?: string | number;
};

type ApprovalTask = Record<string, unknown> & {
  subtasks?: unknown[];
};

type ApprovalScope = Record<string, unknown> & {
  tasks?: ApprovalTask[];
};

type ApprovalProject = Record<string, unknown> & {
  id: string;
  name: string;
  status?: string;
  owner?: {
    name?: string;
  };
  pin?: string;
  totalBudget?: number;
  priority?: string;
  businessUnit?: string;
  entity?: string;
  startDate?: string;
  expectedEndDate?: string;
  monday?: boolean;
  tuesday?: boolean;
  wednesday?: boolean;
  thursday?: boolean;
  friday?: boolean;
  saturday?: boolean;
  sunday?: boolean;
  includeGlobalHolidays?: boolean;
  includeHolidays?: boolean;
  location?: {
    regionName?: string;
  };
  description?: string;
  attachments?: ApiAttachment[];
  scopes?: ApprovalScope[];
  version?: string | number;
  versionNumber?: string | number;
  versionLabel?: string;
  versionName?: string;
  versionNo?: string | number;
  currentVersion?: ProjectVersionSource | null;
  activeVersion?: ProjectVersionSource | null;
  selectedVersion?: ProjectVersionSource | null;
};

const getErrorMessage = (err: unknown, fallback: string) => {
  const apiError = err as ApiError;
  return apiError.response?.data?.message || fallback;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const getCreatorName = (log: ApprovalAuditLog | null) => {
  if (!log) return "N/A";
  const item = log as unknown as Record<string, unknown>;
  const raw =
    item.createdByName ||
    item.creatorName ||
    item.requestedByName ||
    item.createdBy ||
    item.creator ||
    null;
  return raw ? String(raw) : "N/A";
};

const getApprovalVersionLabel = (project: ApprovalProject): string => {
  const raw =
    project?.versionLabel ||
    project?.versionName ||
    project?.versionNumber ||
    project?.versionNo ||
    project?.version ||
    project?.currentVersion?.versionLabel ||
    project?.currentVersion?.versionName ||
    project?.currentVersion?.versionNumber ||
    project?.currentVersion?.versionNo ||
    project?.currentVersion?.version ||
    project?.activeVersion?.versionLabel ||
    project?.activeVersion?.versionName ||
    project?.activeVersion?.versionNumber ||
    project?.activeVersion?.versionNo ||
    project?.activeVersion?.version ||
    project?.selectedVersion?.versionLabel ||
    project?.selectedVersion?.versionName ||
    project?.selectedVersion?.versionNumber ||
    project?.selectedVersion?.versionNo ||
    project?.selectedVersion?.version;

  if (raw === undefined || raw === null || raw === "") return "Version not set";

  const label = String(raw).trim();
  const normalized = label.toLowerCase();
  if (normalized.startsWith("v") || normalized.includes("version")) return label;
  return `Version ${label}`;
};

function ApprovalReviewPageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
  const dispatch = useAppDispatch();
  const { auditTrail } = useAppSelector((state) => state.approval);
  const isReadOnlyFromMyRequests = searchParams.get("source") === "my-requests";

  const [project, setProject] = useState<ApprovalProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("structured");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successAction, setSuccessAction] = useState<"approved" | "rejected" | null>(null);
  const [selectedAuditLog, setSelectedAuditLog] = useState<ApprovalAuditLog | null>(null);
  const [auditDetailOpen, setAuditDetailOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectAttachments, setProjectAttachments] = useState<ApiAttachment[]>([]);

  useEffect(() => {
    const fetchProjectForApproval = async () => {
      try {
        setLoading(true);
        setError(null);
        const [projectResponse, attachmentResponse] = await Promise.all([
          axios.get(`/projects/${projectId}/view-for-approval`),
          axios.get(`/projects/${projectId}/attachments`).catch(() => null),
        ]);

        const projectData = projectResponse.data?.data as ApprovalProject;
        setProject(projectData);

        const dedicatedAttachments = attachmentResponse?.data?.data;
        if (Array.isArray(dedicatedAttachments)) {
          setProjectAttachments(dedicatedAttachments);
        } else {
          setProjectAttachments(
            Array.isArray(projectData?.attachments)
              ? projectData.attachments
              : [],
          );
        }
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to load project details"));
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProjectForApproval();
      dispatch(getApprovalAuditTrail(projectId));
    }
  }, [projectId, dispatch]);

  const handleApprove = async () => {
    try {
      setSubmitting(true);
      await dispatch(approveProject(projectId));
      setSuccessAction("approved");
      setSuccessDialogOpen(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to approve project"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveConfirm = async () => {
    setApproveDialogOpen(false);
    await handleApprove();
  };

  const handleRejectConfirm = async (remarks: string) => {
    try {
      setSubmitting(true);
      await dispatch(rejectProject(projectId, remarks));
      setRejectDialogOpen(false);
      setSuccessAction("rejected");
      setSuccessDialogOpen(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to reject project"));
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
  const workingDays = [
    project?.monday && "Mon",
    project?.tuesday && "Tue",
    project?.wednesday && "Wed",
    project?.thursday && "Thu",
    project?.friday && "Fri",
    project?.saturday && "Sat",
    project?.sunday && "Sun",
  ]
    .filter(Boolean)
    .join(", ");
  const versionLabel = getApprovalVersionLabel(project);

  return (
    <Box
      sx={{
        background: "#f4f6f8",
        minHeight: "100vh",
        height: { xs: "auto", md: "100vh" },
        display: "flex",
        flexDirection: "column",
        overflow: { xs: "visible", md: "hidden" },
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
        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              fontSize: { xs: "16px", sm: "20px" },
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {project.name}
          </Typography>
          <Chip
            icon={<LayersIcon sx={{ fontSize: 14 }} />}
            label={versionLabel}
            size="small"
            sx={{
              flexShrink: 0,
              height: 24,
              backgroundColor: "rgba(255, 255, 255, 0.18)",
              color: "#FFFFFF",
              border: "1px solid rgba(255, 255, 255, 0.35)",
              fontWeight: 800,
              fontSize: { xs: "10px", sm: "11px" },
              "& .MuiChip-icon": { color: "#FFFFFF" },
            }}
          />
        </Stack>
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
      <Box
        sx={{
          display: "flex",
          flex: 1,
          minHeight: 0,
          gap: { xs: 1, md: 1 },
          p: { xs: 0.75, sm: 1 },
          flexDirection: { xs: "column", md: "row" },
          overflow: { xs: "visible", md: "hidden" },
        }}
      >
        {/* LEFT PANEL */}
        <Box
          sx={{
            width: { xs: "100%", md: "25%" },
            display: "flex",
            flexDirection: "column",
            gap: 0,
            minHeight: 0,
            overflow: { xs: "visible", md: "hidden" },
            maxHeight: { xs: "none", md: "100%" },
          }}
        >
          <Card
            sx={{
              border: "1px solid #e5e7eb",
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              borderRadius: 1,
              boxShadow: "none",
            }}
          >
            <Box
              sx={{
                px: 1.5,
                py: 1.25,
                bgcolor: "#d9d9d9",
                borderBottom: "1px solid #cbd5e1",
              }}
            >
              <Typography sx={{ fontSize: 14, fontWeight: 800, color: "#1f2937" }}>
                Request History
              </Typography>
            </Box>
            <ApprovalAuditTrail
              auditLogs={auditLogs}
              empty={auditLogs.length === 0}
              variant="simple"
              onLogClick={(log) => {
                setSelectedAuditLog(log);
                setAuditDetailOpen(true);
              }}
            />

            <Box sx={{ height: { xs: 32, md: 180 } }} />

            <Box
              sx={{
                px: 1.5,
                py: 1.25,
                bgcolor: "#d9d9d9",
                borderTop: "1px solid #cbd5e1",
                borderBottom: "1px solid #cbd5e1",
              }}
            >
              <Typography sx={{ fontSize: 14, fontWeight: 800, color: "#1f2937" }}>
                Request Approvals
              </Typography>
            </Box>
            <ApprovalFlowUI
              projectId={projectId}
              projectStatus={project.status}
              variant="simple"
            />
          </Card>
        </Box>

        {/* RIGHT PANEL */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <Card
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: { xs: "visible", md: "auto" },
              border: "1px solid #e5e7eb",
              borderRadius: 1,
              boxShadow: "none",
              bgcolor: "#ffffff",
            }}
          >
          {/* PROJECT SUMMARY - IN UPPER PART */}
          <Box
            sx={{
              p: { xs: 1.25, sm: 1.5 },
              borderBottom: "1px solid #e5e7eb",
              "& > .project-info-grid > .MuiBox-root > .MuiTypography-root:first-of-type": {
                fontSize: "10px",
                color: "#64748b",
                fontWeight: 700,
                mb: 0.35,
              },
              "& > .project-info-grid > .MuiBox-root > .MuiTypography-root:not(:first-of-type)": {
                fontSize: "12px",
                lineHeight: 1.35,
                fontWeight: 600,
                color: "#1f2937",
              },
            }}
          >
            <Typography sx={{ fontSize: 14, fontWeight: 800, color: "#111827", mb: 1.15 }}>
              Project Information
            </Typography>
            <Box
              className="project-info-grid"
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
                columnGap: 2,
                rowGap: 1,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontSize: { xs: 10, sm: 11 },
                    color: "#6b7280",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Owner
                </Typography>
                <Typography
                  sx={{
                    fontSize: { xs: 12, sm: 14 },
                    fontWeight: 500,
                    color: "#374151",
                  }}
                >
                  {project.owner?.name}
                </Typography>
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontSize: { xs: 10, sm: 11 },
                    color: "#6b7280",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Project Code (PIN)
                </Typography>
                <Typography
                  sx={{
                    fontSize: { xs: 12, sm: 14 },
                    fontWeight: 500,
                    color: "#374151",
                  }}
                >
                  {project.pin || "N/A"}
                </Typography>
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontSize: { xs: 10, sm: 11 },
                    color: "#6b7280",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Version
                </Typography>
                <Chip
                  size="small"
                  icon={<LayersIcon sx={{ fontSize: 14 }} />}
                  label={versionLabel}
                  sx={{
                    height: 24,
                    maxWidth: "100%",
                    fontSize: { xs: 10, sm: 11 },
                    fontWeight: 800,
                    bgcolor: "#F8FAFC",
                    color: "#334155",
                    border: "1px solid #CBD5E1",
                    "& .MuiChip-label": {
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    },
                  }}
                />
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontSize: { xs: 10, sm: 11 },
                    color: "#6b7280",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Total Budget
                </Typography>
                <Typography
                  sx={{
                    fontSize: { xs: 12, sm: 14 },
                    fontWeight: 500,
                    color: "#374151",
                  }}
                >
                  ₱{project.totalBudget?.toLocaleString() || "N/A"}
                </Typography>
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontSize: { xs: 10, sm: 11 },
                    color: "#6b7280",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Status
                </Typography>
                <Typography
                  sx={{
                    fontSize: { xs: 12, sm: 14 },
                    fontWeight: 500,
                    color: "#374151",
                  }}
                >
                  {project.status}
                </Typography>
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontSize: { xs: 10, sm: 11 },
                    color: "#6b7280",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Priority
                </Typography>
                <Typography
                  sx={{
                    fontSize: { xs: 12, sm: 14 },
                    fontWeight: 500,
                    color: "#374151",
                  }}
                >
                  {project.priority || "N/A"}
                </Typography>
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontSize: { xs: 10, sm: 11 },
                    color: "#6b7280",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Business Unit
                </Typography>
                <Typography
                  sx={{
                    fontSize: { xs: 12, sm: 14 },
                    fontWeight: 500,
                    color: "#374151",
                  }}
                >
                  {project.businessUnit || "N/A"}
                </Typography>
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontSize: { xs: 10, sm: 11 },
                    color: "#6b7280",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Entity
                </Typography>
                <Typography
                  sx={{
                    fontSize: { xs: 12, sm: 14 },
                    fontWeight: 500,
                    color: "#374151",
                  }}
                >
                  {project.entity || "N/A"}
                </Typography>
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontSize: { xs: 10, sm: 11 },
                    color: "#6b7280",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Start Date
                </Typography>
                <Typography
                  sx={{
                    fontSize: { xs: 12, sm: 14 },
                    fontWeight: 500,
                    color: "#374151",
                  }}
                >
                  {project.startDate
                    ? new Date(project.startDate).toLocaleDateString()
                    : "N/A"}
                </Typography>
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontSize: { xs: 10, sm: 11 },
                    color: "#6b7280",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Expected End Date
                </Typography>
                <Typography
                  sx={{
                    fontSize: { xs: 12, sm: 14 },
                    fontWeight: 500,
                    color: "#374151",
                  }}
                >
                  {project.expectedEndDate
                    ? new Date(project.expectedEndDate).toLocaleDateString()
                    : "N/A"}
                </Typography>
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontSize: { xs: 10, sm: 11 },
                    color: "#6b7280",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Working Days
                </Typography>
                <Typography
                  sx={{
                    fontSize: { xs: 12, sm: 14 },
                    fontWeight: 500,
                    color: "#374151",
                  }}
                >
                  {workingDays || "N/A"}
                </Typography>
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontSize: { xs: 10, sm: 11 },
                    color: "#6b7280",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Include Holidays
                </Typography>
                <Typography
                  sx={{
                    fontSize: { xs: 12, sm: 14 },
                    fontWeight: 500,
                    color: "#374151",
                  }}
                >
                  {project.includeGlobalHolidays || project.includeHolidays
                    ? "Yes"
                    : "No"}
                </Typography>
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontSize: { xs: 10, sm: 11 },
                    color: "#6b7280",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Region
                </Typography>
                <Typography
                  sx={{
                    fontSize: { xs: 12, sm: 14 },
                    fontWeight: 500,
                    color: "#374151",
                  }}
                >
                  {project.location?.regionName || "N/A"}
                </Typography>
              </Box>
              {project.description && (
                <Box sx={{ gridColumn: { xs: "1 / -1", sm: "1 / -1" } }}>
                  <Divider sx={{ my: 0.75 }} />
                  <Typography
                    sx={{
                      fontSize: { xs: 10, sm: 11 },
                      color: "#6b7280",
                      fontWeight: 500,
                      mb: 0.5,
                    }}
                  >
                    Description
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: { xs: 12, sm: 13 },
                      color: "#374151",
                      lineHeight: 1.6,
                    }}
                  >
                    {project.description}
                  </Typography>
                </Box>
              )}
              <Box sx={{ gridColumn: { xs: "1 / -1", sm: "1 / -1" } }}>
                <Divider sx={{ my: 0.75 }} />
                <Typography
                  sx={{
                    fontSize: { xs: 10, sm: 11 },
                    color: "#6b7280",
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Attachments
                </Typography>
                {projectAttachments.length > 0 ? (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, minmax(0, 1fr))",
                        md: "repeat(3, minmax(0, 1fr))",
                      },
                      gap: 1,
                      maxHeight: 150,
                      overflowY: "auto",
                      pr: 0.5,
                    }}
                  >
                    {projectAttachments.map((att, idx) => (
                      <Box
                        key={
                          att?.id || `${att?.fileName || "attachment"}-${idx}`
                        }
                        sx={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 1,
                          backgroundColor: "#f9fafb",
                          px: 1.25,
                          py: 0.75,
                          minHeight: 42,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 1,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 12,
                            color: "#374151",
                            lineHeight: 1.35,
                            wordBreak: "break-word",
                          }}
                        >
                          {getAttachmentFileName(att, `Attachment ${idx + 1}`)}
                        </Typography>
                        <IconButton
                          size="small"
                          component="a"
                          href={getAttachmentFileUrl("projects", att)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography
                    sx={{ fontSize: { xs: 12, sm: 13 }, color: "#6b7280" }}
                  >
                    No attachments uploaded
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          {/* VIEW TOGGLE */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              flexWrap: "wrap",
              px: { xs: 1.5, sm: 2 },
              py: 0.9,
              borderBottom: "1px solid #e5e7eb",
              bgcolor: "#ffffff",
            }}
          >
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: { xs: "12px", sm: "14px" },
                color: "#7D8693",
              }}
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
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              p: { xs: 1.25, sm: 1.5 },
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
          </Box>
          </Card>
        </Box>
      </Box>

      {/* FOOTER */}
      <Box
        sx={{
          background: "white",
          borderTop: "1px solid #e5e7eb",
          px: { xs: 1, sm: 1.5 },
          py: { xs: 0.75, sm: 1 },
          flexShrink: 0,
          display: "flex",
          justifyContent: { xs: "space-between", sm: "flex-end" },
          gap: { xs: 0.75, sm: 1 },
          flexWrap: "wrap",
        }}
      >
        <Button
          size="small"
          variant="outlined"
          onClick={() => router.back()}
          disabled={submitting}
          sx={{
            minHeight: 34,
            px: 1.6,
            borderRadius: 1.5,
            fontSize: { xs: "11px", sm: "12px" },
            fontWeight: 800,
            textTransform: "none",
          }}
        >
          Cancel
        </Button>
        {!isReadOnlyFromMyRequests && (
          <>
            <Button
              size="small"
              variant="contained"
              color="error"
              startIcon={<BlockIcon />}
              onClick={() => setRejectDialogOpen(true)}
              disabled={submitting}
              sx={{
                minHeight: 34,
                px: 1.6,
                borderRadius: 1.5,
                fontSize: { xs: "11px", sm: "12px" },
                fontWeight: 800,
                textTransform: "none",
                boxShadow: "none",
              }}
            >
              Reject
            </Button>
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={() => setApproveDialogOpen(true)}
              disabled={submitting}
              sx={{
                minHeight: 34,
                px: 1.6,
                borderRadius: 1.5,
                fontSize: { xs: "11px", sm: "12px" },
                fontWeight: 800,
                textTransform: "none",
                boxShadow: "none",
              }}
            >
              {submitting ? "Approving..." : "Approve"}
            </Button>
          </>
        )}
      </Box>

      {!isReadOnlyFromMyRequests && (
        <Dialog
          open={approveDialogOpen}
          onClose={() => !submitting && setApproveDialogOpen(false)}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle sx={{ fontWeight: 700 }}>Confirm Approval</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to approve this request for project{" "}
              <strong>{project.name}</strong>?
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setApproveDialogOpen(false)}
              variant="outlined"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApproveConfirm}
              variant="contained"
              color="success"
              disabled={submitting}
            >
              {submitting ? "Approving..." : "Yes, Approve"}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {!isReadOnlyFromMyRequests && (
        <ApprovalRejectDialog
          open={rejectDialogOpen}
          projectName={project.name}
          onClose={() => setRejectDialogOpen(false)}
          onConfirm={handleRejectConfirm}
          isSubmitting={submitting}
        />
      )}

      {!isReadOnlyFromMyRequests && (
        <Dialog
          open={successDialogOpen}
          onClose={() => {
            setSuccessDialogOpen(false);
            router.push("/myApprovals");
          }}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle
            sx={{
              fontWeight: 800,
              color: successAction === "approved" ? "#065f46" : "#991b1b",
            }}
          >
            Request {successAction === "approved" ? "Approved" : "Rejected"}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={1.5} alignItems="center" sx={{ py: 1 }}>
              {successAction === "approved" ? (
                <CheckCircleIcon sx={{ fontSize: 56, color: "#10b981" }} />
              ) : (
                <BlockIcon sx={{ fontSize: 56, color: "#ef4444" }} />
              )}
              <Typography sx={{ textAlign: "center", fontWeight: 700 }}>
                Project request was successfully {successAction}.
              </Typography>
              <Typography sx={{ textAlign: "center", color: "#6b7280", fontSize: 14 }}>
                You will be returned to My Approvals.
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ justifyContent: "center", pb: 2.5 }}>
            <Button
              variant="contained"
              color={successAction === "approved" ? "success" : "error"}
              onClick={() => {
                setSuccessDialogOpen(false);
                router.push("/myApprovals");
              }}
            >
              Go to My Approvals
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <Dialog
        open={auditDetailOpen}
        onClose={() => setAuditDetailOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 1,
            backgroundColor: "#eff6ff",
            borderBottom: "1px solid #dbeafe",
          }}
        >
          <HistoryIcon sx={{ color: "#1d4ed8", fontSize: 20 }} />
          Request History Details
        </DialogTitle>
        <DialogContent dividers>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 1.25,
            }}
          >
            <Box>
              <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                Action
              </Typography>
              <Typography sx={{ fontSize: 14, color: "#0f172a", fontWeight: 600 }}>
                {selectedAuditLog?.action || "N/A"}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                Approver
              </Typography>
              <Typography sx={{ fontSize: 14, color: "#0f172a", fontWeight: 600 }}>
                {selectedAuditLog?.approverName || "System"}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                Creator
              </Typography>
              <Typography sx={{ fontSize: 14, color: "#0f172a", fontWeight: 600 }}>
                {getCreatorName(selectedAuditLog)}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                Approval Level
              </Typography>
              <Typography sx={{ fontSize: 14, color: "#0f172a", fontWeight: 600 }}>
                {selectedAuditLog?.level || "N/A"}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                Previous Status
              </Typography>
              <Typography sx={{ fontSize: 14, color: "#0f172a", fontWeight: 600 }}>
                {selectedAuditLog?.previousStatus || "N/A"}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                New Status
              </Typography>
              <Typography sx={{ fontSize: 14, color: "#0f172a", fontWeight: 600 }}>
                {selectedAuditLog?.newStatus || "N/A"}
              </Typography>
            </Box>
            <Box sx={{ gridColumn: { xs: "1 / -1", sm: "1 / -1" } }}>
              <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                Date & Time
              </Typography>
              <Typography sx={{ fontSize: 14, color: "#0f172a", fontWeight: 600 }}>
                {formatDateTime(selectedAuditLog?.createdAt)}
              </Typography>
            </Box>
            <Box
              sx={{
                gridColumn: { xs: "1 / -1", sm: "1 / -1" },
                backgroundColor: "#fff7ed",
                border: "1px solid #fed7aa",
                borderRadius: 1,
                px: 1.25,
                py: 1,
              }}
            >
              <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                  <ChatBubbleOutlineIcon sx={{ fontSize: 14, color: "#c2410c" }} />
                  Remarks
                </Box>
              </Typography>
              <Typography sx={{ fontSize: 14, color: "#0f172a", fontWeight: 600, whiteSpace: "pre-wrap" }}>
                {selectedAuditLog?.remarks || "N/A"}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAuditDetailOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function ApprovalReviewPage() {
  return (
    <Suspense
      fallback={
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
      }
    >
      <ApprovalReviewPageContent />
    </Suspense>
  );
}

function StructuredView({ project }: { project: ApprovalProject }) {
  return (
    <Stack spacing={3}>
      {/* STRUCTURED VIEW COMPONENT */}
      <StructuredViewComponent
        project={{
          id: project.id,
          name: project.name,
          scopes: (project.scopes || []) as unknown as Scope[],
        }}
      />
    </Stack>
  );
}
