"use client";

import { Paper, Typography, Grid, Box } from "@mui/material";
import { useAppSelector } from "@/app/redux/hook";
import { aggregateTeamStats } from "@/app/utils/teamAggregation";

interface Props {
  projectId: string | null;
  allProjectsData?: any[] | null;
}

export default function TeamRoles({ projectId, allProjectsData }: Props) {
  const fullProject = useAppSelector((state) => state.project.fullProject);

  // Determine data to use
  let projectData = null;
  
  if (projectId === "all-projects" && allProjectsData && allProjectsData.length > 0) {
    projectData = null;
  } else if (projectId && projectId !== "all-projects") {
    projectData = fullProject && fullProject.id === projectId ? fullProject : null;
  }

  const stats = aggregateTeamStats(
    projectData,
    projectId === "all-projects" ? allProjectsData || [] : undefined
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#10B981";
      case "inProgress":
        return "#3B82F6";
      case "pending":
        return "#9CA3AF";
      case "overdue":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const statusItems = [
    { label: "Completed", value: stats.completedSubtasks, color: getStatusColor("completed") },
    { label: "In Progress", value: stats.inProgressSubtasks, color: getStatusColor("inProgress") },
    { label: "Pending", value: stats.pendingSubtasks, color: getStatusColor("pending") },
    { label: "Overdue", value: stats.overdueSubtasks, color: getStatusColor("overdue") },
  ];

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
        Subtask Status
      </Typography>

      <Grid container spacing={1.5}>
        {statusItems.map((item) => (
          <Grid key={item.label} size={{ xs: 6 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: `${item.color}15`,
                border: `1px solid ${item.color}30`,
                textAlign: "center",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: item.color,
                  fontWeight: 700,
                  fontSize: 20,
                  mb: 0.5,
                }}
              >
                {item.value}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontWeight: 500,
                  fontSize: 11,
                }}
              >
                {item.label}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mb: 1,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Total Subtasks
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: "#4B2E83" }}>
            {stats.totalAssignedSubtasks}
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 700, color: "text.secondary" }}>
            Team Members
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: "text.secondary" }}>
            {stats.totalMembers}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
