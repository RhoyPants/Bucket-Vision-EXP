// app/(pages)/sprint/components/SelectedTaskHeader.tsx
"use client";
import React from "react";
import { Box, Typography, Chip, LinearProgress } from "@mui/material";

export default function SelectedTaskHeader({
  task,
  onAddSubtask,
}: {
  task: { id: string; title: string; meta?: { approved?: boolean; progress?: number } } | null;
  onAddSubtask?: () => void;
}) {
  if (!task) return <Box>No task selected</Box>;

  const progress = task.meta?.progress ?? 0;
  const approved = task.meta?.approved ?? false;

  return (
    <Box sx={{ mb: 2, p: 2, borderRadius: 2, background: "#f1f3f8", display: "flex", flexDirection: "column", gap: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>{task.title}</Typography>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          {approved && <Chip label="Approved" color="success" sx={{ fontWeight: 700 }} />}
        </Box>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: 13, color: "text.secondary" }}>Project Progress</Typography>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 2, mt: 1 }} />
        </Box>
        <Typography sx={{ fontWeight: 700 }}>{progress}%</Typography>
      </Box>
    </Box>
  );
}
