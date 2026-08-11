"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import RadioButtonUncheckedOutlinedIcon from "@mui/icons-material/RadioButtonUncheckedOutlined";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import axiosApi from "@/app/lib/axios";
import {
  ApiAttachment,
  getAttachmentFileName,
  getAttachmentFileUrl,
  getProjectAttachments,
} from "@/app/api-service/attachmentService";
import { useAppSelector } from "@/app/redux/hook";
import { notifyProjectCompletion } from "@/app/utils/projectCompletionEmailNotification";

type ProjectMember = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  projectRole?: string;
  user?: {
    name?: string;
    email?: string;
  };
};

type ProjectMembers = {
  owner?: ProjectMember[];
  subOwners?: ProjectMember[];
  members?: ProjectMember[];
};

type ApprovalRecord = {
  id: string;
  order?: number;
  stepOrder?: number;
  level?: string;
  status?: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  approverName?: string;
  approverEmail?: string;
  approverRole?: string;
  approver?: {
    name?: string;
    email?: string;
    role?: string;
  } | null;
};

type ApprovalAuditRecord = {
  id: string;
  action?: string;
  level?: string;
  previousStatus?: string;
  newStatus?: string;
  remarks?: string;
  createdAt?: string;
  approverName?: string;
  approverEmail?: string;
  approver?: {
    name?: string;
    email?: string;
  } | null;
};

type ApprovalFlowSummary = {
  name?: string;
  description?: string;
  approvalEnabled?: boolean;
  selfApprovalMode?: string;
  steps?: unknown[];
};

type ProjectInfoData = {
  id: string;
  name?: string;
  pin?: string;
  description?: string;
  status?: string;
  entity?: string;
  priority?: string;
  totalBudget?: number | string;
  progress?: number;
  overallProgress?: number;
  startDate?: string;
  expectedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  activatedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  cancelReason?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: { name?: string; email?: string } | null;
  completedBy?: { name?: string; email?: string } | null;
  cancelledBy?: { name?: string; email?: string } | null;
  owner?: { name?: string; email?: string } | null;
  projectOwner?: { name?: string; email?: string } | null;
  businessUnitName?: string;
  businessUnitDetails?: { name?: string; code?: string } | null;
  location?: {
    regionName?: string;
    provinceName?: string;
    cityName?: string;
    barangayName?: string;
    street?: string;
  } | null;
  monday?: boolean;
  tuesday?: boolean;
  wednesday?: boolean;
  thursday?: boolean;
  friday?: boolean;
  saturday?: boolean;
  sunday?: boolean;
  includeHolidays?: boolean;
  includeGlobalHolidays?: boolean;
  approvalEnabled?: boolean;
  approvalFlow?: ApprovalFlowSummary | null;
  currentApprovalFlow?: ApprovalFlowSummary | null;
};

const emptyValue = "Not recorded";

const getLocalDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeProgress = (value?: number) => {
  const progress = Number(value ?? 0);
  if (!Number.isFinite(progress)) return 0;
  if (progress >= 0 && progress <= 1) return Math.round(progress * 100);
  return Math.min(100, Math.max(0, Math.round(progress)));
};

const formatDate = (value?: string) => {
  if (!value) return emptyValue;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return emptyValue;
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const formatDateTime = (value?: string) => {
  if (!value) return emptyValue;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return emptyValue;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatBudget = (value?: number | string) => {
  if (value === undefined || value === null || value === "") return emptyValue;
  const amount = Number(value);
  if (!Number.isFinite(amount)) return emptyValue;
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(amount);
};

const readableStatus = (value?: string) =>
  String(value || "Unknown")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const statusColor = (status?: string) => {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "ACTIVE" || normalized === "APPROVED") {
    return { color: "#047857", bg: "#ECFDF5", border: "#A7F3D0" };
  }
  if (normalized === "COMPLETED") {
    return { color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE" };
  }
  if (normalized === "NEEDS_REVISION") {
    return { color: "#C2410C", bg: "#FFF7ED", border: "#FED7AA" };
  }
  if (normalized === "CANCELLED") {
    return { color: "#B91C1C", bg: "#FEF2F2", border: "#FECACA" };
  }
  return { color: "#475569", bg: "#F8FAFC", border: "#CBD5E1" };
};

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card variant="outlined" sx={{ borderColor: "#E2E8F0", borderRadius: 2, boxShadow: "none" }}>
      <CardContent sx={{ p: { xs: 2, md: 2.5 }, "&:last-child": { pb: { xs: 2, md: 2.5 } } }}>
        <Typography sx={{ color: "#0F172A", fontSize: 16, fontWeight: 600 }}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography sx={{ mt: 0.25, color: "#64748B", fontSize: 12.5, fontWeight: 400 }}>
            {subtitle}
          </Typography>
        ) : null}
        <Divider sx={{ my: 2 }} />
        {children}
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  detail,
}: {
  label: string;
  value?: React.ReactNode;
  detail?: string;
}) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ color: "#64748B", fontSize: 11.5, fontWeight: 500 }}>
        {label}
      </Typography>
      <Typography
        component="div"
        sx={{ mt: 0.35, color: "#1E293B", fontSize: 14, fontWeight: 400, overflowWrap: "anywhere" }}
      >
        {value || emptyValue}
      </Typography>
      {detail ? (
        <Typography sx={{ mt: 0.25, color: "#94A3B8", fontSize: 11.5, fontWeight: 400 }}>
          {detail}
        </Typography>
      ) : null}
    </Box>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
        gap: 2.25,
      }}
    >
      {children}
    </Box>
  );
}

function MemberGroup({
  title,
  members,
}: {
  title: string;
  members?: ProjectMember[];
}) {
  return (
    <Box>
      <Typography sx={{ mb: 1, color: "#64748B", fontSize: 11.5, fontWeight: 500 }}>
        {title} ({members?.length || 0})
      </Typography>
      {members?.length ? (
        <Stack spacing={0.75}>
          {members.map((member, index) => (
            <Box
              key={member.id || `${title}-${index}`}
              sx={{ px: 1.25, py: 1, border: "1px solid #E2E8F0", borderRadius: 1.25, bgcolor: "#FAFCFF" }}
            >
              <Typography sx={{ color: "#1E293B", fontSize: 13.5, fontWeight: 500 }}>
                {member.user?.name || member.name || "Unnamed user"}
              </Typography>
              <Typography sx={{ color: "#64748B", fontSize: 11.5, fontWeight: 400 }}>
                {member.user?.email || member.email || "No email recorded"}
                {member.projectRole || member.role
                  ? ` · ${readableStatus(member.projectRole || member.role)}`
                  : ""}
              </Typography>
            </Box>
          ))}
        </Stack>
      ) : (
        <Typography sx={{ color: "#94A3B8", fontSize: 13, fontWeight: 400 }}>
          None assigned
        </Typography>
      )}
    </Box>
  );
}

export default function ProjectInfo({ projectId }: { projectId: string }) {
  const router = useRouter();
  const currentUser = useAppSelector((state) => state.auth.user);
  const [project, setProject] = useState<ProjectInfoData | null>(null);
  const [projectMembers, setProjectMembers] = useState<ProjectMembers>({});
  const [attachments, setAttachments] = useState<ApiAttachment[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
  const [approvalAudit, setApprovalAudit] = useState<ApprovalAuditRecord[]>([]);
  const [approvalFlow, setApprovalFlow] = useState<ApprovalFlowSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [configOpen, setConfigOpen] = useState(false);
  const [completionDate, setCompletionDate] = useState(getLocalDate);
  const [completionRemarks, setCompletionRemarks] = useState("");
  const [completing, setCompleting] = useState(false);
  const [completionError, setCompletionError] = useState("");
  const [completionSuccess, setCompletionSuccess] = useState("");
  const [requestAction, setRequestAction] = useState<"cancel" | "resume" | null>(null);
  const [requestActionReason, setRequestActionReason] = useState("");
  const [requestActionBusy, setRequestActionBusy] = useState(false);
  const [requestActionError, setRequestActionError] = useState("");
  const [statusActionMessage, setStatusActionMessage] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([
      axiosApi.get(`/projects/${projectId}/full`),
      axiosApi.get(`/projects/${projectId}/members`),
      getProjectAttachments(projectId),
      axiosApi.get(`/approvals/${projectId}`).catch(() => null),
      axiosApi.get(`/approvals/${projectId}/audit`).catch(() => null),
      axiosApi
        .get(`/admin/projects/${projectId}/approval-config`)
        .catch(() => null),
    ])
      .then(([
        projectResponse,
        memberResponse,
        projectAttachments,
        approvalResponse,
        auditResponse,
        configResponse,
      ]) => {
        if (!active) return;
        const projectData = projectResponse.data?.data ?? projectResponse.data;
        const approvalData = approvalResponse?.data?.data;
        const auditData = auditResponse?.data?.data;
        const configData = configResponse?.data?.data ?? configResponse?.data;

        setProject(projectData);
        setProjectMembers(memberResponse.data?.data ?? {});
        setAttachments(Array.isArray(projectAttachments) ? projectAttachments : []);
        setApprovals(
          Array.isArray(approvalData)
            ? approvalData
            : Array.isArray(approvalData?.approvals)
              ? approvalData.approvals
              : Array.isArray(approvalResponse?.data?.approvals)
                ? approvalResponse.data.approvals
                : [],
        );
        setApprovalAudit(
          Array.isArray(auditData)
            ? auditData
            : Array.isArray(auditData?.auditTrail)
              ? auditData.auditTrail
              : [],
        );
        const selectedFlow =
          configData?.currentApprovalFlow ||
          approvalData?.approvalFlow ||
          projectData?.currentApprovalFlow ||
          projectData?.approvalFlow ||
          null;
        setApprovalFlow(
          selectedFlow
            ? {
                ...selectedFlow,
                approvalEnabled:
                  configData?.approvalEnabled ??
                  projectData?.approvalEnabled,
              }
            : null,
        );
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load the complete project information.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [projectId]);

  if (loading) {
    return (
      <Box sx={{ minHeight: 420, display: "grid", placeItems: "center" }}>
        <Stack spacing={1.25} alignItems="center">
          <CircularProgress size={28} />
          <Typography sx={{ color: "#64748B", fontSize: 13, fontWeight: 400 }}>
            Loading project information...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (error || !project) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert severity="error">{error || "Project information is not available."}</Alert>
      </Box>
    );
  }

  const owners = projectMembers.owner || [];
  const primaryOwner = owners[0];
  const fallbackOwner = project.owner ?? project.projectOwner;
  const actualStartDate = project.actualStartDate || project.activatedAt;
  const actualEndDate = project.actualEndDate || project.completedAt;
  const includesHolidays = project.includeHolidays ?? project.includeGlobalHolidays ?? false;
  const tone = statusColor(project.status);
  const progress = normalizeProgress(project.overallProgress ?? project.progress);
  const isCompleted = String(project.status || "").toUpperCase() === "COMPLETED";
  const isCancelled = String(project.status || "").toUpperCase() === "CANCELLED";
  const canComplete = progress >= 100 && !isCompleted && !isCancelled;
  const cancellableStatuses = new Set([
    "DRAFT",
    "FOR_REVIEW",
    "FOR_APPROVAL",
    "NEEDS_REVISION",
    "REJECTED",
  ]);
  const canCancel = cancellableStatuses.has(String(project.status || "").toUpperCase());
  const workDays = [
    ["Monday", project.monday ?? true],
    ["Tuesday", project.tuesday ?? true],
    ["Wednesday", project.wednesday ?? true],
    ["Thursday", project.thursday ?? true],
    ["Friday", project.friday ?? true],
    ["Saturday", project.saturday ?? false],
    ["Sunday", project.sunday ?? false],
  ] as const;
  const sortedApprovals = [...approvals].sort(
    (left, right) =>
      Number(left.order ?? left.stepOrder ?? Number.MAX_SAFE_INTEGER) -
      Number(right.order ?? right.stepOrder ?? Number.MAX_SAFE_INTEGER),
  );
  const sortedApprovalAudit = [...approvalAudit].sort(
    (left, right) =>
      new Date(left.createdAt || 0).getTime() -
      new Date(right.createdAt || 0).getTime(),
  );
  const requester =
    project.createdBy ||
    project.owner ||
    project.projectOwner ||
    (owners[0]
      ? {
          name: owners[0].user?.name || owners[0].name,
          email: owners[0].user?.email || owners[0].email,
        }
      : null);
  const submissionLog = sortedApprovalAudit.find((log) =>
    String(log.action || log.newStatus || "").toUpperCase().includes("SUBMIT"),
  );
  const finalApproval =
    [...sortedApprovals].reverse().find(
      (approval) => String(approval.status || "").toUpperCase() === "APPROVED",
    ) || sortedApprovals[sortedApprovals.length - 1];
  const finalApprovalAudit = [...sortedApprovalAudit]
    .reverse()
    .find((log) =>
      String(log.action || log.newStatus || "").toUpperCase().includes("APPROV"),
    );
  const approvalCompletedAt =
    project.activatedAt ||
    finalApproval?.approvedAt ||
    finalApproval?.updatedAt ||
    finalApprovalAudit?.createdAt;
  const allApprovalsComplete =
    sortedApprovals.length > 0 &&
    sortedApprovals.every(
      (approval) => String(approval.status || "").toUpperCase() === "APPROVED",
    );

  const handleCompleteProject = async () => {
    if (!canComplete || !completionDate) return;

    try {
      setCompleting(true);
      setCompletionError("");
      setCompletionSuccess("");

      const response = await axiosApi.post(`/projects/${projectId}/complete`, {
        actualEndDate: completionDate,
        remarks: completionRemarks.trim(),
      });
      const completedProject = response.data?.data;

      setProject((current) =>
        current
          ? {
              ...current,
              ...(completedProject && typeof completedProject === "object"
                ? completedProject
                : {}),
              status: "COMPLETED",
              actualEndDate:
                completedProject?.actualEndDate || completionDate,
              completedAt:
                completedProject?.completedAt || new Date().toISOString(),
            }
          : current,
      );

      try {
        const emailResult = await notifyProjectCompletion({
          projectId,
          project,
          members: projectMembers,
          actualEndDate: completionDate,
          remarks: completionRemarks.trim(),
          completedBy: currentUser?.name,
        });
        setCompletionSuccess(
          `${response.data?.message || "Project tagged as completed successfully."} Email notification sent to ${emailResult.sent} unique recipient${emailResult.sent === 1 ? "" : "s"}${emailResult.failed ? `; ${emailResult.failed} failed` : ""}.`,
        );
      } catch (emailError) {
        console.warn("Could not send project completion emails:", emailError);
        setCompletionSuccess(
          `${response.data?.message || "Project tagged as completed successfully."} Some email notifications could not be sent.`,
        );
      }
      setCompletionRemarks("");
    } catch (requestError: unknown) {
      setCompletionError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to complete this project.",
      );
    } finally {
      setCompleting(false);
    }
  };

  const handleRequestStatusAction = async () => {
    if (!requestAction || !requestActionReason.trim()) return;

    try {
      setRequestActionBusy(true);
      setRequestActionError("");
      setStatusActionMessage("");

      const response = await axiosApi.post(
        `/projects/${projectId}/${requestAction}`,
        { reason: requestActionReason.trim() },
      );
      const updatedProject = response.data?.data;
      const nextStatus = requestAction === "cancel" ? "CANCELLED" : "DRAFT";

      setProject((current) =>
        current
          ? {
              ...current,
              ...(updatedProject && typeof updatedProject === "object"
                ? updatedProject
                : {}),
              status: updatedProject?.status || nextStatus,
              ...(requestAction === "cancel"
                ? {
                    cancellationReason:
                      updatedProject?.cancellationReason ||
                      updatedProject?.cancelReason ||
                      requestActionReason.trim(),
                    cancelledAt:
                      updatedProject?.cancelledAt || new Date().toISOString(),
                  }
                : {
                    cancellationReason: undefined,
                    cancelReason: undefined,
                  }),
            }
          : current,
      );
      setStatusActionMessage(
        response.data?.message ||
          (requestAction === "cancel"
            ? "Project request cancelled. It can be resumed later."
            : "Project request resumed as a draft. Review it before resubmitting."),
      );
      try {
        const auditResponse = await axiosApi.get(`/approvals/${projectId}/audit`);
        const auditData = auditResponse.data?.data;
        setApprovalAudit(
          Array.isArray(auditData)
            ? auditData
            : Array.isArray(auditData?.auditTrail)
              ? auditData.auditTrail
              : [],
        );
      } catch {
        // The status action succeeded; failure to refresh history should not undo it.
      }
      setRequestAction(null);
      setRequestActionReason("");
    } catch (requestError: unknown) {
      setRequestActionError(
        requestError instanceof Error
          ? requestError.message
          : `Unable to ${requestAction} this project request.`,
      );
    } finally {
      setRequestActionBusy(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 1.5, md: 2.5 }, maxWidth: 1320, mx: "auto" }}>
      <Stack spacing={2}>
        <Box>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={1}
          >
            <Box>
              <Typography component="h2" sx={{ color: "#0F172A", fontSize: 22, fontWeight: 600 }}>
                Project information
              </Typography>
              <Typography sx={{ mt: 0.35, color: "#64748B", fontSize: 13, fontWeight: 400 }}>
                Complete project record excluding scope, tasks, and subtasks.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={readableStatus(project.status)}
                size="small"
                sx={{
                  color: tone.color,
                  bgcolor: tone.bg,
                  border: `1px solid ${tone.border}`,
                  fontSize: 12,
                  fontWeight: 500,
                }}
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<TaskAltOutlinedIcon />}
                disabled={isCancelled || isCompleted}
                onClick={() => {
                  setCompletionError("");
                  setCompletionSuccess("");
                  setConfigOpen(true);
                }}
                sx={{ textTransform: "none", fontWeight: 500 }}
              >
                Tag as Complete
              </Button>
              {isCancelled || canCancel ? (
                <Button
                  variant="outlined"
                  size="small"
                  color={isCancelled ? "primary" : "error"}
                  startIcon={
                    isCancelled ? <ReplayOutlinedIcon /> : <CancelOutlinedIcon />
                  }
                  onClick={() => {
                    setRequestActionError("");
                    setRequestActionReason("");
                    setRequestAction(isCancelled ? "resume" : "cancel");
                  }}
                  sx={{ textTransform: "none", fontWeight: 500 }}
                >
                  {isCancelled
                    ? "Resume Project Request"
                    : "Cancel Project Request"}
                </Button>
              ) : null}
            </Stack>
          </Stack>
        </Box>

        {statusActionMessage ? (
          <Alert severity="success" onClose={() => setStatusActionMessage("")}>
            {statusActionMessage}
          </Alert>
        ) : null}

        {isCancelled ? (
          <Alert severity="warning">
            <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
              This project request is cancelled.
            </Typography>
            <Typography sx={{ mt: 0.25, fontSize: 12.5, fontWeight: 400 }}>
              Reason: {project.cancellationReason || project.cancelReason || emptyValue}
            </Typography>
          </Alert>
        ) : null}

        <Alert
          severity="info"
          icon={<AccountTreeOutlinedIcon fontSize="small" />}
          action={
            <Button
              size="small"
              onClick={() => router.push(`/projectDashboard/${projectId}?view=project-structure`)}
              sx={{ whiteSpace: "nowrap", textTransform: "none", fontWeight: 500 }}
            >
              Open Project Structure
            </Button>
          }
          sx={{ alignItems: "center", fontSize: 13, "& .MuiAlert-message": { fontWeight: 400 } }}
        >
          Scope, tasks, subtasks, and their checklists are available in the Project Structure tab.
        </Alert>

        <Section title="Project overview">
          <FieldGrid>
            <Field label="Project name" value={project.name} />
            <Field label="Project PIN" value={project.pin} />
            <Field
              label="Project owner"
              value={primaryOwner?.user?.name || primaryOwner?.name || fallbackOwner?.name}
              detail={primaryOwner?.user?.email || primaryOwner?.email || fallbackOwner?.email}
            />
            <Field
              label="Business unit"
              value={project.businessUnitDetails?.name || project.businessUnitName}
              detail={project.businessUnitDetails?.code}
            />
            <Field label="Entity" value={project.entity} />
            <Field label="Priority type" value={project.priority} />
            <Field label="Budget allocated" value={formatBudget(project.totalBudget)} />
            <Field label="Current status" value={readableStatus(project.status)} />
          </FieldGrid>
          <Divider sx={{ my: 2 }} />
          <Field label="Project description" value={project.description || "No description provided"} />
        </Section>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
            gap: 2,
          }}
        >
          <Section title="Project timeline" subtitle="Expected dates compared with recorded actual dates.">
            <FieldGrid>
              <Field label="Expected start date" value={formatDate(project.startDate)} />
              <Field label="Expected end date" value={formatDate(project.expectedEndDate)} />
              <Field label="Actual start date" value={formatDate(actualStartDate)} />
              <Field label="Actual end date" value={formatDate(actualEndDate)} />
            </FieldGrid>
          </Section>

          <Section title="Project location">
            <FieldGrid>
              <Field label="Region" value={project.location?.regionName} />
              <Field label="Province" value={project.location?.provinceName} />
              <Field label="City / Municipality" value={project.location?.cityName} />
              <Field label="Barangay" value={project.location?.barangayName} />
            </FieldGrid>
            <Divider sx={{ my: 2 }} />
            <Field label="Street address" value={project.location?.street} />
          </Section>
        </Box>

        <Section title="Project work schedule" subtitle="Days included in project schedule calculations.">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)", lg: "repeat(7, 1fr)" },
              gap: 1,
            }}
          >
            {workDays.map(([day, enabled]) => (
              <Stack
                key={day}
                direction="row"
                spacing={0.75}
                alignItems="center"
                sx={{
                  px: 1.25,
                  py: 1,
                  border: "1px solid",
                  borderColor: enabled ? "#BFDBFE" : "#E2E8F0",
                  bgcolor: enabled ? "#EFF6FF" : "#F8FAFC",
                  borderRadius: 1.25,
                }}
              >
                {enabled ? (
                  <CheckCircleOutlineIcon sx={{ color: "#2563EB", fontSize: 18 }} />
                ) : (
                  <RadioButtonUncheckedOutlinedIcon sx={{ color: "#94A3B8", fontSize: 18 }} />
                )}
                <Typography sx={{ color: enabled ? "#1E3A8A" : "#64748B", fontSize: 12.5, fontWeight: 400 }}>
                  {day}
                </Typography>
              </Stack>
            ))}
          </Box>
          <Divider sx={{ my: 2 }} />
          <Stack direction="row" spacing={0.75} alignItems="center">
            {includesHolidays ? (
              <CheckCircleOutlineIcon sx={{ color: "#2563EB", fontSize: 18 }} />
            ) : (
              <RadioButtonUncheckedOutlinedIcon sx={{ color: "#94A3B8", fontSize: 18 }} />
            )}
            <Typography sx={{ color: "#475569", fontSize: 13, fontWeight: 400 }}>
              Global holidays are {includesHolidays ? "included" : "not included"} in schedule calculations.
            </Typography>
          </Stack>
        </Section>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
            gap: 2,
          }}
        >
          <Section title="Project team" subtitle="Ownership and assigned project members.">
            <Stack spacing={2}>
              <MemberGroup title="Owner" members={owners} />
              <MemberGroup title="Sub-owners" members={projectMembers.subOwners} />
              <MemberGroup title="Members" members={projectMembers.members} />
            </Stack>
          </Section>

          <Section title="Project attachments" subtitle={`${attachments.length} uploaded file${attachments.length === 1 ? "" : "s"}.`}>
            {attachments.length ? (
              <Stack spacing={0.75}>
                {attachments.map((attachment, index) => (
                  <Link
                    key={attachment.id || index}
                    href={getAttachmentFileUrl("projects", attachment)}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="none"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      px: 1.25,
                      py: 1,
                      color: "#334155",
                      border: "1px solid #E2E8F0",
                      borderRadius: 1.25,
                      "&:hover": { bgcolor: "#F8FAFC", borderColor: "#CBD5E1" },
                    }}
                  >
                    <AttachFileOutlinedIcon sx={{ color: "#64748B", fontSize: 19 }} />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography noWrap sx={{ fontSize: 13, fontWeight: 400 }}>
                        {getAttachmentFileName(attachment, `Attachment ${index + 1}`)}
                      </Typography>
                      <Typography sx={{ color: "#94A3B8", fontSize: 11 }}>
                        {attachment.mimeType || "File"} · Uploaded {formatDate(attachment.createdAt)}
                      </Typography>
                    </Box>
                    <OpenInNewOutlinedIcon sx={{ color: "#94A3B8", fontSize: 17 }} />
                  </Link>
                ))}
              </Stack>
            ) : (
              <Stack alignItems="center" spacing={1} sx={{ py: 4 }}>
                <AttachFileOutlinedIcon sx={{ color: "#CBD5E1", fontSize: 30 }} />
                <Typography sx={{ color: "#94A3B8", fontSize: 13, fontWeight: 400 }}>
                  No project attachments uploaded
                </Typography>
              </Stack>
            )}
          </Section>
        </Box>

        <Section
          title="Project approval history"
          subtitle="The approval flow assigned to this project and its recorded decisions."
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
              gap: 2,
            }}
          >
            <Field
              label="Approval flow used"
              value={approvalFlow?.name || "Flow information not available"}
              detail={approvalFlow?.description}
            />
            <Field
              label="Approval requirement"
              value={
                project.approvalEnabled === false || approvalFlow?.approvalEnabled === false
                  ? "Disabled"
                  : "Enabled"
              }
            />
            <Field
              label="Self-approval mode"
              value={
                approvalFlow?.selfApprovalMode
                  ? readableStatus(approvalFlow.selfApprovalMode)
                  : emptyValue
              }
            />
          </Box>

          <Divider sx={{ my: 2 }} />
          <Typography sx={{ mb: 1.25, color: "#475569", fontSize: 13, fontWeight: 500 }}>
            Approval flow preview
          </Typography>
          {sortedApprovals.length ? (
            <Box sx={{ display: "flex", alignItems: "stretch", gap: 1, overflowX: "auto", pb: 1 }}>
              <Box
                sx={{
                  width: 220,
                  minWidth: 220,
                  minHeight: 155,
                  flex: "0 0 220px",
                  p: 1.5,
                  border: "1px solid #D8CBEA",
                  bgcolor: "#F7F3FC",
                  borderRadius: 2,
                }}
              >
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <PersonOutlineOutlinedIcon sx={{ color: "#4B2E83", fontSize: 18 }} />
                  <Typography sx={{ color: "#4B2E83", fontSize: 10, fontWeight: 600 }}>
                    START · REQUESTER
                  </Typography>
                </Stack>
                <Typography sx={{ mt: 0.75, color: "#1E293B", fontSize: 13.5, fontWeight: 500 }}>
                  {requester?.name || "Requester not recorded"}
                </Typography>
                <Typography
                  title={requester?.email}
                  sx={{
                    mt: 0.25,
                    color: "#64748B",
                    fontSize: 11,
                    fontWeight: 400,
                    overflowWrap: "anywhere",
                    lineHeight: 1.35,
                  }}
                >
                  {requester?.email || "Creates and submits the project"}
                </Typography>
                <Typography sx={{ mt: 1.25, color: "#4B2E83", fontSize: 10.5, fontWeight: 400 }}>
                  {formatDateTime(submissionLog?.createdAt || project.createdAt)}
                </Typography>
              </Box>

              <Box sx={{ display: "grid", placeItems: "center", color: "#94A3B8" }}>
                <ArrowForwardOutlinedIcon />
              </Box>

              {sortedApprovals.map((approval, index) => {
                const approvalStatus = String(approval.status || "PENDING").toUpperCase();
                const approvalTone =
                  approvalStatus === "APPROVED"
                    ? { color: "#4B2E83", bg: "#F7F3FC", border: "#D8CBEA" }
                    : approvalStatus === "REJECTED"
                      ? { color: "#B91C1C", bg: "#FEF2F2", border: "#FECACA" }
                      : { color: "#B45309", bg: "#FFFBEB", border: "#FDE68A" };
                const decisionDate =
                  approval.approvedAt ||
                  approval.rejectedAt ||
                  approval.updatedAt ||
                  approval.createdAt;

                return (
                  <Fragment key={approval.id}>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: 0.75,
                      alignContent: "start",
                      width: 220,
                      minWidth: 220,
                      minHeight: 155,
                      flex: "0 0 220px",
                      p: 1.5,
                      border: `1px solid ${approvalTone.border}`,
                      bgcolor: approvalTone.bg,
                      borderRadius: 2,
                    }}
                  >
                    <Typography sx={{ color: approvalTone.color, fontSize: 10, fontWeight: 600 }}>
                      STEP {approval.order ?? approval.stepOrder ?? index + 1}
                    </Typography>
                    <Chip
                      label={readableStatus(approvalStatus)}
                      size="small"
                      sx={{
                        height: 20,
                        color: approvalTone.color,
                        bgcolor: "#FFFFFF",
                        border: `1px solid ${approvalTone.border}`,
                        fontSize: 9,
                        fontWeight: 500,
                      }}
                    />
                    <Box sx={{ minWidth: 0, gridColumn: "1 / -1" }}>
                      <Typography sx={{ color: "#1E293B", fontSize: 13.5, fontWeight: 500 }}>
                        {readableStatus(approval.level || approval.approverRole)}
                      </Typography>
                      <Typography
                        noWrap
                        title={approval.approver?.name || approval.approverName}
                        sx={{ color: "#64748B", fontSize: 11.5, fontWeight: 400 }}
                      >
                        {approval.approver?.name || approval.approverName || "Approver not recorded"}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        gridColumn: "1 / -1",
                        mt: 0.5,
                        color: approvalTone.color,
                        fontSize: 10.5,
                        fontWeight: 400,
                      }}
                    >
                      {formatDateTime(decisionDate)}
                    </Typography>
                    {approval.remarks ? (
                      <Typography
                        sx={{
                          gridColumn: "1 / -1",
                          color: "#64748B",
                          fontSize: 11,
                          fontWeight: 400,
                          fontStyle: "italic",
                        }}
                      >
                        Remarks: {approval.remarks}
                      </Typography>
                    ) : null}
                  </Box>
                  {index < sortedApprovals.length - 1 ? (
                    <Box sx={{ display: "grid", placeItems: "center", color: "#94A3B8" }}>
                      <ArrowForwardOutlinedIcon />
                    </Box>
                  ) : null}
                  </Fragment>
                );
              })}

              <Box sx={{ display: "grid", placeItems: "center", color: "#94A3B8" }}>
                <ArrowForwardOutlinedIcon />
              </Box>

              <Box
                sx={{
                  width: 220,
                  minWidth: 220,
                  minHeight: 155,
                  flex: "0 0 220px",
                  p: 1.5,
                  border: "1px solid #D8CBEA",
                  bgcolor: "#F7F3FC",
                  borderRadius: 2,
                }}
              >
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <CheckCircleOutlineIcon sx={{ color: "#4B2E83", fontSize: 18 }} />
                  <Typography sx={{ color: "#4B2E83", fontSize: 10, fontWeight: 600 }}>
                  {allApprovalsComplete ? "COMPLETE" : "FINAL STATUS"}
                  </Typography>
                </Stack>
                <Typography sx={{ mt: 0.75, color: "#1E293B", fontSize: 13.5, fontWeight: 500 }}>
                  {allApprovalsComplete ? "Project Active" : readableStatus(project.status)}
                </Typography>
                <Typography sx={{ mt: 0.25, color: "#475569", fontSize: 11.5, fontWeight: 400 }}>
                  {allApprovalsComplete
                    ? "All required approvals completed"
                    : "Waiting for all required approvals"}
                </Typography>
                <Typography sx={{ mt: 1.25, color: "#4B2E83", fontSize: 10.5, fontWeight: 400 }}>
                  {allApprovalsComplete ? formatDateTime(approvalCompletedAt) : "Not completed"}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Alert severity="info">No approval records are available for this project.</Alert>
          )}

          {sortedApprovalAudit.length ? (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography sx={{ mb: 1.25, color: "#475569", fontSize: 13, fontWeight: 500 }}>
                Approval audit history
              </Typography>
              <Stack spacing={1.25}>
                {[...sortedApprovalAudit].reverse().map((log) => (
                  <Box
                    key={log.id}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "16px minmax(0, 1fr)",
                      gap: 1,
                      alignItems: "flex-start",
                    }}
                  >
                    <CheckCircleOutlineIcon sx={{ mt: 0.15, color: "#94A3B8", fontSize: 16 }} />
                    <Box>
                      <Typography sx={{ color: "#334155", fontSize: 12.5, fontWeight: 400 }}>
                        {log.approver?.name || log.approverName || "System"} ·{" "}
                        {readableStatus(log.action || log.newStatus)}
                      </Typography>
                      <Typography sx={{ color: "#94A3B8", fontSize: 11, fontWeight: 400 }}>
                        {formatDateTime(log.createdAt)}
                        {log.level ? ` · ${readableStatus(log.level)}` : ""}
                        {log.previousStatus && log.newStatus
                          ? ` · ${readableStatus(log.previousStatus)} → ${readableStatus(log.newStatus)}`
                          : ""}
                      </Typography>
                      {log.remarks ? (
                        <Box sx={{ mt: 0.75, px: 1.25, py: 0.85, bgcolor: "#F8FAFC", borderRadius: 1 }}>
                          <Typography sx={{ color: "#64748B", fontSize: 11, fontWeight: 500 }}>
                            Remarks
                          </Typography>
                          <Typography sx={{ mt: 0.15, color: "#475569", fontSize: 12, fontWeight: 400 }}>
                            {log.remarks}
                          </Typography>
                        </Box>
                      ) : null}
                    </Box>
                  </Box>
                ))}
              </Stack>
            </>
          ) : null}
        </Section>

        <Section title="Record information">
          <FieldGrid>
            <Field label="Project Vision ID #" value="TBD" />
            <Field label="Created on" value={formatDateTime(project.createdAt)} />
            <Field label="Last updated" value={formatDateTime(project.updatedAt)} />
            <Field label="Activated on" value={formatDateTime(project.activatedAt)} />
            <Field
              label="Created by"
              value={requester?.name}
              detail={requester?.email}
            />
            <Field
              label="Completed by"
              value={project.completedBy?.name}
              detail={project.completedBy?.email}
            />
          </FieldGrid>
        </Section>

        <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="center" sx={{ py: 0.5 }}>
          <GroupsOutlinedIcon sx={{ color: "#94A3B8", fontSize: 16 }} />
          <Typography sx={{ color: "#94A3B8", fontSize: 11.5, fontWeight: 400 }}>
            Project information is read-only on this page.
          </Typography>
        </Stack>
      </Stack>

      <Dialog
        open={configOpen}
        onClose={completing ? undefined : () => setConfigOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontSize: 18, fontWeight: 600 }}>
          Project configuration
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <TaskAltOutlinedIcon sx={{ color: isCompleted ? "#2563EB" : "#64748B" }} />
                <Typography sx={{ color: "#0F172A", fontSize: 15, fontWeight: 500 }}>
                  Tag project as completed
                </Typography>
              </Stack>
              <Typography sx={{ mt: 0.75, color: "#64748B", fontSize: 13, fontWeight: 400 }}>
                This changes the project status immediately and allows the backend to lock
                the project and notify relevant stakeholders.
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                gap: 2,
                px: 1.5,
                py: 1.25,
                bgcolor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: 1.5,
              }}
            >
              <Typography sx={{ color: "#64748B", fontSize: 13 }}>Project progress</Typography>
              <Typography sx={{ color: "#1E293B", fontSize: 13, fontWeight: 500 }}>
                {progress}%
              </Typography>
            </Box>

            {isCompleted ? (
              <Alert severity="success">
                This project is already completed
                {actualEndDate ? ` as of ${formatDate(actualEndDate)}` : ""}.
              </Alert>
            ) : progress < 100 ? (
              <Alert severity="warning">
                Completion becomes available when project progress reaches 100%.
              </Alert>
            ) : (
              <>
                <TextField
                  label="Completion date"
                  type="date"
                  value={completionDate}
                  onChange={(event) => setCompletionDate(event.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  fullWidth
                  required
                  disabled={completing}
                />
                <TextField
                  label="Remarks"
                  value={completionRemarks}
                  onChange={(event) => setCompletionRemarks(event.target.value)}
                  placeholder="Add completion or turnover notes"
                  multiline
                  minRows={3}
                  fullWidth
                  disabled={completing}
                />
              </>
            )}

            {completionError ? <Alert severity="error">{completionError}</Alert> : null}
            {completionSuccess ? <Alert severity="success">{completionSuccess}</Alert> : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setConfigOpen(false)}
            disabled={completing}
            sx={{ textTransform: "none", fontWeight: 400 }}
          >
            Close
          </Button>
          {!isCompleted ? (
            <Button
              variant="contained"
              startIcon={
                completing ? <CircularProgress size={16} color="inherit" /> : <TaskAltOutlinedIcon />
              }
              onClick={handleCompleteProject}
              disabled={!canComplete || !completionDate || completing}
              sx={{ textTransform: "none", fontWeight: 500, boxShadow: "none" }}
            >
              {completing ? "Completing..." : "Tag as Complete"}
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>

      <Dialog
        open={requestAction !== null}
        onClose={
          requestActionBusy
            ? undefined
            : () => {
                setRequestAction(null);
                setRequestActionError("");
              }
        }
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontSize: 18, fontWeight: 600 }}>
          {requestAction === "resume"
            ? "Resume project request?"
            : "Cancel project request?"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography sx={{ color: "#64748B", fontSize: 13, fontWeight: 400 }}>
              {requestAction === "resume"
                ? "The request will return to Draft with its existing project details, structure, members, and attachments preserved. Review it before resubmitting."
                : "Editing and submission will be disabled while cancelled. The request can be resumed later without recreating the project."}
            </Typography>
            <TextField
              label="Reason"
              value={requestActionReason}
              onChange={(event) => setRequestActionReason(event.target.value)}
              placeholder={
                requestAction === "resume"
                  ? "Why should this project request continue?"
                  : "Why is this project request being cancelled?"
              }
              multiline
              minRows={3}
              required
              fullWidth
              disabled={requestActionBusy}
            />
            {requestActionError ? (
              <Alert severity="error">{requestActionError}</Alert>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => {
              setRequestAction(null);
              setRequestActionError("");
            }}
            disabled={requestActionBusy}
            sx={{ textTransform: "none", fontWeight: 400 }}
          >
            Back
          </Button>
          <Button
            variant="contained"
            color={requestAction === "cancel" ? "error" : "primary"}
            startIcon={
              requestActionBusy ? (
                <CircularProgress size={16} color="inherit" />
              ) : requestAction === "resume" ? (
                <ReplayOutlinedIcon />
              ) : (
                <CancelOutlinedIcon />
              )
            }
            onClick={handleRequestStatusAction}
            disabled={!requestActionReason.trim() || requestActionBusy}
            sx={{ textTransform: "none", fontWeight: 500, boxShadow: "none" }}
          >
            {requestActionBusy
              ? "Saving..."
              : requestAction === "resume"
                ? "Resume Project Request"
                : "Cancel Project Request"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
