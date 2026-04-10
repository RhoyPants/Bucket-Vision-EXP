
"use client";

import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Box,
  Chip,
  Avatar,
  Typography,
  Button,
  IconButton,
  Slider,
} from "@mui/material";
import { useAppDispatch } from "@/app/redux/hook";
import type { KanbanSubtask } from "@/app/redux/slices/kanbanSlice";
import {
  addChecklist,
  deleteChecklist,
  toggleChecklist,
  loadKanbanByTask,
  deleteSubtask,
} from "@/app/redux/controllers/subTaskController";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

export default function KanbanSortableCard({
  subtask,
  isOverlay = false,
  isDropTarget = false,
  onViewDetails,
}: {
  subtask: KanbanSubtask;
  isOverlay?: boolean;
  isDropTarget?: boolean;
  onViewDetails?: (subtask: KanbanSubtask) => void;
}) {
  const dispatch = useAppDispatch();
  const [adding, setAdding] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({});

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

  const handleDeleteSubtask = async () => {
    if (!confirm("Delete this subtask?")) return;

    await dispatch(deleteSubtask(subtask.id) as any);

    // 🔥 reload kanban to reflect removal
    await dispatch(loadKanbanByTask(subtask.parentTaskId) as any);
  };
  const [value, setValue] = useState(0);

  const getProgressColor = (progress?: number) => {
    if (!progress || progress === 0) return "#9e9e9e";
    if (progress < 50) return "#f59e0b";
    if (progress < 100) return "#3b82f6";
    return "#22c55e";
  };

  // ✅ ADD CHECKLIST
  const handleAddChecklist = async () => {
    if (!input.trim()) return;

    await dispatch(
      addChecklist({
        subtaskId: subtask.id,
        title: input,
      }) as any,
    );

    // reload
    await dispatch(loadKanbanByTask(subtask.parentTaskId) as any);

    setInput("");
    setAdding(false);
  };

  // ✅ FIXED: TOGGLE CHECKLIST (2 params)
  const handleToggle = async (checklistId: string) => {
    await dispatch(toggleChecklist(checklistId, subtask.parentTaskId) as any);
  };

  // ✅ DELETE CHECKLIST
  const handleDelete = async (id: string) => {
    await dispatch(deleteChecklist(id) as any);

    // reload
    await dispatch(loadKanbanByTask(subtask.parentTaskId) as any);
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

        {/* Progress Bar */}
        <Box
          sx={{
            height: 6,
            borderRadius: 2,
            backgroundColor: "#eee",
            overflow: "hidden",
            mb: 1,
          }}
        >
          <Box
            sx={{
              width: `${subtask.progress || 0}%`,
              height: "100%",
              backgroundColor: getProgressColor(subtask.progress),
              transition: "0.3s ease",
            }}
          />
        </Box>

        {/* Assignee */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Avatar sx={{ width: 28, height: 28 }}>
            {subtask.assignee ? subtask.assignee[0] : "—"}
          </Avatar>

          <Typography sx={{ fontSize: 13 }}>
            {subtask.assignee || "Unassigned"}
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
        {/* CHECKLIST */}

        <Box sx={{ mt: 1 }}>
          {subtask.checklists?.map((item) => (
            <Box
              key={item.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 0.5,
                "&:hover .delete-btn": {
                  opacity: 1,
                },
              }}
            >
              <input
                type="checkbox"
                checked={item.isCompleted}
                onChange={() => handleToggle(item.id)}
              />
              <Typography
                sx={{
                  fontSize: 13,
                  textDecoration: item.isCompleted ? "line-through" : "none",
                  flexGrow: 1,
                }}
              >
                {item.title}
              </Typography>
              <Box
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  width: 120,
                }}
              >
                <Slider
                  size="small"
                  value={value}
                  onChange={(_, val) =>
                    setSliderValues((prev) => ({
                      ...prev,
                      [item.id]: val as number,
                    }))
                  }
                />

                <Typography sx={{ fontSize: 11, minWidth: 30 }}>
                  {value}%
                </Typography>
              </Box>

              <IconButton
                className="delete-btn"
                size="small"
                sx={{
                  opacity: 0,
                  transition: "opacity 0.2s",
                  color: "error.main",
                }}
                onClick={() => handleDelete(item.id)}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
          {/* ADD */}
          {adding ? (
            <Box sx={{ mt: 1 }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Checklist item..."
                style={{ width: "100%", padding: 6 }}
              />

              <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleAddChecklist}
                >
                  Add
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setAdding(false);
                    setInput("");
                  }}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          ) : (
            ""
          )}
        </Box>

        {/* Actions */}
        {!adding && (
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Button
              size="small"
              variant="outlined"
              sx={{ textTransform: "none" }}
              onClick={() => onViewDetails?.(subtask)}
            >
              View Details
            </Button>

            <Button
              size="small"
              onClick={() => {
                setAdding(true);
              }}
              sx={{ textTransform: "none" }}
            >
              {adding ? "Editing..." : "Add Checklist"}
            </Button>
            <Button
              size="small"
              color="error"
              sx={{ textTransform: "none" }}
              onClick={handleDeleteSubtask}
            >
              Delete
            </Button>
          </Box>
        )}
      </Box>
    </div>
  );
}
