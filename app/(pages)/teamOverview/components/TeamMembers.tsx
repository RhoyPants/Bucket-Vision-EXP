"use client";

import { Box, Grid, Paper, Typography } from "@mui/material";
import MemberCard from "./MemberCard";
import { useAppSelector } from "@/app/redux/hook";
import {
  aggregateMemberWorkload,
  getSortedMembers,
} from "@/app/utils/teamAggregation";

interface Props {
  projectId: string | null;
  allProjectsData?: any[] | null;
}

export default function TeamMembers({ projectId, allProjectsData }: Props) {
  const projects = useAppSelector((state) => state.project.projects);
  const fullProject = useAppSelector((state) => state.project.fullProject);

  // Determine data to use
  let projectData = null;
  
  if (projectId === "all-projects" && allProjectsData && allProjectsData.length > 0) {
    projectData = null;
  } else if (projectId && projectId !== "all-projects") {
    projectData = fullProject && fullProject.id === projectId ? fullProject : null;
  }

  const memberWorkload = aggregateMemberWorkload(
    projectData,
    projectId === "all-projects" ? allProjectsData || [] : undefined
  );
  const sortedMembers = getSortedMembers(memberWorkload, "progress");

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1,
        borderRadius: 3,
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 6px 18px rgba(15,15,15,0.03)",
        backgroundColor: "#fff",
      }}
    >
      <Typography sx={{ fontWeight: 900, fontSize: 20, mb: 2 }}>
        Team Members
      </Typography>

      {/* Grid of member cards - two columns on md, one on xs */}
      <Grid container spacing={1}>
        {sortedMembers.map((member) => (
          <Grid key={member.userId} size={{ xs: 12, sm: 6, md: 4 }}>
            <MemberCard
              projectId={projectId}
              memberId={member.userId}
              name={member.memberName}
              email={member.userEmail}
              assigned={member.assigned}
              completed={member.completed}
              inProgress={member.inProgress}
              pending={member.pending}
              overdue={member.overdue}
              progressPercent={member.progressPercent}
              allProjectsData={
                projectId === "all-projects" ? allProjectsData : null
              }
            />
          </Grid>
        ))}
      </Grid>

      {sortedMembers.length === 0 && (
        <Typography sx={{ textAlign: "center", color: "text.secondary", py: 3 }}>
          No team members assigned yet
        </Typography>
      )}
    </Paper>
  );
}
