// app/components/taskboard/ColumnSection.tsx
"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SortableTaskCard from "./SortableTaskCard";
import type { TaskData, TaskStatus } from "@/app/taskboard/taskTypes";

export default function ColumnSection({
  columnId,
  title,
  tasks,
  onStatusChange,
  onOpenCardMenu,
}: {
  columnId: TaskStatus;
  title: string;
  tasks: TaskData[];
  onStatusChange: (taskId: number, newStatus: TaskStatus) => void;
  onOpenCardMenu?: (e: React.MouseEvent, id: number) => void;
}) {
  const { setNodeRef } = useDroppable({
    id: `column-${columnId}`,
    data: { columnId },
  });

  const columnTasks = tasks.filter((t) => t.status === columnId);

  return (
    <Box
      ref={setNodeRef}
      sx={{
        backgroundColor: "#fff",
        borderRadius: 2,
        p: 2,
        border: "1px solid #e0e0e0",
        minHeight: "340px",
        maxHeight: "80vh",
        overflowY: "auto",
      }}
    >
      <Typography sx={{ fontWeight: 700, mb: 1, fontFamily: "var(--font-ftsterling)" }}>
        {title} ({columnTasks.length})
      </Typography>

      <SortableContext items={columnTasks.map((t) => `task-${t.id}`)} strategy={verticalListSortingStrategy}>
        {columnTasks.map((task) => (
          <SortableTaskCard key={task.id} task={task} onOpenMenu={onOpenCardMenu} />
        ))}
      </SortableContext>
    </Box>
  );
}
