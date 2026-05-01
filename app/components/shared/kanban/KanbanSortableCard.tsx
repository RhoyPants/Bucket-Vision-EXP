"use client";

import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Tooltip } from "@mui/material";
import { Box, Chip, Typography, IconButton, Stack } from "@mui/material";

import { useAppDispatch } from "@/app/redux/hook";
import type { KanbanSubtask } from "@/app/redux/slices/kanbanSlice";

import {
  addChecklist,
  deleteChecklist,
  toggleChecklist,
  deleteSubtask,
} from "@/app/redux/controllers/subTaskController";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ChecklistIcon from "@mui/icons-material/Checklist";
import EventIcon from "@mui/icons-material/Event";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AddIcon from "@mui/icons-material/Add";

import ProgressCalendarModal from "../modals/ProgressCalendarModal";
import SubtaskModal from "../modals/SubtaskModal";

export default function KanbanSortableCard({
  subtask,
  isOverlay = false,
  isDropTarget = false,
  parentTaskId,
  taskBudget = 0,
  projectId = "",
  onProgressSuccess,
  showHierarchy = false,
}: {
  subtask: KanbanSubtask & {
    project?: { id: string; name: string };
    Scope?: { id: string; name: string };
    task?: { id: string; title: string };
  };
  isOverlay?: boolean;
  isDropTarget?: boolean;
  parentTaskId?: string | null;
  taskBudget?: number;
  projectId?: string;
  onProgressSuccess?: () => void;
  showHierarchy?: boolean;
}) {
  const dispatch = useAppDispatch();

  const [adding, setAdding] = useState(false);
  const [input, setInput] = useState("");
  const [openCalendar, setOpenCalendar] = useState(false);
  const [openSubtaskModal, setOpenSubtaskModal] = useState(false);
  const [subtaskModalMode, setSubtaskModalMode] = useState<"create" | "view" | "edit">("view");

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
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 250ms ease",
    cursor: isDragging ? "grabbing" : "grab",
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDeleteSubtask = async () => {
    if (!confirm("Delete this subtask?")) return;
    await dispatch(deleteSubtask(subtask.id, subtask.parentTaskId) as any);
  };

  const getProgressColor = (progress?: number) => {
    if (!progress || progress === 0) return "#9e9e9e";
    if (progress < 50) return "#f59e0b";
    if (progress < 100) return "#3b82f6";
    return "#22c55e";
  };

  const handleAddChecklist = async () => {
    if (!input.trim()) return;

    await dispatch(
      addChecklist({
        subtaskId: subtask.id,
        title: input,
      }) as any,
    );

    setInput("");
    setAdding(false);
  };

  const handleToggle = async (checklistId: string) => {
    await dispatch(toggleChecklist(checklistId, subtask.parentTaskId) as any);
  };

  const handleDelete = async (id: string) => {
    await dispatch(deleteChecklist(id) as any);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...(!isOverlay ? attributes : {})}
        {...(!isOverlay ? listeners : {})}
      >
        <Box
          sx={{
            position: "relative",
            borderRadius: 3,
            p: 2,
            mb: 2,
            backgroundColor: isDropTarget
              ? "#e7fbe7"
              : isDragging
                ? "#e3f2fd"
                : "#fff",
            border: "1px solid #eee",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            transition: "all 0.2s ease",

            "&:hover": {
              boxShadow: "0 6px 16px rgba(0,0,0,0.1)",
            },

            "&:hover .hover-actions": {
              opacity: 1,
            },
          }}
        >

          {/*HOVER ACTIONS */}
          <Box
            className="hover-actions"
            sx={{
              position: "absolute",
              top: 6,
              right: 6,
              display: "flex",
              gap: 0.5,
              opacity: 0,
              transition: "opacity 0.2s ease",
              backgroundColor: "rgba(9, 4, 70, 0.8)",
              borderRadius: 2,
              padding: 0.5,
            }}
          >
            <Tooltip title="View Details" arrow>
              <IconButton
                size="small"
                onClick={() => setOpenSubtaskModal(true)}
                sx={{
                  background: "#fff",
                  border: "1px solid #0C66E4",
                  color: "#0C66E4",
                  "&:hover": { background: "#e3f2fd" },
                }}
              >
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Add Progress" arrow>
              <IconButton
                size="small"
                onClick={() => setOpenCalendar(true)}
                sx={{
                  background: "#fff",
                  border: "1px solid #eee",
                  "&:hover": { background: "#f5f5f5" },
                }}
              >
                <EventIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Checklist" arrow>
              <IconButton
                size="small"
                onClick={() => setAdding(true)}
                sx={{
                  background: "#fff",
                  border: "1px solid #eee",
                  "&:hover": { background: "#f5f5f5" },
                }}
              >
                <ChecklistIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Delete Subtask" arrow>
              <IconButton
                size="small"
                color="error"
                onClick={handleDeleteSubtask}
                sx={{
                  background: "#fff",
                  border: "1px solid #eee",
                  "&:hover": { background: "#fdecea" },
                }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          {/* TITLE + PRIORITY */}
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography fontWeight={600}>{subtask.title}</Typography>

            <Chip
              label={subtask.priority || "Medium"}
              size="small"
              sx={{
                bgcolor:
                  subtask.priority === "High"
                    ? "#ef4444"
                    : subtask.priority === "Medium"
                      ? "#f59e0b"
                      : "#22c55e",
                color: "#fff",
                fontWeight: 600,
              }}
            />
          </Box>

          {/*  HIERARCHY INFO (TASKBOARD ONLY) */}
          {showHierarchy && (
            <Box sx={{ mb: 1.5, pb: 1.5, borderBottom: "1px solid #e5e7eb" }}>
              {subtask.project && (
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    fontSize: "10px",
                    color: "#6B7280",
                    fontWeight: 600,
                    mb: 0.3,
                  }}
                >
                  {subtask.project.name}
                </Typography>
              )}

              {subtask.Scope && (
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    fontSize: "10px",
                    color: "#6B7280",
                    fontWeight: 600,
                    mb: 0.3,
                  }}
                >
                  {subtask.Scope.name}
                </Typography>
              )}

              {subtask.task && (
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    fontSize: "10px",
                    color: "#6B7280",
                    fontWeight: 600,
                  }}
                >
                  {subtask.task.title}
                </Typography>
              )}
            </Box>
          )}

          {/*  DATE INFO */}
          {(subtask.projectedStartDate || subtask.projectedEndDate) && (
            <Box sx={{ mb: 1.5, pb: 1.5, borderBottom: "1px solid #e5e7eb" }}>
              {subtask.projectedStartDate && (
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    fontSize: "11px",
                    color: "#374151",
                    mb: 0.3,
                  }}
                >
                  Start: <b>{new Date(subtask.projectedStartDate).toLocaleDateString()}</b>
                </Typography>
              )}
              {subtask.projectedEndDate && (
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    fontSize: "11px",
                    color: "#374151",
                  }}
                >
                  End: <b>{new Date(subtask.projectedEndDate).toLocaleDateString()}</b>
                </Typography>
              )}
            </Box>
          )}

          {/* ASSIGNEES */}
          {(subtask.assignees && subtask.assignees.length > 0) && (
            <Box sx={{ mb: 1.5, pb: 1.5, borderBottom: "1px solid #e5e7eb" }}>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  fontSize: "11px",
                  color: "#374151",
                  fontWeight: 600,
                  mb: 0.5,
                }}
              >
                Assigned:
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                {subtask.assignees.map((assignee: any, idx: number) => (
                  <Chip
                    key={idx}
                    label={assignee.user?.name || "Unknown"}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontSize: "10px",
                      height: "20px",
                      backgroundColor: "#e3f2fd",
                      borderColor: "#0C66E4",
                      color: "#0C66E4",
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {/* BUDGET INFO */}
          <Stack direction="row" spacing={2} mb={1}>
            <Typography variant="caption">
              {subtask.budgetAllocated || 0}
            </Typography>
            <Typography variant="caption">
             {subtask.budgetPercent?.toFixed(1) || 0}%
            </Typography>
          </Stack>

          {/* PROGRESS */}
          <Typography fontSize={12}>
            Progress: <b>{subtask.progress || 0}%</b>
          </Typography>

          <Box
            sx={{
              height: 6,
              borderRadius: 2,
              backgroundColor: "#eee",
              overflow: "hidden",
              mt: 0.5,
            }}
          >
            <Box
              sx={{
                width: `${subtask.progress || 0}%`,
                height: "100%",
                backgroundColor: getProgressColor(subtask.progress),
                transition: "width 0.3s ease",
              }}
            />
          </Box>

          {/* CHECKLIST */}
          <Box mt={1}>
            {subtask.checklists?.map((item) => (
              <Box
                key={item.id}
                display="flex"
                alignItems="center"
                gap={1}
                mb={1}
              >
                <input
                  type="checkbox"
                  checked={item.isCompleted}
                  onChange={() => handleToggle(item.id)}
                />

                <Typography
                  sx={{
                    fontSize: 13,
                    flexGrow: 1,
                    textDecoration: item.isCompleted ? "line-through" : "none",
                  }}
                >
                  {item.title}
                </Typography>

                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDelete(item.id)}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>

          {/* ADD CHECKLIST */}
          {adding && (
            <Box mt={1}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Checklist item..."
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  outline: "none",
                  fontSize: 13,
                }}
              />

              <Stack direction="row" spacing={1} mt={1}>
                <Tooltip title="Add item" arrow>
                  <IconButton
                    onClick={handleAddChecklist}
                    size="small"
                    sx={{
                      backgroundColor: "#e3f2fd",
                      border: "1px solid #bbdefb",
                      "&:hover": {
                        backgroundColor: "#bbdefb",
                      },
                    }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Cancel" arrow>
                  <IconButton
                    onClick={() => setAdding(false)}
                    size="small"
                    sx={{
                      backgroundColor: "#f5f5f5",
                      border: "1px solid #ddd",
                      "&:hover": {
                        backgroundColor: "#e0e0e0",
                      },
                    }}
                  >
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
          )}
        </Box>
      </div>

      <ProgressCalendarModal
        open={openCalendar}
        onClose={() => setOpenCalendar(false)}
        subtaskId={subtask.id}
        isTaskBoard={parentTaskId === null}
        onSuccess={() => {
          onProgressSuccess?.();
          setOpenCalendar(false);
        }}
      />

      <SubtaskModal
        open={openSubtaskModal}
        onClose={() => setOpenSubtaskModal(false)}
        mode="view"
        subtask={
          {
            id: subtask.id,
            taskId: subtask.parentTaskId || "",
            title: subtask.title,
            description: subtask.description,
            priority: subtask.priority,
            projectedStartDate: subtask.projectedStartDate,
            projectedEndDate: subtask.projectedEndDate,
            budgetAllocated: subtask.budgetAllocated,
            budgetPercent: subtask.budgetPercent,
            remarks: subtask.remarks,
            userIds: subtask.userIds || [],
            assignees: subtask.assignees || [], //IMPORTANT: Pass assignees with user data
          } as any
        }
        taskBudget={taskBudget}
        projectId={projectId}
      />
    </>
  );
}
