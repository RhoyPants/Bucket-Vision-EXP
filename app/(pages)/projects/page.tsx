"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  Stack,
  Chip,
  Tooltip,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SettingsIcon from "@mui/icons-material/Settings";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { useRouter } from "next/navigation";

import {
  getProjects,
  deleteProject,
} from "@/app/redux/controllers/projectController";

import ProjectModal from "@/app/components/shared/modals/ProjectModal";
import Layout from "@/app/components/shared/Layout";

export default function ProjectsPage() {
  const dispatch = useAppDispatch();
  const { projects } = useAppSelector((state) => state.project);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const router = useRouter();

  useEffect(() => {
    dispatch(getProjects());
  }, [dispatch]);

  // 🔥 SAFE LOCATION FORMATTER
  const formatLocation = (location: any) => {
    if (!location) return "No location";

    const {
      street,
      barangayName,
      cityName,
      provinceName,
    } = location;

    const parts = [
      street,
      barangayName,
      cityName,
      provinceName,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(", ") : "No location";
  };

  return (
    <Layout>
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        {/* HEADER */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
        >
          <Typography variant="h4" fontWeight={700}>
            Projects
          </Typography>

          <Button
            variant="contained"
            sx={{ borderRadius: 2, textTransform: "none" }}
            onClick={() => {
              setMode("create");
              setSelectedProject(null);
              setOpen(true);
            }}
          >
            + New Project
          </Button>
        </Stack>

        {/* GRID */}
        <Grid container spacing={3} mt={2}>
          {projects.map((project: any) => (
            <Grid
              size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
              key={project.id}
            >
              <Card
                sx={{
                  borderRadius: 4,
                  p: 1,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
                  transition: "all 0.25s ease",
                  position: "relative",

                  "&:hover": {
                    transform: "translateY(-6px)",
                    boxShadow: "0 12px 30px rgba(0,0,0,0.1)",
                  },

                  "&:hover .actions": {
                    opacity: 1,
                    transform: "translateY(0px)",
                  },
                }}
              >
                <CardContent>
                  {/* HEADER */}
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" fontWeight={600}>
                      {project.name}
                    </Typography>

                    <Box display="flex" alignItems="center" gap={1}>
                      {project.priority && (
                        <Chip
                          size="small"
                          label={project.priority}
                          sx={{
                            bgcolor:
                              project.priority === "High"
                                ? "#ef4444"
                                : project.priority === "Medium"
                                ? "#f59e0b"
                                : "#22c55e",
                            color: "#fff",
                          }}
                        />
                      )}

                      <Tooltip title="Go to Sprint" arrow>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(
                              `/sprintManagement?projectId=${project.id}`
                            );
                          }}
                        >
                          <InfoOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  {/* DESCRIPTION */}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    mt={1}
                    sx={{ minHeight: 40 }}
                  >
                    {project.description || "No description"}
                  </Typography>

                  {/* LOCATION */}
                  <Typography variant="caption" display="block" mt={2}>
                    📍 {formatLocation(project.location)}
                  </Typography>

                  {/* DATE */}
                  <Box mt={2}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 500, mb: 0.5 }}>
                      Expected Start Date
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ fontWeight: 600 }}>
                      {project.startDate?.slice(0, 10) || "Not set"}
                    </Typography>
                  </Box>

                  <Box mt={1}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 500, mb: 0.5 }}>
                      Expected End Date
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ fontWeight: 600 }}>
                      {project.expectedEndDate?.slice(0, 10) || "Not set"}
                    </Typography>
                  </Box>

                  {/* BUSINESS */}
                  <Typography variant="caption" display="block">
                    🏢 {project.businessUnit || "No Business Unit"}
                  </Typography>

                  {/* ENTITY */}
                  <Typography variant="caption" display="block">
                    🧩 {project.entity || "No Entity"}
                  </Typography>
                </CardContent>

                {/* ACTIONS */}
                <Box
                  className="actions"
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    px: 2,
                    pb: 2,
                    opacity: 0,
                    transform: "translateY(10px)",
                    transition: "all 0.25s ease",
                  }}
                >
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<SettingsIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/projects/${project.id}/setup`);
                      }}
                      sx={{ textTransform: "none" }}
                    >
                      Setup
                    </Button>

                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMode("edit");
                        setSelectedProject(project);
                        setOpen(true);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Stack>

                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(deleteProject(project.id));
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* MODAL */}
        <ProjectModal
          open={open}
          onClose={() => setOpen(false)}
          mode={mode}
          project={selectedProject}
        />
      </Box>
    </Layout>
  );
}