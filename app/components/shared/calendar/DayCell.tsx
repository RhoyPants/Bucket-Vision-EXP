"use client";

import React, { memo } from "react";
import { Box, Typography } from "@mui/material";
import { SubtaskBarData } from "@/app/redux/slices/projectCalendarSlice";
import SubtaskBar from "./SubtaskBar";

interface DayCellProps {
  day: number;
  subtasks: SubtaskBarData[];
  isCurrentMonth: boolean;
  isToday: boolean;
  onSubtaskClick: (subtaskId: string) => void;
}

const DayCell = memo(
  ({ day, subtasks, isCurrentMonth, isToday, onSubtaskClick }: DayCellProps) => {
    return (
      <Box
        sx={{
          minHeight: 120,
          p: 0.75,
          border: "1px solid #e0e0e0",
          backgroundColor: (() => {
            if (!isCurrentMonth) return "#fafafa";
            if (isToday) return "#f0f7ff";
            return "white";
          })(),
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          transition: "all 0.2s ease",
          "&:hover": {
            backgroundColor: isCurrentMonth ? "#f5f5f5" : "#fafafa",
          },
        }}
      >
        {/* Day number */}
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: isToday ? 700 : 600,
            color: isToday ? "#1976d2" : "inherit",
            fontSize: "0.9rem",
          }}
        >
          {day}
        </Typography>

        {/* Subtask bars container */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 0.25,
            flex: 1,
            overflow: "hidden",
          }}
        >
          {subtasks && subtasks.length > 0 ? (
            subtasks.slice(0, 3).map((subtask) => (
              <SubtaskBar
                key={subtask.id}
                subtask={subtask}
                onClick={onSubtaskClick}
              />
            ))
          ) : null}

          {/* Overflow indicator */}
          {subtasks && subtasks.length > 3 && (
            <Typography
              variant="caption"
              sx={{
                color: "#999",
                fontSize: "0.7rem",
                fontStyle: "italic",
              }}
            >
              +{subtasks.length - 3} more
            </Typography>
          )}
        </Box>
      </Box>
    );
  }
);

DayCell.displayName = "DayCell";

export default DayCell;
