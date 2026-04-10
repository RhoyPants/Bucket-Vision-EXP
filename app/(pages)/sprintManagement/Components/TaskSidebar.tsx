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
import PriorityLegend from "./PriorityLegend";

interface TaskItem {
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
}: {
  tasks: TaskItem[];
  activeTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  onDeleteTask?: (task: TaskItem) => void;
  onAddTask?: () => void;
}) {
  // 🎨 Progress color logic
  const getProgressColor = (progress?: number) => {
    if (!progress || progress === 0) return "#9E9E9E"; // gray
    if (progress < 50) return "#F59E0B"; // yellow
    if (progress < 100) return "#3B82F6"; // blue
    return "#22C55E"; // green
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

                "&:hover .delete-btn": {
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
                {/* Priority dot */}
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: priorityDot(task.priority),
                  }}
                />

                {/* Title */}
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

                {/* Delete */}
                <IconButton
                  className="delete-btn"
                  size="small"
                  sx={{
                    opacity: 0,
                    transition: "opacity 0.2s",
                    color: "error.main",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTask?.(task);
                  }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>

              {/* Progress Bar */}
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

              {/* Progress Info */}
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
        {/* Add Task Button */}
        <Box sx={{ mt: 1 }}>
          <Button
            fullWidth
            variant="contained"
            size="small"
            onClick={onAddTask}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "8px",
              mb: 1,
            }}
          >
            + Add Task
          </Button>
        </Box>
      </List>
    </Box>
  );
}
