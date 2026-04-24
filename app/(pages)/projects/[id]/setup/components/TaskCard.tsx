"use client";

import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import {
  validateTaskForm,
  calculateBudgetPercent,
  getFieldError,
  hasFieldError,
  ValidationError,
} from "@/app/utils/taskValidation";
import SubtaskList from "./SubtaskList";

interface TaskCardProps {
  task: any;
  categoryBudget: number;
  subtaskInputs: Record<string, any>;
  setSubtaskInputs: (inputs: any) => void;
  members: any[];
  projectId?: string;
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: any) => void;
  onUpdateSubtask: (subId: string, taskId: string) => void;
  onDeleteSubtask: (subId: string, taskId: string) => void;
  onEditSubtask: (sub: any, taskId: string) => void;
  onAddSubtask: (taskId: string) => void;
}

export default function TaskCard({
  task,
  categoryBudget,
  subtaskInputs,
  setSubtaskInputs,
  members,
  projectId,
  onDeleteTask,
  onUpdateTask,
  onUpdateSubtask,
  onDeleteSubtask,
  onEditSubtask,
  onAddSubtask,
}: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: task.title,
    budgetAllocated: task.budgetAllocated,
  });
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const handleEditStart = () => {
    setEditForm({
      title: task.title,
      budgetAllocated: task.budgetAllocated,
    });
    setErrors([]);
    setTouched({});
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  const handleEditChange = (field: string, value: any) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditBlur = (field: string) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  const handleEditSubmit = async () => {
    const validation = validateTaskForm(editForm, categoryBudget);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setSaving(true);
    try {
      onUpdateTask(task.id, editForm);
      setIsEditing(false);
      setErrors([]);
      setTouched({});
    } finally {
      setSaving(false);
    }
  };

  const budgetPercent = calculateBudgetPercent(task.budgetAllocated, categoryBudget);
  const titleError = touched["title"] && getFieldError("title", errors);
  const budgetError = touched["budgetAllocated"] && getFieldError("budgetAllocated", errors);

  return (
    <>
      <Box
        sx={{
          backgroundColor: "#f0f9ff",
          p: 2,
          mt: 1.5,
          border: "2px solid #0ea5e9",
          borderRadius: 1,
          position: "relative",
          transition: "all 0.2s ease",
          "&:hover": {
            boxShadow: "0 2px 8px rgba(6, 182, 212, 0.15)",
            "& .task-actions": { opacity: 1 },
          },
        }}
      >
        {isEditing ? (
          // EDIT MODE
          <Box display="flex" gap={1} alignItems="flex-start" flexWrap="wrap">
            <Tooltip title={titleError || ""} open={!!titleError}>
              <TextField
                size="small"
                label="Task"
                value={editForm.title}
                onChange={(e) => handleEditChange("title", e.target.value)}
                onBlur={() => handleEditBlur("title")}
                error={!!titleError}
                sx={{ flex: "0 1 140px" }}
                disabled={saving}
              />
            </Tooltip>

            <Tooltip title={budgetError || ""} open={!!budgetError}>
              <TextField
                size="small"
                label="Budget"
                type="number"
                inputProps={{ step: "0.01" }}
                value={editForm.budgetAllocated}
                onChange={(e) => handleEditChange("budgetAllocated", parseFloat(e.target.value) || 0)}
                onBlur={() => handleEditBlur("budgetAllocated")}
                error={!!budgetError}
                sx={{ flex: "0 1 90px" }}
                disabled={saving}
              />
            </Tooltip>

            <Box display="flex" gap={0.5}>
              <IconButton
                size="small"
                onClick={handleEditSubmit}
                disabled={saving}
                sx={{ color: "#10b981" }}
              >
                {saving ? <CircularProgress size={20} /> : <SaveIcon fontSize="small" />}
              </IconButton>
              <IconButton
                size="small"
                onClick={handleEditCancel}
                disabled={saving}
                sx={{ color: "#6b7280" }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        ) : (
          // DISPLAY MODE
          <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
            <Box flex={1} minWidth={0}>
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#0369a1" }}>
                  {task.title}
                </Typography>
              </Box>
              <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                <Typography variant="caption" sx={{ color: "#0c4a6e", fontWeight: 500 }}>
                  ₱{task.budgetAllocated?.toLocaleString()}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    backgroundColor: "#0ea5e9",
                    color: "#fff",
                    px: 1,
                    py: 0.25,
                    borderRadius: 0.5,
                    fontWeight: 600,
                  }}
                >
                  {budgetPercent.toFixed(1)}%
                </Typography>
              </Box>
            </Box>

            <Box
              className="task-actions"
              sx={{
                display: "flex",
                gap: 0.5,
                opacity: { xs: 1, sm: 0 },
                transition: "opacity 0.2s ease",
              }}
            >
              <IconButton
                size="small"
                onClick={handleEditStart}
                sx={{
                  color: "#0369a1",
                  "&:hover": { backgroundColor: "#e0f2fe" },
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => onDeleteTask(task.id)}
                sx={{
                  color: "#ef4444",
                  "&:hover": { backgroundColor: "#fef2f2" },
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        )}

        {/* SUBTASK SECTION */}
        {!isEditing && (
          <SubtaskList
            task={task}
            subtaskInputs={subtaskInputs}
            setSubtaskInputs={setSubtaskInputs}
            members={members}
            projectId={projectId}
            onUpdateSubtask={onUpdateSubtask}
            onDeleteSubtask={onDeleteSubtask}
            onEditSubtask={onEditSubtask}
            onAddSubtask={onAddSubtask}
          />
        )}
      </Box>
    </>
  );
}
