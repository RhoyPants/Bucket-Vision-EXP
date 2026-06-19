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
import {
  getAttachmentFileName,
  getAttachmentFileUrl,
} from "@/app/api-service/attachmentService";

type ViewMode = "structured" | "gantt";

function ApprovalReviewPageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
  const dispatch = useAppDispatch();
  const { auditTrail } = useAppSelector((state) => state.approval);
  const isReadOnlyFromMyRequests = searchParams.get("source") === "my-requests";

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("structured");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectAttachments, setProjectAttachments] = useState<any[]>([]);

  useEffect(() => {
    const fetchProjectForApproval = async () => {
      try {
        setLoading(true);
        setError(null);
        const [projectResponse, attachmentResponse] = await Promise.all([
          axios.get(`/projects/${projectId}/view-for-approval`),
          axios.get(`/projects/${projectId}/attachments`).catch(() => null),
        ]);

        const projectData = projectResponse.data?.data;
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

  const handleApproveConfirm = async () => {
    setApproveDialogOpen(false);
    await handleApprove();
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
  const totalTasks = (project?.scopes || []).reduce(
    (sum: number, s: any) => sum + (s?.tasks?.length || 0),
    0,
  );
  const totalSubtasks = (project?.scopes || []).reduce(
    (sum: number, s: any) =>
      sum +
      (s?.tasks || []).reduce(
        (taskSum: number, t: any) => taskSum + (t?.subtasks?.length || 0),
        0,
      ),
    0,
  );
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
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ fontSize: { xs: "16px", sm: "20px" } }}
          >
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
      <Box
        sx={{
          display: "flex",
          flex: 1,
          gap: 2,
          p: { xs: 1, sm: 2 },
          flexDirection: { xs: "column", md: "row" },
        }}
      >
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
          <Card
            sx={{
              p: { xs: 1.5, sm: 2.5 },
              border: "1px solid #e5e7eb",
              flex: 1,
              overflowY: "auto",
              maxHeight: "auto",
            }}
          >
            <Typography
              sx={{
                fontSize: { xs: 13, sm: 14 },
                fontWeight: 600,
                color: "#111827",
                mb: 1.5,
              }}
            >
              Approval Overview
            </Typography>
            <ApprovalFlowUI
              projectId={projectId}
              projectStatus={project.status}
            />
            <Divider sx={{ my: 2 }} />
            <Typography
              sx={{
                fontSize: { xs: 13, sm: 14 },
                fontWeight: 600,
                color: "#111827",
                mb: 1.5,
              }}
            >
              Approval Overview
            </Typography>
            <ApprovalAuditTrail
              auditLogs={auditLogs}
              empty={auditLogs.length === 0}
            />
          </Card>
        </Box>

        {/* RIGHT PANEL */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            minWidth: 0,
          }}
        >
          {/* PROJECT SUMMARY - IN UPPER PART */}
          <Card sx={{ p: { xs: 1.5, sm: 2.5 }, border: "1px solid #e5e7eb" }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
                gap: 2,
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
                  <Divider sx={{ my: 1 }} />
                  <Typography
                    sx={{
                      fontSize: { xs: 10, sm: 11 },
                      color: "#6b7280",
                      fontWeight: 500,
                      mb: 1,
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
                <Divider sx={{ my: 1 }} />
                <Typography
                  sx={{
                    fontSize: { xs: 10, sm: 11 },
                    color: "#6b7280",
                    fontWeight: 500,
                    mb: 1,
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
                      maxHeight: 220,
                      overflowY: "auto",
                      pr: 0.5,
                    }}
                  >
                    {projectAttachments.map((att: any, idx: number) => (
                      <Box
                        key={
                          att?.id || `${att?.fileName || "attachment"}-${idx}`
                        }
                        sx={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 1,
                          backgroundColor: "#f9fafb",
                          px: 1.25,
                          py: 1,
                          minHeight: 54,
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
          </Card>

          {/* VIEW TOGGLE */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              flexWrap: "wrap",
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
        {!isReadOnlyFromMyRequests && (
          <>
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
              onClick={() => setApproveDialogOpen(true)}
              disabled={submitting}
              sx={{ fontSize: { xs: "12px", sm: "14px" } }}
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
