"use client";

import React, { useMemo, memo } from "react";
import { Box, Typography, Tooltip } from "@mui/material";
import {
  CalendarSubtask,
  assignLanes,
  getBarStyle,
  getBarBackgroundColor,
  getDurationDays,
} from "./calendarUtils";

const LANE_HEIGHT = 20;  // px — slim bar for breathing room
const LANE_GAP    = 6;   // px — visible gap between lanes

interface WeekRowProps {
  weekStart: Date;
  weekEnd: Date;
  subtasks: CalendarSubtask[];
  onSubtaskClick: (subtaskId: string) => void;
}

const WeekRow = memo(function WeekRow({
  weekStart,
  weekEnd,
  subtasks,
  onSubtaskClick,
}: WeekRowProps) {
  const laned = useMemo(() => assignLanes(subtasks), [subtasks]);

  const laneCount  = laned.length > 0 ? Math.max(...laned.map((t) => t.lane)) + 1 : 0;
  const rowHeight  = laneCount > 0
    ? LANE_GAP + laneCount * (LANE_HEIGHT + LANE_GAP)
    : 4; // near-zero height for empty weeks

  return (
    <Box sx={{ position: "relative", height: rowHeight }}>
      {laned.map((task) => {
        const { leftPct, widthPct } = getBarStyle(task, weekStart, weekEnd);
        const duration = getDurationDays(task.startDate, task.endDate);
        const { bg, text, border } = getBarBackgroundColor(task.progress, duration);
        const top = LANE_GAP + task.lane * (LANE_HEIGHT + LANE_GAP);

        const startLabel = task.startDate?.slice(0, 10) ?? "";
        const endLabel   = task.endDate?.slice(0, 10) ?? "";
        const tooltipContent = (
          <Box sx={{ p: 0.5 }}>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, mb: 0.25 }}>
              {task.title}
            </Typography>
            <Typography sx={{ fontSize: "0.7rem", opacity: 0.85 }}>
              {startLabel} → {endLabel}
            </Typography>
            {task.scopeName && (
              <Typography sx={{ fontSize: "0.68rem", opacity: 0.7, mt: 0.25 }}>
                {task.scopeName}
              </Typography>
            )}
            <Box
              sx={{
                mt: 0.5,
                height: 4,
                borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.3)",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  width: `${task.progress}%`,
                  height: "100%",
                  backgroundColor: "white",
                  borderRadius: 2,
                }}
              />
            </Box>
            <Typography sx={{ fontSize: "0.68rem", mt: 0.25, opacity: 0.9 }}>
              {task.progress}% complete
            </Typography>
          </Box>
        );

        return (
          <Tooltip key={task.id} title={tooltipContent} placement="top" arrow>
            <Box
              onClick={() => onSubtaskClick(task.id)}
              sx={{
                position: "absolute",
                top: top + 2,  // anchor bars with margin-top
                left: `${leftPct}%`,
                width: `calc(${widthPct}% - 4px)`,
                height: LANE_HEIGHT,
                backgroundColor: bg,
                border,
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                px: 0.75,
                gap: 0.5,
                overflow: "hidden",
                boxSizing: "border-box",
                opacity: 0.85,  // uniform opacity for all bars
                transition: "all 0.2s ease",
                zIndex: 1,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                "&:hover": {
                  opacity: 1,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                  transform: "scale(1.02)",
                  zIndex: 20,
                },
                "&::after": {
                  /* Progress fill indicator */
                  content: '""',
                  position: "absolute",
                  right: 0,
                  top: 0,
                  height: "100%",
                  width: `${100 - task.progress}%`,
                  backgroundColor: "rgba(255,255,255,0.25)",
                  borderRadius: "4px",
                  pointerEvents: "none",
                },
              }}
            >
              {/* Title — only shown for non-trivially-narrow bars */}
              {widthPct > 8 && (
                <Typography
                  sx={{
                    color: text,
                    fontWeight: 500,
                    fontSize: "11px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    flex: 1,
                    lineHeight: 1.2,
                  }}
                >
                  {task.title}
                </Typography>
              )}

              {/* Progress badge — only on wider bars */}
              {widthPct > 18 && (
                <Box
                  sx={{
                    flexShrink: 0,
                    backgroundColor: "rgba(255,255,255,0.25)",
                    borderRadius: "3px",
                    px: 0.4,
                    height: 14,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Typography sx={{ color: text, fontSize: "0.58rem", fontWeight: 700 }}>
                    {task.progress}%
                  </Typography>
                </Box>
              )}
            </Box>
          </Tooltip>
        );
      })}
    </Box>
  );
});

export default WeekRow;
