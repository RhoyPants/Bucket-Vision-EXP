"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box, Chip, Avatar, Typography, Button } from "@mui/material";
import type { KanbanSubtask } from "@/app/redux/slices/kanbanSlice";

export default function KanbanSortableCard({
  subtask,
  isOverlay = false,
  isDropTarget = false,
  onViewDetails, // NEW
}: {
  subtask: KanbanSubtask;
  isOverlay?: boolean;
  isDropTarget?: boolean;
  onViewDetails?: (subtask: KanbanSubtask) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `subtask-${subtask.id}`,
    disabled: isOverlay,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    cursor: isDragging ? "grabbing" : "grab",
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(!isOverlay ? attributes : {})}
      {...(!isOverlay ? listeners : {})}
    >
      <Box
        sx={{
          borderRadius: 2,
          p: 2,
          mb: 2,
          backgroundColor: isDropTarget
            ? "#e7fbe7"
            : isDragging
            ? "#e3f2fd"
            : "#fff",
          transition: "0.2s ease",
          border: isDragging ? "2px solid #1976d2" : "1px solid #eee",
          boxShadow: isDragging
            ? "0 6px 16px rgba(0,0,50,0.15)"
            : "0 2px 6px rgba(0,0,0,0.08)",

          "&:hover": {
            backgroundColor: "#f5f5f5",
            transform: "translateY(-2px)",
          },
        }}
      >
        {/* Title & Priority */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography sx={{ fontWeight: 700 }}>{subtask.title}</Typography>

          <Chip
            label={subtask.priority}
            size="small"
            sx={{
              bgcolor:
                subtask.priority === "High"
                  ? "#ef4444"
                  : subtask.priority === "Medium"
                  ? "#f59e0b"
                  : "#22c55e",
              color: "#fff",
              fontWeight: 700,
            }}
          />
        </Box>

        {/* Assignee */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Avatar sx={{ width: 28, height: 28 }}>
            {subtask.assignee ? subtask.assignee[0] : "—"}
          </Avatar>

          <Typography sx={{ fontSize: 13 }}>
            {subtask.assignee ?? "Unassigned"}
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
            {subtask.endDate}
          </Typography>
        </Box>

        {/* Description */}
        {subtask.description && (
          <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 1 }}>
            {subtask.description}
          </Typography>
        )}

        {/* View Details */}
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            size="small"
            variant="outlined"
            sx={{ textTransform: "none" }}
            onClick={() => {
              console.log("Clicked:", subtask);
              onViewDetails?.(subtask);
            }}
          >
            View Details
          </Button>
        </Box>
      </Box>
    </div>
  );
}
