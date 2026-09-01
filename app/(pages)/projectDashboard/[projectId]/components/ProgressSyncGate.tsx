"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import {
  getProgressSyncStatus,
  ProgressSyncItem,
  ProgressSyncResult,
  ProgressSyncStatus,
  syncVersionProgress,
} from "@/app/api-service/versioningService";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { fetchPersonalDashboardDetail } from "@/app/redux/controllers/personalDashboardController";

type Step = "welcome" | "summary" | "result" | "error";

const reasonLabel = (reason?: string) => {
  if (reason === "SOURCE_SUBTASK_REMOVED") return "The original subtask no longer exists in this version.";
  if (reason === "TARGET_PROGRESS_ALREADY_EXISTS") return "Progress from the same user and date already exists in this version.";
  return "This progress update needs manual attention.";
};

const formatDate = (value?: string) => {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

function AttentionList({ unmatched, conflicts }: { unmatched: ProgressSyncItem[]; conflicts: ProgressSyncItem[] }) {
  const items = [
    ...unmatched.map((item) => ({ ...item, kind: "Unmatched" })),
    ...conflicts.map((item) => ({ ...item, kind: "Conflict" })),
  ];
  if (!items.length) return null;
  return (
    <Stack spacing={1} sx={{ mt: 2 }}>
      {items.map((item, index) => (
        <Box key={item.sourceLogId || `${item.kind}-${index}`} sx={{ position: "relative", py: 1.5, pr: 1.5, pl: 2.5, border: "1px solid #E2E8F0", borderRadius: 1.5, bgcolor: "#FFFFFF", "&::before": { content: '""', position: "absolute", left: 10, top: 13, bottom: 13, width: 3, borderRadius: 1, bgcolor: "#D97706" } }}>
          <Stack direction="row" justifyContent="space-between" gap={1}>
            <Typography sx={{ fontSize: 13, fontWeight: 850, color: "#1E293B" }}>{item.sourceSubtaskTitle || "Unknown subtask"}</Typography>
            <Typography sx={{ fontSize: 10, fontWeight: 850, color: "#B45309", textTransform: "uppercase" }}>{item.kind}</Typography>
          </Stack>
          <Typography sx={{ mt: 0.4, fontSize: 11.5, color: "#64748B" }}>{reasonLabel(item.reason)}</Typography>
          <Typography sx={{ mt: 0.5, fontSize: 10.5, color: "#78716C" }}>
            {formatDate(item.date)}{item.dailyPercent !== undefined ? ` · ${item.dailyPercent}% progress` : ""}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}

function EligibleList({ items }: { items: ProgressSyncItem[] }) {
  if (!items.length) return null;
  return (
    <Box sx={{ mt: 2 }}>
      <Typography sx={{ mb: 0.8, fontSize: 11, fontWeight: 850, color: "#475569", textTransform: "uppercase", letterSpacing: ".04em" }}>
        Ready to sync
      </Typography>
      <Stack spacing={0.75} sx={{ maxHeight: 180, overflowY: "auto", pr: 0.5 }}>
        {items.map((item, index) => (
          <Box key={item.sourceLogId || `eligible-${index}`} sx={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, py: 1.25, pr: 1.25, pl: 2.25, border: "1px solid #E2E8F0", borderRadius: 1.5, bgcolor: "#FFFFFF", "&::before": { content: '""', position: "absolute", left: 9, top: 11, bottom: 11, width: 3, borderRadius: 1, bgcolor: "#10B981" } }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography noWrap title={item.targetSubtaskTitle || item.sourceSubtaskTitle} sx={{ fontSize: 12.5, fontWeight: 800, color: "#1E293B" }}>
                {item.targetSubtaskTitle || item.sourceSubtaskTitle || "Unknown subtask"}
              </Typography>
              <Typography sx={{ mt: 0.25, fontSize: 10.5, color: "#64748B" }}>{formatDate(item.date)}</Typography>
            </Box>
            <Typography sx={{ flexShrink: 0, px: 1, py: 0.35, borderRadius: 999, bgcolor: "#F1F5F9", color: "#334155", fontSize: 11, fontWeight: 900 }}>
              {item.dailyPercent ?? 0}%
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

export default function ProgressSyncGate({ projectId }: { projectId: string }) {
  const dispatch = useAppDispatch();
  const currentUserId = useAppSelector((state) => state.auth.user?.id);
  const selectedDashboard = useAppSelector((state) => state.personalDashboard.selectedDashboard);
  const dashboardProject = selectedDashboard?.id === projectId ? selectedDashboard.project : null;
  const ownerId = dashboardProject?.ownerId ? String(dashboardProject.ownerId) : "";
  const isProjectOwner = Boolean(currentUserId && ownerId && String(currentUserId) === ownerId);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("welcome");
  const [status, setStatus] = useState<ProgressSyncStatus | null>(null);
  const [result, setResult] = useState<ProgressSyncResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const acknowledgementKey = status ? `progress-sync-seen:${status.project.id}:v${status.project.versionNumber}` : "";

  const loadStatus = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getProgressSyncStatus(projectId);
      setStatus(data);
      const isActiveVersion = data.project.isActive || data.project.status?.toUpperCase() === "ACTIVE";
      const isVersionedProject = Boolean(data.project.parentProjectId || data.project.parentProject);
      if (!isActiveVersion || !isVersionedProject) {
        setOpen(false);
        return;
      }
      const key = `progress-sync-seen:${data.project.id}:v${data.project.versionNumber}`;

      // A completed sync is the permanent server-side signal that this gate is finished.
      if (data.project.progressSyncedAt) {
        sessionStorage.setItem(key, "true");
        setOpen(false);
        return;
      }

      // Do not show a welcome/up-to-date modal when there is nothing from the
      // previous version waiting to be synchronized.
      if (!data.requiresSync) {
        setOpen(false);
        return;
      }
      setStep("welcome");
      setResult(null);
      setOpen(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError || "Unable to check progress updates."));
      setStep("error");
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setOpen(false);
    if (!isProjectOwner) return;
    void loadStatus();
  }, [projectId, isProjectOwner]);

  const continueToProject = () => {
    if (acknowledgementKey) sessionStorage.setItem(acknowledgementKey, "true");
    setOpen(false);
  };

  const syncProgress = async () => {
    if (!isProjectOwner) {
      setOpen(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const syncResult = await syncVersionProgress(projectId);
      setResult(syncResult);
      setStep("result");
      await Promise.all([
        getProgressSyncStatus(projectId).then(setStatus),
        dispatch(fetchPersonalDashboardDetail(projectId)).catch(() => undefined),
      ]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError || "Unable to sync progress updates."));
    } finally {
      setLoading(false);
    }
  };

  const eligibleCount = status?.eligible?.length || 0;
  const unmatched = result?.unmatched ?? status?.unmatched ?? [];
  const conflicts = result?.conflicts ?? status?.conflicts ?? [];
  const attentionCount = unmatched.length + conflicts.length;

  return (
    <Dialog open={open} maxWidth="sm" fullWidth disableEscapeKeyDown aria-labelledby="progress-sync-title" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle id="progress-sync-title" sx={{ px: 3, pt: 3, pb: 1, fontWeight: 900, color: "#172033" }}>
        {step === "welcome" && `Welcome to Version ${status?.project.versionNumber || ""}`}
        {step === "summary" && "Progress update check"}
        {step === "result" && (result?.requiresAttention ? "Progress synced with attention needed" : "Progress sync complete")}
        {step === "error" && "Unable to check progress updates"}
      </DialogTitle>
      <DialogContent sx={{ px: 3, pt: "12px !important" }}>
        {step === "welcome" && (
          <Stack alignItems="center" textAlign="center" spacing={1.5} sx={{ py: 2 }}>
            <Box sx={{ width: 58, height: 58, display: "grid", placeItems: "center", borderRadius: "50%", bgcolor: "#EEECFF", color: "#5045B8" }}><SyncRoundedIcon sx={{ fontSize: 31 }} /></Box>
            <Typography sx={{ fontSize: 14, color: "#64748B" }}>Your newly approved version of <strong>{status?.project.name}</strong> is now active.</Typography>
          </Stack>
        )}

        {step === "summary" && status && !status.requiresSync && (
          <Alert severity="success" icon={<CheckCircleRoundedIcon />}>All progress is up to date.</Alert>
        )}

        {step === "summary" && status?.requiresSync && (
          <>
            <Typography sx={{ color: "#475569", fontSize: 13.5, lineHeight: 1.65 }}>
              You have <strong>{eligibleCount + attentionCount}</strong> progress {eligibleCount + attentionCount === 1 ? "update" : "updates"} recorded in Version {status.project.parentProject?.versionNumber ?? "the previous version"} while Version {status.project.versionNumber} was pending approval.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 2 }}>
              <Box sx={{ flex: 1, p: 1.5, borderRadius: 2, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}><Typography sx={{ fontSize: 22, fontWeight: 900, color: "#0F766E" }}>{eligibleCount}</Typography><Typography sx={{ fontSize: 11, color: "#64748B" }}>Ready to sync automatically</Typography></Box>
              <Box sx={{ flex: 1, p: 1.5, borderRadius: 2, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}><Typography sx={{ fontSize: 22, fontWeight: 900, color: attentionCount ? "#B45309" : "#64748B" }}>{attentionCount}</Typography><Typography sx={{ fontSize: 11, color: "#64748B" }}>Need attention</Typography></Box>
            </Stack>
            <EligibleList items={status.eligible || []} />
            <AttentionList unmatched={unmatched} conflicts={conflicts} />
          </>
        )}

        {step === "result" && result && (
          <>
            <Alert severity={result.requiresAttention ? "warning" : "success"} icon={result.requiresAttention ? <WarningAmberRoundedIcon /> : <CheckCircleRoundedIcon />}>
              {result.syncedLogs} progress {result.syncedLogs === 1 ? "update was" : "updates were"} synced across {result.syncedSubtasks} {result.syncedSubtasks === 1 ? "subtask" : "subtasks"}.
            </Alert>
            {result.requiresAttention && (
              <>
                <Typography sx={{ mt: 2, fontSize: 12.5, color: "#64748B" }}>The following items were not discarded. Manual mapping or exclusion will be available in a future update.</Typography>
                <AttentionList unmatched={unmatched} conflicts={conflicts} />
              </>
            )}
          </>
        )}

        {step === "error" && <Alert severity="error">{error || "The progress synchronization status could not be loaded."}</Alert>}
        {step !== "error" && error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {loading && <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}><CircularProgress size={26} /></Box>}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        {step === "welcome" && <Button variant="contained" disabled={loading || !status} onClick={() => setStep("summary")}>Next</Button>}
        {step === "summary" && status && !status.requiresSync && <Button variant="contained" onClick={continueToProject}>Continue to project</Button>}
        {step === "summary" && status?.requiresSync && eligibleCount > 0 && <Button variant="contained" startIcon={<SyncRoundedIcon />} disabled={loading} onClick={() => void syncProgress()}>Sync {eligibleCount} progress {eligibleCount === 1 ? "update" : "updates"}</Button>}
        {step === "summary" && status?.requiresSync && eligibleCount === 0 && <Button variant="contained" onClick={continueToProject}>Continue to project</Button>}
        {step === "result" && <Button variant="contained" onClick={continueToProject}>Continue to project</Button>}
        {step === "error" && <Button variant="contained" disabled={loading} onClick={() => void loadStatus()}>Retry</Button>}
      </DialogActions>
    </Dialog>
  );
}
