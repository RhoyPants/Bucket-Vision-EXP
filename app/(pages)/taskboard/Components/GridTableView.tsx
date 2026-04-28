/**
 * Task Board GridTableView - Table display for subtasks with progress tracking
 * Clean tabular interface for managing assigned subtasks
 */

import React, { useMemo, useState } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Stack,
  IconButton,
  Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { SubtaskCardData } from "@/app/api-service/myBoardService";

interface GridTableViewProps {
  subtasks: SubtaskCardData[];
  onUpdateProgress: (subtask: SubtaskCardData) => void;
}

export default function GridTableView({
  subtasks,
  onUpdateProgress,
}: GridTableViewProps) {
  // ========================================
  // 🔥 FORMATTERS
  // ========================================
  const formatDate = (date?: string | Date) => {
    if (!date) return "-";
    try {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "-";
    }
  };

  const formatBudget = (budget?: number) => {
    if (!budget) return "₱0";
    return `₱${budget.toLocaleString()}`;
  };

  // ========================================
  // 🔥 CALCULATE STATISTICS
  // ========================================
  const totalBudget = useMemo(() => {
    return subtasks.reduce((sum, sub) => sum + (sub.budgetAllocated || 0), 0);
  }, [subtasks]);

  const getWeightPercent = (budget?: number) => {
    if (!budget || totalBudget === 0) return 0;
    return ((budget / totalBudget) * 100).toFixed(2);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "#4CAF50"; // Green
    if (progress >= 50) return "#FFC107"; // Amber
    return "#FF9800"; // Orange
  };

  // ========================================
  // 🔥 RENDER
  // ========================================
  if (!subtasks || subtasks.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: "center" }}>
        <Typography color="textSecondary">No subtasks to display</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: "#F7F8FA",
                borderBottom: "2px solid #DDE1E8",
              }}
            >
              <TableCell
                sx={{
                  fontWeight: 700,
                  color: "#1D1F26",
                  backgroundColor: "#F7F8FA",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  width: "25%",
                }}
              >
                Subtask Name
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontWeight: 700,
                  color: "#1D1F26",
                  backgroundColor: "#F7F8FA",
                  fontSize: "12px",
                  textTransform: "uppercase",
                }}
              >
                Budget (₱)
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontWeight: 700,
                  color: "#1D1F26",
                  backgroundColor: "#F7F8FA",
                  fontSize: "12px",
                  textTransform: "uppercase",
                }}
              >
                Weight %
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: 700,
                  color: "#1D1F26",
                  backgroundColor: "#F7F8FA",
                  fontSize: "12px",
                  textTransform: "uppercase",
                }}
              >
                Expected Start
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: 700,
                  color: "#1D1F26",
                  backgroundColor: "#F7F8FA",
                  fontSize: "12px",
                  textTransform: "uppercase",
                }}
              >
                Expected End
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: 700,
                  color: "#1D1F26",
                  backgroundColor: "#F7F8FA",
                  fontSize: "12px",
                  textTransform: "uppercase",
                }}
              >
                Actual Start
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: 700,
                  color: "#1D1F26",
                  backgroundColor: "#F7F8FA",
                  fontSize: "12px",
                  textTransform: "uppercase",
                }}
              >
                Actual End
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: 700,
                  color: "#1D1F26",
                  backgroundColor: "#F7F8FA",
                  fontSize: "12px",
                  textTransform: "uppercase",
                }}
              >
                Progress
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: 700,
                  color: "#1D1F26",
                  backgroundColor: "#F7F8FA",
                  fontSize: "12px",
                  textTransform: "uppercase",
                }}
              >
                Assignee
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: 700,
                  color: "#1D1F26",
                  backgroundColor: "#F7F8FA",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  width: "100px",
                }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {subtasks.map((subtask) => (
              <TableRow
                key={subtask.id}
                sx={{
                  backgroundColor: "#FFFFFF",
                  borderBottom: "1px solid #DDE1E8",
                  "&:hover": { backgroundColor: "#F7F8FA" },
                }}
              >
                {/* Subtask Name with Category & Task */}
                <TableCell sx={{ fontWeight: 600, color: "#1D1F26", fontSize: "13px" }}>
                  <Stack spacing={0.5}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: "#A5ADB8",
                        }}
                      />
                      <Typography sx={{ fontWeight: 600, color: "#1D1F26" }}>
                        {subtask.title}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        fontSize: "11px",
                        color: "#7D8693",
                        ml: 2.5,
                      }}
                    >
                      Task: {subtask.task?.title || "-"} | Category:{" "}
                      {subtask.category?.name || "-"}
                    </Typography>
                  </Stack>
                </TableCell>

                {/* Budget */}
                <TableCell
                  align="right"
                  sx={{ fontSize: "13px", color: "#7D8693" }}
                >
                  {formatBudget(subtask.budgetAllocated)}
                </TableCell>

                {/* Weight % */}
                <TableCell
                  align="right"
                  sx={{ fontSize: "13px", color: "#7D8693" }}
                >
                  {getWeightPercent(subtask.budgetAllocated)}%
                </TableCell>

                {/* Expected Start */}
                <TableCell
                  align="center"
                  sx={{ fontSize: "13px", color: "#7D8693" }}
                >
                  {formatDate(
                    (subtask as any)?.projectedStartDate ||
                      (subtask as any)?.expectedStartDate
                  )}
                </TableCell>

                {/* Expected End */}
                <TableCell
                  align="center"
                  sx={{ fontSize: "13px", color: "#7D8693" }}
                >
                  {formatDate(
                    (subtask as any)?.projectedEndDate ||
                      (subtask as any)?.expectedEndDate
                  )}
                </TableCell>

                {/* Actual Start */}
                <TableCell
                  align="center"
                  sx={{ fontSize: "13px", color: "#7D8693" }}
                >
                  {formatDate((subtask as any)?.actualStartDate)}
                </TableCell>

                {/* Actual End */}
                <TableCell
                  align="center"
                  sx={{ fontSize: "13px", color: "#7D8693" }}
                >
                  {formatDate((subtask as any)?.actualEndDate)}
                </TableCell>

                {/* Progress Bar with % */}
                <TableCell align="center" sx={{ fontSize: "13px" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        flex: 1,
                        height: "6px",
                        borderRadius: "3px",
                        backgroundColor: "#E0E0E0",
                        overflow: "hidden",
                        minWidth: "60px",
                      }}
                    >
                      <Box
                        sx={{
                          height: "100%",
                          width: `${subtask.progress || 0}%`,
                          backgroundColor: getProgressColor(subtask.progress || 0),
                          transition: "width 0.3s ease",
                        }}
                      />
                    </Box>
                    <Typography
                      sx={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#1D1F26",
                        minWidth: "35px",
                      }}
                    >
                      {subtask.progress || 0}%
                    </Typography>
                  </Box>
                </TableCell>

                {/* Assignee */}
                <TableCell align="center" sx={{ fontSize: "12px" }}>
                  {(subtask as any)?.assignees && (subtask as any)?.assignees.length > 0 ? (
                    <Stack direction="row" spacing={0.5} justifyContent="center" flexWrap="wrap" gap={0.5}>
                      {(subtask as any).assignees.slice(0, 2).map((assignee: any, idx: number) => (
                        <Chip
                          key={idx}
                          label={assignee.user?.name || "Unknown"}
                          size="small"
                          variant="outlined"
                          sx={{
                            height: "24px",
                            fontSize: "11px",
                            backgroundColor: "#e3f2fd",
                            borderColor: "#0C66E4",
                            color: "#0C66E4",
                          }}
                        />
                      ))}
                      {(subtask as any)?.assignees.length > 2 && (
                        <Chip
                          label={`+${(subtask as any).assignees.length - 2}`}
                          size="small"
                          variant="outlined"
                          sx={{
                            height: "24px",
                            fontSize: "11px",
                            backgroundColor: "#f3e5f5",
                            borderColor: "#9C27B0",
                            color: "#9C27B0",
                          }}
                        />
                      )}
                    </Stack>
                  ) : (
                    <Typography sx={{ fontSize: "12px", color: "#A5ADB8" }}>
                      Unassigned
                    </Typography>
                  )}
                </TableCell>

                {/* Actions */}
                <TableCell align="center">
                  <Tooltip title="Update Progress">
                    <IconButton
                      size="small"
                      onClick={() => onUpdateProgress(subtask)}
                      sx={{
                        color: "#0C66E4",
                        "&:hover": { backgroundColor: "#e3f2fd" },
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Summary Footer */}
      <Paper
        sx={{
          p: 2,
          mt: 2,
          backgroundColor: "#F7F8FA",
          borderRadius: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Stack spacing={1}>
          <Typography
            sx={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#7D8693",
              textTransform: "uppercase",
            }}
          >
            Summary
          </Typography>
          <Typography sx={{ fontSize: "14px", color: "#1D1F26" }}>
            <strong>Total Subtasks:</strong> {subtasks.length}
          </Typography>
          <Typography sx={{ fontSize: "14px", color: "#1D1F26" }}>
            <strong>Avg Progress:</strong>{" "}
            {subtasks.length > 0
              ? Math.round(
                  subtasks.reduce((sum, s) => sum + (s.progress || 0), 0) /
                    subtasks.length
                )
              : 0}
            %
          </Typography>
        </Stack>

        <Stack spacing={1} sx={{ textAlign: "right" }}>
          <Typography
            sx={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#7D8693",
              textTransform: "uppercase",
            }}
          >
            Total Budget
          </Typography>
          <Typography sx={{ fontSize: "18px", fontWeight: 700, color: "#1D1F26" }}>
            {formatBudget(totalBudget)}
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
