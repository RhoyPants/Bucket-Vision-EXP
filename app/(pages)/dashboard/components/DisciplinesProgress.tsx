"use client";

import React from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
} from "@mui/material";
import { Layers, TrendingUp } from "lucide-react";
import { useAppSelector } from "@/app/redux/hook";

interface DisciplineRow {
  id: string;
  name: string;
  progress: number;
  tasks: number;
  subtasks: number;
  budget: number;
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
};

const getProgressColor = (progress: number) => {
  if (progress >= 80) return "#4caf50";
  if (progress >= 50) return "#ff9800";
  return "#f44336";
};

const getProgressChipColor = (
  progress: number
): "success" | "warning" | "error" => {
  if (progress >= 80) return "success";
  if (progress >= 50) return "warning";
  return "error";
};

export const DisciplinesProgress: React.FC = () => {
  const { disciplines } = useAppSelector((state) => state.dashboard);

  const data: DisciplineRow[] =
    disciplines?.map((d) => ({
      id: d.id,
      name: d.name,
      progress: d.progress,
      tasks: d.tasks,
      subtasks: d.subtasks,
      budget: d.budgetAllocated,
    })) || [];

  if (data.length === 0) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
            Progress by Discipline / Work Package
          </Typography>
          <Typography variant="body2" sx={{ color: "#666" }}>
            No disciplines available yet.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
          <Layers size={24} color="#1976d2" />
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Progress by Discipline / Work Package
          </Typography>
        </Box>

        {/* Overview Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
            gap: 2,
            mb: 3,
          }}
        >
          {data.map((discipline) => (
            <Box key={discipline.id}>
              <Tooltip title={`${discipline.name} - ${discipline.progress.toFixed(1)}% complete`}>
                <Box
                  sx={{
                    p: 2,
                    border: "1px solid #e0e0e0",
                    borderRadius: 1,
                    backgroundColor: "#fafafa",
                    "&:hover": {
                      backgroundColor: "#f5f5f5",
                      borderColor: "#1976d2",
                    },
                    transition: "all 0.2s",
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {discipline.name}
                    </Typography>
                    <Chip
                      label={`${discipline.progress.toFixed(1)}%`}
                      size="small"
                      color={getProgressChipColor(discipline.progress)}
                      variant="filled"
                      icon={<TrendingUp size={14} />}
                    />
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={Math.min(discipline.progress, 100)}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "rgba(0,0,0,0.1)",
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: getProgressColor(discipline.progress),
                        borderRadius: 4,
                      },
                      mb: 1,
                    }}
                  />

                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      fontSize: "0.75rem",
                      color: "#999",
                    }}
                  >
                    <span>📋 {discipline.tasks} tasks</span>
                    <span>✓ {discipline.subtasks} subtasks</span>
                  </Box>
                </Box>
              </Tooltip>
            </Box>
          ))}
        </Box>

        {/* Detailed Table */}
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
          Detailed Breakdown
        </Typography>

        <TableContainer sx={{ border: "1px solid #e0e0e0", borderRadius: 1 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: 600 }}>Discipline</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  Progress
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Tasks
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Subtasks
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Budget Allocated
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, index) => (
                <TableRow
                  key={row.id}
                  sx={{
                    backgroundColor: index % 2 === 0 ? "#fff" : "#fafafa",
                    "&:hover": { backgroundColor: "#f0f0f0" },
                  }}
                >
                  <TableCell sx={{ fontWeight: 500 }}>{row.name}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, justifyContent: "center" }}>
                      <Box sx={{ width: 60 }}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(row.progress, 100)}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: "rgba(0,0,0,0.1)",
                            "& .MuiLinearProgress-bar": {
                              backgroundColor: getProgressColor(row.progress),
                            },
                          }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 40 }}>
                        {row.progress.toFixed(1)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">{row.tasks}</TableCell>
                  <TableCell align="right">{row.subtasks}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 500 }}>
                    {formatCurrency(row.budget)}
                  </TableCell>
                </TableRow>
              ))}
              {/* Total Row */}
              <TableRow sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
                <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                <TableCell align="center">
                  <Typography sx={{ fontWeight: 700 }}>
                    {(
                      data.reduce((sum, d) => sum + d.progress, 0) / data.length
                    ).toFixed(1)}
                    %
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {data.reduce((sum, d) => sum + d.tasks, 0)}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {data.reduce((sum, d) => sum + d.subtasks, 0)}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {formatCurrency(
                    data.reduce((sum, d) => sum + d.budget, 0)
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default DisciplinesProgress;
