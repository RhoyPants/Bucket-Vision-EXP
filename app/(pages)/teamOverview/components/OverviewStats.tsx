"use client";

import { Box } from "@mui/material";
import StatCard from "./StatCard";
import { useAppSelector } from "@/app/redux/hook";
import { aggregateTeamStats } from "@/app/utils/teamAggregation";
import GroupsIcon from "@mui/icons-material/Groups";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

interface Props {
  projectId: string | null;
  allProjectsData?: any[] | null;
}

export default function OverviewStats({ projectId, allProjectsData }: Props) {
  const projects = useAppSelector((state) => state.project.projects);
  const fullProject = useAppSelector((state) => state.project.fullProject);

  // Determine which data to use for aggregation
  let projectData = null;
  
  if (projectId === "all-projects" && allProjectsData && allProjectsData.length > 0) {
    // For multi-project, just pass as array to aggregateTeamStats
    projectData = null;
  } else if (projectId && projectId !== "all-projects") {
    // For single project, use fullProject if it matches
    projectData = fullProject && fullProject.id === projectId ? fullProject : null;
  }

  const stats = aggregateTeamStats(
    projectData,
    projectId === "all-projects" ? allProjectsData || [] : undefined
  );

  const statCards = [
    {
      title: "Total Members",
      value: stats.totalMembers,
      icon: <GroupsIcon />,
      color: "#4B2E83",
    },
    {
      title: "Total Assigned",
      value: stats.totalAssignedSubtasks,
      icon: <AssignmentIcon />,
      color: "#3B82F6",
    },
    {
      title: "In Progress",
      value: stats.inProgressSubtasks,
      icon: <PlayCircleIcon />,
      color: "#F59E0B",
    },
    {
      title: "Completed",
      value: stats.completedSubtasks,
      icon: <CheckCircleIcon />,
      color: "#10B981",
    },
    {
      title: "Avg Progress",
      value: `${stats.averageProgress}%`,
      icon: <TrendingUpIcon />,
      color: "#06B6D4",
    },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(5, 1fr)",
        },
        gap: 2,
        mb: 2.5,
      }}
    >
      {statCards.map((card, index) => (
        <StatCard
          key={index}
          title={card.title}
          value={card.value}
          icon={card.icon}
          color={card.color}
        />
      ))}
    </Box>
  );
}
