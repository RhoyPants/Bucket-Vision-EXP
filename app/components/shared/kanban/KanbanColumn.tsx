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
  compact = false,
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
  compact?: boolean;
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

  const columnTheme = String(id) === "1"
    ? { accent: "#686AF3", soft: "#F1F0FF", label: "In progress" }
    : String(id) === "2"
      ? { accent: "#2FC99A", soft: "#ECFBF6", label: "Completed" }
      : { accent: "#9A8AF0", soft: "#F5F3FF", label: "Not started" };

  return (
    <Box
      ref={setNodeRef}
      sx={{
        backgroundColor: showHierarchy ? "#FAFAFD" : "#f7f7fb",
        borderRadius: 2,
        p: 1.25,
        minHeight: 260,
        transition: "all 0.25s ease",
        border: isOver ? `2px dashed ${columnTheme.accent}` : "1px solid #E8E5EF",
        boxShadow: isOver
          ? "0 0 8px rgba(25, 118, 210, 0.4)"
          : "inset 0 1px 0 rgba(0,0,0,0.02)",
      }}
    >
      {/* TITLE */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.25, px: .25 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: .8 }}>
          <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: columnTheme.accent }} />
          <Typography sx={{ fontWeight: 800, fontSize: 13, color: "#19152A" }}>{columnTheme.label}</Typography>
        </Box>
        <Box sx={{ minWidth: 25, height: 25, px: .75, display: "grid", placeItems: "center", borderRadius: "8px", bgcolor: columnTheme.soft, color: columnTheme.accent, fontSize: 12, fontWeight: 800 }}>
          {sortedItems.length}
        </Box>
      </Box>

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
              compact={compact}
            />
          </Box>
        ))}
        {sortedItems.length === 0 && (
          <Box sx={{ minHeight: 150, display: "grid", placeItems: "center", border: "1px dashed #D8D3E3", borderRadius: 1.5, bgcolor: "#FFFFFF" }}>
            <Typography sx={{ fontSize: 12, color: "#8A8498" }}>No {title.toLowerCase()} tasks</Typography>
          </Box>
        )}
      </SortableContext>
    </Box>
  );
}
