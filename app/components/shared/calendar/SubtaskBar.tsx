"use client";

import React, { useMemo } from "react";
import { Box, Typography, Chip } from "@mui/material";
import { SubtaskBarData } from "@/app/redux/slices/projectCalendarSlice";

interface SubtaskBarProps {
  subtask: SubtaskBarData;
  onClick: (subtaskId: string) => void;
}

export default function SubtaskBar({ subtask, onClick }: SubtaskBarProps) {
  // ✅ Determine color based on progress
  const getProgressColor = (progress: number) => {
    if (progress <= 30) return "#ef5350"; // red
    if (progress <= 70) return "#ffa726"; // orange
    return "#66bb6a"; // green
  };

  const backgroundColor = useMemo(
    () => getProgressColor(subtask.progress),
    [subtask.progress]
  );

  return (
    <Box
      onClick={() => onClick(subtask.id)}
      sx={{
        px: 1,
        py: 0.5,
        mb: 0.5,
        backgroundColor,
        borderRadius: 0.75,
        cursor: "pointer",
        transition: "all 0.2s ease",
        "&:hover": {
          transform: "translateX(2px)",
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
        },
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 0.5,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: "white",
          fontWeight: 500,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          flex: 1,
        }}
      >
        {subtask.title}
      </Typography>
      <Chip
        label={`${subtask.progress}%`}
        size="small"
        sx={{
          height: 20,
          backgroundColor: "rgba(255,255,255,0.3)",
          color: "white",
          fontSize: "0.7rem",
          fontWeight: 600,
          "& .MuiChip-label": {
            px: 0.5,
          },
        }}
      />
    </Box>
  );
}
