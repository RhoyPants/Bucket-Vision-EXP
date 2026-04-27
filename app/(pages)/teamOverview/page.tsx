"use client";

import React, { useEffect, useMemo } from "react";
import {
  Box,
  Grid,
  CircularProgress,
  Paper,
  Typography,
  TextField,
  MenuItem,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { getProjects } from "@/app/redux/controllers/projectController";
import { getProjectFull } from "@/app/redux/controllers/projectController";
import OverviewStats from "./components/OverviewStats";
import TeamMembers from "./components/TeamMembers";
import TaskStatus from "./components/TaskStatus";
import TeamRoles from "./components/TeamRoles";
import Layout from "@/app/components/shared/Layout";

export default function TeamOverviewPage() {
  const dispatch = useAppDispatch();
  const [projectId, setProjectId] = React.useState<string | null>(null);
  const [allProjectsData, setAllProjectsData] = React.useState<any[]>([]);
  const [loadingAllProjects, setLoadingAllProjects] = React.useState(false);

  const { loading } = useAppSelector((state) => state.project);
  const projects = useAppSelector((state) => state.project.projects);
  const fullProject = useAppSelector((state) => state.project.fullProject);
  const user = useAppSelector((state) => state.auth.user);
  const projectMembers = useAppSelector(
    (state) => state.projectMembers.projectMembers
  );

  // Determine if user is OWNER or SUB_OWNER in a project
  const isUserOwnerOrSubOwner = (projId: string): boolean => {
    if (!projectMembers || !user) return false;

    // projectMembers appears to be an object, try to access it
    const projectTeam = (projectMembers as any)[projId];
    if (!projectTeam) return false;

    // Check if user's role is OWNER or SUB_OWNER in this project
    // Loop through all roles to find user
    for (const role in projectTeam) {
      const members = (projectTeam as any)[role];
      if (Array.isArray(members)) {
        const isMember = members.some((m: any) => m.userId === user.id);
        if (isMember && (role === "OWNER" || role === "SUB_OWNER")) {
          return true;
        }
      }
    }

    return false;
  };

  // Get projects where user is OWNER or SUB_OWNER
  const userAccessibleProjects = useMemo(() => {
    if (!user || !projects) return projects || [];

    return projects.filter((proj: any) => isUserOwnerOrSubOwner(proj.id));
  }, [user, projects, projectMembers]);

  // Load projects on mount
  useEffect(() => {
    if (!projects || projects.length === 0) {
      dispatch(getProjects() as any).then((result: any) => {
        if (result && result.length > 0) {
          setProjectId(result[0].id);
        }
      });
    } else if (projects.length > 0 && !projectId) {
      setProjectId(projects[0].id);
    }
  }, [projects, projectId, dispatch]);

  // Load full project data once projectId is set
  useEffect(() => {
    if (!projectId) return;

    if (projectId === "all-projects") {
      // Load all accessible projects
      setLoadingAllProjects(true);
      const loadPromises = userAccessibleProjects.map((proj: any) =>
        dispatch(getProjectFull(proj.id) as any)
      );

      Promise.all(loadPromises)
        .then((results: any[]) => {
          // Collect all non-null results
          const validProjects = results.filter((p) => p !== null);
          setAllProjectsData(validProjects);
          setLoadingAllProjects(false);
        })
        .catch(() => {
          setLoadingAllProjects(false);
        });
    } else {
      // Load single project
      dispatch(getProjectFull(projectId) as any);
    }
  }, [projectId, dispatch, userAccessibleProjects]);

  const isLoading = projectId === "all-projects" ? loadingAllProjects : loading;

  if (isLoading && !fullProject && allProjectsData.length === 0) {
    return (
      <Layout>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 500,
          }}
        >
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        {/* Project Selector */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: 2.5,
            border: "1px solid rgba(0,0,0,0.06)",
            backgroundColor: "#fff",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: "#4B2E83",
                minWidth: 100,
              }}
            >
              Select Project:
            </Typography>
            <TextField
              select
              value={projectId ?? ""}
              onChange={(e) => setProjectId(e.target.value)}
              size="small"
              sx={{ minWidth: 300, backgroundColor: "#fff" }}
            >
              {userAccessibleProjects && userAccessibleProjects.length > 0 && (
                <MenuItem
                  value="all-projects"
                  sx={{ fontWeight: 700, color: "#4B2E83" }}
                >
                  📊 All Projects
                </MenuItem>
              )}
              {userAccessibleProjects && userAccessibleProjects.length > 0 && (
                <MenuItem disabled sx={{ height: 0, padding: 0 }} />
              )}
              {userAccessibleProjects.map((project: any) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Paper>

        {/* Top stats */}
        <Box>
          <OverviewStats
            projectId={projectId}
            allProjectsData={
              projectId === "all-projects" ? allProjectsData : null
            }
          />
        </Box>

        {/* Main content: left (members) + right (status + roles) */}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, md: 8 }}>
            <TeamMembers
              projectId={projectId}
              allProjectsData={
                projectId === "all-projects" ? allProjectsData : null
              }
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TaskStatus
                projectId={projectId}
                allProjectsData={
                  projectId === "all-projects" ? allProjectsData : null
                }
              />
              <TeamRoles
                projectId={projectId}
                allProjectsData={
                  projectId === "all-projects" ? allProjectsData : null
                }
              />
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  );
}
