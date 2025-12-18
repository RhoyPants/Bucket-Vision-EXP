"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import KanbanSortableCard from "./KanbanSortableCard";
import type { KanbanSubtask } from "@/app/redux/slices/kanbanSlice";

export default function KanbanColumn({
  id,
  title,
  items,
  activeId,
  onViewDetails,
  loading,
}: {
  id: string;
  title: string;
  items: KanbanSubtask[];
  activeId: string | null;
  onViewDetails: (subtask: KanbanSubtask) => void;
  loading: Boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${id}`,
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        backgroundColor: "#f7f7fb",
        borderRadius: 2,
        p: 2,
        minHeight: "300px",
        maxHeight: "72vh",
        overflowY: "auto",
        transition: "0.2s ease",
        border: isOver ? "2px dashed #1976d2" : "2px solid transparent", // 🔥 BLUE BORDER
        boxShadow: isOver
          ? "0 0 8px rgba(25, 118, 210, 0.4)" // 🔥 Glow effect
          : "inset 0 1px 0 rgba(0,0,0,0.02)",
      }}
    >
      <Typography sx={{ fontWeight: 700, mb: 1 }}>
        {title} ({items.length})
      </Typography>

      <SortableContext
        items={items.map((i) => `subtask-${i.id}`)}
        strategy={verticalListSortingStrategy}
      >
        {items.map((s) => (
          <KanbanSortableCard
            key={s.id}
            subtask={s}
            isDropTarget={activeId === s.id}
            onViewDetails={onViewDetails} 
          />
        ))}
      </SortableContext>
    </Box>
  );
}
