"use client";

import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Dialog,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useState } from "react";
import { useAppSelector } from "@/app/redux/hook";

interface MemberProps {
  projectId: string | null;
  memberId: string;
  name: string;
  email?: string;
  assigned: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
  progressPercent: number;
  allProjectsData?: any[] | null;
}

export default function MemberCard({
  projectId,
  memberId,
  name,
  email,
  assigned,
  completed,
  inProgress,
  pending,
  overdue,
  progressPercent,
  allProjectsData,
}: MemberProps) {
  const [openModal, setOpenModal] = useState(false);
  const fullProject = useAppSelector((state) => state.project.fullProject);

  // Get all subtasks assigned to this member from the selected project(s)
  const getMemberSubtasks = () => {
    let projectsData: any[] = [];
    
    if (projectId === "all-projects" && allProjectsData && allProjectsData.length > 0) {
      projectsData = allProjectsData;
    } else if (projectId && projectId !== "all-projects") {
      if (fullProject && fullProject.id === projectId) {
        projectsData = [fullProject];
      }
    }

    if (projectsData.length === 0 || !projectsData[0]?.categories) return [];

    const subtasks: any[] = [];
    
    projectsData.forEach((project: any) => {
      project.categories?.forEach((category: any) => {
        if (category.tasks) {
          category.tasks.forEach((task: any) => {
            if (task.subtasks) {
              task.subtasks.forEach((subtask: any) => {
                if (
                  subtask.assignees?.some(
                    (a: any) => a.userId === memberId
                  )
                ) {
                  subtasks.push({
                    id: subtask.id,
                    subtaskName: subtask.title,
                    taskName: task.title,
                    categoryName: category.name,
                    projectName: project.name,
                    progress: subtask.progress,
                    status:
                      subtask.progress === 100
                        ? "Completed"
                        : subtask.progress > 0
                          ? "In Progress"
                          : "Pending",
                    dueDate: subtask.projectedEndDate,
                  });
                }
              });
            }
          });
        }
      });
    });
    return subtasks;
  };

  const memberSubtasks = getMemberSubtasks();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "#10B981";
      case "In Progress":
        return "#F59E0B";
      case "Pending":
        return "#9CA3AF";
      default:
        return "#6B7280";
    }
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: 2.25,
          borderRadius: 2.25,
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 6px 18px rgba(15,15,15,0.03)",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#fff",
        }}
      >
        {/* Header: Avatar + Name */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1.5 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              bgcolor: "grey.200",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AccountCircleIcon sx={{ fontSize: 60, color: "grey.600" }} />
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 800, fontSize: 14 }}>
              {name}
            </Typography>
            {email && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", fontSize: 11 }}
              >
                {email}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mb: 1.5 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              Overall Progress
            </Typography>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: "#4B2E83" }}
            >
              {progressPercent}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progressPercent}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: "rgba(75,46,131,0.12)",
              "& .MuiLinearProgress-bar": {
                borderRadius: 4,
                backgroundColor: "#4B2E83",
              },
            }}
          />
        </Box>

        {/* Stats Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 1,
            mb: 1.5,
            p: 1.25,
            borderRadius: 1.5,
            backgroundColor: "rgba(0,0,0,0.02)",
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary">
              Assigned
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#4B2E83" }}>
              {assigned}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Completed
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#10B981" }}>
              {completed}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              In Progress
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#3B82F6" }}>
              {inProgress}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              {overdue > 0 ? "Overdue" : "Pending"}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: overdue > 0 ? "#EF4444" : "#9CA3AF",
              }}
            >
              {overdue > 0 ? overdue : pending}
            </Typography>
          </Box>
        </Box>

        {/* View Button */}
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            size="small"
            onClick={() => setOpenModal(true)}
            sx={{
              backgroundColor: "#4B2E83",
              "&:hover": { backgroundColor: "#3f2566" },
              textTransform: "none",
              fontWeight: 500,
              fontSize: 12,
              py: 0.75,
              px: 2,
            }}
          >
            View Details
          </Button>
        </Box>
      </Paper>

      {/* Task Board Modal */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="lg"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 18, mb: 0.5 }}>
            {name}'s Tasks
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {email}
          </Typography>

          {fullProject?.name && (
            <Box
              sx={{
                p: 1.5,
                mb: 2,
                borderRadius: 2,
                backgroundColor: "rgba(75,46,131,0.08)",
                border: "1px solid rgba(75,46,131,0.2)",
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "#4B2E83" }}
              >
                📋 Project: {fullProject.name}
              </Typography>
            </Box>
          )}

          {memberSubtasks.length > 0 ? (
            <TableContainer
              sx={{
                border: "1px solid rgba(0,0,0,0.06)",
                borderRadius: 2,
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "rgba(75,46,131,0.05)" }}>
                    <TableCell sx={{ fontWeight: 700, color: "#4B2E83", fontSize: 12 }}>
                      Project
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#4B2E83", fontSize: 12 }}>
                      Category
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#4B2E83", fontSize: 12 }}>
                      Task
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#4B2E83", fontSize: 12 }}>
                      Subtask
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#4B2E83", fontSize: 12 }}>
                      Assigned
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#4B2E83", fontSize: 12 }}>
                      Progress
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#4B2E83", fontSize: 12 }}>
                      Status
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {memberSubtasks.map((subtask) => (
                    <TableRow key={subtask.id} sx={{ "&:hover": { backgroundColor: "rgba(75,46,131,0.03)" } }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: 12 }}>
                          {subtask.projectName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: 12, color: "text.secondary" }}>
                          {subtask.categoryName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: 12 }}>
                          {subtask.taskName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: 12, fontWeight: 500 }}>
                          {subtask.subtaskName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: 12, color: "text.secondary" }}>
                          {name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                          <LinearProgress
                            variant="determinate"
                            value={subtask.progress}
                            sx={{
                              width: 50,
                              height: 5,
                              borderRadius: 3,
                              backgroundColor: "rgba(75,46,131,0.12)",
                              "& .MuiLinearProgress-bar": {
                                borderRadius: 3,
                                backgroundColor: "#4B2E83",
                              },
                            }}
                          />
                          <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 30 }}>
                            {subtask.progress}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: "inline-block",
                            px: 0.75,
                            py: 0.25,
                            borderRadius: 0.75,
                            backgroundColor: `${getStatusColor(
                              subtask.status
                            )}20`,
                            border: `1px solid ${getStatusColor(
                              subtask.status
                            )}40`,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: getStatusColor(subtask.status),
                              fontWeight: 700,
                              fontSize: 10,
                            }}
                          >
                            {subtask.status}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary" sx={{ textAlign: "center", py: 3 }}>
              No tasks assigned
            </Typography>
          )}

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 1,
              mt: 2,
            }}
          >
            <Button
              variant="text"
              onClick={() => setOpenModal(false)}
              sx={{ color: "#4B2E83" }}
            >
              Close
            </Button>
          </Box>
        </Box>
      </Dialog>
    </>
  );
}
