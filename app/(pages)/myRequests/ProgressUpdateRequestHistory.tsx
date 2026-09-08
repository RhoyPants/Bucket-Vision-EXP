"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Alert, Box, Button, Chip, CircularProgress, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Pagination } from "@mui/material";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  cancelProgressUpdateRequest,
  ProgressUpdateRequest,
  ProgressUpdateRequestStatus,
} from "@/app/api-service/progressUpdateRequestService";
import ProgressCalendarModal from "@/app/components/shared/modals/ProgressCalendarModal";
import ConfirmationModal from "@/app/components/shared/modals/ConfirmationModal";
import WorkflowResultModal from "@/app/components/shared/modals/WorkflowResultModal";
import { notifyProgressUpdate } from "@/app/utils/progressUpdateEmailNotification";
import { brandColors } from "@/app/lib/theme";
import axiosApi from "@/app/lib/axios";

type StatusFilter = "ALL" | ProgressUpdateRequestStatus;

const displayPercent = (value: string | number | undefined) => Number(value ?? 0).toFixed(2);
const messageFrom = (error: any, fallback: string) => error?.response?.data?.message || error?.message || fallback;

const statusLegendItems = [
  { label: "Pending", color: "#F97316", value: "PENDING" as const },
  { label: "Approved", color: "#34D399", value: "APPROVED" as const },
  { label: "Rejected", color: "#FB7185", value: "REJECTED" as const },
  { label: "Cancelled", color: "#A0A0A0", value: "CANCELLED" as const },
  { label: "Applied", color: "#60A5FA", value: "APPLIED" as const },
];

export default function ProgressUpdateRequestHistory() {
  const [requests, setRequests] = useState<ProgressUpdateRequest[]>([]);
  const [status, setStatus] = useState<StatusFilter>("PENDING");
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [progressTarget, setProgressTarget] = useState<{ subtaskId: string; date?: string } | null>(null);
  const [cancelTarget, setCancelTarget] = useState<ProgressUpdateRequest | null>(null);
  const [cancelledResultOpen, setCancelledResultOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const load = useCallback(async (pageNum: number = 1) => {
    setLoading(true);
    setError("");
    try {
      const response = await axiosApi.get("/progress/update-requests/mine", {
        params: {
          status: status === "ALL" ? undefined : status,
          page: pageNum,
          limit: pageLimit,
        },
      });
      const data = response.data?.data || [];
      const paginationData = response.data?.pagination || { page: 1, limit: pageLimit, total: data.length, totalPages: 1 };
      setRequests(data);
      setPagination(paginationData);
    } catch (requestError: any) {
      setError(messageFrom(requestError, "Unable to load your progress update requests."));
    } finally {
      setLoading(false);
    }
  }, [pageLimit, status]);

  useEffect(() => { void load(page); }, [load, page]);

  const sorted = useMemo(
    () => [...requests].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()),
    [requests],
  );

  const cancel = async (request: ProgressUpdateRequest) => {
    setCancellingId(request.id);
    setError("");
    try {
      const actionResult = await cancelProgressUpdateRequest(request.id);
      try {
        await notifyProgressUpdate("CANCELLED", { ...request, ...(actionResult?.data || actionResult || {}) });
      } catch (emailError) {
        console.warn("Progress cancellation email notification failed:", emailError);
      }
      setCancelledResultOpen(true);
      setCancelTarget(null);
      await load(page);
    } catch (requestError: any) {
      setError(messageFrom(requestError, "Unable to cancel this request."));
    } finally {
      setCancellingId(null);
    }
  };

  const handleStatusLegendClick = (selectedValue: ProgressUpdateRequestStatus) => {
    setStatus(status === selectedValue ? "ALL" : selectedValue);
    setPage(1);
  };

  const statusLegend = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        columnGap: { xs: 1.25, sm: 1.75 },
        rowGap: 0.5,
        minWidth: 0,
        mb: 2,
        mt: 1.5,
      }}
    >
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: brandColors.deepTwilightLight, whiteSpace: "nowrap" }}>
        Status
      </Typography>
      {statusLegendItems.map((item) => (
        <Stack
          key={item.label}
          component="button"
          type="button"
          direction="row"
          spacing={0.5}
          alignItems="center"
          aria-pressed={status === item.value}
          onClick={() => handleStatusLegendClick(item.value)}
          sx={{
            p: 0.45,
            mx: -0.45,
            border: 0,
            borderRadius: 1,
            bgcolor: status === item.value ? "#F1F0FF" : "transparent",
            cursor: "pointer",
            font: "inherit",
            "&:hover": { bgcolor: "#F8F7FF" },
            "&:focus-visible": { outline: "2px solid #686AF3", outlineOffset: 1 },
          }}
        >
          <Box
            sx={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              backgroundColor: item.color,
              border: "1px solid rgba(15, 23, 42, 0.12)",
              flexShrink: 0,
            }}
          />
          <Typography sx={{ fontSize: 11.25, lineHeight: 1.2, color: status === item.value ? brandColors.deepTwilight : "#6B6880", fontWeight: status === item.value ? 750 : 400, whiteSpace: "nowrap" }}>
            {item.label}
          </Typography>
        </Stack>
      ))}
    </Box>
  );

  return (
    <Box>
      <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: "1px solid #E8E3F5", borderRadius: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.5}>
          <Box>
            <Typography sx={{ color: "#210E64", fontWeight: 800 }}>My progress update requests</Typography>
            <Typography sx={{ color: "#6B6880", fontSize: 13 }}>Track decreases submitted for BU Head approval and cancel pending requests.</Typography>
          </Box>
          <TextField select size="small" label="Status" value={status} onChange={(event) => { setStatus(event.target.value as StatusFilter); setPage(1); }} sx={{ minWidth: 180 }}>
            {(["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED", "APPLIED"] as StatusFilter[]).map((item) => <MenuItem key={item} value={item}>{item === "ALL" ? "All statuses" : item.charAt(0) + item.slice(1).toLowerCase()}</MenuItem>)}
          </TextField>
        </Stack>
      </Paper>
      {statusLegend}
      {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess("")} sx={{ mb: 2 }}>{success}</Alert>}
      {loading ? (
        <Box sx={{ py: 8, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper elevation={0} sx={{ border: `1px solid ${brandColors.lavender}`, borderRadius: 2, minHeight: 460, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <TableContainer sx={{ flex: 1, minHeight: 0, overflowX: "auto", overflowY: "auto" }}>
          <Table sx={{ minWidth: 1200, tableLayout: "fixed", "& .MuiTableCell-root": { px: { xs: 1.25, md: 1.75 } }, "& .MuiTableCell-root:not(:last-child)": { borderRight: `1px solid ${brandColors.lavender}` } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ py: 1.1, fontSize: 11, fontWeight: 600, color: brandColors.deepTwilightLight, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${brandColors.lavender}`, whiteSpace: "nowrap", bgcolor: brandColors.aliceBlue, width: "18%" }}>Subtask</TableCell>
                <TableCell sx={{ py: 1.1, fontSize: 11, fontWeight: 600, color: brandColors.deepTwilightLight, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${brandColors.lavender}`, whiteSpace: "nowrap", bgcolor: brandColors.aliceBlue, width: "28%" }}>Project / Scope / Task</TableCell>
                <TableCell sx={{ py: 1.1, fontSize: 11, fontWeight: 600, color: brandColors.deepTwilightLight, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${brandColors.lavender}`, whiteSpace: "nowrap", bgcolor: brandColors.aliceBlue, width: "14%" }}>Approver</TableCell>
                <TableCell sx={{ py: 1.1, fontSize: 11, fontWeight: 600, color: brandColors.deepTwilightLight, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${brandColors.lavender}`, whiteSpace: "nowrap", bgcolor: brandColors.aliceBlue, width: "12%" }}>Affected Date</TableCell>
                <TableCell sx={{ py: 1.1, fontSize: 11, fontWeight: 600, color: brandColors.deepTwilightLight, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${brandColors.lavender}`, whiteSpace: "nowrap", bgcolor: brandColors.aliceBlue, width: "12%" }}>Change</TableCell>
                <TableCell sx={{ py: 1.1, fontSize: 11, fontWeight: 600, color: brandColors.deepTwilightLight, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${brandColors.lavender}`, whiteSpace: "nowrap", bgcolor: brandColors.aliceBlue, width: "10%" }}>Status</TableCell>
                <TableCell sx={{ py: 1.1, fontSize: 11, fontWeight: 600, color: brandColors.deepTwilightLight, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${brandColors.lavender}`, whiteSpace: "nowrap", bgcolor: brandColors.aliceBlue, width: "16%" }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.length === 0 && <TableRow><TableCell colSpan={7} sx={{ height: 280, textAlign: "center", border: 0 }}><Typography sx={{ fontWeight: 800 }}>No progress update requests</Typography><Typography sx={{ mt: 0.5, color: "#777186", fontSize: 13 }}>Your submitted progress corrections will appear here.</Typography></TableCell></TableRow>}
              {sorted.map((request) => (
                <TableRow key={request.id} hover sx={{ bgcolor: "#FFFFFF", "&:hover": { bgcolor: `${brandColors.lavenderMist} !important` } }}>
                  <TableCell sx={{ py: 1, height: 52, fontSize: 12.5, color: "#3F3B4D", borderBottom: `1px solid ${brandColors.lavenderMist}`, fontWeight: 600 }}>
                    {request.subtask?.title || request.progressLog?.subtask?.title || "Untitled subtask"}
                  </TableCell>
                  <TableCell sx={{ py: 1, height: 52, fontSize: 12.5, color: "#3F3B4D", borderBottom: `1px solid ${brandColors.lavenderMist}` }}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, mb: 0.25 }}>{request.project?.name || "Project not provided"}</Typography>
                    <Typography sx={{ fontSize: 11, color: "#666" }}>{request.scope?.name || "Scope not provided"} · {request.task?.title || request.task?.name || "Task not provided"}</Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1, height: 52, fontSize: 12.5, color: "#3F3B4D", borderBottom: `1px solid ${brandColors.lavenderMist}` }}>
                    {request.assignedApprover?.name || request.assignedBuHead?.name || "Assigned BU Head"}
                  </TableCell>
                  <TableCell sx={{ py: 1, height: 52, fontSize: 12.5, color: request.progressLog?.date ? "#3F3B4D" : "#d32f2f", borderBottom: `1px solid ${brandColors.lavenderMist}`, whiteSpace: "nowrap", fontWeight: 600 }}>
                    {request.progressLog?.date ? dayjs(request.progressLog.date).format("MMM DD, YYYY") : "Missing"}
                  </TableCell>
                  <TableCell sx={{ py: 1, height: 52, fontSize: 12.5, color: "#B42318", borderBottom: `1px solid ${brandColors.lavenderMist}`, whiteSpace: "nowrap", fontWeight: 700 }}>
                    {displayPercent(request.currentPercent)}% → {displayPercent(request.requestedPercent)}%
                  </TableCell>
                  <TableCell sx={{ py: 1, height: 52, fontSize: 12.5, color: "#3F3B4D", borderBottom: `1px solid ${brandColors.lavenderMist}` }}>
                    <Chip size="small" label={request.status} color={request.status === "PENDING" ? "warning" : request.status === "APPROVED" ? "success" : request.status === "REJECTED" ? "error" : "default"} sx={{ fontWeight: 600 }} />
                  </TableCell>
                  <TableCell sx={{ py: 1, height: 52, fontSize: 12.5, color: "#3F3B4D", borderBottom: `1px solid ${brandColors.lavenderMist}` }}>
                    {request.status === "PENDING" ? (
                      <Stack direction="row" spacing={0.5}>
                        {request.progressLog?.subtaskId && (
                          <Button size="small" startIcon={<OpenInNewIcon />} onClick={() => setProgressTarget({ subtaskId: request.progressLog!.subtaskId, date: request.progressLog!.date })} sx={{ fontSize: 11 }}>
                            View
                          </Button>
                        )}
                        {request.canCancel === true && (
                          <Button size="small" color="error" startIcon={<CancelOutlinedIcon />} disabled={cancellingId === request.id} onClick={() => setCancelTarget(request)} sx={{ fontSize: 11 }}>
                            Cancel
                          </Button>
                        )}
                      </Stack>
                    ) : request.status === "APPROVED" ? (
                      <Stack spacing={0.25}>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#388E3C" }}>✓ Approved</Typography>
                        {request.reviewedBy?.name && (
                          <Typography sx={{ fontSize: 11, color: "#666" }}>by {request.reviewedBy.name}</Typography>
                        )}
                        {request.reviewedAt && (
                          <Typography sx={{ fontSize: 10, color: "#999" }}>{dayjs(request.reviewedAt).format("MMM DD, YYYY")}</Typography>
                        )}
                      </Stack>
                    ) : request.status === "REJECTED" ? (
                      <Stack spacing={0.25}>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#D32F2F" }}>✗ Rejected</Typography>
                        {request.reviewedBy?.name && (
                          <Typography sx={{ fontSize: 11, color: "#666" }}>by {request.reviewedBy.name}</Typography>
                        )}
                        {request.reviewedAt && (
                          <Typography sx={{ fontSize: 10, color: "#999" }}>{dayjs(request.reviewedAt).format("MMM DD, YYYY")}</Typography>
                        )}
                      </Stack>
                    ) : request.status === "CANCELLED" ? (
                      <Stack spacing={0.25}>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#757575" }}>⊘ Cancelled</Typography>
                        {request.requestedBy?.name && (
                          <Typography sx={{ fontSize: 11, color: "#666" }}>by {request.requestedBy.name}</Typography>
                        )}
                        {request.cancelledAt && (
                          <Typography sx={{ fontSize: 10, color: "#999" }}>{dayjs(request.cancelledAt).format("MMM DD, YYYY")}</Typography>
                        )}
                      </Stack>
                    ) : request.status === "APPLIED" ? (
                      <Stack spacing={0.25}>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#1976d2" }}>→ Applied</Typography>
                        {request.appliedAt && (
                          <Typography sx={{ fontSize: 10, color: "#999" }}>{dayjs(request.appliedAt).format("MMM DD, YYYY")}</Typography>
                        )}
                      </Stack>
                    ) : (
                      <Typography sx={{ fontSize: 12, color: "#999" }}>—</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </TableContainer>
          <Box sx={{ mt: "auto", px: 2, py: 1.25, bgcolor: brandColors.aliceBlue, borderTop: `1px solid ${brandColors.lavender}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: brandColors.deepTwilightLight }}>
              Showing {pagination.total ? (page - 1) * pageLimit + 1 : 0}–{Math.min(page * pageLimit, pagination.total)} of {pagination.total}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField select size="small" label="Per page" value={pageLimit} onChange={(event) => { setPageLimit(Number(event.target.value)); setPage(1); }} sx={{ width: 90 }}>{[10, 20, 50].map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}</TextField>
              <Pagination
                count={Math.max(1, pagination.totalPages)}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                size="small"
                sx={{ "& .MuiPaginationItem-root": { fontSize: 12 } }}
              />
            </Stack>
          </Box>
        </Paper>
      )}
      {progressTarget && <ProgressCalendarModal open subtaskId={progressTarget.subtaskId} initialDate={progressTarget.date} onClose={() => setProgressTarget(null)} onSuccess={() => void load(page)} />}
      <ConfirmationModal open={Boolean(cancelTarget)} title="Cancel progress request?" message="The pending decrease request will be cancelled. Applied progress will remain unchanged, and the assigned BU Head will be notified." confirmLabel="Cancel request" danger loading={Boolean(cancellingId)} onClose={() => setCancelTarget(null)} onConfirm={() => { if (cancelTarget) void cancel(cancelTarget); }} />
      <WorkflowResultModal open={cancelledResultOpen} title="Progress Request Cancelled" message="The progress decrease request was successfully cancelled." helperText="Existing progress remains unchanged. The assigned BU Head has been notified." buttonLabel="Back to My Requests" tone="neutral" onClose={() => setCancelledResultOpen(false)} />
    </Box>
  );
}
