// app/components/taskboard/TaskCard.tsx
"use client";

import {
  Box,
  Typography,
  Chip,
  Button,
  LinearProgress,
  Menu,
  MenuItem,
  Avatar,
} from "@mui/material";
import React from "react";
import type { TaskData, TaskStatus } from "@/app/(pages)/taskboard/taskTypes";

const priorityColors: Record<string, string> = {
  High: "#dc2626",
  Medium: "#f59e0b",
  Low: "#22c55e",
};

export default function TaskCard({
  id,
  title,
  priority,
  developer,
  dueDate,
  description,
  progress,
  overlay,
  // callback passed by parent to change status
  onOpenMenu,
}: TaskData & { onOpenMenu?: (e: React.MouseEvent, id: number) => void }) {
  return (
    <Box
      sx={{
        border: "1px solid #e6e6e6",
        borderRadius: 2,
        p: 2,
        backgroundColor: "#fff",
        mb: 2,
        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
        opacity: overlay ? 0.9 : 1,
      }}
      onDoubleClick={(e) => onOpenMenu?.(e as any, id)} // double click opens menu if provided
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography sx={{ fontWeight: 700, fontFamily: "var(--font-ftsterling)" }}>
          {title}
        </Typography>

        <Chip
          label={priority}
          size="small"
          sx={{
            backgroundColor: priorityColors[priority],
            color: "#fff",
            fontWeight: 700,
          }}
        />
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Avatar sx={{ width: 26, height: 26 }}>{developer[0]}</Avatar>
        <Typography sx={{ fontSize: 13 }}>{developer}</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Typography sx={{ fontSize: 13, color: "text.secondary" }}>{dueDate}</Typography>
      </Box>

      <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 1 }}>
        {description}
      </Typography>

      {typeof progress === "number" && (
        <Box sx={{ mb: 1 }}>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 1 }} />
        </Box>
      )}

      <Button variant="outlined" size="small" sx={{ textTransform: "none", fontWeight: 600 }}>
        View Details
      </Button>
    </Box>
  );
}
