import { Box, Card, Typography, Chip, LinearProgress, Stack } from "@mui/material";
import { Subtask, Priority } from "./types";

const PRIORITY_COLOR_MAP: Record<Priority, { chip: string; text: string }> = {
  LOW: { chip: "#9ca3af", text: "#fff" },
  MEDIUM: { chip: "#f59e0b", text: "#fff" },
  HIGH: { chip: "#ef4444", text: "#fff" },
};

interface SubtaskCardProps {
  subtask: Subtask;
}

export default function SubtaskCard({ subtask }: SubtaskCardProps) {
  const priorityColor = subtask.priority
    ? PRIORITY_COLOR_MAP[subtask.priority]
    : { chip: "#9ca3af", text: "#fff" };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const projectedStart = formatDate(subtask.projectedStartDate);
  const projectedEnd = formatDate(subtask.projectedEndDate);
  const actualStart = formatDate(subtask.actualStartDate);
  const actualEnd = formatDate(subtask.actualEndDate);

  return (
    <Card
      sx={{
        p: 2,
        minWidth: 240,
        flexShrink: 0,
        border: "2px solid #a78bfa",
        bgcolor: "#f5f3ff",
        borderRadius: 1.5,
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        transition: "all 0.2s",
        "&:hover": {
          boxShadow: "0 4px 12px rgba(167, 139, 250, 0.2)",
        },
      }}
    >
      {/* SUBTASK HEADER */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
        <Typography
          fontWeight={600}
          fontSize={13}
          sx={{ color: "#1f2937", flex: 1, wordBreak: "break-word" }}
        >
          {subtask.title}
        </Typography>
        {subtask.priority && (
          <Chip
            label={subtask.priority}
            size="small"
            sx={{
              backgroundColor: priorityColor.chip,
              color: priorityColor.text,
              fontWeight: 600,
              fontSize: 11,
              height: 20,
              ml: 1,
              flexShrink: 0,
            }}
          />
        )}
      </Box>

      {/* PROGRESS */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
          <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 500 }}>
            Progress
          </Typography>
          <Chip
            label={`${subtask.progress}%`}
            size="small"
            sx={{
              backgroundColor: "#6366f1",
              color: "#fff",
              height: 20,
              fontWeight: 600,
              fontSize: 11,
            }}
          />
        </Box>
        <LinearProgress
          variant="determinate"
          value={subtask.progress}
          sx={{
            height: 6,
            borderRadius: 1,
            bgcolor: "#e5e7eb",
            "& .MuiLinearProgress-bar": {
              borderRadius: 1,
              bgcolor: "#a78bfa",
            },
          }}
        />
      </Box>

      {/* DATES */}
      <Stack spacing={0.75} sx={{ fontSize: 12 }}>
        {(projectedStart || projectedEnd) && (
          <Box>
            <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 600, display: "block", mb: 0.25 }}>
              Projected
            </Typography>
            <Typography variant="caption" sx={{ color: "#374151" }}>
              {projectedStart && projectedEnd ? `${projectedStart} - ${projectedEnd}` : projectedStart || projectedEnd || "N/A"}
            </Typography>
          </Box>
        )}
        {(actualStart || actualEnd) && (
          <Box>
            <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 600, display: "block", mb: 0.25 }}>
              Actual
            </Typography>
            <Typography variant="caption" sx={{ color: "#374151" }}>
              {actualStart && actualEnd ? `${actualStart} - ${actualEnd}` : actualStart || actualEnd || "N/A"}
            </Typography>
          </Box>
        )}
      </Stack>
    </Card>
  );
}
