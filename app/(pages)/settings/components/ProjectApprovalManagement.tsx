"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Stack,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Grid,
  Typography,
  CircularProgress,
} from "@mui/material";
import { ViewList as ViewListIcon, ViewAgenda as ViewAgendaIcon, Security as SecurityIcon } from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { getProjects } from "@/app/redux/controllers/projectController";
import dynamic from "next/dynamic";

const ProjectApprovalConfig = dynamic(() => import("./ProjectApprovalConfig"), {
  ssr: false,
});

interface ProjectWithApproval {
  id: string;
  name: string;
  description?: string;
  status?: string;
  businessUnit?: string;
  approvalFlowId?: string;
  approvalEnabled?: boolean;
  approvalFlow?: {
    id: string;
    name: string;
  };
}

export default function ProjectApprovalManagement() {
  const dispatch = useAppDispatch();
  const { projects, loading } = useAppSelector((state) => state.project);

  const [viewMode, setViewMode] = useState<"table" | "card">("card");
  const [approvalConfigOpen, setApprovalConfigOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectWithApproval | null>(null);

  useEffect(() => {
    dispatch(getProjects());
  }, [dispatch]);

  const handleOpenConfig = (project: ProjectWithApproval) => {
    setSelectedProject(project);
    setApprovalConfigOpen(true);
  };

  const handleCloseConfig = () => {
    setApprovalConfigOpen(false);
    setSelectedProject(null);
    dispatch(getProjects());
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "APPROVED":
        return "success";
      case "PENDING":
        return "warning";
      case "REJECTED":
        return "error";
      case "DRAFT":
        return "default";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <Card sx={{ textAlign: "center", p: 4, border: "2px dashed #e5e7eb" }}>
        <Typography sx={{ color: "#6b7280", mb: 1 }}>No projects found</Typography>
        <Typography sx={{ color: "#9ca3af", fontSize: 14 }}>
          Create projects first to configure approval workflows
        </Typography>
      </Card>
    );
  }

  return (
    <Box>
      {/* HEADER WITH VIEW TOGGLE */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          🔐 Project Approval Workflows
        </Typography>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, newViewMode) => {
            if (newViewMode !== null) setViewMode(newViewMode);
          }}
          size="small"
        >
          <ToggleButton value="table" aria-label="table view">
            <ViewListIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton value="card" aria-label="card view">
            <ViewAgendaIcon fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* TABLE VIEW */}
      {viewMode === "table" && (
        <TableContainer component={Card}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: 600 }}>Project Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Business Unit</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Approval Flow</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Approval Enabled</TableCell>
                <TableCell sx={{ fontWeight: 600, textAlign: "center" }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project: ProjectWithApproval) => (
                <TableRow
                  key={project.id}
                  sx={{
                    "&:hover": { backgroundColor: "#f9f9f9" },
                  }}
                >
                  <TableCell>
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                        {project.name}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: "#6b7280" }}>
                        {project.description || "No description"}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={project.status || "DRAFT"}
                      size="small"
                      color={getStatusColor(project.status) as any}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{project.businessUnit || "-"}</TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                      {project.approvalFlow?.name || (
                        <Typography component="span" sx={{ color: "#9ca3af", fontStyle: "italic" }}>
                          {project.approvalEnabled ? "Default" : "None"}
                        </Typography>
                      )}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={project.approvalEnabled ? "Yes" : "No"}
                      size="small"
                      color={project.approvalEnabled ? "success" : "default"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    <Tooltip title="Configure Approval Workflow">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenConfig(project)}
                        sx={{
                          color: "#4B2E83",
                          "&:hover": { backgroundColor: "#f0e6ff" },
                        }}
                      >
                        <SecurityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* CARD VIEW */}
      {viewMode === "card" && (
        <Grid container spacing={3}>
          {projects.map((project: ProjectWithApproval) => (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={project.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.3s ease",
                  border: "1px solid #e5e7eb",
                  "&:hover": {
                    boxShadow: "0 8px 16px rgba(75, 46, 131, 0.12)",
                    borderColor: "#4B2E83",
                  },
                }}
              >
                <CardContent sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {project.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#6b7280",
                          fontSize: 12,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {project.description || "No description"}
                      </Typography>
                    </Box>
                  </Box>

                  <Stack spacing={1.5} sx={{ mb: 2 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: "#6b7280", display: "block", mb: 0.5 }}>
                        Status
                      </Typography>
                      <Chip
                        label={project.status || "DRAFT"}
                        size="small"
                        color={getStatusColor(project.status) as any}
                        variant="outlined"
                      />
                    </Box>

                    {project.businessUnit && (
                      <Box>
                        <Typography variant="caption" sx={{ color: "#6b7280", display: "block", mb: 0.5 }}>
                          Business Unit
                        </Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                          {project.businessUnit}
                        </Typography>
                      </Box>
                    )}

                    <Box>
                      <Typography variant="caption" sx={{ color: "#6b7280", display: "block", mb: 0.5 }}>
                        Approval Status
                      </Typography>
                      <Chip
                        label={project.approvalEnabled ? "✅ Enabled" : "❌ Disabled"}
                        size="small"
                        color={project.approvalEnabled ? "success" : "default"}
                        variant="outlined"
                      />
                    </Box>

                    <Box>
                      <Typography variant="caption" sx={{ color: "#6b7280", display: "block", mb: 0.5 }}>
                        Approval Flow
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: project.approvalFlow?.name ? "#1f2937" : "#9ca3af",
                          fontStyle: project.approvalFlow?.name ? "normal" : "italic",
                        }}
                      >
                        {project.approvalFlow?.name || (project.approvalEnabled ? "Default" : "None")}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>

                <Box sx={{ p: 2, borderTop: "1px solid #e5e7eb" }}>
                  <Tooltip title="Configure Approval Workflow">
                    <Stack
                      component="button"
                      direction="row"
                      spacing={1}
                      onClick={() => handleOpenConfig(project)}
                      sx={{
                        width: "100%",
                        p: 1,
                        border: "1px solid #4B2E83",
                        color: "#4B2E83",
                        textTransform: "none",
                        fontWeight: 500,
                        backgroundColor: "transparent",
                        borderRadius: 1,
                        cursor: "pointer",
                        alignItems: "center",
                        justifyContent: "center",
                        "&:hover": {
                          backgroundColor: "#f0e6ff",
                          borderColor: "#4B2E83",
                        },
                      }}
                    >
                      🔐 Configure
                    </Stack>
                  </Tooltip>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* APPROVAL CONFIG MODAL */}
      {approvalConfigOpen && selectedProject && (
        <ProjectApprovalConfig
          projectId={selectedProject.id}
          projectName={selectedProject.name}
          projectStatus={selectedProject.status}
          currentApprovalFlowId={selectedProject.approvalFlowId}
          currentApprovalEnabled={selectedProject.approvalEnabled}
          currentApprovalFlowName={selectedProject.approvalFlow?.name}
          open={approvalConfigOpen}
          onClose={handleCloseConfig}
        />
      )}
    </Box>
  );
}
