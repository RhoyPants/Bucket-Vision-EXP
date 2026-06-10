"use client";

import { useEffect, useMemo, useCallback, useState } from "react";
import dayjs from "dayjs";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  IconButton,
  Alert,
  CircularProgress,
  Card,
  Stack,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ImageIcon from "@mui/icons-material/Image";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

import { useDispatch, useSelector } from "react-redux";
import {
  getProgressLogs,
  saveProgressLog,
} from "@/app/redux/controllers/progressController";
import { getSCurve } from "@/app/redux/controllers/scurveController";
import axiosApi from "@/app/lib/axios";
import { RootState } from "@/app/redux/store";
import { ProgressAttachment } from "@/app/redux/slices/progressSlice";

import { Viewer, Worker } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface ProgressCalendarProps {
  subtaskId: string;
  isTaskBoard?: boolean;
  projectedStartDate?: string;
  projectedEndDate?: string;
  onSuccess?: () => void;
}

export default function ProgressCalendar({
  subtaskId,
  isTaskBoard = false,
  projectedStartDate,
  projectedEndDate,
  onSuccess,
}: ProgressCalendarProps) {
  const dispatch = useDispatch<any>();

  const logsArray =
    useSelector(
      (state: RootState) => state.progress.logsBySubtask[subtaskId],
    ) || [];

  const isLoading = useSelector((state: RootState) => state.progress.loading);

  // Get projectId from Redux state (already set when user navigates to project)
  const currentProjectId = useSelector(
    (state: RootState) => state.project?.currentProjectId,
  );

  // STABLE logs map - supports multiple logs per date
  const logs = useMemo(() => {
    const map: any = {};
    logsArray.forEach((log: any) => {
      const key = dayjs(log.date).format("YYYY-MM-DD");
      if (!map[key]) map[key] = [];
      map[key].push(log);
    });
    return map;
  }, [logsArray]);

  // Calculate total progress
  const cumulativeProgress = useMemo(() => {
    return logsArray.reduce(
      (sum: number, log: any) => sum + log.dailyPercent,
      0,
    );
  }, [logsArray]);

  // =========================
  // STATE
  // =========================
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const [dailyPercent, setDailyPercent] = useState("");
  const [remarks, setRemarks] = useState("");
  const [location, setLocation] = useState("");
  const [dayNumber, setDayNumber] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [currentProgress, setCurrentProgress] = useState(0);
  const [range, setRange] = useState<any>(null);
  const [loadingSubtask, setLoadingSubtask] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [showProgressFormModal, setShowProgressFormModal] = useState(false);
  const [showExistingLogModal, setShowExistingLogModal] = useState(false);
  const [selectedLogForDetails, setSelectedLogForDetails] = useState<any>(null);
  const [selectedAttachmentIndex, setSelectedAttachmentIndex] = useState<
    number | null
  >(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const logsForSelectedDate = logs[selectedDate.format("YYYY-MM-DD")] || [];

  const getAttachmentUrl = useCallback((att?: ProgressAttachment | null) => {
    if (!att) return "";
    const candidate = att.proxyUrl || att.url || "";
    if (!candidate) return "";

    const withTokenFallback = (rawUrl: string) => {
      if (typeof window === "undefined") return rawUrl;
      const token = localStorage.getItem("token");
      if (!token) return rawUrl;

      // Avoid duplicating token param and only apply to progress attachment file endpoint.
      if (
        !rawUrl.includes("/api/progress/attachments/") ||
        !rawUrl.includes("/file")
      ) {
        return rawUrl;
      }

      try {
        const parsed = new URL(rawUrl, window.location.origin);
        if (!parsed.searchParams.get("token")) {
          parsed.searchParams.set("token", token);
        }
        return parsed.toString();
      } catch {
        return rawUrl;
      }
    };

    // If backend returns relative proxyUrl (e.g. /api/progress/attachments/:id/file),
    // resolve it against API base URL so requests go to backend host/port.
    if (candidate.startsWith("/")) {
      const apiBase =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
      try {
        const baseUrl = new URL(apiBase);
        const basePath = baseUrl.pathname.replace(/\/+$/, "");
        let relPath = candidate;

        // Avoid /api/api when both basePath and relative path include /api.
        if (basePath.endsWith("/api") && relPath.startsWith("/api/")) {
          relPath = relPath.replace(/^\/api/, "");
        }

        return withTokenFallback(`${baseUrl.origin}${basePath}${relPath}`);
      } catch {
        return withTokenFallback(`${apiBase.replace(/\/$/, "")}${candidate}`);
      }
    }

    return withTokenFallback(candidate);
  }, []);

  const getViewerHeaders = useCallback((): Record<string, string> => {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // Get users from Redux
  const allUsers = useSelector((state: RootState) => state.user?.users || []);

  // Create PDF viewer plugin
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  // =========================
  // LOAD DATA
  // =========================
  useEffect(() => {
    dispatch(getProgressLogs(subtaskId));
  }, [subtaskId]);

  useEffect(() => {
    const fetchSubtask = async () => {
      setLoadingSubtask(true);
      setError("");
      try {
        const { data } = await axiosApi.get(`/subtasks/${subtaskId}`);
        setRange({
          start: data.projectedStartDate || "",
          end: data.projectedEndDate || "",
        });
        setCurrentProgress(data.progress || 0);
      } catch (err: any) {
        console.error(" Error loading subtask:", err);
        setError("Failed to load subtask details");
      } finally {
        setLoadingSubtask(false);
      }
    };

    if (subtaskId) fetchSubtask();
  }, [subtaskId]);

  // =========================
  // SELECT DATE - RESET FORM
  // =========================
  useEffect(() => {
    // Reset form when date changes
    setDailyPercent("");
    setRemarks("");
    setLocation("");
    setDayNumber("");
    setAttachments([]);
    setImagePreviews([]);
    setSelectedLogForDetails(null);
  }, [selectedDate, logs]);

  // =========================
  // CALENDAR GENERATION
  // =========================
  const startOfMonth = currentMonth.startOf("month");
  const startDay = startOfMonth.startOf("week");

  const dates = Array.from({ length: 42 }, (_, i) => startDay.add(i, "day"));

  // =========================
  // COLOR LOGIC
  // =========================
  const getBackgroundColor = (date: any, logsForDate: any[], isSelected: boolean) => {
    if (isSelected) return "#db60d1"; // Selected = Pink/Magenta

    if (!range?.start || !range?.end) return "#ffffff"; // No range = White

    const start = dayjs(range.start);
    const end = dayjs(range.end);

    const isBeforeStart = date.isBefore(start, "day");
    const isAfterEnd = date.isAfter(end, "day");

    // Use first log for coloring (or could aggregate)
    const log = logsForDate?.[0] || null;

    if (log?.cumulativePercent >= 100) return "#1B5E20"; // DARK GREEN for 100% Complete
    if (isBeforeStart && log) return "#7B1FA2"; // PURPLE for early logs (before start date)
    if (isBeforeStart) return "#f5f5f5"; // LIGHT GRAY before start date

    // Within projected range
    if (!isAfterEnd) {
      if (log) {
        if (log.cumulativePercent >= 75) return "#388E3C"; // GREEN 75%+
        if (log.cumulativePercent >= 50) return "#66BB6A"; // LIGHT GREEN 50-75%
        return "#81C784"; // PALE GREEN <50%
      }
      return "#C8E6C9"; // VERY LIGHT GREEN (no logs yet)
    }

    // After deadline
    if (log) {
      if (log.cumulativePercent >= 100) return "#1B5E20"; // Still green if 100%
      if (log.cumulativePercent >= 50) return "#FFA726"; // ORANGE if some progress
      return "#D32F2F"; // RED if minimal progress and overdue
    }
    return "#FFCDD2"; // LIGHT RED (after deadline, no progress)
  };

  // =========================
  // PHOTO HANDLER
  // =========================
  const recomputeImagePreviews = (files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (!imageFiles.length) {
      setImagePreviews([]);
      return;
    }

    Promise.all(
      imageFiles.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) =>
              resolve((event.target?.result as string) || "");
            reader.readAsDataURL(file);
          }),
      ),
    ).then(setImagePreviews);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    setAttachments((prev) => {
      const merged = [...prev];
      selected.forEach((f) => {
        const exists = merged.some(
          (m) =>
            m.name === f.name &&
            m.size === f.size &&
            m.lastModified === f.lastModified,
        );
        if (!exists && merged.length < 10) {
          merged.push(f);
        }
      });
      recomputeImagePreviews(merged);
      return merged;
    });

    e.currentTarget.value = "";
  };

  const removeAttachment = (target: File) => {
    setAttachments((prev) => {
      const next = prev.filter(
        (f) =>
          !(
            f.name === target.name &&
            f.size === target.size &&
            f.lastModified === target.lastModified
          ),
      );
      recomputeImagePreviews(next);
      return next;
    });
  };

  // =========================
  // VALIDATE PROGRESS
  // =========================
  const validateProgress = () => {
    const value = Number(dailyPercent);
    const remainingProgress = 100 - cumulativeProgress;

    if (!value || value <= 0 || value > 100) {
      setError("Daily progress must be between 1 and 100");
      return false;
    }

    if (value > remainingProgress) {
      setError(`Cannot exceed 100% total. Remaining: ${remainingProgress}%`);
      return false;
    }

    return true;
  };

  // =========================
  // SAVE HANDLER WITH LOADING
  // =========================
  const handleSave = useCallback(async () => {
    if (!validateProgress()) return;

    setSaveModalOpen(true);

    try {
      const value = Number(dailyPercent);

      //  saveProgressLog now handles ALL refresh logic internally
      await dispatch(
        saveProgressLog({
          subtaskId,
          date: selectedDate.format("YYYY-MM-DD"),
          dailyPercent: value,
          remarks,
          location: location || undefined,
          dayNumber: dayNumber ? Number(dayNumber) : undefined,
          files: attachments.length ? attachments : undefined,
          file: attachments[0] || undefined,
        }),
      );

      //  FALLBACK: Manually refresh S-Curve with projectId from Redux
      try {
        if (currentProjectId) {
          await dispatch(getSCurve(currentProjectId) as any);
        } else {
          console.warn(" No projectId available for S-Curve refresh");
        }
      } catch (scurveErr) {
        console.warn(" S-Curve manual refresh warning:", scurveErr);
      }

      setSuccess(true);
      setError("");

      // Reset form after success
      setTimeout(() => {
        setSaveModalOpen(false);
        setDailyPercent("");
        setRemarks("");
        setLocation("");
        setDayNumber("");
        setAttachments([]);
        setImagePreviews([]);
        setSuccess(false);
        // Refresh logs
        dispatch(getProgressLogs(subtaskId));
        // CALL onSuccess callback to notify parent to reload
        // TaskBoard: Reloads all assigned subtasks
        // SprintManagement: Reloads subtasks for current task (preserves project/Scope selection)
        if (onSuccess) {
          onSuccess();
        }
      }, 2000);
    } catch (err: any) {
      console.error(" Error saving progress:", err);
      setError(err.response?.data?.message || "Failed to save progress");
      setSaveModalOpen(false);
    }
  }, [
    dispatch,
    dailyPercent,
    remarks,
    location,
    dayNumber,
    attachments,
    selectedDate,
    subtaskId,
    currentProjectId,
    onSuccess,
    isTaskBoard,
  ]);

  const remainingProgress = 100 - cumulativeProgress;

  return (
    <Box display="grid" gridTemplateColumns="3fr 1.2fr" gap={2}>
      {error && (
        <Alert severity="error" sx={{ gridColumn: "1/-1" }}>
          {error}
        </Alert>
      )}
      {loadingSubtask && (
        <Alert severity="info" sx={{ gridColumn: "1/-1" }}>
          Loading subtask details...
        </Alert>
      )}

      {/* CALENDAR */}
      <Paper sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" mb={2}>
          <IconButton
            onClick={() => setCurrentMonth(currentMonth.subtract(1, "month"))}
          >
            <ArrowBackIosIcon />
          </IconButton>

          <Typography variant="h5">
            {currentMonth.format("MMMM YYYY")}
          </Typography>

          <IconButton
            onClick={() => setCurrentMonth(currentMonth.add(1, "month"))}
          >
            <ArrowForwardIosIcon />
          </IconButton>
        </Box>

        <Box display="grid" gridTemplateColumns="repeat(7, 1fr)">
          {DAYS.map((d) => (
            <Box key={d} textAlign="center" fontWeight="bold" fontSize={12}>
              {d}
            </Box>
          ))}
        </Box>

        <Box display="grid" gridTemplateColumns="repeat(7, 1fr)">
          {dates.map((date) => {
            const key = date.format("YYYY-MM-DD");
            const logsForDate = logs[key] || [];
            const isSelected = selectedDate.isSame(date, "day");
            const firstLog = logsForDate[0];

            return (
              <Box
                key={key}
                onClick={() => {
                  setSelectedDate(date);
                }}
                sx={{
                  minHeight: 100,
                  border: "1px solid #ddd",
                  p: 1,
                  cursor: "pointer",
                  backgroundColor: getBackgroundColor(date, logsForDate, isSelected),
                  transition: "all 0.2s ease",
                  "&:hover": {
                    transform: "scale(1.02)",
                    boxShadow: 2,
                  },
                  position: "relative",
                }}
              >
                <Typography fontSize={12} fontWeight="bold">
                  {date.date()}
                </Typography>

                {logsForDate.length > 0 && (
                  <>
                    {logsForDate.length > 1 && (
                      <Chip
                        label={`${logsForDate.length} logs`}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: 9,
                          mt: 0.5,
                          backgroundColor: "#ff9800",
                          color: "white",
                        }}
                      />
                    )}
                    {logsForDate.length === 1 && (
                      <Chip
                        label={`+${firstLog.dailyPercent}%`}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: 10,
                          mt: 0.5,
                          backgroundColor: "#1976d2",
                          color: "white",
                        }}
                      />
                    )}
                    <Typography
                      fontSize={10}
                      sx={{ mt: 0.5, fontWeight: "bold" }}
                    >
                      Total: {firstLog.cumulativePercent}%
                    </Typography>
                    {logsForDate.some((log: any) => log.attachments?.length || log.photoUrl) && (
                      <ImageIcon
                        sx={{
                          fontSize: 14,
                          color: "#fff",
                          mt: 0.25,
                          opacity: 0.85,
                        }}
                      />
                    )}
                  </>
                )}
              </Box>
            );
          })}
        </Box>

        {/* Progress Overview */}
        <Box sx={{ mt: 3, p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Overall Progress
          </Typography>
          <LinearProgress
            variant="determinate"
            value={cumulativeProgress}
            sx={{ mb: 1, height: 8, borderRadius: 1 }}
          />
          <Typography variant="caption">
            {cumulativeProgress.toFixed(1)}% of 100% • Remaining:{" "}
            {remainingProgress.toFixed(1)}%
          </Typography>
        </Box>

        {/* COLOR LEGEND */}
        <Box
          sx={{
            mt: 3,
            p: 2,
            backgroundColor: "#fafafa",
            borderRadius: 1,
            border: "1px solid #e0e0e0",
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: "bold" }}>
            Color Guide
          </Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
            {/* Row 1 */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: "#1B5E20",
                  borderRadius: "3px",
                  border: "1px solid #ccc",
                }}
              />
              <Typography variant="caption">✔ 100% Complete</Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: "#388E3C",
                  borderRadius: "3px",
                  border: "1px solid #ccc",
                }}
              />
              <Typography variant="caption">⚡ 75%+ Progress</Typography>
            </Box>

            {/* Row 2 */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: "#66BB6A",
                  borderRadius: "3px",
                  border: "1px solid #ccc",
                }}
              />
              <Typography variant="caption">🔹 50-75% Progress</Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: "#81C784",
                  borderRadius: "3px",
                  border: "1px solid #ccc",
                }}
              />
              <Typography variant="caption">🟢 Started (under 50%)</Typography>
            </Box>

            {/* Row 3 */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: "#C8E6C9",
                  borderRadius: "3px",
                  border: "1px solid #ccc",
                }}
              />
              <Typography variant="caption">🔵 In Range (no log)</Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: "#FFA726",
                  borderRadius: "3px",
                  border: "1px solid #ccc",
                }}
              />
              <Typography variant="caption">⚠️ Overdue (partial)</Typography>
            </Box>

            {/* Row 4 */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: "#D32F2F",
                  borderRadius: "3px",
                  border: "1px solid #ccc",
                }}
              />
              <Typography variant="caption">
                ❌ Overdue (no progress)
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: "#7B1FA2",
                  borderRadius: "3px",
                  border: "1px solid #ccc",
                }}
              />
              <Typography variant="caption">⏱️ Early Log</Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* RIGHT PANEL */}
      <Paper sx={{ p: 3, maxHeight: "800px", overflowY: "auto" }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {selectedDate.format("MMM DD, YYYY")}
        </Typography>
        <Divider sx={{ my: 2 }} />

        {/* Cumulative Progress Info - ALWAYS VISIBLE */}
            <Box
              sx={{
                mb: 2,
                p: 1.5,
                backgroundColor: "#f0f0f0",
                borderRadius: 1,
              }}
            >
              <Typography
                variant="caption"
                sx={{ display: "block", color: "#666", mb: 0.5 }}
              >
                Total Progress
              </Typography>
              <Typography variant="h6" sx={{ color: "#1976d2" }}>
                {cumulativeProgress.toFixed(1)}% / 100%
              </Typography>
              <Typography variant="caption" sx={{ color: "#999" }}>
                Remaining: {remainingProgress.toFixed(1)}%
              </Typography>
            </Box>

        {/* Submitted Progress List */}
        {logsForSelectedDate.length > 0 ? (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: "bold" }}>
              📋 Submitted Progress ({logsForSelectedDate.length})
            </Typography>
            <Stack spacing={0.5}>
              {logsForSelectedDate.map((log: any, idx: number) => (
                <Box
                  key={log.id || idx}
                  onClick={() => {
                    setSelectedLogForDetails(log);
                    setSelectedAttachmentIndex(null);
                    setShowExistingLogModal(true);
                  }}
                  sx={{
                    p: 0.75,
                    cursor: "pointer",
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: 0.75,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: "#f0f4ff",
                      borderColor: "#1976d2",
                      boxShadow: 1,
                    },
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                    <Chip
                      label={`+${log.dailyPercent}%`}
                      color="primary"
                      size="small"
                      sx={{ fontWeight: "bold", height: 20 }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" sx={{ color: "#666", display: "block", fontSize: 11 }}>
                        <strong>{log.user?.name || log.userId || "System"}</strong> • {log.cumulativePercent}%
                      </Typography>
                      {log.remarks && (
                        <Typography variant="caption" sx={{ display: "block", color: "#999", fontSize: 10, mt: 0.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {log.remarks}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>
        ) : (
          <Box sx={{ mt: 3, p: 2, backgroundColor: "#f5f5f5", borderRadius: 1, textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: "#999" }}>
              No progress logged for this date
            </Typography>
          </Box>
        )}

        {/* Submit Progress Button */}
        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 3 }}
          onClick={() => setShowProgressFormModal(true)}
          disabled={cumulativeProgress >= 100}
        >
          {cumulativeProgress >= 100 ? "✓ 100% Complete" : "Submit Progress"}
        </Button>
      </Paper>

      {/* PROGRESS FORM MODAL */}
      <Dialog
        open={showProgressFormModal}
        onClose={() => setShowProgressFormModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Submit Progress for {selectedDate.format("MMM DD, YYYY")}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* Cumulative Progress Info */}
            <Box
              sx={{
                mb: 2,
                p: 1.5,
                backgroundColor: "#f0f0f0",
                borderRadius: 1,
              }}
            >
              <Typography
                variant="caption"
                sx={{ display: "block", color: "#666", mb: 0.5 }}
              >
                Total Progress
              </Typography>
              <Typography variant="h6" sx={{ color: "#1976d2" }}>
                {cumulativeProgress.toFixed(1)}% / 100%
              </Typography>
              <Typography variant="caption" sx={{ color: "#999" }}>
                Remaining: {remainingProgress.toFixed(1)}%
              </Typography>
            </Box>

            {/* Daily Progress Input */}
            <TextField
              label="Daily Progress (%)"
              type="number"
              fullWidth
              value={dailyPercent}
              onChange={(e) => setDailyPercent(e.target.value)}
              inputProps={{ min: 0, max: remainingProgress }}
              error={
                dailyPercent ? Number(dailyPercent) > remainingProgress : false
              }
              helperText={
                dailyPercent && Number(dailyPercent) > remainingProgress
                  ? `Cannot exceed ${remainingProgress.toFixed(1)}%`
                  : undefined
              }
              sx={{ mt: 2 }}
            />

            {/* Day Number Input */}
            <TextField
              label="Day Number"
              type="number"
              fullWidth
              value={dayNumber}
              onChange={(e) => setDayNumber(e.target.value)}
              inputProps={{ min: 1 }}
              sx={{ mt: 2 }}
            />

            {/* Location Input */}
            <TextField
              label="Location"
              fullWidth
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Site A, Building 1"
              InputProps={{
                startAdornment: (
                  <LocationOnIcon sx={{ mr: 1, color: "#666" }} />
                ),
              }}
              sx={{ mt: 2 }}
            />

            {/* Remarks */}
            <TextField
              label="Remarks"
              multiline
              rows={3}
              fullWidth
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              sx={{ mt: 2 }}
            />

            {/* Attachments Upload */}
            <Box sx={{ mt: 2 }}>
              <input
                accept="*/*"
                style={{ display: "none" }}
                id="form-photo-input"
                type="file"
                multiple
                onChange={handlePhotoChange}
              />
              <label htmlFor="form-photo-input" style={{ width: "100%" }}>
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  disabled={attachments.length >= 10}
                  startIcon={<CloudUploadIcon />}
                  sx={{ mt: 1 }}
                >
                  {attachments.length
                    ? `Add Attachments (${attachments.length}/10)`
                    : "Add Attachments"}
                </Button>
              </label>

              {attachments.length > 0 && (
                <Box sx={{ mt: 1.5 }}>
                  <Typography variant="caption" sx={{ color: "#666" }}>
                    Selected Files
                  </Typography>
                  <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                    {attachments.map((f) => (
                      <Box
                        key={f.name + f.size + f.lastModified}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          border: "1px solid #e5e7eb",
                          borderRadius: 1,
                          px: 1,
                          py: 0.5,
                          backgroundColor: "#fafafa",
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontSize: 12, mr: 1 }}
                        >
                          {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)
                        </Typography>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeAttachment(f)}
                          sx={{ p: 0.5 }}
                        >
                          <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}

              {imagePreviews.length > 0 && (
                <Stack spacing={1} sx={{ mt: 2 }}>
                  {imagePreviews.map((src, idx) => (
                    <Box
                      key={src + idx}
                      component="img"
                      src={src}
                      sx={{
                        width: "100%",
                        height: 150,
                        objectFit: "cover",
                        borderRadius: 1,
                        border: "1px solid #ddd",
                      }}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowProgressFormModal(false)}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={isLoading || !dailyPercent || cumulativeProgress >= 100}
          >
            {isLoading ? "Saving..." : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* SUCCESS MODAL WITH LOADING */}
      <Dialog
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Saving Progress...</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: "center", py: 3 }}>
            {isLoading ? (
              <>
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography sx={{ mt: 2, color: "#666" }}>
                  Adding progress to your subtask...
                </Typography>
              </>
            ) : (
              <>
                <CheckCircleIcon
                  sx={{ fontSize: 60, color: "#2E7D32", mb: 2 }}
                />
                <Typography
                  sx={{ fontWeight: "bold", color: "#2E7D32", fontSize: 18 }}
                >
                  Progress Saved Successfully! ✔
                </Typography>
                <Typography sx={{ mt: 1, color: "#666" }}>
                  +{dailyPercent}% added to your progress
                </Typography>
              </>
            )}
          </Box>
        </DialogContent>
      </Dialog>
      {/* EXISTING LOG MODAL - FULL SCREEN */}
      <Dialog
        open={showExistingLogModal}
        onClose={() => {
          setShowExistingLogModal(false);
          setSelectedAttachmentIndex(null);
        }}
        fullScreen
      >
        <DialogTitle
          sx={{
            px: 3,
            py: 1.5,
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#fff",
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: 18 }}>
            ✔ Progress Log Details
          </Typography>

          <Button
            variant="contained"
            onClick={() => {
              setShowExistingLogModal(false);
              setSelectedAttachmentIndex(null);
            }}
          >
            Close
          </Button>
        </DialogTitle>

        <DialogContent
          sx={{ p: 0, height: "calc(100vh - 65px)", overflow: "hidden" }}
        >
          {selectedLogForDetails && (
            <Grid container sx={{ height: "100%", minHeight: 0 }}>
              {/* LEFT COLUMN - DETAILS */}
              <Grid
                size={{ xs: 12, md: 4 }}
                sx={{
                  height: "100%",
                  minHeight: 0,
                  overflowY: "auto",
                  borderRight: "1px solid #e5e7eb",
                  p: 3,
                  backgroundColor: "#fafafa",
                }}
              >
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#666" }}>
                      Date
                    </Typography>
                    <Typography variant="body1">
                      {dayjs(selectedLogForDetails.date).format("MMMM DD, YYYY")}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: "#666" }}>
                      Daily Progress
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={`+${selectedLogForDetails.dailyPercent}%`}
                        color="primary"
                      />
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: "#666" }}>
                      Cumulative Progress
                    </Typography>
                    <Typography variant="body1">
                      {selectedLogForDetails.cumulativePercent}% of 100%
                    </Typography>
                  </Box>

                  {selectedLogForDetails.location && (
                    <Box>
                      <Typography variant="caption" sx={{ color: "#666" }}>
                        📍 Location
                      </Typography>
                      <Typography variant="body2">
                        {selectedLogForDetails.location}
                      </Typography>
                    </Box>
                  )}

                  {selectedLogForDetails.dayNumber && (
                    <Box>
                      <Typography variant="caption" sx={{ color: "#666" }}>
                        Day Number
                      </Typography>
                      <Typography variant="body2">
                        Day {selectedLogForDetails.dayNumber}
                      </Typography>
                    </Box>
                  )}

                  {selectedLogForDetails.remarks && (
                    <Box>
                      <Typography variant="caption" sx={{ color: "#666" }}>
                        Remarks
                      </Typography>
                      <Typography variant="body2">
                        {selectedLogForDetails.remarks}
                      </Typography>
                    </Box>
                  )}

                  {selectedLogForDetails.attachments?.length > 0 && (
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: "#666", display: "block", mb: 1 }}
                      >
                        📎 Attachments ({selectedLogForDetails.attachments.length})
                      </Typography>

                      <Stack spacing={1}>
                        {(selectedLogForDetails.attachments as ProgressAttachment[]).map(
                          (att, idx) => (
                            <Box
                              key={att.id || att.url}
                              onClick={() => setSelectedAttachmentIndex(idx)}
                              sx={{
                                p: 1.25,
                                border:
                                  selectedAttachmentIndex === idx
                                    ? "2px solid #1976d2"
                                    : "1px solid #e5e7eb",
                                borderRadius: 1.5,
                                cursor: "pointer",
                                backgroundColor:
                                  selectedAttachmentIndex === idx
                                    ? "#eef6ff"
                                    : "#fff",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                  backgroundColor: "#f5f9ff",
                                  borderColor: "#90caf9",
                                },
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: "#1976d2",
                                  wordBreak: "break-word",
                                }}
                              >
                                {att.name || "Attachment"}
                              </Typography>

                              {att.mimeType && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    display: "block",
                                    color: "#666",
                                    mt: 0.25,
                                  }}
                                >
                                  {att.mimeType}{" "}
                                  {typeof att.size === "number"
                                    ? `• ${(att.size / 1024 / 1024).toFixed(2)} MB`
                                    : ""}
                                </Typography>
                              )}
                            </Box>
                          ),
                        )}
                      </Stack>
                    </Box>
                  )}

                  {!selectedLogForDetails.attachments?.length && selectedLogForDetails.photoUrl && (
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: "#666", display: "block", mb: 1 }}
                      >
                        📷 Photo
                      </Typography>
                      <Box
                        component="img"
                        src={selectedLogForDetails.photoUrl}
                        sx={{
                          width: "100%",
                          height: 200,
                          objectFit: "cover",
                          borderRadius: 1.5,
                          border: "1px solid #ddd",
                        }}
                      />
                    </Box>
                  )}

                  {selectedLogForDetails.user && (
                    <Box>
                      <Typography variant="caption" sx={{ color: "#666" }}>
                        Added By
                      </Typography>
                      <Typography variant="body2">
                        {selectedLogForDetails.user.name || selectedLogForDetails.user.email}
                      </Typography>
                    </Box>
                  )}

                  {selectedLogForDetails.createdAt && (
                    <Box>
                      <Typography variant="caption" sx={{ color: "#666" }}>
                        Created At
                      </Typography>
                      <Typography variant="body2">
                        {dayjs(selectedLogForDetails.createdAt).format(
                          "MMM DD, YYYY hh:mm A",
                        )}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Grid>

              {/* RIGHT COLUMN - FILE VIEWER */}
              <Grid
                size={{ xs: 12, md: 8 }}
                sx={{
                  height: "100%",
                  minHeight: 0,
                  p: 2,
                  backgroundColor: "#f3f4f6",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    height: "100%",
                    minHeight: 0,
                    display: "flex",
                    flexDirection: "column",
                    border: "1px solid #e5e7eb",
                    borderRadius: 2,
                    backgroundColor: "#fff",
                    overflow: "hidden",
                  }}
                >
                  {selectedAttachmentIndex !== null &&
                    selectedLogForDetails.attachments &&
                    (() => {
                      const att =
                        selectedLogForDetails.attachments[selectedAttachmentIndex];
                      const fileUrl = getAttachmentUrl(att);
                      const isPDF =
                        att.mimeType === "application/pdf" ||
                        (att.name || "").toLowerCase().endsWith(".pdf") ||
                        fileUrl.toLowerCase().includes(".pdf");
                      const isImage = att.mimeType?.startsWith("image/");

                      return (
                        <Stack
                          sx={{
                            height: "100%",
                            minHeight: 0,
                            overflow: "hidden",
                          }}
                        >
                          <Box
                            sx={{
                              px: 2,
                              py: 1.25,
                              borderBottom: "1px solid #e5e7eb",
                              backgroundColor: "#fff",
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: 700 }}
                            >
                              📄 File Viewer
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              flex: 1,
                              minHeight: 0,
                              overflow: "hidden",
                              p: 1.5,
                            }}
                          >
                            {isPDF ? (
                              <Box
                                sx={{
                                  height: "100%",
                                  minHeight: 0,
                                  border: "1px solid #ddd",
                                  borderRadius: 1,
                                  overflow: "auto",
                                  backgroundColor: "#fff",

                                  "& .rpv-core__viewer": {
                                    height: "100%",
                                  },
                                  "& .rpv-default-layout__body": {
                                    height: "100%",
                                    overflow: "auto",
                                  },
                                  "& .rpv-core__inner-pages": {
                                    overflow: "auto",
                                  },
                                }}
                              >
                                <Worker workerUrl="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js">
                                  <Viewer
                                    fileUrl={fileUrl}
                                    httpHeaders={getViewerHeaders()}
                                    plugins={[defaultLayoutPluginInstance]}
                                    defaultScale={1.1}
                                  />
                                </Worker>
                              </Box>
                            ) : isImage ? (
                              <>
                                <Box
                                  component="img"
                                  src={fileUrl}
                                  alt={att.name}
                                  onClick={() => {
                                    const imageItems = (
                                      selectedLogForDetails.attachments as ProgressAttachment[]
                                    ).filter((a: ProgressAttachment) =>
                                      a.mimeType?.startsWith("image/"),
                                    );
                                    const selectedImageIndex =
                                      imageItems.findIndex(
                                        (a: ProgressAttachment) =>
                                          (a.id || a.url) ===
                                          (att.id || att.url),
                                      );
                                    setLightboxOpen(true);
                                    setLightboxIndex(
                                      selectedImageIndex >= 0
                                        ? selectedImageIndex
                                        : 0,
                                    );
                                  }}
                                  sx={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                    borderRadius: 1,
                                    border: "1px solid #ddd",
                                    cursor: "pointer",
                                    backgroundColor: "#fff",
                                  }}
                                />

                                <Lightbox
                                  open={lightboxOpen}
                                  close={() => setLightboxOpen(false)}
                                  slides={selectedLogForDetails.attachments
                                    .filter((a: ProgressAttachment) =>
                                      a.mimeType?.startsWith("image/"),
                                    )
                                    .map((a: ProgressAttachment) => ({
                                      src: getAttachmentUrl(a),
                                      alt: a.name,
                                    }))}
                                  index={lightboxIndex}
                                  plugins={[Zoom, Fullscreen]}
                                />
                              </>
                            ) : (
                              <Box
                                sx={{
                                  height: "100%",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  backgroundColor: "#fff",
                                  borderRadius: 1,
                                  border: "1px solid #ddd",
                                  p: 2,
                                }}
                              >
                                <InsertDriveFileIcon
                                  sx={{ fontSize: 80, color: "#bbb", mb: 2 }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: "#666",
                                    textAlign: "center",
                                    mb: 2,
                                  }}
                                >
                                  Preview not available for this file type
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{ color: "#999", textAlign: "center" }}
                                >
                                  Use the Download button to view this file
                                </Typography>
                              </Box>
                            )}
                          </Box>

                          <Box
                            sx={{
                              flexShrink: 0,
                              px: 2,
                              py: 1.25,
                              borderTop: "1px solid #e5e7eb",
                              backgroundColor: "#fff",
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                wordBreak: "break-word",
                                fontWeight: 700,
                                lineHeight: 1.25,
                                mb: 0.5,
                              }}
                            >
                              {att.name}
                            </Typography>

                            <Box
                              sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 0.75,
                                alignItems: "center",
                                mb: 1,
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{ color: "#666" }}
                              >
                                {att.mimeType || "Unknown"}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: "#999" }}
                              >
                                •
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: "#666" }}
                              >
                                {typeof att.size === "number"
                                  ? `${(att.size / 1024 / 1024).toFixed(2)} MB`
                                  : "N/A"}
                              </Typography>
                              {att.createdAt && (
                                <>
                                  <Typography
                                    variant="caption"
                                    sx={{ color: "#999" }}
                                  >
                                    •
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{ color: "#666" }}
                                  >
                                    {dayjs(att.createdAt).format(
                                      "MMM DD, YYYY hh:mm A",
                                    )}
                                  </Typography>
                                </>
                              )}
                            </Box>

                            <Button
                              size="small"
                              variant="contained"
                              href={fileUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Download File
                            </Button>
                          </Box>
                        </Stack>
                      );
                    })()}

                  {selectedAttachmentIndex === null && (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        gap: 2,
                      }}
                    >
                      <ImageIcon sx={{ fontSize: 80, color: "#ddd" }} />
                      <Typography
                        variant="body2"
                        sx={{ color: "#999", textAlign: "center" }}
                      >
                        Select an attachment from the list to preview
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
