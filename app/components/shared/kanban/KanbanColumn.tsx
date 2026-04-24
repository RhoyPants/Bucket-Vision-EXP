"use client";

import React, { useMemo } from "react";
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
  parentTaskId,
  taskBudget = 0,
  projectId = "",
  onProgressSuccess,
  showHierarchy = false,
}: {
  id: string | number;
  title: string;
  items: any[];
  activeId: string | null;
  parentTaskId?: string | null;
  taskBudget?: number;
  projectId?: string;
  onProgressSuccess?: () => void;
  showHierarchy?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${id}`,
  });

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [items]);

  const itemIds = useMemo(
    () => sortedItems.map((i) => `subtask-${i.id}`),
    [sortedItems]
  );

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
        transition: "all 0.25s ease",
        border: isOver ? "2px dashed #1976d2" : "2px solid transparent",
        boxShadow: isOver
          ? "0 0 8px rgba(25, 118, 210, 0.4)"
          : "inset 0 1px 0 rgba(0,0,0,0.02)",
      }}
    >
      {/* TITLE */}
      <Typography sx={{ fontWeight: 700, mb: 1 }}>
        {title} ({sortedItems.length})
      </Typography>

      {/* CARDS */}
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        {sortedItems.map((s) => (
          <Box key={s.id}>
            <KanbanSortableCard
              subtask={s}
              isDropTarget={activeId === s.id}
              parentTaskId={parentTaskId}
              taskBudget={taskBudget}
              projectId={projectId}
              onProgressSuccess={onProgressSuccess}
              showHierarchy={showHierarchy}
            />
          </Box>
        ))}
      </SortableContext>
    </Box>
  );
}