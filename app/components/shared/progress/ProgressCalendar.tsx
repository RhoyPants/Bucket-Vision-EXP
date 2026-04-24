"use client";

import { useEffect, useMemo, useCallback, useState } from "react";
import dayjs from "dayjs";
import { Box, Paper, Typography, TextField, Button, Divider, IconButton, Alert } from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

import { useDispatch, useSelector } from "react-redux";
import { getProgressLogs, saveProgressLog } from "@/app/redux/controllers/progressController";
import { getSCurve } from "@/app/redux/controllers/scurveController";
import { loadKanbanByTask, loadMyBoard } from "@/app/redux/controllers/subTaskController";
import axiosApi from "@/app/lib/axios";
import { RootState } from "@/app/redux/store";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface ProgressCalendarProps {
  subtaskId: string;
  isTaskBoard?: boolean;
}

export default function ProgressCalendar({ subtaskId, isTaskBoard = false }: ProgressCalendarProps) {
  const dispatch = useDispatch<any>();

  const logsArray =
    useSelector(
      (state: RootState) => state.progress.logsBySubtask[subtaskId],
    ) || [];

  // ✅ STABLE logs map
  const logs = useMemo(() => {
    const map: any = {};
    logsArray.forEach((log: any) => {
      const key = dayjs(log.date).format("YYYY-MM-DD");
      map[key] = log;
    });
    return map;
  }, [logsArray]);

  // =========================
  // STATE
  // =========================
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(dayjs());

  const [dailyPercent, setDailyPercent] = useState("");
  const [remarks, setRemarks] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);

  const [currentProgress, setCurrentProgress] = useState(0);
  const [range, setRange] = useState<any>(null);
  const [loadingSubtask, setLoadingSubtask] = useState(false);
  const [error, setError] = useState("");

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
  // SELECT DATE
  // =========================
  useEffect(() => {
    const key = selectedDate.format("YYYY-MM-DD");
    const log = logs[key];

    if (log) {
      setDailyPercent(String(log.dailyPercent));
      setRemarks(log.remarks || "");
    } else {
      setDailyPercent("");
      setRemarks("");
    }
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
    if (isSelected) return "#db60d1";

    if (!range?.start || !range?.end) return "#fff";

    const start = dayjs(range.start);
    const end = dayjs(range.end);

    const isBeforeStart = date.isBefore(start, "day");
    const isAfterEnd = date.isAfter(end, "day");

    if (log?.cumulativePercent >= 100) return "#2E7D32";
    if (isBeforeStart && log) return "#B39DDB";
    if (isBeforeStart) return "#fff";

    if (!isAfterEnd) return log ? "#81C784" : "#E3F2FD";

    return "#FFCDD2";
  };

  // =========================
  // SAVE (🔥 FULL REAL-TIME FIX)
  // =========================
  const handleSave = useCallback(async () => {
    const value = Number(dailyPercent);
    if (!value || value <= 0 || value > 100) {
      alert("Please enter valid progress (1–100)");
      return;
    }

    try {
      const res = await dispatch(
        saveProgressLog({
          subtaskId,
          date: selectedDate.format("YYYY-MM-DD"),
          dailyPercent: value,
          remarks,
          file: photo || undefined,
        }),
      );

      let taskId = res?.payload?.taskId;
      let projectId = res?.payload?.projectId;

      if (!taskId || !projectId) {
        const { data } = await axiosApi.get(`/subtasks/${subtaskId}`);
        taskId = data.taskId;
        projectId = data.task?.category?.projectId;
      }

      if (taskId) {
        await dispatch(loadKanbanByTask(taskId));
      }

      if (projectId) {
        await dispatch(getSCurve(projectId));
      }

      if (isTaskBoard) {
        await dispatch(loadMyBoard());
      }

      setCurrentProgress((prev) => Math.min(100, prev + value));
      setPhoto(null);
    } catch (err) {
      console.error("❌ Error saving progress:", err);
      alert("Failed to save progress");
    }
  }, [dispatch, dailyPercent, remarks, photo, selectedDate, subtaskId, isTaskBoard]);

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
            <Box key={d} textAlign="center" fontWeight="bold">
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
                onClick={() => setSelectedDate(date)}
                sx={{
                  minHeight: 100,
                  border: "1px solid #ddd",
                  p: 1,
                  cursor: "pointer",
                  backgroundColor: getBackgroundColor(date, log, isSelected),
                }}
              >
                <Typography fontSize={12}>{date.date()}</Typography>

                {log && (
                  <>
                    <Typography fontSize={11} color="green">
                      +{log.dailyPercent}%
                    </Typography>
                    <Typography fontSize={11}>
                      {log.cumulativePercent}%
                    </Typography>
                  </>
                )}
              </Box>
            );
          })}
        </Box>
      </Paper>

      {/* RIGHT PANEL */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">
          {selectedDate.format("MMMM DD, YYYY")}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography>
          Current Progress: <b>{currentProgress}%</b>
        </Typography>

        <TextField
          label="Daily Progress (%)"
          type="number"
          fullWidth
          value={dailyPercent}
          onChange={(e) => setDailyPercent(e.target.value)}
          sx={{ mt: 2 }}
        />

        <TextField
          label="Remarks"
          multiline
          rows={3}
          fullWidth
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          sx={{ mt: 2 }}
        />

        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 3 }}
          onClick={handleSave}
        >
          Save Progress
        </Button>
      </Paper>
    </Box>
  );
}