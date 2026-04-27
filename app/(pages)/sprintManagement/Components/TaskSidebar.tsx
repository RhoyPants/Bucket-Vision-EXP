"use client";

import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  LinearProgress,
  IconButton,
  Typography,
  Button,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PriorityLegend from "./PriorityLegend";

interface TaskItem {
  budgetPercent: number;
  budgetAllocated: number;
  id: string;
  title: string;
  priority?: string;
  progress?: number;
}

export default function TaskSidebar({
  tasks,
  activeTaskId,
  onSelectTask,
  onDeleteTask,
  onAddTask,
  onViewTask,
}: {
  tasks: TaskItem[];
  activeTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  onDeleteTask?: (task: TaskItem) => void;
  onAddTask?: () => void;
  onViewTask?: (task: TaskItem) => void;
}) {
  const getProgressColor = (progress?: number) => {
    if (!progress || progress === 0) return "#9E9E9E";
    if (progress < 50) return "#F59E0B";
    if (progress < 100) return "#3B82F6";
    return "#22C55E";
  };

  const priorityDot = (priority?: string) => {
    const colors: Record<string, string> = {
      High: "#E5494D",
      Medium: "#FF9800",
      Low: "#57A55A",
      Normal: "#57A55A",
    };
    return colors[priority || ""] || "#888";
  };

  return (
    <Box
      sx={{
        width: 260,
        height: "100%",
        borderRight: "1px solid #E0E4EA",
        background: "#F7F8FA",
        overflowY: "auto",
        p: 1.5,
      }}
    >
      {/* 🔥 HEADER */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Typography fontWeight={700}>TASK</Typography>

        <Button
          size="small"
          variant="contained"
          onClick={onAddTask}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            borderRadius: "6px",
            px: 1.5,
          }}
        >
          + Add
        </Button>
      </Box>

      {/* Priority Legend */}
      <PriorityLegend />

      <List sx={{ p: 0, mt: 1 }}>
        {tasks.map((task) => {
          const isActive = activeTaskId === task.id;
          const progress = Number(task.progress) || 0;

          return (
            <ListItemButton
              key={task.id}
              selected={isActive}
              onClick={() => onSelectTask(task.id)}
              sx={{
                mb: 1,
                borderRadius: "8px",
                alignItems: "flex-start",
                flexDirection: "column",
                background: isActive ? "#EAF2FF" : "#fff",
                borderLeft: isActive
                  ? "4px solid #0C66E4"
                  : "4px solid transparent",
                py: 1.3,
                px: 1.6,
                transition: "0.15s",
                boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.05)" : "none",

                "&:hover": {
                  background: isActive ? "#E6F0FF" : "#F0F2F5",
                },

                "&:hover .task-actions": {
                  opacity: 1,
                },
              }}
            >
              {/* Title row */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  width: "100%",
                }}
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: priorityDot(task.priority),
                  }}
                />

                <ListItemText
                  primary={task.title}
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: isActive ? 700 : 600,
                    color: "#1D1F26",
                    lineHeight: "18px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                />

                <Box sx={{ flexGrow: 1 }} />

                {/* Action Buttons */}
                <Box
                  className="task-actions"
                  sx={{
                    display: "flex",
                    gap: 0.5,
                    opacity: 0,
                    transition: "opacity 0.2s",
                  }}
                >
                  <IconButton
                    size="small"
                    sx={{
                      color: "#0C66E4",
                      "&:hover": { backgroundColor: "rgba(12, 102, 228, 0.08)" },
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewTask?.(task);
                    }}
                  >
                    <InfoOutlinedIcon fontSize="small" />
                  </IconButton>

                  <IconButton
                    size="small"
                    sx={{
                      color: "error.main",
                      "&:hover": { backgroundColor: "rgba(239, 68, 68, 0.08)" },
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTask?.(task);
                    }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              {/* Budget Info */}
              {task.budgetAllocated > 0 && (
                <Box
                  sx={{
                    backgroundColor: "#f0f9ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: 0.5,
                    px: 1,
                    py: 0.5,
                    mt: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#1e40af" }}>
                      ₱{(task.budgetAllocated || 0).toLocaleString()}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontWeight: 600,
                        backgroundColor: "#0ea5e9",
                        color: "#fff",
                        px: 1,
                        py: 0.25,
                        borderRadius: 0.5,
                      }}
                    >
                      {(task.budgetPercent || 0).toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Progress */}
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  width: "100%",
                  mt: 1,
                  height: 5,
                  borderRadius: 2,
                  backgroundColor: "#D6D9DE",

                  "& .MuiLinearProgress-bar": {
                    backgroundColor: getProgressColor(progress),
                    transition: "0.3s ease",
                  },
                }}
              />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  mt: 0.5,
                }}
              >
                <Typography sx={{ fontSize: 11, color: "#6B7280" }}>
                  {progress}%
                </Typography>

                {progress === 100 && (
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: "#22C55E",
                      fontWeight: 600,
                    }}
                  >
                    ✔ Done
                  </Typography>
                )}
              </Box>
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}