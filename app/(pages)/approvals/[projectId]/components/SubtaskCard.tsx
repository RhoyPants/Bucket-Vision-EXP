import { Box, Card, Typography, Chip, LinearProgress, Stack } from "@mui/material";
import { Subtask, Priority, CompareTheme } from "./types";
import { formatBudget, formatPercent } from "@/app/utils/formatters";

const PRIORITY_COLOR_MAP: Record<Priority, { chip: string; text: string }> = {
  LOW: { chip: "#9ca3af", text: "#fff" },
  MEDIUM: { chip: "#f59e0b", text: "#fff" },
  HIGH: { chip: "#ef4444", text: "#fff" },
};

interface SubtaskCardProps {
  subtask: Subtask;
  theme?: CompareTheme;
}

export default function SubtaskCard({ subtask, theme }: SubtaskCardProps) {
  const ct = theme;
  const isModified = ct !== undefined && subtask.changeStatus === "MODIFIED";
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
        width: 252,
        minWidth: 252,
        flex: "0 0 252px",
        display: "flex",
        flexDirection: "column",
        border: ct ? `1px solid ${ct.border}` : "2px solid #a78bfa",
        ...(isModified && { borderLeft: `4px solid ${ct!.accent}` }),
        bgcolor: ct ? ct.background : "#f5f3ff",
        borderRadius: 1.5,
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        transition: "all 0.2s",
        "&:hover": {
          boxShadow: ct ? "0 4px 12px rgba(0,0,0,0.08)" : "0 4px 12px rgba(167, 139, 250, 0.2)",
        },
      }}
    >
      {/* SUBTASK HEADER */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, minHeight: 42, mb: 1.25 }}>
        <Typography
          fontWeight={600}
          fontSize={13}
          title={subtask.title}
          sx={{
            color: ct ? ct.text : "#1f2937",
            flex: 1,
            minWidth: 0,
            lineHeight: 1.35,
            wordBreak: "break-word",
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
            overflow: "hidden",
          }}
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
            label={formatPercent(subtask.progress)}
            size="small"
            sx={{
              backgroundColor: ct ? ct.accent : "#6366f1",
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
              bgcolor: ct ? ct.accent : "#a78bfa",
            },
          }}
        />
      </Box>

      {/* BUDGET AND WEIGHT */}
      <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ mb: 1.5, px: 1, py: 0.75, borderRadius: 1, bgcolor: "rgba(255,255,255,0.65)", border: "1px solid #e5e7eb" }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 9, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Budget</Typography>
          <Typography noWrap sx={{ fontSize: 10.5, color: "#374151", fontWeight: 700 }}>{formatBudget(subtask.budgetAllocated, true)}</Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography sx={{ fontSize: 9, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Weight</Typography>
          <Typography sx={{ fontSize: 10.5, color: "#374151", fontWeight: 700 }}>{formatPercent(subtask.budgetPercent)}</Typography>
        </Box>
      </Stack>

      {/* DATES */}
      <Stack spacing={0.75} sx={{ fontSize: 12 }}>
          <Box sx={{ minHeight: 42 }}>
            <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 600, display: "block", mb: 0.25 }}>
              Projected
            </Typography>
            <Typography variant="caption" sx={{ color: "#374151" }}>
              {projectedStart && projectedEnd ? `${projectedStart} - ${projectedEnd}` : projectedStart || projectedEnd || "—"}
            </Typography>
          </Box>
          <Box sx={{ minHeight: 42 }}>
            <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 600, display: "block", mb: 0.25 }}>
              Actual
            </Typography>
            <Typography variant="caption" sx={{ color: "#374151" }}>
              {actualStart && actualEnd ? `${actualStart} - ${actualEnd}` : actualStart || actualEnd || "—"}
            </Typography>
          </Box>
      </Stack>
    </Card>
  );
}
