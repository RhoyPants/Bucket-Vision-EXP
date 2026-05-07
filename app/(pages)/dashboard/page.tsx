"use client";

import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { loadCompleteDashboard } from "@/app/redux/controllers/dashboardController";
import { getSCurve } from "@/app/redux/controllers/scurveController";
import { getProjects } from "@/app/redux/controllers/projectController";
import Layout from "@/app/components/shared/Layout";
import SCurveChart from "@/app/components/shared/Scurved/SCurveChart";
import {
  ExecutiveKPIStrip,
  PortfolioHealthOverview,
  BudgetSnapshot,
  WeeklyAccomplishmentReports,
  DisciplinesProgress,
  ProjectsRequiringAttention,
  CriticalAlerts,
  DashboardCalendar,
} from "./components";
import { ProjectSelector } from "./components/ProjectSelector";
import { Box, Container, Typography, CircularProgress, Alert } from "@mui/material";

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const [projectId, setProjectId] = React.useState<string | null>(null);

  const { loading, error } = useAppSelector((state) => state.dashboard);
  const projects = useAppSelector((state) => state.project.projects);

  // Only show ACTIVE projects in the selector
  const activeProjects = projects?.filter(
    (p) => (p as any).status === "ACTIVE" && (p as any).isActive === true
  ) ?? [];

  // Derive the selected project's start date for calendar auto-navigation
  const selectedProject = projects?.find((p) => p.id === projectId) ?? null;
  const projectStartDate = (selectedProject as any)?.startDate ?? null;

  useEffect(() => {
    // First, fetch all projects if not already loaded
    if (!projects || projects.length === 0) {
      dispatch(getProjects() as any).then((result: any) => {
        if (result && result.length > 0) {
          // Auto-select the first ACTIVE project
          const firstActive = result.find(
            (p: any) => p.status === "ACTIVE" && p.isActive === true
          );
          if (firstActive) setProjectId(firstActive.id);
        }
      });
    } else if (activeProjects.length > 0 && !projectId) {
      setProjectId(activeProjects[0].id);
    }
  }, [projects, activeProjects, projectId, dispatch]);

  useEffect(() => {
    // Load complete dashboard data once projectId is set
    if (projectId) {
      dispatch(loadCompleteDashboard(projectId) as any);
      dispatch(getSCurve(projectId) as any);
    }
  }, [projectId, dispatch]);

  return (
    <Layout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700, 
              mb: 0.5, 
              color: "#1f2937",
              letterSpacing: "-0.5px"
            }}
          >
            Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280" }}>
            Monitor project performance, budget, and team progress
          </Typography>
        </Box>

        {/* Project Selector */}
        <ProjectSelector
          projects={activeProjects}
          selectedProjectId={projectId}
          onSelectProject={setProjectId}
          loading={!projects || projects.length === 0}
        />

        {/* Error State */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              backgroundColor: "#fef2f2",
              color: "#991b1b",
              border: "1px solid #fecaca"
            }}
          >
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && projectId && (
          <Box sx={{ display: "flex", justifyContent: "center", p: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Dashboard Content */}
        {!loading && projectId && (
          <>
            {/* Section 1: Executive KPI Strip */}
            <ExecutiveKPIStrip />

            {/* Section 2: Portfolio Health Overview */}
            <PortfolioHealthOverview />

            {/* Section 3: S-Curve Chart */}
            <Box sx={{ mb: 3 }}>
              <SCurveChart projectId={projectId} />
            </Box>

            {/* Section 3.5: Subtask Calendar */}
            <DashboardCalendar projectId={projectId} projectStartDate={projectStartDate} />

            {/* Section 4: Budget Snapshot */}
            <BudgetSnapshot />

            {/* Section 5: Progress by Discipline */}
            <DisciplinesProgress />

            {/* Section 6: Critical Alerts */}
            <CriticalAlerts />

            {/* Section 7: Projects Requiring Attention */}
            <ProjectsRequiringAttention />

            {/* Section 8: Weekly Accomplishment Reports */}
            <WeeklyAccomplishmentReports />
          </>
        )}
      </Container>
    </Layout>
  );
}
