"use client";

import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Chip,
  LinearProgress,
} from "@mui/material";
import PriorityLegend from "./PriorityLegend";

interface TaskItem {
  task_id: number;
  task_name: string;
  priority: string;
  progress: number;
}

export default function TaskSidebar({
  tasks,
  activeTaskId,
  onSelectTask,   // ✅ Correct prop name
}: {
  tasks: TaskItem[];
  activeTaskId: number | null;
  onSelectTask: (taskId: number) => void;
}) {
  const priorityDot = (priority: string) => {
    const colors: Record<string, string> = {
      High: "#E5494D",   // red
      Medium: "#FF9800", // orange
      Low: "#57A55A",    // green
      Normal: "#57A55A",
    };
    return colors[priority] || "#888";
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
      {/* 🔹 Legend (High / Medium / Low colors) */}
      <PriorityLegend />

      <List sx={{ p: 0, mt: 1 }}>
        {tasks.map((task) => {
          const isActive = activeTaskId === task.task_id;

          return (
            <ListItemButton
              key={task.task_id}
              selected={isActive}
              onClick={() => onSelectTask(task.task_id)} // ✅ fixed function call
              sx={{
                mb: 1,
                borderRadius: "8px",
                alignItems: "flex-start",
                flexDirection: "column",
                background: isActive ? "#EAF2FF" : "transparent",
                borderLeft: isActive
                  ? "4px solid #0C66E4"
                  : "4px solid transparent",
                py: 1.3,
                px: 1.6,
                transition: "0.15s",
                "&:hover": {
                  background: isActive ? "#E6F0FF" : "#F0F2F5",
                },
              }}
            >
              {/* Task Title + Dot */}
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

                <ListItemText
                  primary={task.task_name}
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
              </Box>

              {/* Progress bar */}
              <LinearProgress
                variant="determinate"
                value={task.progress}
                sx={{
                  width: "100%",
                  mt: 1,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "#D6D9DE",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: "#0C66E4",
                  },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}
