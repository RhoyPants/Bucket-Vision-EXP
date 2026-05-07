"use client";

import React, { useMemo, memo } from "react";
import { Box, Typography, Paper } from "@mui/material";
import { SubtaskBarData } from "@/app/redux/slices/projectCalendarSlice";
import { getWeeksInMonth, getSubtasksInWeek, CalendarSubtask } from "./calendarUtils";
import WeekRow from "./WeekRow";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface CalendarGridProps {
  month: number;
  year: number;
  subtasks: SubtaskBarData[];
  onSubtaskClick: (subtaskId: string) => void;
}

const CalendarGrid = memo(function CalendarGrid({
  month,
  year,
  subtasks,
  onSubtaskClick,
}: CalendarGridProps) {
  const weeks = useMemo(() => getWeeksInMonth(year, month), [year, month]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const isToday = (d: Date) =>
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();

  const isInMonth = (d: Date) => d.getMonth() === month - 1 && d.getFullYear() === year;

  return (
    <Paper
      elevation={0}
      sx={{ border: "1px solid #e0e0e0", overflow: "hidden", borderRadius: 2 }}
    >
      {/* ── Weekday header ─────────────────────────────── */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          backgroundColor: "#f5f5f5",
          borderBottom: "1px solid #e5e5e5",
        }}
      >
        {WEEKDAY_LABELS.map((label) => (
          <Typography
            key={label}
            variant="caption"
            align="center"
            sx={{
              py: 1,
              fontWeight: 700,
              color: "#555",
              fontSize: "0.75rem",
              letterSpacing: 0.4,
            }}
          >
            {label}
          </Typography>
        ))}
      </Box>

      {/* ── Week rows ──────────────────────────────────── */}
      {weeks.map((week, wi) => {
        const weekSubtasks = getSubtasksInWeek(
          subtasks as CalendarSubtask[],
          week.weekStart,
          week.weekEnd
        );

        // Build the 7 day-cells for this week
        const days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(week.weekStart);
          d.setDate(d.getDate() + i);
          return d;
        });

        return (
          <Box
            key={wi}
            sx={{
              borderBottom: wi < weeks.length - 1 ? "1px solid #f1f1f1" : "none",
              // Alternate week rows: even rows get a barely-visible tint
              backgroundColor: wi % 2 === 1 ? "#fafafa" : "#ffffff",
            }}
          >
            {/* Day-number strip */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                borderBottom: "1px solid #f1f1f1",
              }}
            >
              {days.map((d, di) => {
                const today_ = isToday(d);
                const inMonth = isInMonth(d);
                return (
                  <Box
                    key={di}
                    sx={{
                      borderRight: di < 6 ? "1px solid #f1f1f1" : "none",
                      px: 0.5,
                      py: 0.4,
                      backgroundColor: today_ ? "#e8f4fd" : "transparent",
                      textAlign: "center",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: today_ ? 700 : 400,
                        color: today_ ? "#1976d2" : inMonth ? "#333" : "#c0c0c0",
                        fontSize: "0.72rem",
                      }}
                    >
                      {d.getDate()}
                    </Typography>
                  </Box>
                );
              })}
            </Box>

            {/* Gantt bars area — column guide lines via background */}
            <Box
              sx={{
                position: "relative",
                px: 0.5,
                pt: 0.5,
                pb: 0.75,
                backgroundImage: `repeating-linear-gradient(
                  to right,
                  transparent,
                  transparent calc(${100 / 7}% - 1px),
                  #f1f1f1 calc(${100 / 7}% - 1px),
                  #f1f1f1 ${100 / 7}%
                )`,
              }}
            >
              <WeekRow
                weekStart={week.weekStart}
                weekEnd={week.weekEnd}
                subtasks={weekSubtasks}
                onSubtaskClick={onSubtaskClick}
              />
            </Box>
          </Box>
        );
      })}

      {/* Empty state */}
      {subtasks.length === 0 && (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <Typography variant="body2" sx={{ color: "#9ca3af" }}>
            No subtasks found for this period
          </Typography>
        </Box>
      )}
    </Paper>
  );
});

export default CalendarGrid;
