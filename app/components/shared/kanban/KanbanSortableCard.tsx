// app/components/shared/kanban/KanbanSortableCard.tsx
"use client";
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box, Chip, Avatar, Typography, Button } from "@mui/material";
import type { KanbanSubtask } from "@/app/redux/slices/kanbanSlice";

export default function KanbanSortableCard({ subtask }: { subtask: KanbanSubtask }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `subtask-${subtask.id}` });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.8 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Box sx={{ borderRadius: 2, p: 2, mb: 2, backgroundColor: "#fff", boxShadow: "0 6px 14px rgba(20,10,40,0.04)", border: "1px solid #eee" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Typography sx={{ fontWeight: 700 }}>{subtask.title}</Typography>
          {subtask.priority && <Chip label={subtask.priority} size="small" sx={{ bgcolor: subtask.priority === "High" ? "#ef4444" : subtask.priority === "Medium" ? "#f59e0b" : "#22c55e", color: "#fff", fontWeight: 700 }} />}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Avatar sx={{ width: 28, height: 28 }}>{subtask.assignee ? subtask.assignee[0] : "—"}</Avatar>
          <Typography sx={{ fontSize: 13 }}>{subtask.assignee ?? "Unassigned"}</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{subtask.dueDate}</Typography>
        </Box>

        {subtask.description && <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 1 }}>{subtask.description}</Typography>}

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button size="small" variant="outlined" sx={{ textTransform: "none" }}>View Details</Button>
        </Box>
      </Box>
    </div>
  );
}
