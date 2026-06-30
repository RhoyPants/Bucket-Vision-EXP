"use client";

import React from "react";
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import type { SubtaskCardData } from "@/app/api-service/myBoardService";

interface BoardCardGridProps {
  subtasks: SubtaskCardData[];
  onUpdateProgress: (subtask: SubtaskCardData) => void;
  actionLoadingId?: string | null;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

const getProgressColor = (progress: number) => {
  if (progress >= 100) return "#16a34a";
  if (progress >= 60) return "#2563eb";
  if (progress > 0) return "#f59e0b";
  return "#94a3b8";
};

const getStatusLabel = (progress: number) => {
  if (progress >= 100) return "Completed";
  if (progress > 0) return "In progress";
  return "Not started";
};

const formatDate = (date?: string | Date) => {
  if (!date) return "No date";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "No date";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function BoardCardGrid({
  subtasks,
  onUpdateProgress,
  actionLoadingId,
  page,
  totalPages,
  total,
  onPageChange,
}: BoardCardGridProps) {
  return (
    <Box>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: "1px solid #E3E8EF",
          borderRadius: 2,
          overflowX: "auto",
          background: "#FFFFFF",
        }}
      >
        <Table stickyHeader sx={{ minWidth: 980 }}>
          <TableHead>
            <TableRow>
              {["Subtask", "Project", "Scope / Task", "Assignees", "Progress", "Schedule", "Assignor", ""].map((label) => (
                <TableCell
                  key={label}
                  sx={{
                    bgcolor: "#F8FAFC",
                    color: "#475569",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 0,
                    textTransform: "uppercase",
                    borderBottom: "1px solid #E3E8EF",
                    py: 1.5,
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {subtasks.map((subtask) => {
              const progress = Number(subtask.progress || 0);
              const assigneeNames = subtask.assigneeNames?.length
                ? subtask.assigneeNames
                : subtask.assignees?.map((assignee) => assignee.user?.name).filter(Boolean) || [];
              const progressColor = getProgressColor(progress);

              return (
                <TableRow
                  key={subtask.id}
                  sx={{
                    "&:hover": { bgcolor: "#F8FAFC" },
                    "& td": {
                      borderBottom: "1px solid #EEF2F7",
                      py: 1.6,
                    },
                  }}
                >
                  <TableCell sx={{ minWidth: 240 }}>
                    <Stack spacing={0.5}>
                      <Typography sx={{ fontSize: 13, color: "#0f172a", fontWeight: 750, lineHeight: 1.25 }}>
                        {subtask.subtaskName || subtask.title}
                      </Typography>
                      <Chip
                        size="small"
                        label={getStatusLabel(progress)}
                        sx={{
                          width: "fit-content",
                          height: 22,
                          borderRadius: 1,
                          bgcolor: `${progressColor}14`,
                          color: progressColor,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      />
                    </Stack>
                  </TableCell>

                  <TableCell sx={{ minWidth: 180 }}>
                    <Typography sx={{ fontSize: 13, color: "#334155", fontWeight: 650 }}>
                      {subtask.projectName || subtask.project?.name || "No project"}
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ minWidth: 220 }}>
                    <Stack spacing={0.4}>
                      <Typography sx={{ fontSize: 13, color: "#334155", fontWeight: 650 }}>
                        {subtask.scopeName || subtask.scope?.name || "No scope"}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: "#64748b" }}>
                        {subtask.taskName || subtask.task?.title || "No task"}
                      </Typography>
                    </Stack>
                  </TableCell>

                  <TableCell sx={{ minWidth: 190 }}>
                    <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                      {assigneeNames.length > 0 ? (
                        <>
                          {assigneeNames.slice(0, 2).map((name) => (
                            <Chip
                              key={name}
                              size="small"
                              label={name}
                              sx={{
                                maxWidth: 130,
                                height: 24,
                                bgcolor: "#EFF6FF",
                                color: "#1d4ed8",
                                "& .MuiChip-label": {
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                },
                              }}
                            />
                          ))}
                          {assigneeNames.length > 2 && (
                            <Chip size="small" label={`+${assigneeNames.length - 2}`} sx={{ height: 24 }} />
                          )}
                        </>
                      ) : (
                        <Typography sx={{ fontSize: 12, color: "#94a3b8" }}>No assignee</Typography>
                      )}
                    </Stack>
                  </TableCell>

                  <TableCell sx={{ minWidth: 170 }}>
                    <Stack spacing={0.75}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography sx={{ fontSize: 12, color: "#64748b" }}>Progress</Typography>
                        <Typography sx={{ fontSize: 12, color: "#0f172a", fontWeight: 800 }}>{progress}%</Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, Math.max(0, progress))}
                        sx={{
                          height: 7,
                          borderRadius: 999,
                          bgcolor: "#E2E8F0",
                          "& .MuiLinearProgress-bar": {
                            bgcolor: progressColor,
                            borderRadius: 999,
                          },
                        }}
                      />
                    </Stack>
                  </TableCell>

                  <TableCell sx={{ whiteSpace: "nowrap", minWidth: 150 }}>
                    <Stack spacing={0.25}>
                      <Typography sx={{ fontSize: 12, color: "#334155", fontWeight: 650 }}>
                        {formatDate(subtask.startDate || subtask.projectedStartDate)}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: "#64748b" }}>
                        to {formatDate(subtask.endDate || subtask.projectedEndDate)}
                      </Typography>
                    </Stack>
                  </TableCell>

                  <TableCell sx={{ minWidth: 130 }}>
                    <Typography sx={{ fontSize: 12, color: "#64748b" }}>
                      {subtask.assignorName || "Unknown"}
                    </Typography>
                  </TableCell>

                  <TableCell align="right" sx={{ width: 120 }}>
                    <Button
                      size="small"
                      variant="contained"
                      endIcon={<OpenInNewOutlinedIcon sx={{ fontSize: 16 }} />}
                      disabled={actionLoadingId === subtask.id}
                      onClick={() => onUpdateProgress(subtask)}
                      sx={{
                        borderRadius: 1,
                        textTransform: "none",
                        fontWeight: 700,
                        bgcolor: "#0F172A",
                        "&:hover": { bgcolor: "#1E293B" },
                      }}
                    >
                      {actionLoadingId === subtask.id ? "Opening" : "Update"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Paper
          elevation={0}
          sx={{ mt: 2, p: 1.5, border: "1px solid #E3E8EF", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}
        >
          <Typography sx={{ fontSize: 13, color: "#64748b" }}>
            Showing page {page} of {totalPages}, {total} total
          </Typography>
          <Pagination
            page={page}
            count={totalPages}
            onChange={(_, nextPage) => onPageChange(nextPage)}
            color="primary"
            size="small"
          />
        </Paper>
      )}
    </Box>
  );
}
