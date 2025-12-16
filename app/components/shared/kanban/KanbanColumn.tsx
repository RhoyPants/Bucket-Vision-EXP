// app/components/shared/kanban/KanbanColumn.tsx
"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import KanbanSortableCard from "./KanbanSortableCard";
import type { KanbanSubtask } from "@/app/redux/slices/kanbanSlice";

export default function KanbanColumn({
  id,
  title,
  items,
}: {
  id: string;
  title: string;
  items: KanbanSubtask[];
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${id}`,
    data: { columnId: id },
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        backgroundColor: "#F7F8FA",
        borderRadius: 2,
        p: 2,
        minHeight: "400px",
        maxHeight: "75vh",
        overflowY: "auto",
        boxShadow: "inset 0 0 4px rgba(0,0,0,0.05)",
        transition: "0.2s",
        border: isOver ? "2px dashed #0C66E4" : "2px solid transparent",
      }}
    >
      {/* Column Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 1.5,
        }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{title}</Typography>

        <Box
          sx={{
            background: "#E6E8EC",
            borderRadius: "12px",
            px: 1,
            fontSize: "12px",
            fontWeight: 600,
            color: "#333",
            height: 22,
            display: "flex",
            alignItems: "center",
          }}
        >
          {items.length}
        </Box>
      </Box>

      {/* Sortable List */}
      <SortableContext
        items={items.map((i) => `subtask-${i.id}`)}
        strategy={verticalListSortingStrategy}
      >
        {items.length > 0 ? (
          items.map((s) => (
            <KanbanSortableCard key={s.id} subtask={s} />
          ))
        ) : (
          // EMPTY COLUMN PLACEHOLDER
          <Box
            sx={{
              mt: 2,
              p: 2,
              background: "#ffffff",
              borderRadius: 2,
              textAlign: "center",
              fontSize: 13,
              color: "#7A7D85",
              border: "1px dashed #C6C9D1",
            }}
          >
            No subtasks.  
            <br />
            Drag here or create a new one.
          </Box>
        )}
      </SortableContext>
    </Box>
  );
}
