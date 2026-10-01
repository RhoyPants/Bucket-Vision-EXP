"use client";

import {
  Alert, Badge, Box, Button, CircularProgress, Collapse, Drawer, FormControl, IconButton, MenuItem, Pagination, Select,
  Stack, Tab, Tabs, TextField, Tooltip, Typography,
} from "@mui/material";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import CloseIcon from "@mui/icons-material/Close";
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import UnarchiveOutlinedIcon from "@mui/icons-material/UnarchiveOutlined";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  notificationService,
  type NotificationCategory,
  type NotificationState,
  type NotificationSummary,
  type UserNotification,
} from "@/app/api-service/notificationService";
import { workflowError } from "@/app/api-service/incidentManagementService";
import { incidentService } from "@/app/api-service/incidentService";

const states: Array<{ value: NotificationState; label: string }> = [
  { value: "ALL", label: "All" }, { value: "UNREAD", label: "Unread" },
  { value: "UNACKNOWLEDGED", label: "Needs reply" }, { value: "ARCHIVED", label: "Archived" },
];
const categories: Array<{ value: NotificationCategory | ""; label: string }> = [
  { value: "", label: "All categories" }, { value: "APPROVAL", label: "Approvals" },
  { value: "PROJECT", label: "Projects" }, { value: "PROGRESS_UPDATE", label: "Progress updates" },
  { value: "INCIDENT", label: "Incidents" }, { value: "CORRECTIVE_ACTION", label: "Corrective actions" },
  { value: "SYSTEM", label: "System" },
];
const emptySummary: NotificationSummary = { unreadCount: 0, unacknowledgedCount: 0, byCategory: {} };
const isVisibleNotification = (item: UserNotification) => item.type !== "PROGRESS_UPDATE_SUBMITTED";
const formatDate = (value: string) => {
  const date = new Date(value);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDifference = Math.round((startOfToday - startOfDate) / 86400000);
  const time = new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit" }).format(date);
  if (dayDifference === 0) return `Today, ${time}`;
  if (dayDifference === 1) return `Yesterday, ${time}`;
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
};
const assignmentLabels: Record<string, string> = {
  REQUESTER_BU_HEAD: "Requester's BU Head",
  PROJECT_BU_HEAD: "Project BU Head",
  PROJECT_OWNER: "Project Owner",
};
const isApprovalNotice = (item: UserNotification) => item.category === "APPROVAL" || /approval/i.test(item.title) || /pending your approval/i.test(item.message);
const isRejectedNotice = (item: UserNotification) => item.type.includes("REJECTED") || /\brejected\b/i.test(`${item.title} ${item.message}`);
const isCancelledNotice = (item: UserNotification) => item.type.includes("CANCELLED") || /\bcancelled\b/i.test(`${item.title} ${item.message}`);
const isCorrectiveActionNotice = (item: UserNotification) => item.category === "CORRECTIVE_ACTION" || item.type.includes("CORRECTIVE_ACTION") || item.target?.resourceType === "INCIDENT_ACTION";
const humanizeMessage = (value: string) => value.replace(/\(Step\s+(\d+):\s*([A-Z_]+)\)/g, (_, order: string, assignment: string) => `Step ${order} · ${assignmentLabels[assignment] || assignment.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())}`);

const readableValue = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : null;
function legacyPayload(item: UserNotification): Record<string, unknown> | null {
  const raw = item.message?.trim();
  if (!raw?.startsWith("{")) return null;
  try { return JSON.parse(raw) as Record<string, unknown>; } catch { return null; }
}
function displayMessage(item: UserNotification): { primary: string; secondary?: string } {
  const raw = item.message?.trim();
  if (!raw?.startsWith("{")) return { primary: raw ? humanizeMessage(raw) : "Open this notification to view its details." };
  try {
    const legacy = JSON.parse(raw) as Record<string, unknown>;
    const incidentNumber = readableValue(legacy.incidentNumber) || readableValue(item.metadata?.incidentNumber);
    const incidentType = readableValue(legacy.incidentType) || readableValue(item.metadata?.incidentType);
    const criticality = readableValue(legacy.criticality) || readableValue(item.metadata?.criticality);
    const actionTitle = readableValue(legacy.actionTitle) || readableValue(item.metadata?.actionTitle);
    const projectName = readableValue(legacy.projectName) || readableValue(item.metadata?.projectName);
    const primary = actionTitle || [incidentNumber, incidentType, criticality].filter(Boolean).join(" · ");
    return {
      primary: primary || "Open this notification to view its details.",
      ...(projectName ? { secondary: projectName } : {}),
    };
  } catch {
    return { primary: "Open this notification to view its details." };
  }
}

function notificationContext(item: UserNotification): { incident?: string; project?: string; reporter?: string; assigner?: string } {
  const legacy = legacyPayload(item);
  const metadata = item.metadata || {};
  const incidentTitle = readableValue(metadata.incidentTitle) || readableValue(metadata.title) || readableValue(legacy?.incidentTitle) || readableValue(legacy?.title);
  const project = readableValue(metadata.projectName) || readableValue(legacy?.projectName);
  const reporter = readableValue(metadata.reporterName) || readableValue(metadata.reportedByName) || readableValue(legacy?.reporterName) || readableValue(legacy?.reportedByName);
  const assigner = readableValue(metadata.assignedByName) || readableValue(metadata.assignerName) || (isCorrectiveActionNotice(item) ? item.actor?.name || null : null);
  return {
    ...(incidentTitle ? { incident: incidentTitle } : {}),
    ...(project ? { project } : {}),
    ...(reporter ? { reporter } : {}),
    ...(assigner ? { assigner } : {}),
  };
}

function notificationIncidentId(item: UserNotification): string | null {
  return readableValue(item.target?.incidentId) || readableValue(legacyPayload(item)?.incidentId);
}

function acknowledgementResult(item: UserNotification): { by: string | null; remarks: string | null; at: string | null } {
  const metadata = item.metadata || {};
  return {
    by: readableValue(metadata.acknowledgedByName) || readableValue(metadata.recipientName) || item.actor?.name || null,
    remarks: readableValue(metadata.acknowledgementRemarks) || readableValue(metadata.remarks) || item.acknowledgementRemarks,
    at: readableValue(metadata.acknowledgedAt) || item.acknowledgedAt,
  };
}

function rejectionDetails(item: UserNotification): { by: string | null; remarks: string | null } {
  const metadata = item.metadata || {};
  const messageReason = item.message.match(/(?:^|[.!?]\s+)Reason:\s*(.+?)\s*$/i)?.[1]?.trim() || null;
  return {
    by: readableValue(metadata.rejectedByName) || readableValue(metadata.reviewedByName) || item.actor?.name || null,
    remarks: readableValue(metadata.rejectionReason) || readableValue(metadata.reviewRemarks) || readableValue(metadata.remarks) || messageReason,
  };
}

function rejectionSummary(item: UserNotification, message: string): string {
  if (!isRejectedNotice(item)) return message;
  return message.replace(/(?:[.!?]\s+)Reason:\s*.+?\s*$/i, ".").trim();
}

function projectApprovalDetails(item: UserNotification): { project: string; requester: string | null; step: string | null } {
  const metadata = item.metadata || {};
  const project = readableValue(metadata.projectName) || notificationContext(item).project || "Project request";
  const requester = readableValue(metadata.requesterName) || readableValue(metadata.submittedByName) || readableValue(metadata.createdByName) || item.actor?.name || null;
  const rawStep = metadata.stepOrder ?? metadata.approvalStepOrder;
  const messageStep = item.message.match(/Step\s+(\d+)/i)?.[1];
  const step = rawStep != null ? `Step ${String(rawStep)}` : messageStep ? `Step ${messageStep}` : null;
  return { project, requester, step };
}

const Emphasis = ({ children }: { children: ReactNode }) => <Box component="span" sx={{ fontWeight: 750, color: "text.primary" }}>{children}</Box>;

function notificationSentence(item: UserNotification): ReactNode {
  const metadata = item.metadata || {};
  const context = notificationContext(item);
  const actor = item.actor?.name || readableValue(metadata.actorName) || readableValue(metadata.assignedByName);
  const project = context.project || readableValue(metadata.projectName) || "the project";
  const report = context.incident || readableValue(metadata.incidentTitle) || readableValue(metadata.incidentNumber) || "the incident";
  const action = readableValue(metadata.actionTitle) || readableValue(legacyPayload(item)?.actionTitle) || "the corrective action";
  const rejection = rejectionDetails(item);
  const acknowledgement = acknowledgementResult(item);
  const type = item.type;

  if (type === "INCIDENT_CORRECTIVE_ACTION_ASSIGNED") return <>{actor ? <Emphasis>{actor}</Emphasis> : "You were"} {actor ? "assigned you the corrective action" : "assigned"} <Emphasis>“{action}”</Emphasis> for <Emphasis>{report}</Emphasis>{context.project ? <> in <Emphasis>{context.project}</Emphasis></> : null}.</>;
  if (type === "INCIDENT_CORRECTIVE_ACTION_OVERDUE") return <>Your corrective action <Emphasis>“{action}”</Emphasis> for <Emphasis>{report}</Emphasis> is overdue.</>;
  if (type === "INCIDENT_CORRECTIVE_ACTION_ACKNOWLEDGED") return <><Emphasis>{acknowledgement.by || actor || "The assignee"}</Emphasis> acknowledged the corrective action <Emphasis>“{action}”</Emphasis> for <Emphasis>{report}</Emphasis>{acknowledgement.remarks ? <> and replied, “{acknowledgement.remarks}.”</> : "."}</>;
  if (type === "INCIDENT_WORKFLOW_LEVEL_ASSIGNED") return <>You were assigned to review <Emphasis>{report}</Emphasis>{context.project ? <> in <Emphasis>{context.project}</Emphasis></> : null}.</>;
  if (type === "INCIDENT_WORKFLOW_LEVEL_ACKNOWLEDGED") return <><Emphasis>{acknowledgement.by || actor || "The resolver"}</Emphasis> acknowledged the incident assignment for <Emphasis>{report}</Emphasis>{acknowledgement.remarks ? <> and replied, “{acknowledgement.remarks}.”</> : "."}</>;
  if (type === "PROJECT_APPROVAL_ASSIGNED") return <><Emphasis>{projectApprovalDetails(item).requester || "A user"}</Emphasis> submitted the new project request <Emphasis>“{project}”</Emphasis>. Please review and approve it.</>;
  if (type.includes("PROJECT") && type.includes("REJECTED")) return <>Your project request <Emphasis>“{project}”</Emphasis> was rejected{rejection.by ? <> by <Emphasis>{rejection.by}</Emphasis></> : null}.{rejection.remarks ? <> Reason: “{rejection.remarks}”</> : null}</>;
  if (type.includes("PROGRESS_UPDATE") && type.includes("APPROVED")) return <>Your progress update for <Emphasis>{project}</Emphasis> was approved{actor ? <> by <Emphasis>{actor}</Emphasis></> : null}.</>;
  if (type.includes("PROGRESS_UPDATE") && type.includes("REJECTED")) return <>Your progress update for <Emphasis>{project}</Emphasis> was rejected{rejection.by ? <> by <Emphasis>{rejection.by}</Emphasis></> : null}.{rejection.remarks ? <> Reason: “{rejection.remarks}”</> : null}</>;
  if (type === "PROGRESS_UPDATE_REQUEST_CANCELLED") return <>The progress update request for <Emphasis>{project}</Emphasis> was cancelled.</>;
  if (type === "PROGRESS_UPDATE_APPROVAL_ACKNOWLEDGED") return <><Emphasis>{acknowledgement.by || actor || "The reviewer"}</Emphasis> acknowledged the progress update for <Emphasis>{project}</Emphasis>{acknowledgement.remarks ? <> and replied, “{acknowledgement.remarks}.”</> : "."}</>;
  return <>{rejectionSummary(item, displayMessage(item).primary)}</>;
}

function targetUrl(item: UserNotification): string | null {
  const legacy = legacyPayload(item);
  const target = item.target || (legacy ? {
    resourceType: readableValue(legacy.actionId) ? "INCIDENT_ACTION" : "INCIDENT",
    projectId: readableValue(legacy.projectId),
    incidentId: readableValue(legacy.incidentId),
    actionId: readableValue(legacy.actionId),
    preferredTab: readableValue(legacy.preferredTab) || "overview",
  } : null);
  if (!target) return isApprovalNotice(item) ? "/myApprovals" : null;
  if (target.url?.startsWith("/")) return target.url;
  const progressRequestId = target.progressUpdateRequestId || target.requestId;
  if (item.type === "PROGRESS_UPDATE_APPROVAL_ASSIGNED") return `/myApprovals?${new URLSearchParams({ tab: "progress", ...(progressRequestId ? { requestId: progressRequestId } : {}) }).toString()}`;
  if (item.type === "PROGRESS_UPDATE_REQUEST_CANCELLED") return `/myApprovals?${new URLSearchParams({ tab: "progress", ...(progressRequestId ? { requestId: progressRequestId } : {}) }).toString()}`;
  if (item.type === "PROGRESS_UPDATE_APPROVAL_ACKNOWLEDGED") return `/myRequests?${new URLSearchParams({ tab: "progress", ...(progressRequestId ? { requestId: progressRequestId } : {}) }).toString()}`;
  if (item.type === "PROJECT_APPROVAL_ASSIGNED") return target.projectId ? `/approvals/${encodeURIComponent(target.projectId)}` : "/myApprovals";
  if (item.type === "PROJECT_APPROVAL_ACKNOWLEDGED") return target.projectId ? `/approvals/${encodeURIComponent(target.projectId)}?source=my-requests` : "/myRequests";
  if (target.projectId && target.incidentId) {
    const query = new URLSearchParams({ view: "incident-reports", incidentId: target.incidentId });
    const isAction = item.type === "INCIDENT_CORRECTIVE_ACTION_ACKNOWLEDGED" || Boolean(target.actionId) || target.resourceType === "INCIDENT_ACTION" || target.resourceType === "CORRECTIVE_ACTION";
    const workflowAcknowledged = item.type === "INCIDENT_WORKFLOW_LEVEL_ACKNOWLEDGED";
    query.set("incidentTab", isAction ? "actions" : workflowAcknowledged ? "workflow" : (target.preferredTab || "workflow"));
    if (target.actionId) query.set("actionId", target.actionId);
    return `/projectDashboard/${encodeURIComponent(target.projectId)}?${query.toString()}`;
  }
  if (target.resourceType === "PROJECT_APPROVAL" && target.projectId) return `/approvals/${encodeURIComponent(target.projectId)}`;
  if (target.resourceType === "PROJECT_REQUEST") return "/myRequests";
  if (target.resourceType === "PROGRESS_UPDATE") return "/myApprovals";
  if (target.projectId) return `/projectDashboard/${encodeURIComponent(target.projectId)}`;
  return isApprovalNotice(item) ? "/myApprovals" : null;
}

function actionLabel(item: UserNotification): string {
  const resourceType = item.target?.resourceType || "";
  if (item.type === "PROGRESS_UPDATE_APPROVAL_ASSIGNED") return "Review progress update";
  if (item.type === "PROGRESS_UPDATE_REQUEST_CANCELLED") return "View cancelled request";
  if (item.type === "PROGRESS_UPDATE_APPROVAL_ACKNOWLEDGED" || item.category === "PROGRESS_UPDATE" || resourceType === "PROGRESS_UPDATE") return "View progress update";
  if (item.type === "PROJECT_APPROVAL_ASSIGNED" || resourceType === "PROJECT_APPROVAL") return "Review approval";
  if (item.type === "PROJECT_APPROVAL_ACKNOWLEDGED" || resourceType === "PROJECT_REQUEST") return "View project request";
  if (item.type === "INCIDENT_CORRECTIVE_ACTION_ACKNOWLEDGED" || item.target?.actionId || resourceType === "INCIDENT_ACTION" || resourceType === "CORRECTIVE_ACTION") return "Review action";
  if (item.type === "INCIDENT_WORKFLOW_LEVEL_ACKNOWLEDGED" || item.category === "INCIDENT" || resourceType === "INCIDENT") return "Review incident";
  return "View details";
}

export default function NotificationCenter() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState(emptySummary);
  const [items, setItems] = useState<UserNotification[]>([]);
  const [state, setState] = useState<NotificationState>("ALL");
  const [category, setCategory] = useState<NotificationCategory | "">("");
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [ackComposerId, setAckComposerId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");
  const lastSummaryAt = useRef(0);

  const loadSummary = useCallback(async (force = false) => {
    try {
      const nextSummary = await notificationService.summary(force);
      setSummary(nextSummary);
      lastSummaryAt.current = Date.now();
    } catch { /* Header remains usable if notifications are unavailable. */ }
  }, []);
  const loadList = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError("");
    try {
      const result = await notificationService.list({ page, limit: 10, state, category, search: searchQuery });
      const visibleNotifications = result.data.filter(isVisibleNotification);
      const hiddenOnPage = result.data.length - visibleNotifications.length;
      const enriched = await Promise.all(visibleNotifications.map(async (item) => {
        const existing = notificationContext(item);
        const incidentId = notificationIncidentId(item);
        if (!incidentId || (existing.incident && existing.reporter)) return item;
        try {
          const incident = await incidentService.get(incidentId);
          return { ...item, metadata: { ...item.metadata, incidentTitle: existing.incident || incident.title, reporterName: existing.reporter || incident.reportedBy?.name } };
        } catch { return item; }
      }));
      const visibleTotal = Math.max(0, result.pagination.total - hiddenOnPage);
      setItems(enriched); setTotal(visibleTotal); setTotalPages(visibleTotal === 0 ? 1 : Math.max(1, Math.ceil(visibleTotal / result.pagination.limit)));
    } catch (value) { setError(workflowError(value).message); }
    finally { if (showLoading) setLoading(false); }
  }, [page, state, category, searchQuery]);

  useEffect(() => {
    void loadSummary();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadSummary();
    }, 300000);
    const refreshWhenStale = () => {
      if (document.visibilityState === "visible" && Date.now() - lastSummaryAt.current >= 60000) void loadSummary();
    };
    document.addEventListener("visibilitychange", refreshWhenStale);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", refreshWhenStale); };
  }, [loadSummary]);
  useEffect(() => { if (open) void loadList(); }, [open, loadList]);
  useEffect(() => { if (open) void loadSummary(true); }, [open, loadSummary]);
  useEffect(() => { const timer = window.setTimeout(() => { setPage(1); setSearchQuery(search.trim()); }, 350); return () => window.clearTimeout(timer); }, [search]);

  const refresh = async () => { await Promise.all([loadList(false), loadSummary(true)]); };
  const mutate = async (id: string, action: () => Promise<unknown>) => {
    setBusyId(id); setError("");
    try { await action(); await refresh(); }
    catch (value) { setError(workflowError(value).message); }
    finally { setBusyId(null); }
  };
  const acknowledge = (item: UserNotification, response?: string) => {
    setAckComposerId(null); setRemarks("");
    void mutate(item.id, () => notificationService.acknowledge(item.id, response));
  };
  const openTarget = async (item: UserNotification) => {
    const url = targetUrl(item);
    if (!item.readAt && item.permissions.canRead) {
      try { await notificationService.markRead(item.id); await loadSummary(true); }
      catch (value) { setError(workflowError(value).message); return; }
    }
    if (url) { setOpen(false); router.push(url); }
    else { await loadList(); }
  };
  const activeLabel = useMemo(() => states.find((item) => item.value === state)?.label, [state]);

  return <>
    <Tooltip title="Notifications">
      <IconButton aria-label={`${summary.unreadCount} unread notifications`} onClick={() => setOpen(true)} sx={{ color: "#374151" }}>
        <Badge badgeContent={summary.unreadCount} color="error" max={99}><NotificationsNoneOutlinedIcon sx={{ fontSize: 22 }} /></Badge>
      </IconButton>
    </Tooltip>
    <Drawer anchor="right" open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { width: { xs: "100%", sm: 420 }, bgcolor: "white" } }}>
      <Box sx={{ display: "flex", alignItems: "center", px: 2, py: 1.25, bgcolor: "white", borderBottom: "1px solid #e5e7eb" }}>
        <Box sx={{ flex: 1 }}><Typography fontSize="1.05rem" fontWeight={700}>Notifications</Typography><Typography variant="caption" color="text.secondary">{summary.unreadCount} unread{summary.unacknowledgedCount > 0 ? ` · ${summary.unacknowledgedCount} awaiting reply` : ""}</Typography></Box>
        <IconButton aria-label="Close notifications" onClick={() => setOpen(false)}><CloseIcon /></IconButton>
      </Box>
      <Tabs value={state} onChange={(_, value: NotificationState) => { setState(value); setPage(1); }} variant="scrollable" scrollButtons="auto" sx={{ bgcolor: "white", borderBottom: "1px solid #e5e7eb", minHeight: 40, "& .MuiTab-root": { minHeight: 40, minWidth: "auto", textTransform: "none", fontWeight: 600, fontSize: 12.5, px: 1.5 } }}>
        {states.map((item) => <Tab key={item.value} value={item.value} label={item.label} />)}
      </Tabs>
      <Box sx={{ px: 1.5, py: 1, bgcolor: "white", borderBottom: "1px solid #e5e7eb" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <TextField size="small" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search notifications" fullWidth />
          <FormControl size="small" sx={{ minWidth: 155 }}><Select value={category} onChange={(event) => { setCategory(event.target.value as NotificationCategory | ""); setPage(1); }}>{categories.map((item) => <MenuItem key={item.value || "all"} value={item.value}>{item.label}</MenuItem>)}</Select></FormControl>
        </Stack>
        <Stack direction="row" spacing={0.75} mt={0.75}>
          {state !== "ARCHIVED" && <Button size="small" startIcon={<DoneAllIcon />} onClick={() => void mutate("all-read", () => notificationService.markAllRead(category || undefined))}>Mark all read</Button>}
          {state !== "ARCHIVED" && <Button size="small" startIcon={<ArchiveOutlinedIcon />} onClick={() => void mutate("archive-read", () => notificationService.archiveAll({ state: "READ", ...(category ? { category } : {}) }))}>Archive read</Button>}
        </Stack>
      </Box>
      {error && <Alert severity="error" onClose={() => setError("")} sx={{ m: 2, mb: 0 }}>{error}</Alert>}
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", bgcolor: "white" }}>
        {loading ? <Box sx={{ py: 8, textAlign: "center" }}><CircularProgress size={28} /></Box> : items.length === 0 ? <Box sx={{ py: 9, textAlign: "center" }}><Typography fontWeight={700}>{state === "ALL" ? "No notifications" : `No ${activeLabel?.toLowerCase()} notifications`}</Typography><Typography variant="body2" color="text.secondary" mt={0.5}>Notifications matching this view will appear here.</Typography></Box> : <Stack spacing={0}>
          {items.map((item) => {
            const unread = !item.readAt;
            const needsAck = item.requiresAcknowledgement && !item.acknowledgedAt;
            const navigable = Boolean(targetUrl(item));
            const rejected = isRejectedNotice(item);
            const cancelled = isCancelledNotice(item);
            const iconColor = rejected ? "#DC2626" : cancelled ? "#64748B" : isApprovalNotice(item) ? "#7C3AED" : isCorrectiveActionNotice(item) ? "#D97706" : "#2563EB";
            return <Box key={item.id} onClick={() => void openTarget(item)} sx={{ position: "relative", bgcolor: unread ? "#F3F5FF" : "white", borderBottom: "1px solid #E5E7EB", pl: 7, pr: 1.5, py: 1.35, cursor: navigable ? "pointer" : "default", WebkitTapHighlightColor: "transparent", transition: "background-color 180ms ease", "&:hover": { bgcolor: navigable ? (unread ? "#ECEFFF" : "#F8FAFC") : undefined }, "&:hover .notification-actions, &:focus-within .notification-actions": { opacity: 1, transform: "translateX(0)", pointerEvents: "auto" } }}>
              <Box sx={{ position: "absolute", left: 16, top: 16, width: 30, height: 30, borderRadius: "50%", bgcolor: `${iconColor}14`, color: iconColor, display: "grid", placeItems: "center" }}><NotificationsNoneOutlinedIcon sx={{ fontSize: 17 }} /></Box>
              <Typography component="div" variant="body2" sx={{ color: unread ? "#17134F" : "#374151", lineHeight: 1.45, overflowWrap: "anywhere", fontWeight: unread ? 500 : 400 }}>
                {notificationSentence(item)}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.5} mt={0.45}>
                <Typography variant="caption" color="text.secondary">{formatDate(item.createdAt)}</Typography>
                <Box sx={{ flex: 1 }} />
                <Box className="notification-actions" sx={{ display: "flex", alignItems: "center", gap: 0.15, opacity: { xs: 1, sm: 0 }, transform: { xs: "none", sm: "translateX(5px)" }, pointerEvents: { xs: "auto", sm: "none" }, transition: "opacity 160ms ease, transform 160ms ease" }}>
                  {navigable && <Tooltip title={actionLabel(item)}><IconButton disableRipple size="small" aria-label={actionLabel(item)} onClick={(event) => { event.stopPropagation(); void openTarget(item); }} sx={{ color: "#24106F", borderRadius: 0.75, p: 0.45, "&:hover": { bgcolor: "rgba(36,16,111,.1)" } }}><VisibilityOutlinedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>}
                  {item.archivedAt ? <Tooltip title="Restore"><IconButton disableRipple size="small" aria-label="Restore notification" disabled={busyId === item.id} onClick={(event) => { event.stopPropagation(); void mutate(item.id, () => notificationService.restore(item.id)); }} sx={{ borderRadius: 0.75, p: 0.45 }}><UnarchiveOutlinedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip> : item.permissions.canArchive && <Tooltip title="Archive"><IconButton disableRipple size="small" aria-label="Archive notification" disabled={busyId === item.id} onClick={(event) => { event.stopPropagation(); void mutate(item.id, () => notificationService.archive(item.id)); }} sx={{ borderRadius: 0.75, p: 0.45 }}><ArchiveOutlinedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>}
                </Box>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.75} mt={0.45} flexWrap="wrap" useFlexGap>
                {needsAck && <Typography variant="caption" fontWeight={700} sx={{ color: "#64748b" }}>Reply requested</Typography>}
                <Box sx={{ flex: 1 }} />
                {needsAck && item.permissions.canAcknowledge && <Button disableRipple size="small" variant="text" disabled={busyId === item.id} onClick={(event) => { event.stopPropagation(); setRemarks(""); setAckComposerId((current) => current === item.id ? null : item.id); }} sx={{ minWidth: 0, px: 0.75 }}>Reply</Button>}
              </Stack>
              <Collapse in={ackComposerId === item.id} timeout={260} unmountOnExit>
                <Box onClick={(event) => event.stopPropagation()} sx={{ mt: 0.75, pt: 0.75, borderTop: "1px solid #FCD34D", animation: "acknowledgementFade 260ms ease-out", "@keyframes acknowledgementFade": { from: { opacity: 0, transform: "translateY(-4px)" }, to: { opacity: 1, transform: "translateY(0)" } } }}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary">Quick reply</Typography>
                  <Stack direction="row" spacing={0.5} mt={0.5} flexWrap="wrap" useFlexGap>
                    {["Noted", "On it", "Will review"].map((response) => <Button disableRipple key={response} size="small" variant="outlined" disabled={busyId === item.id} onClick={() => acknowledge(item, response)} sx={{ minWidth: 0, px: 1 }}>{response}</Button>)}
                  </Stack>
                  <Stack direction="row" spacing={0.5} mt={0.75}>
                    <TextField size="small" fullWidth placeholder="Custom response (optional)" value={remarks} onChange={(event) => setRemarks(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && remarks.trim()) acknowledge(item, remarks); }} />
                    <Button disableRipple size="small" variant="contained" disabled={busyId === item.id || !remarks.trim()} onClick={() => acknowledge(item, remarks)}>Send</Button>
                  </Stack>
                </Box>
              </Collapse>
            </Box>;
          })}
        </Stack>}
      </Box>
      <Box sx={{ bgcolor: "white", borderTop: "1px solid #e5e7eb", px: 2, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}><Typography variant="caption" color="text.secondary">{total} notification{total === 1 ? "" : "s"}</Typography><Pagination count={totalPages} page={Math.min(page, totalPages)} onChange={(_, value) => setPage(value)} size="small" siblingCount={0} /></Box>
    </Drawer>
  </>;
}
