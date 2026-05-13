"use client";

import React from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { CheckCircle2, FolderOpen } from "lucide-react";
import { Projects } from "@/app/redux/slices/projectSlice";
import { formatBudgetShort } from "@/app/utils/formatters";

interface ProjectSelectorProps {
  projects: Projects[];
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  loading?: boolean;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  loading = false,
}) => {
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <Card sx={{ mb: 4, backgroundColor: "#f8f9fa", border: "1px solid #e5e7eb" }}>
        <CardContent>
          <Typography variant="body2" sx={{ color: "#6b7280", textAlign: "center" }}>
            No active projects available. Activate a project to view its dashboard.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 4, backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <FolderOpen size={22} color="#6366f1" />
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#1f2937" }}>
            Select Project
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
            gap: 2,
          }}
        >
          {projects.map((project) => {
            const isSelected = selectedProjectId === project.id;
            const hasStartDate = project.startDate && project.expectedEndDate;

            return (
              <div key={project.id}>
                <Tooltip
                  title={
                    !hasStartDate ? "Project dates not set. Set dates for complete dashboard view." : ""
                  }
                >
                  <Card
                    onClick={() => onSelectProject(project.id)}
                    sx={{
                      cursor: "pointer",
                      height: "100%",
                      transition: "all 0.3s ease",
                      backgroundColor: isSelected ? "#eef2ff" : "#ffffff",
                      border: isSelected ? "2px solid #6366f1" : "1px solid #e5e7eb",
                      "&:hover": {
                        backgroundColor: isSelected ? "#eef2ff" : "#f8f9fa",
                        borderColor: isSelected ? "#6366f1" : "#d1d5db",
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 600,
                                color: isSelected ? "#4f46e5" : "#1f2937",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {project.name}
                            </Typography>
                            {isSelected && <CheckCircle2 size={18} color="#4f46e5" />}
                          </Box>

                          {project.description && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: "#6b7280",
                                display: "-webkit-box",
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                mb: 1,
                              }}
                            >
                              {project.description}
                            </Typography>
                          )}

                          {/* Metadata */}
                          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 1 }}>
                            {project.priority && (
                              <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.7rem" }}>
                                <span style={{ fontWeight: 600 }}>Priority:</span> {project.priority}
                              </Typography>
                            )}

                            {project.totalBudget && (
                              <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.7rem" }}>
                                <span style={{ fontWeight: 600 }}>Budget:</span> ₱{formatBudgetShort(project.totalBudget)}
                              </Typography>
                            )}

                            {!hasStartDate && (
                              <Typography
                                variant="caption"
                                sx={{ color: "#f59e0b", fontSize: "0.7rem", fontWeight: 500 }}
                              >
                                ⚠ Dates not set
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Tooltip>
              </div>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProjectSelector;
