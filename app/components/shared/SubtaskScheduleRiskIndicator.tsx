"use client";

import { Box, Tooltip } from "@mui/material";
import type { SubtaskScheduleRisk } from "@/app/utils/subtaskScheduleRisk";

export default function SubtaskScheduleRiskIndicator({
  risk,
}: {
  risk: SubtaskScheduleRisk;
}) {
  if (!risk) return null;

  const isDelayed = risk === "delayed";
  const label = isDelayed ? "Delayed" : "Near to delay";
  const color = isDelayed ? "#DC2626" : "#F59E0B";

  return (
    <Tooltip title={label} arrow placement="top">
      <Box
        component="span"
        role="img"
        aria-label={label}
        sx={{
          position: "relative",
          display: "inline-flex",
          flex: "0 0 auto",
          width: 10,
          height: 10,
          borderRadius: "50%",
          bgcolor: color,
          boxShadow: `0 0 0 2px ${isDelayed ? "#FEE2E2" : "#FEF3C7"}`,
          "&::after": {
            content: '\"\"',
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            bgcolor: color,
            animation: "subtask-schedule-risk-pulse 1.6s ease-out infinite",
          },
          "@keyframes subtask-schedule-risk-pulse": {
            "0%": { transform: "scale(1)", opacity: 0.65 },
            "75%, 100%": { transform: "scale(2.5)", opacity: 0 },
          },
          "@media (prefers-reduced-motion: reduce)": {
            "&::after": { animation: "none" },
          },
        }}
      />
    </Tooltip>
  );
}
