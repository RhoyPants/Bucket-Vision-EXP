// app/(pages)/sprintManagement/Components/SprintHeader.tsx
"use client";
import React from "react";
import { Box, Typography, Button } from "@mui/material";

export default function SprintHeader({
  title,
  version,
  onAddSubtask,
}: { title: string; version?: string; onAddSubtask?: () => void }) {
  return (
    <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
      <Box sx={{
        flex: 1,
        p: 2,
        borderRadius: 2,
        background: "linear-gradient(90deg,#2d0f6f 0%, #8e6bb3 60%)",
        color: "#fff",
        boxShadow: "0 6px 14px rgba(20,10,60,0.06)"
      }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>{title}</Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 1 }}>
        <Button variant="contained" onClick={onAddSubtask} sx={{ bgcolor: "#2f7a2f", textTransform: "none" }}>
          Add New Sub Task
        </Button>
        {version && (
          <Button variant="contained" sx={{ bgcolor: "#27124b", textTransform: "none" }}>
            Version {version}
          </Button>
        )}
      </Box>
    </Box>
  );
}
