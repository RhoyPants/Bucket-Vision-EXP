import { Box } from "@mui/material";
import ProjectDashboardHeader from "./components/ProjectDashboardHeader";
import ProjectDashboardSidebar from "./components/ProjectDashboardSidebar";
import ProjectSprintManagement from "./components/ProjectSprintManagement";
import ProjectVersioning from "./components/ProjectVersioning";
import ProjectDashboardContent from "./components/ProjectDashboardContent";
import ProjectIncidentReports from "./components/ProjectIncidentReports";
import ProjectReports from "./components/ProjectReports";
import ProjectCpm from "./components/ProjectCpm";
import ProjectInfoConfig from "./components/ProjectInfoConfig";

export default async function ProjectDashboardRoute({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { projectId } = await params;
  const { view } = await searchParams;

  return (
    <Box sx={{ minHeight: "100vh", width: "100%", backgroundColor: "#F8FAFC" }}>
      <ProjectDashboardHeader projectId={projectId} />
      <ProjectDashboardSidebar projectId={projectId} />
      <Box
        component="main"
        sx={{
          minHeight: "100vh",
          pt: { xs: "125px", md: "max(10vh, 125px)" },
          mr: { xs: 0, md: "280px" },
        }}
      >
        {!view ? <ProjectDashboardContent projectId={projectId} /> : null}
        {view === "sprint-management" ? <ProjectSprintManagement projectId={projectId} /> : null}
        {view === "cpm" ? <ProjectCpm projectId={projectId} /> : null}
        {view === "project-versioning" ? <ProjectVersioning projectId={projectId} /> : null}
        {view === "project-reports" ? <ProjectReports projectId={projectId} /> : null}
        {view === "incident-reports" ? <ProjectIncidentReports projectId={projectId} /> : null}
        {view === "project-info" ? <ProjectInfoConfig projectId={projectId} /> : null}
        {view === "project-structure" ? <ProjectInfoConfig projectId={projectId} initialSection="structure" /> : null}
        {view === "team-organization" ? <ProjectInfoConfig projectId={projectId} initialSection="team-organization" /> : null}
        {view === "team-overview" ? <ProjectInfoConfig projectId={projectId} initialSection="team-overview" /> : null}
      </Box>
    </Box>
  );
}
