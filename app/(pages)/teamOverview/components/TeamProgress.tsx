"use client";

import { Box, LinearProgress, Paper, Typography } from "@mui/material";
import { useAppSelector } from "@/app/redux/hook";
import { aggregateMemberWorkload, getSortedMembers } from "@/app/utils/teamAggregation";
import type { Projects } from "@/app/redux/slices/projectSlice";

interface Props {
  projectId: string | null;
  allProjectsData?: Projects[] | null;
}

export default function TeamProgress({ projectId, allProjectsData }: Props) {
  const fullProject = useAppSelector((state) => state.project.fullProject);
  const projectData =
    projectId && projectId !== "all-projects" && fullProject?.id === projectId
      ? fullProject
      : null;
  const members = getSortedMembers(
    aggregateMemberWorkload(
      projectData,
      projectId === "all-projects" ? allProjectsData ?? [] : undefined,
    ),
    "progress",
  ).slice(0, 6);

  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 6px 18px rgba(15,15,15,0.04)", bgcolor: "#fff" }}>
      <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 1.5 }}>Team Progress</Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {members.length ? members.map((member) => (
          <Box key={member.userId}>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 0.5 }}>
              <Typography noWrap title={member.memberName} sx={{ minWidth: 0, fontSize: 12, fontWeight: 600 }}>{member.memberName}</Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 800 }}>{member.progressPercent}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={member.progressPercent}
              sx={{ height: 7, borderRadius: 4, bgcolor: "rgba(75,46,131,0.12)", "& .MuiLinearProgress-bar": { borderRadius: 4, bgcolor: "#4B2E83" } }}
            />
          </Box>
        )) : (
          <Typography sx={{ color: "#64748B", fontSize: 12, textAlign: "center", py: 2 }}>No members with assignments</Typography>
        )}
      </Box>
    </Paper>
  );
}
