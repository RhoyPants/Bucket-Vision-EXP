"use client";

import { Box, Tab, Tabs } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import ProjectInfo from "./ProjectInfo";
import ProjectStructure from "./ProjectStructure";
import ProjectTeamOrganization from "./ProjectTeamOrganization";
import ProjectTeamOverview from "./ProjectTeamOverview";

const sections = ["information", "structure", "team-organization", "team-overview"] as const;
type Section = (typeof sections)[number];

export default function ProjectInfoConfig({ projectId, initialSection }: { projectId: string; initialSection?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = searchParams.get("section") || initialSection || "information";
  const section: Section = sections.includes(requested as Section) ? requested as Section : "information";

  const changeSection = (_event: React.SyntheticEvent, value: Section) => {
    router.replace(`/projectDashboard/${projectId}?view=project-info&section=${value}`, { scroll: false });
  };

  return (
    <Box>
      <Box sx={{ position: "sticky", top: { xs: 125, md: "max(10vh, 125px)" }, zIndex: 10, bgcolor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", px: { xs: 1.25, md: 2 } }}>
        <Tabs value={section} onChange={changeSection} variant="scrollable" scrollButtons="auto" aria-label="Project information and configuration sections" sx={{ "& .MuiTab-root": { minHeight: 48, textTransform: "none", fontWeight: 800 } }}>
          <Tab value="information" label="Project Information" />
          <Tab value="structure" label="Structure" />
          <Tab value="team-organization" label="Team Organization" />
          <Tab value="team-overview" label="Team Overview" />
        </Tabs>
      </Box>
      {section === "information" && <ProjectInfo projectId={projectId} />}
      {section === "structure" && <ProjectStructure projectId={projectId} />}
      {section === "team-organization" && <ProjectTeamOrganization projectId={projectId} />}
      {section === "team-overview" && <ProjectTeamOverview projectId={projectId} />}
    </Box>
  );
}
