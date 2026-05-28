import { Box, Typography, LinearProgress } from "@mui/material";
import { Task, CompareTheme, getCompareTheme } from "./types";
import SubtaskCard from "./SubtaskCard";

interface TaskRowProps {
  task: Task;
  theme?: CompareTheme;
}

export default function TaskRow({ task, theme }: TaskRowProps) {
  const ct = theme;
  const isModified = ct !== undefined && task.changeStatus === "MODIFIED";

  return (
    <Box
      sx={{
        backgroundColor: ct ? ct.background : "#f0f9ff",
        p: 2,
        mb: 2,
        border: ct ? `1px solid ${ct.border}` : "2px solid #0ea5e9",
        ...(isModified && { borderLeft: `4px solid ${ct!.accent}` }),
        borderRadius: 1.5,
        transition: "all 0.2s",
        "&:hover": {
          boxShadow: ct ? "0 2px 8px rgba(0,0,0,0.08)" : "0 2px 8px rgba(14, 165, 233, 0.15)",
        },
      }}
    >
      {/* TASK HEADER */}
      <Box sx={{ mb: 1.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
          <Typography fontWeight={600} fontSize={14} sx={{ color: ct ? ct.text : "#1f2937" }}>
            {task.title}
          </Typography>
          {task.budgetAllocated !== undefined && (
            <Typography fontSize={12} sx={{ color: "#6b7280", fontWeight: 600 }}>
              ₱{(task.budgetAllocated || 0).toLocaleString()}
            </Typography>
          )}
        </Box>

        {/* PROGRESS */}
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 500 }}>Progress</Typography>
            <Typography variant="caption" sx={{ color: "#1f2937", fontWeight: 700 }}>{task.progress}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={task.progress}
            sx={{
              height: 5,
              borderRadius: 1,
              bgcolor: "#e5e7eb",
              "& .MuiLinearProgress-bar": {
                borderRadius: 1,
                bgcolor: ct ? ct.accent : "#0ea5e9",
              },
            }}
          />
        </Box>
      </Box>

      {/* SUBTASKS HORIZONTAL SCROLL */}
      {task.subtasks && task.subtasks.length > 0 ? (
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            overflowX: "auto",
            pb: 1,
            scrollBehavior: "smooth",
            "&::-webkit-scrollbar": { height: 6 },
            "&::-webkit-scrollbar-track": { bgcolor: ct ? ct.background : "#f0f9ff", borderRadius: 1 },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: ct ? ct.accent : "#0ea5e9",
              borderRadius: 1,
              "&:hover": { bgcolor: ct ? ct.text : "#0284c7" },
            },
          }}
        >
          {task.subtasks.map((subtask) => (
            <SubtaskCard
              key={subtask.id}
              subtask={subtask}
              theme={ct ? getCompareTheme(subtask.changeStatus) : undefined}
            />
          ))}
        </Box>
      ) : (
        <Typography variant="caption" sx={{ color: "#9ca3af", display: "block", py: 1 }}>
          No subtasks
        </Typography>
      )}
    </Box>
  );
}
