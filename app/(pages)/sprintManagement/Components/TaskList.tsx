"use client";

import {
  Box,
  LinearProgress,
  IconButton,
  Typography,
  Button,
  Chip,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AddIcon from "@mui/icons-material/Add";

interface TaskItem {
  budgetPercent: number;
  budgetAllocated: number;
  id: string;
  title: string;
  priority?: string;
  progress?: number;
}

export default function TaskList({
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
    if (!progress || progress === 0) return "#cbd5e1";
    if (progress < 50) return "#f59e0b";
    if (progress < 100) return "#3b82f6";
    return "#22c55e";
  };

  const getPriorityColor = (priority?: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      High: { bg: "#fee2e2", text: "#dc2626" },
      Medium: { bg: "#fef3c7", text: "#d97706" },
      Low: { bg: "#dcfce7", text: "#16a34a" },
      Normal: { bg: "#dcfce7", text: "#16a34a" },
    };
    return colors[priority || ""] || { bg: "#e5e7eb", text: "#6b7280" };
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        width: "100%",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      {/* Header with Add Button */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Typography fontWeight={700} sx={{ color: "#210e64" }}>
          Tasks
        </Typography>

        <Button
          size="small"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddTask}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            borderRadius: "8px",
            px: 1.5,
            backgroundColor: "#210e64",
            "&:hover": {
              backgroundColor: "#1a0b50",
            },
          }}
        >
          Add Task
        </Button>
      </Box>

      {/* Horizontal Scrollable Container - Always Visible Scrollbar */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "nowrap",
          gap: { xs: 1.5, sm: 1.8, md: 2 },
          overflowX: "auto",
          overflowY: "hidden",
          pb: 1.2,
          pr: 1,
          scrollBehavior: "smooth",
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          height: "auto",
          "&::-webkit-scrollbar": {
            height: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "#EEF1F7",
            borderRadius: "8px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#C8C2E8",
            borderRadius: "8px",
            "&:hover": {
              background: "#b8acdb",
            },
          },
        }}
      >
        {tasks.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              minWidth: 0,
              minHeight: "100px",
              color: "#888",
              flexShrink: 0,
            }}
          >
            <Typography variant="body2">No tasks in this category</Typography>
          </Box>
        ) : (
          tasks.map((task) => {
            const isActive = activeTaskId === task.id;
            const progress = Number(task.progress) || 0;
            const priorityColor = getPriorityColor(task.priority);

            return (
              <Box
                key={task.id}
                onClick={() => onSelectTask(task.id)}
                sx={{
                  flex: "0 0 240px",
                  padding: "16px",
                  borderRadius: "10px",
                  border: isActive ? "2px solid #210e64" : "1px solid #e5e0f0",
                  backgroundColor: isActive ? "#f5f3ff" : "#fafafe",
                  cursor: "pointer",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: isActive
                    ? "0 4px 12px rgba(33, 14, 100, 0.12)"
                    : "0 1px 3px rgba(0, 0, 0, 0.03)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  minWidth: 0,
                  overflow: "hidden",
                  "&:hover": {
                    boxShadow: "0 4px 16px rgba(33, 14, 100, 0.12)",
                    border: isActive
                      ? "2px solid #210e64"
                      : "1px solid #d0c4e8",
                    backgroundColor: isActive ? "#f5f3ff" : "#fafaf9",
                  },
                  "&:hover .task-actions": {
                    opacity: 1,
                  },
                }}
              >
                {/* Title and Actions Row */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 1,
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: isActive ? 700 : 600,
                        color: "#210e64",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontSize: "14px",
                      }}
                    >
                      {task.title}
                    </Typography>
                  </Box>

                  {/* Action Buttons */}
                  <Box
                    className="task-actions"
                    sx={{
                      display: "flex",
                      gap: 0.5,
                      opacity: 0,
                      transition: "opacity 0.2s",
                      flexShrink: 0,
                    }}
                  >
                    <IconButton
                      size="small"
                      sx={{
                        color: "#3b82f6",
                        width: "28px",
                        height: "28px",
                        "&:hover": {
                          backgroundColor: "rgba(59, 130, 246, 0.08)",
                        },
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
                        color: "#ef4444",
                        width: "28px",
                        height: "28px",
                        "&:hover": {
                          backgroundColor: "rgba(239, 68, 68, 0.08)",
                        },
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

                {/* Priority Chip */}
                {task.priority && (
                  <Chip
                    label={task.priority}
                    size="small"
                    sx={{
                      backgroundColor: priorityColor.bg,
                      color: priorityColor.text,
                      fontWeight: 600,
                      fontSize: "12px",
                      width: "fit-content",
                      height: "24px",
                    }}
                  />
                )}

                {/* Progress Bar */}
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                      gap: 1,
                    }}
                  >
                    <Typography
                      sx={{ fontSize: "12px", color: "#666", fontWeight: 500 }}
                    >
                      Progress
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: isActive ? "#210e64" : "#666",
                      }}
                    >
                      {progress}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: "#e8e7e2",
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: getProgressColor(progress),
                        borderRadius: 3,
                        transition: "0.3s ease",
                      },
                    }}
                  />
                </Box>

                {/* Budget Info */}
                {task.budgetAllocated > 0 && (
                  <Box
                    sx={{
                      backgroundColor: "#f0f9ff",
                      border: "1px solid #bfdbfe",
                      borderRadius: "8px",
                      px: 1.5,
                      py: 1,
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
                      <Typography
                        sx={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#1e40af",
                        }}
                      >
                        ₱{(task.budgetAllocated || 0).toLocaleString()}
                      </Typography>
                      <Chip
                        label={`${(task.budgetPercent || 0).toFixed(1)}%`}
                        size="small"
                        sx={{
                          height: "20px",
                          fontSize: "11px",
                          backgroundColor: "#0ea5e9",
                          color: "#fff",
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                  </Box>
                )}
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
}
