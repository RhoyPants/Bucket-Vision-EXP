"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  Paper,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  approveProgressUpdateRequest,
  getProgressUpdateRequestInboxPage,
  ProgressUpdateRequest,
  ProgressUpdateRequestStatus,
  rejectProgressUpdateRequest,
} from "@/app/api-service/progressUpdateRequestService";
import ProgressCalendarModal from "@/app/components/shared/modals/ProgressCalendarModal";
import ConfirmationModal from "@/app/components/shared/modals/ConfirmationModal";
import WorkflowResultModal from "@/app/components/shared/modals/WorkflowResultModal";
import { notifyProgressUpdate } from "@/app/utils/progressUpdateEmailNotification";
import { useAppDispatch } from "@/app/redux/hook";
import { decrementProgressUpdateCount } from "@/app/redux/slices/notificationCountSlice";
import { brandColors } from "@/app/lib/theme";

const statusColors: Record<ProgressUpdateRequestStatus, "warning" | "info" | "success" | "error" | "default"> = {
  PENDING: "warning",
  APPLIED: "info",
  APPROVED: "success",
  REJECTED: "error",
  CANCELLED: "default",
};

const percent = (value: string | number | undefined) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number.toFixed(2) : "0.00";
};

const apiMessage = (error: any, fallback: string) =>
  error?.response?.data?.message || error?.message || fallback;

const progressDate = (request: ProgressUpdateRequest) => request.progressLog?.date;

export default function ProgressUpdateRequestsPanel() {
  const dispatch = useAppDispatch();
  const [requests, setRequests] = useState<ProgressUpdateRequest[]>([]);
  const [status, setStatus] = useState<ProgressUpdateRequestStatus>("PENDING");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selected, setSelected] = useState<ProgressUpdateRequest | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [confirmDecision, setConfirmDecision] = useState<"approve" | "reject" | null>(null);
  const [resultAction, setResultAction] = useState<"approved" | "rejected" | null>(null);
  const [progressTarget, setProgressTarget] = useState<{ subtaskId: string; date?: string } | null>(null);
  const [page, setPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getProgressUpdateRequestInboxPage(status, page, pageLimit, debouncedSearch);
      setRequests(result.data);
      setPagination(result.pagination);
    } catch (requestError: any) {
      setError(apiMessage(requestError, "Unable to load progress update requests."));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, pageLimit, status]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return requests;
    return requests.filter((request) =>
      [
        request.context?.projectName,
        request.context?.scopeName,
        request.context?.taskName,
        request.progressLog?.subtask?.title,
        request.requestedBy?.name,
        request.requestedBy?.email,
        request.remarks,
      ].some((value) => String(value || "").toLowerCase().includes(query)),
    );
  }, [requests, search]);

  const totalPages = Math.max(1, pagination.totalPages);
  const paginatedRequests = filtered;

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const hierarchy = (request: ProgressUpdateRequest) => {
    const subtask = request.progressLog?.subtask;
    return {
      project: request.project?.name || request.context?.projectName || subtask?.task?.scope?.project?.name || "Project not provided",
      scope: request.scope?.name || request.context?.scopeName || subtask?.task?.scope?.name || "Scope not provided",
      task: request.task?.title || request.task?.name || request.context?.taskName || subtask?.task?.title || "Task not provided",
    };
  };

  const approverName = (request: ProgressUpdateRequest) =>
    request.assignedApprover?.name || request.assignedBuHead?.name || "Assigned BU Head not provided by API";

  const closeReview = () => {
    if (actionLoading) return;
    setSelected(null);
    setReviewRemarks("");
  };

  const review = async (decision: "approve" | "reject") => {
    if (!selected) return;
    if (decision === "reject" && !reviewRemarks.trim()) {
      setError("A rejection reason is required.");
      return;
    }

    setActionLoading(true);
    setError("");
    try {
      let actionResult: any;
      if (decision === "approve") {
        actionResult = await approveProgressUpdateRequest(selected.id, reviewRemarks);
        setResultAction("approved");
      } else {
        actionResult = await rejectProgressUpdateRequest(selected.id, reviewRemarks);
        setResultAction("rejected");
      }
      try {
        await notifyProgressUpdate(decision === "approve" ? "APPROVED" : "REJECTED", {
          ...selected,
          ...(actionResult?.data || actionResult || {}),
          reviewRemarks: reviewRemarks.trim() || selected.reviewRemarks,
        });
      } catch (emailError) {
        console.warn("Progress decision email notification failed:", emailError);
      }
      dispatch(decrementProgressUpdateCount());
      setConfirmDecision(null);
      setSelected(null);
      setReviewRemarks("");
      await loadRequests();
    } catch (requestError: any) {
      setError(apiMessage(requestError, `Unable to ${decision} this request.`));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box>
      <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, mb: 2, border: "1px solid #E8E3F5", borderRadius: 3 }}>
        <Typography sx={{ color: "#210E64", fontSize: 16, fontWeight: 800 }}>Progress update approvals</Typography>
        <Typography sx={{ color: "#6B6880", fontSize: 13, mt: 0.25 }}>
          Review requested decreases. Progress stays unchanged until the assigned BU Head approves.
        </Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mt: 2 }}>
          <TextField
            size="small"
            placeholder="Search subtask or requester"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
            sx={{ flex: 1 }}
          />
          <TextField select size="small" label="Status" value={status} onChange={(event) => { setStatus(event.target.value as ProgressUpdateRequestStatus); setPage(1); }} sx={{ minWidth: 190 }}>
            {(["PENDING", "APPROVED", "REJECTED", "APPLIED", "CANCELLED"] as ProgressUpdateRequestStatus[]).map((item) => (
              <MenuItem key={item} value={item}>{item.charAt(0) + item.slice(1).toLowerCase()}</MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess("")} sx={{ mb: 2 }}>{success}</Alert>}

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 8 }}><CircularProgress /></Box>
      ) : (
        <Paper elevation={0} sx={{ border: `1px solid ${brandColors.lavender}`, borderRadius: 2, minHeight: 460, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <TableContainer sx={{ flex: 1, minHeight: 0, overflowX: "auto", overflowY: "auto" }}>
          <Table stickyHeader size="small" sx={{ minWidth: 1100, tableLayout: "fixed", "& .MuiTableCell-root:not(:last-child)": { borderRight: `1px solid ${brandColors.lavender}` } }}>
            <TableHead>
              <TableRow>{["SUBTASK", "PROJECT / SCOPE / TASK", "REQUESTER", "AFFECTED DATE", "CHANGE", "STATUS", "ACTION"].map((label) => <TableCell key={label} sx={{ bgcolor: "#EEF4FC", color: "#16045E", fontSize: 11, fontWeight: 900, py: 1.5 }}>{label}</TableCell>)}</TableRow>
            </TableHead>
            <TableBody>
              {paginatedRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} sx={{ height: 280, textAlign: "center", border: 0 }}>
                    <Typography sx={{ fontWeight: 800, color: "#403A55" }}>No {status.toLowerCase()} progress requests</Typography>
                    <Typography sx={{ mt: 0.5, fontSize: 13, color: "#777186" }}>Requests matching this status will appear here.</Typography>
                  </TableCell>
                </TableRow>
              )}
              {paginatedRequests.map((request) => (
                <TableRow key={request.id} hover sx={{ "& td": { borderColor: "#E3E6EF", py: 1.35 } }}>
                  <TableCell sx={{ fontWeight: 800 }}>{request.subtask?.title || request.progressLog?.subtask?.title || "Untitled subtask"}</TableCell>
                  <TableCell><Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>{hierarchy(request).project}</Typography><Typography sx={{ fontSize: 11.5, color: "#706A80" }}>{hierarchy(request).scope} · {hierarchy(request).task}</Typography></TableCell>
                  <TableCell>{request.requestedBy?.name || request.requestedBy?.email || "Unknown user"}</TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap", color: progressDate(request) ? "inherit" : "error.main" }}>{progressDate(request) ? dayjs(progressDate(request)).format("MMM DD, YYYY") : "Missing"}</TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap", color: "#B42318", fontWeight: 900 }}>{percent(request.currentPercent)}% → {percent(request.requestedPercent)}%</TableCell>
                  <TableCell><Chip size="small" label={request.status} color={statusColors[request.status]} /></TableCell>
                  <TableCell><Button size="small" variant="outlined" onClick={() => { setSelected(request); setReviewRemarks(""); setError(""); }}>Review</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </TableContainer>
          <Box sx={{ mt: "auto", px: 2, py: 1.25, bgcolor: brandColors.aliceBlue, borderTop: `1px solid ${brandColors.lavender}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: brandColors.deepTwilightLight, whiteSpace: "nowrap" }}>
              Showing {pagination.total ? (page - 1) * pageLimit + 1 : 0}–{Math.min(page * pageLimit, pagination.total)} of {pagination.total}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField select size="small" label="Per page" value={pageLimit} onChange={(event) => { setPageLimit(Number(event.target.value)); setPage(1); }} sx={{ width: 90 }}>
                {[10, 20, 50].map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}
              </TextField>
              <Pagination count={totalPages} page={page} onChange={(_, newPage) => setPage(newPage)} size="small" sx={{ "& .MuiPaginationItem-root": { fontSize: 12 } }} />
            </Stack>
          </Box>
        </Paper>
      )}

      <Dialog open={Boolean(selected)} onClose={closeReview} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>Progress decrease request</DialogTitle>
        <DialogContent dividers>
          {selected && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">Subtask</Typography>
                <Typography sx={{ fontWeight: 800 }}>{selected.subtask?.title || selected.progressLog?.subtask?.title || "Untitled subtask"}</Typography>
              </Box>
              <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "#FAFAFC" }}>
                <Stack spacing={0.5}>
                  <Typography variant="body2"><strong>Project:</strong> {hierarchy(selected).project}</Typography>
                  <Typography variant="body2"><strong>Scope:</strong> {hierarchy(selected).scope}</Typography>
                  <Typography variant="body2"><strong>Task:</strong> {hierarchy(selected).task}</Typography>
                  <Typography variant="body2"><strong>Assigned approver:</strong> {approverName(selected)}</Typography>
                  <Typography variant="body2" color={progressDate(selected) ? "text.primary" : "error.main"}><strong>Affected progress date:</strong> {progressDate(selected) ? dayjs(progressDate(selected)).format("MMMM DD, YYYY") : "Missing from API response"}</Typography>
                </Stack>
              </Paper>
              <Stack direction="row" spacing={1.5}>
                <Paper variant="outlined" sx={{ flex: 1, p: 1.5 }}><Typography variant="caption" color="text.secondary">Current entry</Typography><Typography sx={{ fontSize: 20, fontWeight: 900 }}>{percent(selected.currentPercent)}%</Typography></Paper>
                <Paper variant="outlined" sx={{ flex: 1, p: 1.5, borderColor: "#FDA29B" }}><Typography variant="caption" color="text.secondary">Requested entry</Typography><Typography sx={{ fontSize: 20, fontWeight: 900, color: "#B42318" }}>{percent(selected.requestedPercent)}%</Typography></Paper>
              </Stack>
              <Box><Typography variant="caption" color="text.secondary">Requester’s reason</Typography><Typography sx={{ whiteSpace: "pre-wrap" }}>{selected.remarks || "—"}</Typography></Box>
              {selected.progressLog?.subtaskId && (
                <Button startIcon={<OpenInNewIcon />} variant="outlined" onClick={() => setProgressTarget({ subtaskId: selected.progressLog!.subtaskId, date: selected.progressLog!.date })}>
                  View subtask progress
                </Button>
              )}
              {selected.status === "PENDING" && (
                <TextField multiline minRows={3} label="Review remarks" value={reviewRemarks} onChange={(event) => setReviewRemarks(event.target.value)} helperText="Optional for approval; required for rejection" />
              )}
              {selected.reviewRemarks && <Box><Typography variant="caption" color="text.secondary">Review remarks</Typography><Typography>{selected.reviewRemarks}</Typography></Box>}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeReview} disabled={actionLoading}>Close</Button>
          {selected?.status === "PENDING" && selected.canReview === true && <>
            <Button color="error" variant="outlined" startIcon={<CancelOutlinedIcon />} disabled={actionLoading || !reviewRemarks.trim()} onClick={() => setConfirmDecision("reject")}>Reject</Button>
            <Button color="success" variant="contained" startIcon={<CheckCircleOutlineIcon />} disabled={actionLoading} onClick={() => setConfirmDecision("approve")}>{actionLoading ? "Saving..." : "Approve"}</Button>
          </>}
        </DialogActions>
      </Dialog>

      {progressTarget && (
        <ProgressCalendarModal open onClose={() => setProgressTarget(null)} subtaskId={progressTarget.subtaskId} initialDate={progressTarget.date} onSuccess={() => void loadRequests()} />
      )}
      <ConfirmationModal
        open={Boolean(confirmDecision)}
        title={confirmDecision === "reject" ? "Reject progress request?" : "Approve progress request?"}
        message={confirmDecision === "reject" ? "The requested decrease will be rejected and the current progress will remain unchanged. The requester will be notified." : "The requested decrease will be applied and all parent progress values will be recalculated. The requester will be notified."}
        confirmLabel={confirmDecision === "reject" ? "Reject request" : "Approve request"}
        danger={confirmDecision === "reject"}
        loading={actionLoading}
        onClose={() => setConfirmDecision(null)}
        onConfirm={() => { if (confirmDecision) void review(confirmDecision); }}
      />
      <WorkflowResultModal
        open={Boolean(resultAction)}
        title={resultAction === "approved" ? "Progress Request Approved" : "Progress Request Rejected"}
        message={resultAction === "approved" ? "The progress decrease was successfully approved and applied." : "The progress decrease was successfully rejected. Existing progress was retained."}
        helperText="The requester has been notified."
        buttonLabel="Back to Progress Approvals"
        tone={resultAction === "approved" ? "success" : "error"}
        onClose={() => setResultAction(null)}
      />
    </Box>
  );
}
