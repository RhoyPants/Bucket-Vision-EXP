"use client";

import { Box, Grid, Card, Typography, Button } from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ProjectCard from "./ProjectCard";
import { ProjectCardActions, ViewType } from "./types";
import Guard from "@/app/components/shared/Guard";

interface ProjectsGridProps {
  projects: any[];
  actions: ProjectCardActions;
  viewType: ViewType;
  emptyMessage?: string;
  emptySubtext?: string;
  showCreateButton?: boolean;
}

export default function ProjectsGrid({
  projects,
  actions,
  viewType,
  emptyMessage = "No projects found",
  emptySubtext = "",
  showCreateButton = false,
}: ProjectsGridProps) {
  if (!projects || projects.length === 0) {
    return (
      <Card sx={{ textAlign: "center", p: 5, border: "2px dashed #e5e7eb", boxShadow: "none" }}>
        <AssignmentIcon sx={{ fontSize: 48, color: "#d1d5db", mb: 2 }} />
        <Typography sx={{ fontWeight: 600, color: "#6b7280", mb: 1 }}>
          {emptyMessage}
        </Typography>
        {emptySubtext && (
          <Typography sx={{ color: "#9ca3af", fontSize: 14, mb: 3 }}>
            {emptySubtext}
          </Typography>
        )}
        {showCreateButton && (
          <Guard module="PROJECTS" action="CREATE">
            <Button
              variant="contained"
              sx={{ backgroundColor: "#4B2E83", "&:hover": { backgroundColor: "#3d2363" } }}
              onClick={actions.onCreateProject}
            >
              + New Project
            </Button>
          </Guard>
        )}
      </Card>
    );
  }

  const gridTemplate = "1fr 110px 170px 110px 80px 160px";

  if (viewType === "list") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: gridTemplate,
            alignItems: "center",
            gap: 2,
            px: 2,
            py: 1,
            borderRadius: 1,
            backgroundColor: "#f8fafc",
            border: "1px solid #e5e7eb",
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Project Name
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Status
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, display: { xs: "none", md: "block" } }}>
            Dates
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, display: { xs: "none", lg: "block" } }}>
            Business Unit
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, display: { xs: "none", sm: "block" } }}>
            Priority
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, textAlign: "right" }}>
            Actions
          </Typography>
        </Box>

        {projects.map((project: any) => (
          <ProjectCard key={project.id} project={project} actions={actions} viewType="list" gridTemplate={gridTemplate} />
        ))}
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {projects.map((project: any) => (
        <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={project.id}>
          <ProjectCard project={project} actions={actions} viewType="card" />
        </Grid>
      ))}
    </Grid>
  );
}
