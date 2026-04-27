"use client";

import React from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import { AlertTriangle, Eye, TrendingUp } from "lucide-react";
import { useAppSelector } from "@/app/redux/hook";

export const ProjectsRequiringAttention: React.FC = () => {
  const { projectsNeedingAttention } = useAppSelector(
    (state) => state.dashboard
  );

  const data = projectsNeedingAttention || [];

  if (data.length === 0) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <AlertTriangle size={24} color="#ff9800" />
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Projects Requiring Attention
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "#666" }}>
            ✓ All projects are on track!
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CRITICAL":
        return "error";
      case "WATCHLIST":
        return "warning";
      default:
        return "success";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CRITICAL":
        return "🔴";
      case "WATCHLIST":
        return "🟡";
      default:
        return "🟢";
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <AlertTriangle size={24} color="#ff9800" />
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Projects Requiring Attention
          </Typography>
          <Chip
            label={`${data.length} Project(s)`}
            size="small"
            color="warning"
            variant="filled"
            sx={{ ml: "auto" }}
          />
        </Box>

        <TableContainer sx={{ border: "1px solid #e0e0e0", borderRadius: 1 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: 600 }}>Project Name</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  Status
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Schedule Variance
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Budget Usage
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Issues</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((project, index) => (
                <TableRow
                  key={project.id}
                  sx={{
                    backgroundColor: index % 2 === 0 ? "#fff" : "#fafafa",
                    "&:hover": { backgroundColor: "#f0f0f0" },
                  }}
                >
                  <TableCell sx={{ fontWeight: 500 }}>
                    {project.name}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${getStatusIcon(project.status)} ${project.status}`}
                      size="small"
                      color={getStatusColor(project.status)}
                      variant="filled"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: 1,
                      }}
                    >
                      <TrendingUp
                        size={16}
                        color={project.variance < -5 ? "#f44336" : "#999"}
                      />
                      <Typography
                        sx={{
                          fontWeight: 600,
                          color:
                            project.variance < -5
                              ? "#f44336"
                              : project.variance < 0
                              ? "#ff9800"
                              : "#4caf50",
                        }}
                      >
                        {project.variance > 0 ? "+" : ""}
                        {project.variance.toFixed(1)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: 60,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: "rgba(0,0,0,0.1)",
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{
                            height: "100%",
                            width: `${Math.min(project.budgetUsage, 100)}%`,
                            backgroundColor:
                              project.budgetUsage > 90
                                ? "#f44336"
                                : project.budgetUsage > 75
                                ? "#ff9800"
                                : "#4caf50",
                            borderRadius: 3,
                          }}
                        />
                      </Box>
                      <Typography sx={{ fontWeight: 600, minWidth: 40 }}>
                        {project.budgetUsage.toFixed(1)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                      {project.reason.map((reason, idx) => (
                        <Chip
                          key={idx}
                          label={reason}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor:
                              reason.includes("budget") || reason.includes("Budget")
                                ? "#ff9800"
                                : "#f44336",
                            color:
                              reason.includes("budget") || reason.includes("Budget")
                                ? "#f57c00"
                                : "#c62828",
                          }}
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Project Details">
                      <IconButton
                        size="small"
                        sx={{
                          color: "#1976d2",
                          "&:hover": { backgroundColor: "#e3f2fd" },
                        }}
                      >
                        <Eye size={18} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box
          sx={{
            mt: 2,
            p: 1.5,
            backgroundColor: "#fff3e0",
            borderRadius: 1,
            borderLeft: "4px solid #ff9800",
          }}
        >
          <Typography variant="caption" sx={{ color: "#f57c00", fontWeight: 600 }}>
            ⚠ {data.length} project(s) need immediate attention. Review and take
            corrective action.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProjectsRequiringAttention;
