"use client";

import { Box, Paper, Typography, LinearProgress } from "@mui/material";
import { useAppSelector } from "@/app/redux/hook";
import {
  aggregateMemberWorkload,
  getSortedMembers,
} from "@/app/utils/teamAggregation";

interface Props {
  projectId: string | null;
  allProjectsData?: any[] | null;
}

export default function TaskStatus({ projectId, allProjectsData }: Props) {
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
  const sortedMembers = getSortedMembers(memberWorkload, "progress").slice(
    0,
    6
  ); // Show top 6 members

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 6px 18px rgba(15,15,15,0.03)",
        backgroundColor: "#fff",
      }}
    >
      <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 2 }}>
        Member Progress
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
        {sortedMembers.length > 0 ? (
          sortedMembers.map((member) => (
            <Box key={member.userId}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={member.memberName}
                >
                  {member.memberName}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {member.progressPercent}%
                </Typography>
              </Box>

              <LinearProgress
                variant="determinate"
                value={member.progressPercent}
                sx={{
                  height: 9,
                  borderRadius: 3,
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 3,
                    backgroundColor: "#4B2E83",
                  },
                  backgroundColor: "rgba(75,46,131,0.12)",
                }}
              />
            </Box>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
            No members with assignments
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
