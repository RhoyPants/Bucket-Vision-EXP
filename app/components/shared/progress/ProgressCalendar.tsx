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
  DialogActions
} from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ImageIcon from "@mui/icons-material/Image";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

import { useDispatch, useSelector } from "react-redux";
import { getProgressLogs, saveProgressLog } from "@/app/redux/controllers/progressController";
import { getSCurve } from "@/app/redux/controllers/scurveController";
import axiosApi from "@/app/lib/axios";
import { RootState } from "@/app/redux/store";

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
  onSuccess
}: ProgressCalendarProps) {
  const dispatch = useDispatch<any>();

  const logsArray =
    useSelector(
      (state: RootState) => state.progress.logsBySubtask[subtaskId],
    ) || [];

  const isLoading = useSelector((state: RootState) => state.progress.loading);

  // 🔥 Get projectId from Redux state (already set when user navigates to project)
  const currentProjectId = useSelector(
    (state: RootState) => state.project?.currentProjectId
  );

  // ✅ STABLE logs map
  const logs = useMemo(() => {
    const map: any = {};
    logsArray.forEach((log: any) => {
      const key = dayjs(log.date).format("YYYY-MM-DD");
      map[key] = log;
    });
    return map;
  }, [logsArray]);

  // Calculate total progress
  const cumulativeProgress = useMemo(() => {
    return logsArray.reduce((sum: number, log: any) => sum + log.dailyPercent, 0);
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
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");

  const [currentProgress, setCurrentProgress] = useState(0);
  const [range, setRange] = useState<any>(null);
  const [loadingSubtask, setLoadingSubtask] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [showExistingLogModal, setShowExistingLogModal] = useState(false);

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
        console.error("❌ Error loading subtask:", err);
        setError("Failed to load subtask details");
      } finally {
        setLoadingSubtask(false);
      }
    };

    if (subtaskId) fetchSubtask();
  }, [subtaskId]);

  // =========================
  // SELECT DATE AND LOAD LOG
  // =========================
  useEffect(() => {
    const key = selectedDate.format("YYYY-MM-DD");
    const log = logs[key];

    if (log) {
      setSelectedLog(log);
      setDailyPercent(String(log.dailyPercent));
      setRemarks(log.remarks || "");
      setLocation(log.location || "");
      setDayNumber(log.dayNumber ? String(log.dayNumber) : "");
    } else {
      setSelectedLog(null);
      setDailyPercent("");
      setRemarks("");
      setLocation("");
      setDayNumber("");
    }
    setPhotoPreview("");
    setPhoto(null);
  }, [selectedDate, logs]);

  // =========================
  // CALENDAR GENERATION
  // =========================
  const startOfMonth = currentMonth.startOf("month");
  const startDay = startOfMonth.startOf("week");

  const dates = Array.from({ length: 42 }, (_, i) =>
    startDay.add(i, "day"),
  );

  // =========================
  // COLOR LOGIC
  // =========================
  const getBackgroundColor = (date: any, log: any, isSelected: boolean) => {
    if (isSelected) return "#db60d1"; // Selected = Pink/Magenta

    if (!range?.start || !range?.end) return "#ffffff"; // No range = White

    const start = dayjs(range.start);
    const end = dayjs(range.end);

    const isBeforeStart = date.isBefore(start, "day");
    const isAfterEnd = date.isAfter(end, "day");

    if (log?.cumulativePercent >= 100) return "#1B5E20"; // ✅ DARK GREEN for 100% Complete
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
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
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

      // 🔥 saveProgressLog now handles ALL refresh logic internally
      await dispatch(
        saveProgressLog({
          subtaskId,
          date: selectedDate.format("YYYY-MM-DD"),
          dailyPercent: value,
          remarks,
          location: location || undefined,
          dayNumber: dayNumber ? Number(dayNumber) : undefined,
          file: photo || undefined,
        }),
      );

      // 🔥 FALLBACK: Manually refresh S-Curve with projectId from Redux
      try {
        if (currentProjectId) {
          await dispatch(getSCurve(currentProjectId) as any);
          console.log("✅ S-Curve manually refreshed:", currentProjectId);
        } else {
          console.warn("⚠️ No projectId available for S-Curve refresh");
        }
      } catch (scurveErr) {
        console.warn("⚠️ S-Curve manual refresh warning:", scurveErr);
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
        setPhoto(null);
        setPhotoPreview("");
        setSuccess(false);
        // Refresh logs
        dispatch(getProgressLogs(subtaskId));
        // 🔥 CALL onSuccess callback to notify parent to reload
        // TaskBoard: Reloads all assigned subtasks
        // SprintManagement: Reloads subtasks for current task (preserves project/category selection)
        if (onSuccess) {
          onSuccess();
        }
      }, 2000);
    } catch (err: any) {
      console.error("❌ Error saving progress:", err);
      setError(err.response?.data?.message || "Failed to save progress");
      setSaveModalOpen(false);
    }
  }, [dispatch, dailyPercent, remarks, location, dayNumber, photo, selectedDate, subtaskId, currentProjectId, onSuccess, isTaskBoard]);

  const remainingProgress = 100 - cumulativeProgress;

  return (
    <Box display="grid" gridTemplateColumns="3fr 1.2fr" gap={2}>
      {error && <Alert severity="error" sx={{ gridColumn: "1/-1" }}>{error}</Alert>}
      {loadingSubtask && <Alert severity="info" sx={{ gridColumn: "1/-1" }}>Loading subtask details...</Alert>}

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
            const log = logs[key];
            const isSelected = selectedDate.isSame(date, "day");

            return (
              <Box
                key={key}
                onClick={() => {
                  setSelectedDate(date);
                  if (log) setShowExistingLogModal(true);
                }}
                sx={{
                  minHeight: 100,
                  border: "1px solid #ddd",
                  p: 1,
                  cursor: "pointer",
                  backgroundColor: getBackgroundColor(date, log, isSelected),
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

                {log && (
                  <>
                    <Chip
                      label={`+${log.dailyPercent}%`}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: 10,
                        mt: 0.5,
                        backgroundColor: "#1976d2",
                        color: "white",
                      }}
                    />
                    <Typography fontSize={10} sx={{ mt: 0.5, fontWeight: "bold" }}>
                      Total: {log.cumulativePercent}%
                    </Typography>
                  </>
                )}
              </Box>
            );
          })}
        </Box>

        {/* Progress Overview */}
        <Box sx={{ mt: 3, p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            📊 Overall Progress
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={cumulativeProgress} 
            sx={{ mb: 1, height: 8, borderRadius: 1 }}
          />
          <Typography variant="caption">
            {cumulativeProgress.toFixed(1)}% of 100% • Remaining: {remainingProgress.toFixed(1)}%
          </Typography>
        </Box>

        {/* COLOR LEGEND */}
        <Box sx={{ mt: 3, p: 2, backgroundColor: "#fafafa", borderRadius: 1, border: "1px solid #e0e0e0" }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: "bold" }}>
            🎨 Color Guide
          </Typography>
          
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
            {/* Row 1 */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 20, height: 20, backgroundColor: "#1B5E20", borderRadius: "3px", border: "1px solid #ccc" }} />
              <Typography variant="caption">✅ 100% Complete</Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 20, height: 20, backgroundColor: "#388E3C", borderRadius: "3px", border: "1px solid #ccc" }} />
              <Typography variant="caption">💚 75%+ Progress</Typography>
            </Box>

            {/* Row 2 */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 20, height: 20, backgroundColor: "#66BB6A", borderRadius: "3px", border: "1px solid #ccc" }} />
              <Typography variant="caption">📈 50-75% Progress</Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 20, height: 20, backgroundColor: "#81C784", borderRadius: "3px", border: "1px solid #ccc" }} />
              <Typography variant="caption">⚡ Started (under 50%)</Typography>
            </Box>

            {/* Row 3 */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 20, height: 20, backgroundColor: "#C8E6C9", borderRadius: "3px", border: "1px solid #ccc" }} />
              <Typography variant="caption">⏳ In Range (no log)</Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 20, height: 20, backgroundColor: "#FFA726", borderRadius: "3px", border: "1px solid #ccc" }} />
              <Typography variant="caption">⚠️ Overdue (partial)</Typography>
            </Box>

            {/* Row 4 */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 20, height: 20, backgroundColor: "#D32F2F", borderRadius: "3px", border: "1px solid #ccc" }} />
              <Typography variant="caption">❌ Overdue (no progress)</Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 20, height: 20, backgroundColor: "#7B1FA2", borderRadius: "3px", border: "1px solid #ccc" }} />
              <Typography variant="caption">📌 Early Log</Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* RIGHT PANEL */}
      <Paper sx={{ p: 3, maxHeight: "800px", overflowY: "auto" }}>
        {/* Success State */}
        {success && (
          <Box sx={{ textAlign: "center", py: 3 }}>
            <CheckCircleIcon sx={{ fontSize: 48, color: "#2E7D32", mb: 1 }} />
            <Typography sx={{ color: "#2E7D32", fontWeight: "bold" }}>
              Progress Logged!
            </Typography>
          </Box>
        )}

        {/* Form */}
        {!success && (
          <>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {selectedDate.format("MMM DD, YYYY")}
            </Typography>

            {selectedLog && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Progress already logged on this date. Edit the details below or select another date.
              </Alert>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Cumulative Progress Info */}
            <Box sx={{ mb: 2, p: 1.5, backgroundColor: "#f0f0f0", borderRadius: 1 }}>
              <Typography variant="caption" sx={{ display: "block", color: "#666", mb: 0.5 }}>
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
                dailyPercent 
                  ? Number(dailyPercent) > remainingProgress 
                  : false
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
                startAdornment: <LocationOnIcon sx={{ mr: 1, color: "#666" }} />,
              }}
              sx={{ mt: 2 }}
            />

            {/* Remarks */}
            <TextField
              label="Remarks"
              multiline
              rows={2}
              fullWidth
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              sx={{ mt: 2 }}
            />

            {/* Photo Upload */}
            <Box sx={{ mt: 2 }}>
              <input
                accept="image/*"
                style={{ display: "none" }}
                id="photo-input"
                type="file"
                onChange={handlePhotoChange}
              />
              <label htmlFor="photo-input" style={{ width: "100%" }}>
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  startIcon={<CloudUploadIcon />}
                  sx={{ mt: 1 }}
                >
                  {photo ? "📸 Photo Selected" : "Upload Photo"}
                </Button>
              </label>

              {photoPreview && (
                <Box
                  component="img"
                  src={photoPreview}
                  sx={{
                    mt: 2,
                    width: "100%",
                    height: 150,
                    objectFit: "cover",
                    borderRadius: 1,
                    border: "1px solid #ddd",
                  }}
                />
              )}
            </Box>

            {/* Save Button */}
            <Button
              variant="contained"
              fullWidth
              sx={{ mt: 3 }}
              onClick={handleSave}
              disabled={isLoading || !dailyPercent || cumulativeProgress >= 100}
            >
              {isLoading ? "Saving..." : "Save Progress"}
            </Button>
          </>
        )}
      </Paper>

      {/* SUCCESS MODAL WITH LOADING */}
      <Dialog open={saveModalOpen} onClose={() => setSaveModalOpen(false)} maxWidth="sm" fullWidth>
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
                <CheckCircleIcon sx={{ fontSize: 60, color: "#2E7D32", mb: 2 }} />
                <Typography sx={{ fontWeight: "bold", color: "#2E7D32", fontSize: 18 }}>
                  Progress Saved Successfully! ✅
                </Typography>
                <Typography sx={{ mt: 1, color: "#666" }}>
                  +{dailyPercent}% added to your progress
                </Typography>
              </>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* EXISTING LOG MODAL */}
      <Dialog 
        open={showExistingLogModal} 
        onClose={() => setShowExistingLogModal(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>📋 Progress Log Details</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ color: "#666" }}>
                  Date
                </Typography>
                <Typography variant="body1">
                  {dayjs(selectedLog.date).format("MMMM DD, YYYY")}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: "#666" }}>
                  Daily Progress
                </Typography>
                <Chip label={`+${selectedLog.dailyPercent}%`} color="primary" />
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: "#666" }}>
                  Cumulative Progress
                </Typography>
                <Typography variant="body1">
                  {selectedLog.cumulativePercent}% of 100%
                </Typography>
              </Box>

              {selectedLog.location && (
                <Box>
                  <Typography variant="caption" sx={{ color: "#666" }}>
                    📍 Location
                  </Typography>
                  <Typography variant="body2">{selectedLog.location}</Typography>
                </Box>
              )}

              {selectedLog.dayNumber && (
                <Box>
                  <Typography variant="caption" sx={{ color: "#666" }}>
                    Day Number
                  </Typography>
                  <Typography variant="body2">Day {selectedLog.dayNumber}</Typography>
                </Box>
              )}

              {selectedLog.remarks && (
                <Box>
                  <Typography variant="caption" sx={{ color: "#666" }}>
                    Remarks
                  </Typography>
                  <Typography variant="body2">{selectedLog.remarks}</Typography>
                </Box>
              )}

              {selectedLog.photoUrl && (
                <Box>
                  <Typography variant="caption" sx={{ color: "#666", display: "block", mb: 1 }}>
                    📸 Photo
                  </Typography>
                  <Box
                    component="img"
                    src={selectedLog.photoUrl}
                    sx={{
                      width: "100%",
                      height: 200,
                      objectFit: "cover",
                      borderRadius: 1,
                      border: "1px solid #ddd",
                    }}
                  />
                </Box>
              )}

              {selectedLog.userId && (
                <Box>
                  <Typography variant="caption" sx={{ color: "#666" }}>
                    Added By
                  </Typography>
                  <Typography variant="body2">User ID: {selectedLog.userId}</Typography>
                </Box>
              )}

              {selectedLog.createdAt && (
                <Box>
                  <Typography variant="caption" sx={{ color: "#666" }}>
                    Created At
                  </Typography>
                  <Typography variant="body2">
                    {dayjs(selectedLog.createdAt).format("MMM DD, YYYY hh:mm A")}
                  </Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExistingLogModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}