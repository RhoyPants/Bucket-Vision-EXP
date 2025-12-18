// app/components/shared/SummaryBar.tsx
"use client";
import React from "react";
import { Box, Grid, Button, Typography, MenuItem, Select } from "@mui/material";

export type SummaryStat = { label: string; value: number | string };

export default function SummaryBar({
  stats,
  priorityCounts,
  projectList = [],
  selectedProjectId,
  onSelectProject,
  showAddTaskButton = false,
  onAddTask,
}: {
  stats: SummaryStat[];
  priorityCounts?: { high: number; medium: number; low: number };

  // ⭐ NEW
  projectList?: { project_id: number; project_name: string }[];
  selectedProjectId?: number | null;
  onSelectProject?: (id: number) => void;

  showAddTaskButton?: boolean;
  onAddTask?: () => void;
}) {
  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid size={{ xs: 12, md: 3 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "row", md: "column" },
              gap: 1,
              alignItems: "flex-start",
            }}
          >
            {/* ⭐ PROJECT DROPDOWN */}
            {projectList.length > 0 && (
              <Select
                fullWidth
                value={selectedProjectId ?? ""}
                onChange={(e) => onSelectProject?.(Number(e.target.value))}
                displayEmpty
                sx={{
                  bgcolor: "#27124b",
                  color: "white",
                  textTransform: "none",
                  height: 40,
                  borderRadius: 1,
                }}
              >
                <MenuItem value="" disabled>
                  Select Project
                </MenuItem>

                {projectList.map((p) => (
                  <MenuItem key={p.project_id} value={p.project_id}>
                    {p.project_name}
                  </MenuItem>
                ))}
              </Select>
            )}

            {/* ADD TASK BUTTON */}
            {showAddTaskButton && (
              <Button
                variant="outlined"
                onClick={onAddTask}
                sx={{ textTransform: "none" }}
              >
                Add New Task
              </Button>
            )}

            {/* Priority Counter */}
            {priorityCounts && (
              <Box
                sx={{
                  ml: { xs: 1, md: 0 },
                  mt: { xs: 0, md: 1 },
                  border: "1px solid #e6e6e6",
                  p: 1,
                  borderRadius: 1,
                  background: "#fff",
                }}
              >
                <Typography sx={{ fontSize: 13 }}>
                  High: {priorityCounts.high}
                </Typography>
                <Typography sx={{ fontSize: 13 }}>
                  Medium: {priorityCounts.medium}
                </Typography>
                <Typography sx={{ fontSize: 13 }}>
                  Low: {priorityCounts.low}
                </Typography>
              </Box>
            )}
          </Box>
        </Grid>

        {/* Stats */}
        <Grid size={{ xs: 12, md: 9 }}>
          <Grid container spacing={2}>
            {stats.map((s) => (
              <Grid key={s.label} size={{ xs: 12, sm: 6, md: 3 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: "#efeaf4",
                    textAlign: "center",
                    boxShadow: "0 4px 10px rgba(20,10,40,0.04)",
                  }}
                >
                  <Typography sx={{ fontWeight: 700, color: "#2b0e63" }}>
                    {s.label}
                  </Typography>
                  <Typography sx={{ fontSize: 28, fontWeight: 800 }}>
                    {s.value}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
