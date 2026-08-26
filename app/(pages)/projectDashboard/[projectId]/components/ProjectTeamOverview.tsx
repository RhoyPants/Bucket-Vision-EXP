"use client";

import { useEffect } from "react";
import { Box, CircularProgress, Grid, Paper, Typography } from "@mui/material";
import OverviewStats from "@/app/(pages)/teamOverview/components/OverviewStats";
import TeamMembers from "@/app/(pages)/teamOverview/components/TeamMembers";
import TaskStatus from "@/app/(pages)/teamOverview/components/TaskStatus";
import TeamProgress from "@/app/(pages)/teamOverview/components/TeamProgress";
import { getProjectFull } from "@/app/redux/controllers/projectController";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";

export default function ProjectTeamOverview({ projectId }: { projectId: string }) {
  const dispatch = useAppDispatch();
  const { fullProject, loading } = useAppSelector((state) => state.project);
  const projectReady = fullProject?.id === projectId;

  useEffect(() => {
    if (!projectReady) {
      dispatch(getProjectFull(projectId, { preferCache: true }));
    }
  }, [dispatch, projectId, projectReady]);

  if (loading && !projectReady) {
    return (
      <Box sx={{ minHeight: 420, display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.25, md: 2 }, maxWidth: 1400, mx: "auto" }}>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 1.5, md: 2 },
          mb: 2,
          borderRadius: 2,
          borderColor: "#CBD5E1",
          boxShadow: "none",
        }}
      >
        <Typography sx={{ color: "#0F172A", fontSize: 18, fontWeight: 900 }}>
          Project Team Overview
        </Typography>
        <Typography sx={{ color: "#64748B", fontSize: 12, mt: 0.25 }}>
          Team capacity, assignments, task status, and project roles.
        </Typography>
      </Paper>

      <OverviewStats projectId={projectId} allProjectsData={null} />

      <Grid container spacing={2} sx={{ mt: 0.25 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <TeamMembers projectId={projectId} allProjectsData={null} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TaskStatus projectId={projectId} allProjectsData={null} />
            <TeamProgress projectId={projectId} allProjectsData={null} />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
