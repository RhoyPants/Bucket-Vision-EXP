"use client";

import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Tooltip, tooltipClasses } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Box, Chip, Typography, IconButton, Stack, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";

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
import CloseIcon from "@mui/icons-material/Close";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";

import ProgressCalendarModal from "../modals/ProgressCalendarModal";
import SubtaskModal from "../modals/SubtaskModal";
import { formatBudget } from "@/app/utils/formatters";

const SourceTooltip = styled(({ className, ...props }: React.ComponentProps<typeof Tooltip>) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: "#FFFFFF",
    color: "#0F172A",
    border: "1px solid #CBD5E1",
    boxShadow: "0 10px 28px rgba(15, 23, 42, 0.16)",
    borderRadius: 8,
    padding: theme.spacing(1),
    maxWidth: 240,
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: "#FFFFFF",
    "&::before": {
      border: "1px solid #CBD5E1",
    },
  },
}));

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
  const isTaskBoardCard = showHierarchy && parentTaskId === null;

  const [adding, setAdding] = useState(false);
  const [input, setInput] = useState("");
  const [openCalendar, setOpenCalendar] = useState(false);
  const [openSubtaskModal, setOpenSubtaskModal] = useState(false);
  const [taskBoardMenuAnchor, setTaskBoardMenuAnchor] = useState<null | HTMLElement>(null);
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
    disabled: isOverlay || (showHierarchy && parentTaskId === null),
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 250ms ease",
    cursor: showHierarchy && parentTaskId === null ? "default" : isDragging ? "grabbing" : "grab",
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

  const getPriorityTheme = (priority?: string) => {
    if (priority === "High") {
      return {
        headerBg: "#FEF2F2",
        border: "#FCA5A5",
        accent: "#DC2626",
      };
    }

    if (priority === "Low") {
      return {
        headerBg: "#F0FDF4",
        border: "#86EFAC",
        accent: "#16A34A",
      };
    }

    return {
      headerBg: "#FFFBEB",
      border: "#FCD34D",
      accent: "#F59E0B",
    };
  };

  const formatCompactDate = (date?: string) => {
    if (!date) return "";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const sourceLabel = [
    subtask.project?.name || subtask.projectName,
    subtask.Scope?.name || subtask.scope?.name || subtask.scopeName,
    subtask.task?.title || subtask.taskName,
  ].filter(Boolean);
  const startDate = subtask.startDate || subtask.projectedStartDate;
  const endDate = subtask.endDate || subtask.projectedEndDate;
  const dateLabel =
    startDate || endDate
      ? `${formatCompactDate(startDate) || "Start"} - ${formatCompactDate(endDate) || "End"}`
      : "";
  const priorityTheme = getPriorityTheme(subtask.priority);

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

  const handleCancelChecklist = () => {
    setInput("");
    setAdding(false);
  };

  const handleCloseTaskBoardMenu = () => {
    setTaskBoardMenuAnchor(null);
  };

  const handleOpenProgressFromMenu = () => {
    handleCloseTaskBoardMenu();
    setOpenCalendar(true);
  };

  const handleOpenChecklistFromMenu = () => {
    handleCloseTaskBoardMenu();
    setAdding(true);
  };

  const handleToggle = async (checklistId: string) => {
    await dispatch(toggleChecklist(checklistId, isTaskBoardCard ? undefined : subtask.parentTaskId) as any);
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
            borderRadius: isTaskBoardCard ? 1 : 3,
            p: isTaskBoardCard ? 1.25 : 2,
            mb: isTaskBoardCard ? 1 : 2,
            backgroundColor: isDropTarget
              ? "#e7fbe7"
              : isDragging
                ? "#e3f2fd"
                : "#fff",
            border: isTaskBoardCard ? `1px solid ${priorityTheme.border}` : "1px solid #eee",
            boxShadow: isTaskBoardCard ? "0 1px 4px rgba(15,23,42,0.05)" : "0 2px 8px rgba(0,0,0,0.06)",
            transition: "all 0.2s ease",
            overflow: "hidden",

            "&:hover": {
              boxShadow: isTaskBoardCard
                ? "0 6px 14px rgba(15,23,42,0.08)"
                : "0 6px 16px rgba(0,0,0,0.1)",
            },

            "&:hover .hover-actions": {
              opacity: isTaskBoardCard ? 1 : 1,
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
              zIndex: 3,
              display: "flex",
              gap: 0.5,
              opacity: isTaskBoardCard ? 1 : 0,
              transition: "opacity 0.2s ease",
              backgroundColor: isTaskBoardCard ? "transparent" : "rgba(9, 4, 70, 0.8)",
              borderRadius: 1.5,
              padding: isTaskBoardCard ? 0 : 0.5,
            }}
          >
            {isTaskBoardCard ? (
              <Tooltip title="Actions" arrow>
                <IconButton
                  size="small"
                  onClick={(event) => setTaskBoardMenuAnchor(event.currentTarget)}
                  sx={{
                    width: 24,
                    height: 24,
                    background: "transparent",
                    border: "none",
                    color: "#475569",
                    boxShadow: "none",
                    p: 0,
                    "&:hover": {
                      background: "transparent",
                      color: "#0F172A",
                    },
                  }}
                >
                  <MoreVertIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            ) : (
              <>
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
              </>
            )}
          </Box>
          {/* TITLE + PRIORITY */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="flex-start"
            gap={1}
            mb={isTaskBoardCard ? 1 : 1}
            sx={{
              mx: isTaskBoardCard ? -1.25 : 0,
              mt: isTaskBoardCard ? -1.25 : 0,
              px: isTaskBoardCard ? 1.25 : 0,
              py: isTaskBoardCard ? 1 : 0,
              pr: isTaskBoardCard ? 7 : 0,
              backgroundColor: isTaskBoardCard ? priorityTheme.headerBg : "transparent",
              borderBottom: isTaskBoardCard ? `1px solid ${priorityTheme.border}` : "none",
              position: "relative",
            }}
          >
            <Typography
              fontWeight={700}
              sx={{
                fontSize: isTaskBoardCard ? 13 : "inherit",
                lineHeight: 1.25,
                wordBreak: "break-word",
              }}
            >
              {subtask.title}
            </Typography>

            {!isTaskBoardCard && (
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
            )}
          </Box>

          {/*  HIERARCHY INFO (TASKBOARD ONLY) */}
          {showHierarchy && (
            <Box
              sx={{
                mb: isTaskBoardCard ? 1 : 1.5,
                pb: isTaskBoardCard ? 1 : 1.5,
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              {isTaskBoardCard ? (
                <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="space-between">
                  <SourceTooltip
                    arrow
                    title={
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.35 }}>
                        <Typography sx={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>
                          {sourceLabel[0] || "No project"}
                        </Typography>
                        <Typography sx={{ fontSize: 11.5, color: "#334155" }}>
                          Scope: {sourceLabel[1] || "No scope"}
                        </Typography>
                        <Typography sx={{ fontSize: 11.5, color: "#334155" }}>
                          Task: {sourceLabel[2] || "No task"}
                        </Typography>
                      </Box>
                    }
                  >
                    <Chip
                      size="small"
                      icon={<AccountTreeOutlinedIcon />}
                      label="Source"
                      sx={{
                        height: 22,
                        borderRadius: 0.75,
                        bgcolor: "#EEF2FF",
                        border: "1px solid #C7D2FE",
                        color: "#3730A3",
                        fontSize: 10,
                        fontWeight: 700,
                        "& .MuiChip-icon": { fontSize: 14, color: "#4F46E5" },
                      }}
                    />
                  </SourceTooltip>

                  {dateLabel && (
                    <Typography
                      sx={{
                        fontSize: 10.5,
                        color: "#64748b",
                        fontWeight: 650,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {dateLabel}
                    </Typography>
                  )}
                </Stack>
              ) : (
                <>
                  {subtask.project && (
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        fontSize: "10px",
                        color: "#6B7280",
                        fontWeight: 700,
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
                </>
              )}
            </Box>
          )}

          {/*  DATE INFO */}
          {!isTaskBoardCard && (subtask.projectedStartDate || subtask.projectedEndDate) && (
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
            <Box
              sx={{
                mb: isTaskBoardCard ? 1 : 1.5,
                pb: isTaskBoardCard ? 1 : 1.5,
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              {!isTaskBoardCard && (
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
              )}
              <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                {subtask.assignees
                  .slice(0, isTaskBoardCard ? 2 : subtask.assignees.length)
                  .map((assignee: any, idx: number) => (
                  <Chip
                    key={idx}
                    label={assignee.user?.name || "Unknown"}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontSize: "10px",
                      height: "20px",
                      borderRadius: isTaskBoardCard ? "4px" : undefined,
                      backgroundColor: "#e3f2fd",
                      borderColor: "#0C66E4",
                      color: "#0C66E4",
                    }}
                  />
                ))}
                {isTaskBoardCard && subtask.assignees.length > 2 && (
                  <Chip
                    label={`+${subtask.assignees.length - 2}`}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontSize: "10px",
                      height: "20px",
                      borderRadius: "4px",
                      backgroundColor: "#F8FAFC",
                      borderColor: "#CBD5E1",
                      color: "#475569",
                    }}
                  />
                )}
              </Stack>
            </Box>
          )}

          {/* BUDGET INFO */}
          {!isTaskBoardCard && (
          <Stack direction="row" spacing={2} mb={1}>
            <Typography variant="caption">
              ₱{formatBudget(subtask.budgetAllocated || 0)}
            </Typography>
            <Typography variant="caption">
             {subtask.budgetPercent?.toFixed(1) || 0}%
            </Typography>
          </Stack>
          )}

          {/* PROGRESS */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
            <Typography fontSize={isTaskBoardCard ? 11 : 12} color="#475569">
              Progress
            </Typography>
            <Typography fontSize={isTaskBoardCard ? 11 : 12} fontWeight={800}>
              {subtask.progress || 0}%
            </Typography>
          </Box>

          <Box
            sx={{
              height: isTaskBoardCard ? 5 : 6,
              borderRadius: 2,
              backgroundColor: "#eee",
              overflow: "hidden",
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
          {(subtask.checklists?.length || adding) && (
          <Box mt={isTaskBoardCard ? 0.75 : 1}>
            {subtask.checklists?.map((item) => (
              <Box
                key={item.id}
                display="flex"
                alignItems="center"
                gap={0.75}
                mb={isTaskBoardCard ? 0.5 : 1}
                sx={{
                  minHeight: isTaskBoardCard ? 24 : 30,
                  px: isTaskBoardCard ? 0 : 0.25,
                }}
              >
                <input
                  type="checkbox"
                  checked={item.isCompleted}
                  onChange={() => handleToggle(item.id)}
                  style={{
                    width: isTaskBoardCard ? 14 : 16,
                    height: isTaskBoardCard ? 14 : 16,
                    margin: 0,
                    flexShrink: 0,
                  }}
                />

                <Typography
                  sx={{
                    fontSize: isTaskBoardCard ? 11 : 13,
                    flexGrow: 1,
                    textDecoration: item.isCompleted ? "line-through" : "none",
                    color: item.isCompleted ? "#64748b" : "#1f2937",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.title}
                </Typography>

                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDelete(item.id)}
                  sx={{
                    p: isTaskBoardCard ? 0.25 : 0.5,
                    ml: "auto",
                    color: "#dc2626",
                  }}
                >
                  <DeleteOutlineIcon sx={{ fontSize: isTaskBoardCard ? 16 : 18 }} />
                </IconButton>
              </Box>
            ))}
          </Box>
          )}

          {/* ADD CHECKLIST */}
          {adding && (
            <Box
              mt={isTaskBoardCard ? 0.75 : 1}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Checklist item..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddChecklist();
                  }
                  if (e.key === "Escape") {
                    handleCancelChecklist();
                  }
                }}
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: isTaskBoardCard ? 30 : 34,
                  padding: "0 10px",
                  borderRadius: isTaskBoardCard ? 4 : 6,
                  border: "1px solid #CBD5E1",
                  outline: "none",
                  fontSize: isTaskBoardCard ? 12 : 13,
                  color: "#0f172a",
                  background: "#fff",
                }}
              />

              <Tooltip title="Add item" arrow>
                <span>
                  <IconButton
                    onClick={handleAddChecklist}
                    size="small"
                    disabled={!input.trim()}
                    sx={{
                      width: isTaskBoardCard ? 30 : 34,
                      height: isTaskBoardCard ? 30 : 34,
                      backgroundColor: "#E0F2FE",
                      border: "1px solid #BAE6FD",
                      color: "#0369A1",
                      "&:hover": {
                        backgroundColor: "#BAE6FD",
                      },
                      "&.Mui-disabled": {
                        backgroundColor: "#F1F5F9",
                        borderColor: "#E2E8F0",
                        color: "#CBD5E1",
                      },
                    }}
                  >
                    <AddIcon sx={{ fontSize: isTaskBoardCard ? 17 : 19 }} />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title="Cancel" arrow>
                <IconButton
                  onClick={handleCancelChecklist}
                  size="small"
                  sx={{
                    width: isTaskBoardCard ? 30 : 34,
                    height: isTaskBoardCard ? 30 : 34,
                    backgroundColor: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    color: "#64748B",
                    "&:hover": {
                      backgroundColor: "#E2E8F0",
                    },
                  }}
                >
                  <CloseIcon sx={{ fontSize: isTaskBoardCard ? 16 : 18 }} />
                </IconButton>
              </Tooltip>
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

      {isTaskBoardCard && (
        <Menu
          anchorEl={taskBoardMenuAnchor}
          open={Boolean(taskBoardMenuAnchor)}
          onClose={handleCloseTaskBoardMenu}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{
            paper: {
              sx: {
                mt: 0.75,
                borderRadius: 1,
                minWidth: 170,
                border: "1px solid #E2E8F0",
                boxShadow: "0 12px 28px rgba(15, 23, 42, 0.16)",
              },
            },
          }}
        >
          <MenuItem onClick={handleOpenProgressFromMenu} sx={{ fontSize: 13, gap: 1 }}>
            <ListItemIcon sx={{ minWidth: "28px !important" }}>
              <EventIcon sx={{ fontSize: 18, color: "#475569" }} />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: 13, fontWeight: 650 }}>
              Add progress
            </ListItemText>
          </MenuItem>
          <MenuItem onClick={handleOpenChecklistFromMenu} sx={{ fontSize: 13, gap: 1 }}>
            <ListItemIcon sx={{ minWidth: "28px !important" }}>
              <ChecklistIcon sx={{ fontSize: 18, color: "#475569" }} />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: 13, fontWeight: 650 }}>
              Add checklist
            </ListItemText>
          </MenuItem>
        </Menu>
      )}

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
