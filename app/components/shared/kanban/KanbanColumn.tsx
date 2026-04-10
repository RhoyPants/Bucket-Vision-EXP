"use client";

import React, { useState } from "react";
import { Box, Typography, TextField, Button } from "@mui/material";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import KanbanSortableCard from "./KanbanSortableCard";
import type { KanbanSubtask } from "@/app/redux/slices/kanbanSlice";

import { useAppDispatch } from "@/app/redux/hook";
import { createSubtask } from "@/app/redux/controllers/subTaskController";

export default function KanbanColumn({
  id,
  title,
  items,
  activeId,
  onViewDetails,
  loading,
  parentTaskId, // 🔥 ADD THIS
}: {
  id: string;
  title: string;
  items: KanbanSubtask[];
  activeId: string | null;
  onViewDetails: (subtask: KanbanSubtask) => void;
  loading: Boolean;
  parentTaskId: string;
}) {
  const dispatch = useAppDispatch();

  const { setNodeRef, isOver } = useDroppable({
    id: `column-${id}`,
  });

  // 🔥 LOCAL STATE
  const [adding, setAdding] = useState(false);
  const [titleInput, setTitleInput] = useState("");

  // 🔥 CREATE HANDLER
  const handleCreate = async () => {
    if (!titleInput.trim()) return;

    try {
      await dispatch(
        createSubtask({
          title: titleInput,
          taskId: parentTaskId,
          statusId: id, // 🔥 COLUMN ID
        })
      );

      setTitleInput("");
      setAdding(false);
    } catch (err) {
      console.error(err);
    }
  };

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
        border: isOver ? "2px dashed #1976d2" : "2px solid transparent",
        boxShadow: isOver
          ? "0 0 8px rgba(25, 118, 210, 0.4)"
          : "inset 0 1px 0 rgba(0,0,0,0.02)",
      }}
    >
      {/* COLUMN TITLE */}
      <Typography sx={{ fontWeight: 700, mb: 1 }}>
        {title} ({items.length})
      </Typography>

      {/* CARDS */}
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

      {/* 🔥 ADD CARD UI */}
      <Box sx={{ mt: 1 }}>
        {!adding ? (
          <Button
            fullWidth
            size="small"
            onClick={() => setAdding(true)}
            sx={{ textTransform: "none" }}
          >
            + Add Card
          </Button>
        ) : (
          <Box>
            <TextField
              fullWidth
              size="small"
              placeholder="Enter subtask..."
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
              autoFocus
            />

            <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
              <Button size="small" variant="contained" onClick={handleCreate}>
                Add
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setAdding(false);
                  setTitleInput("");
                }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}