import { useState, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Checkbox,
  CircularProgress,
  Alert,
  LinearProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ClearIcon from "@mui/icons-material/Clear";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

interface ChecklistFormProps {
  subtaskId: string;
  checklists: any[];
  onAddChecklist: (subtaskId: string, title: string) => Promise<void>;
  onDeleteChecklist: (checklistId: string) => Promise<void>;
  onToggleChecklist: (checklistId: string) => Promise<void>;
  onEditChecklist?: (checklistId: string, title: string) => Promise<void>;
  onMoveChecklist?: (checklistId: string, newOrder: number) => Promise<void>;
  disabled?: boolean;
}

export default function ChecklistForm({
  subtaskId,
  checklists = [],
  onAddChecklist,
  onDeleteChecklist,
  onToggleChecklist,
  onEditChecklist,
  onMoveChecklist,
  disabled = false,
}: ChecklistFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [addingChecklistId, setAddingChecklistId] = useState<string | null>(null);
  const [deletingChecklistId, setDeletingChecklistId] = useState<string | null>(null);
  const [togglingChecklistId, setTogglingChecklistId] = useState<string | null>(null);
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [savingEditId, setSavingEditId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Drag state
  const dragItemId = useRef<string | null>(null);
  const dragOverItemId = useRef<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Sort by order field
  const sorted = [...checklists].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const handleAddChecklist = async () => {
    if (!newChecklistTitle.trim()) {
      setError("Checklist item cannot be empty");
      return;
    }
    setAddingChecklistId(subtaskId);
    setError("");
    try {
      await onAddChecklist(subtaskId, newChecklistTitle);
      setNewChecklistTitle("");
      setIsAdding(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add checklist item");
    } finally {
      setAddingChecklistId(null);
    }
  };

  const handleToggleChecklist = async (checklistId: string) => {
    setTogglingChecklistId(checklistId);
    setError("");
    try {
      await onToggleChecklist(checklistId);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to toggle checklist item");
    } finally {
      setTogglingChecklistId(null);
    }
  };

  const handleDeleteChecklist = async (checklistId: string) => {
    setDeletingChecklistId(checklistId);
    setError("");
    try {
      await onDeleteChecklist(checklistId);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete checklist item");
    } finally {
      setDeletingChecklistId(null);
    }
  };

  const startEditing = (item: any) => {
    setEditingChecklistId(item.id);
    setEditTitle(item.title);
    setError("");
  };

  const cancelEditing = () => {
    setEditingChecklistId(null);
    setEditTitle("");
  };

  const handleSaveEdit = async (checklistId: string) => {
    if (!editTitle.trim()) {
      setError("Title cannot be empty");
      return;
    }
    setSavingEditId(checklistId);
    setError("");
    try {
      if (onEditChecklist) await onEditChecklist(checklistId, editTitle.trim());
      setEditingChecklistId(null);
      setEditTitle("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update checklist item");
    } finally {
      setSavingEditId(null);
    }
  };

  // ── Drag handlers ────────────────────────────────────────
  const handleDragStart = (id: string) => {
    dragItemId.current = id;
    setDraggingId(id);
  };

  const handleDragEnter = (id: string) => {
    dragOverItemId.current = id;
    setDragOverId(id);
  };

  const handleDragEnd = async () => {
    const fromId = dragItemId.current;
    const toId = dragOverItemId.current;
    setDraggingId(null);
    setDragOverId(null);
    dragItemId.current = null;
    dragOverItemId.current = null;

    if (!fromId || !toId || fromId === toId) return;

    const targetItem = sorted.find((c) => c.id === toId);
    if (!targetItem || !onMoveChecklist) return;

    try {
      await onMoveChecklist(fromId, targetItem.order ?? 0);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reorder checklist");
    }
  };

  const completedCount = checklists.filter((c) => c.isCompleted).length;
  const totalCount = checklists.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.75}>
        <Typography variant="caption" fontWeight={600} color="#6366f1">
          Checklist
        </Typography>
        {totalCount > 0 && (
          <Typography variant="caption" color="#6b7280" fontWeight={500}>
            {completedCount}/{totalCount}
          </Typography>
        )}
      </Box>

      {/* Progress bar */}
      {totalCount > 0 && (
        <LinearProgress
          variant="determinate"
          value={progressPercent}
          sx={{
            mb: 1,
            height: 4,
            borderRadius: 2,
            backgroundColor: "#e5e7eb",
            "& .MuiLinearProgress-bar": {
              backgroundColor: progressPercent === 100 ? "#22c55e" : "#6366f1",
              borderRadius: 2,
            },
          }}
        />
      )}

      {error && (
        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 1, fontSize: "0.75rem" }}>
          {error}
        </Alert>
      )}

      {/* List */}
      {sorted.length > 0 && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
            mb: 1,
            p: 0.75,
            backgroundColor: "#fafbff",
            borderRadius: 1,
            border: "1px solid #e5e7eb",
          }}
        >
          {sorted.map((item) => (
            <Box
              key={item.id}
              draggable={!disabled && !editingChecklistId && !!onMoveChecklist}
              onDragStart={() => handleDragStart(item.id)}
              onDragEnter={() => handleDragEnter(item.id)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              display="flex"
              alignItems="center"
              gap={0.5}
              sx={{
                opacity: draggingId === item.id ? 0.4 : togglingChecklistId === item.id ? 0.6 : 1,
                transition: "opacity 0.2s",
                borderRadius: 0.75,
                border: dragOverId === item.id && draggingId !== item.id
                  ? "1px dashed #6366f1"
                  : "1px solid transparent",
                px: 0.25,
                "&:hover .cl-handle": { opacity: 1 },
                "&:hover .cl-actions": { opacity: 1 },
                cursor: draggingId ? "grabbing" : "default",
              }}
            >
              {/* Drag handle — hover only */}
              {onMoveChecklist && (
                <Box
                  className="cl-handle"
                  sx={{
                    opacity: 0,
                    transition: "opacity 0.15s",
                    color: "#9ca3af",
                    cursor: "grab",
                    display: "flex",
                    alignItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <DragIndicatorIcon sx={{ fontSize: 14 }} />
                </Box>
              )}

              <Checkbox
                size="small"
                checked={item.isCompleted || false}
                onChange={() => handleToggleChecklist(item.id)}
                disabled={
                  disabled ||
                  togglingChecklistId === item.id ||
                  deletingChecklistId === item.id ||
                  editingChecklistId === item.id
                }
                sx={{ p: 0.25, flexShrink: 0 }}
              />

              {/* Title or inline edit */}
              {editingChecklistId === item.id ? (
                <TextField
                  size="small"
                  value={editTitle}
                  onChange={(e) => { setEditTitle(e.target.value); setError(""); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit(item.id);
                    if (e.key === "Escape") cancelEditing();
                  }}
                  disabled={savingEditId === item.id || disabled}
                  autoFocus
                  fullWidth
                  sx={{ "& .MuiOutlinedInput-root": { fontSize: "0.8rem" } }}
                />
              ) : (
                <Typography
                  variant="caption"
                  sx={{
                    flex: 1,
                    textDecoration: item.isCompleted ? "line-through" : "none",
                    opacity: item.isCompleted ? 0.55 : 1,
                    wordBreak: "break-word",
                  }}
                >
                  {item.title}
                </Typography>
              )}

              {/* Actions — hover only, pin when editing */}
              <Box
                className="cl-actions"
                display="flex"
                gap={0.25}
                sx={{
                  opacity: editingChecklistId === item.id ? 1 : 0,
                  transition: "opacity 0.15s ease",
                  flexShrink: 0,
                }}
              >
                {editingChecklistId === item.id ? (
                  <>
                    <IconButton
                      size="small"
                      onClick={() => handleSaveEdit(item.id)}
                      disabled={savingEditId === item.id || disabled}
                      sx={{ color: "#10b981", p: 0.25, "&:hover": { backgroundColor: "#f0fdf4" } }}
                    >
                      {savingEditId === item.id ? <CircularProgress size={13} /> : <CheckIcon sx={{ fontSize: 14 }} />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={cancelEditing}
                      disabled={savingEditId === item.id || disabled}
                      sx={{ color: "#6b7280", p: 0.25 }}
                    >
                      <ClearIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </>
                ) : (
                  <>
                    <IconButton
                      size="small"
                      onClick={() => startEditing(item)}
                      disabled={disabled || !!deletingChecklistId}
                      sx={{ color: "#6366f1", p: 0.25, "&:hover": { backgroundColor: "#eef2ff" } }}
                    >
                      <EditIcon sx={{ fontSize: 13 }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteChecklist(item.id)}
                      disabled={disabled || deletingChecklistId === item.id}
                      sx={{ color: "#ef4444", p: 0.25, "&:hover": { backgroundColor: "#fef2f2" } }}
                    >
                      {deletingChecklistId === item.id ? (
                        <CircularProgress size={13} />
                      ) : (
                        <DeleteOutlineIcon sx={{ fontSize: 13 }} />
                      )}
                    </IconButton>
                  </>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Add row */}
      {isAdding ? (
        <Box
          display="flex"
          gap={0.5}
          mb={1}
          sx={{
            p: 0.75,
            backgroundColor: "#f0f4ff",
            borderRadius: 1,
            border: "1px solid #c7d2fe",
          }}
        >
          <TextField
            size="small"
            placeholder="Add checklist item..."
            value={newChecklistTitle}
            onChange={(e) => { setNewChecklistTitle(e.target.value); setError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleAddChecklist(); }}
            disabled={addingChecklistId !== null || disabled}
            fullWidth
            autoFocus
            sx={{ "& .MuiOutlinedInput-root": { fontSize: "0.875rem" } }}
          />
          <IconButton
            size="small"
            onClick={handleAddChecklist}
            disabled={addingChecklistId !== null || disabled}
            sx={{ color: "#10b981", "&:hover": { backgroundColor: "#f0fdf4" } }}
          >
            {addingChecklistId ? <CircularProgress size={18} /> : <CheckIcon fontSize="small" />}
          </IconButton>
          <IconButton
            size="small"
            onClick={() => { setIsAdding(false); setNewChecklistTitle(""); setError(""); }}
            disabled={addingChecklistId !== null || disabled}
            sx={{ color: "#6b7280" }}
          >
            <ClearIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : (
        <Box
          onClick={() => !disabled && setIsAdding(true)}
          sx={{
            p: 0.75,
            borderRadius: 1,
            border: "1px dashed #d1d5db",
            backgroundColor: "#f9fafb",
            cursor: disabled ? "default" : "pointer",
            opacity: disabled ? 0.5 : 1,
            transition: "all 0.2s",
            textAlign: "center",
            "&:hover": disabled ? {} : { borderColor: "#6366f1", backgroundColor: "#f0f4ff" },
          }}
        >
          <Typography
            variant="caption"
            fontWeight={500}
            color={disabled ? "#9ca3af" : "#6366f1"}
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={0.5}
          >
            <AddIcon sx={{ fontSize: "0.875rem" }} />
            Add Item
          </Typography>
        </Box>
      )}
    </Box>
  );
}
