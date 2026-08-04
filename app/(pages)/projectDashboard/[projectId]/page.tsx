import { Box } from "@mui/material";
import ProjectDashboardHeader from "./components/ProjectDashboardHeader";
import ProjectDashboardSidebar from "./components/ProjectDashboardSidebar";
import ProjectSprintManagement from "./components/ProjectSprintManagement";
import ProjectTeamOrganization from "./components/ProjectTeamOrganization";
import ProjectStructure from "./components/ProjectStructure";
import ProjectVersioning from "./components/ProjectVersioning";
import ProjectDashboardContent from "./components/ProjectDashboardContent";
import ProjectIncidentReports from "./components/ProjectIncidentReports";
import ProjectTeamOverview from "./components/ProjectTeamOverview";
import ProjectInfo from "./components/ProjectInfo";
import ProjectReports from "./components/ProjectReports";

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
        {view === "team-organization" ? <ProjectTeamOrganization projectId={projectId} /> : null}
        {view === "project-structure" ? <ProjectStructure projectId={projectId} /> : null}
        {view === "project-versioning" ? <ProjectVersioning projectId={projectId} /> : null}
        {view === "project-reports" ? <ProjectReports projectId={projectId} /> : null}
        {view === "incident-reports" ? <ProjectIncidentReports projectId={projectId} /> : null}
        {view === "team-overview" ? <ProjectTeamOverview projectId={projectId} /> : null}
        {view === "project-info" ? <ProjectInfo projectId={projectId} /> : null}
      </Box>
    </Box>
  );
}
