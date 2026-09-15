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
  items: KanbanSubtask[];
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
    ? { accent: "#2563EB", soft: "#EAF2FF", surface: "#F5F8FF", divider: "#C9DBFF", label: "In progress", description: "Work underway" }
    : String(id) === "2"
      ? { accent: "#16875D", soft: "#E9F8F0", surface: "#F3FBF7", divider: "#BEE8D2", label: "Completed", description: "Finished work" }
      : { accent: "#667085", soft: "#EEF1F5", surface: "#F6F7F9", divider: "#D8DDE5", label: "Not started", description: "Ready to begin" };

  return (
    <Box
      ref={setNodeRef}
      sx={{
        backgroundColor: showHierarchy ? columnTheme.surface : "#f7f7fb",
        borderRadius: 3,
        p: showHierarchy ? 1.75 : 1.25,
        minHeight: showHierarchy ? 420 : 260,
        transition: "all 0.25s ease",
        border: isOver ? `2px dashed ${columnTheme.accent}` : "none",
        boxShadow: isOver
          ? "0 0 8px rgba(25, 118, 210, 0.4)"
          : "none",
      }}
    >
      {/* TITLE */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.75, mx: showHierarchy ? -1.75 : -1.25, mt: showHierarchy ? -1.75 : -1.25, px: showHierarchy ? 1.75 : 1.25, py: 1.5, bgcolor: columnTheme.soft, borderBottom: `1px solid ${columnTheme.divider}`, borderRadius: "12px 12px 0 0" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: columnTheme.accent }} />
          <Box><Typography sx={{ fontWeight: 850, fontSize: 14, lineHeight: 1.2, color: "#0F172A" }}>{columnTheme.label}</Typography><Typography sx={{ mt: 0.25, fontSize: 11, color: "#667085" }}>{columnTheme.description}</Typography></Box>
        </Box>
        <Box sx={{ minWidth: 28, height: 28, px: 1, display: "grid", placeItems: "center", borderRadius: "999px", bgcolor: columnTheme.soft, color: columnTheme.accent, fontSize: 12, fontWeight: 800 }}>
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
