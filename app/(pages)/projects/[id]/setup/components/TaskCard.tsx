"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
  MenuItem,
  Chip,
} from "@mui/material";
import DecimalBudgetField from "@/app/components/shared/DecimalBudgetField";
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
import { getTasksForScope, MaintenanceRecord } from "@/app/api-service/workBreakdownMaintenanceService";

interface TaskCardProps {
  task: any;
  orderLabel: string;
  isInvalidTask?: boolean;
  scopeBudget: number;
  scopeMaintenanceId?: string;
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
  onReorderSubtasks: (taskId: string, draggedId: string, targetId: string) => Promise<void>;
}

function TaskCard({
  task,
  orderLabel,
  isInvalidTask = false,
  scopeBudget,
  scopeMaintenanceId,
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
  onReorderSubtasks,
}: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: task.title,
    budgetAllocated: task.budgetAllocated,
    taskMaintenanceId: task.taskMaintenanceId,
  });
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceRecord[]>([]);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);

  useEffect(() => {
    if (!scopeMaintenanceId) return;
    setMaintenanceLoading(true);
    getTasksForScope(scopeMaintenanceId)
      .then((items) => setMaintenanceTasks(items.filter((item) => item.isActive !== false)))
      .finally(() => setMaintenanceLoading(false));
  }, [scopeMaintenanceId]);

  const usesAvailableMaintenanceTask = Boolean(
    task.taskMaintenanceId && maintenanceTasks.some((item) => item.id === task.taskMaintenanceId),
  );

  const handleEditStart = () => {
    setEditForm({
      title: task.title,
      budgetAllocated: task.budgetAllocated,
      taskMaintenanceId: task.taskMaintenanceId,
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
    const validation = validateTaskForm(editForm, scopeBudget);

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

  const budgetPercent = calculateBudgetPercent(
    task.budgetAllocated,
    scopeBudget,
  );
  const titleError = touched["title"] && getFieldError("title", errors);
  const budgetError =
    touched["budgetAllocated"] && getFieldError("budgetAllocated", errors);

  return (
    <>
      <Box
        sx={{
          maxWidth: "100%",
          minWidth: 0,

          overflow: "hidden",

          backgroundColor: isInvalidTask ? "#FEF2F2" : "#f0f9ff",
          p: 2,
          mt: 1.5,
          border: isInvalidTask ? "2px solid #EF4444" : "2px solid #0ea5e9",
          borderRadius: 1,
          position: "relative",
          transition: "all 0.2s ease",
          boxShadow: isInvalidTask ? "0 0 0 2px rgba(239, 68, 68, 0.12)" : undefined,
          "&:hover": {
            boxShadow: "0 2px 8px rgba(6, 182, 212, 0.15)",
            "& .task-actions": { opacity: 1 },
          },
        }}
      >
        {isInvalidTask && (
          <Typography
            sx={{
              position: "absolute",
              top: 6,
              right: 8,
              color: "#B91C1C",
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            * Needs subtask
          </Typography>
        )}

        {isEditing ? (
          // EDIT MODE
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "minmax(0, 1fr)",
                sm: "minmax(240px, 300px) minmax(160px, 200px) auto",
              },
              gap: 1,
              alignItems: "start",
              justifyContent: "start",
              width: "100%",
            }}
          >
            <Tooltip title={titleError || ""} open={!!titleError}>
              <TextField
                select={usesAvailableMaintenanceTask}
                size="small"
                label="Task"
                value={usesAvailableMaintenanceTask ? (editForm.taskMaintenanceId || task.taskMaintenanceId || "") : editForm.title}
                onChange={(e) => {
                  const value = e.target.value;
                  const selected = maintenanceTasks.find((item) => item.id === value);
                  if (usesAvailableMaintenanceTask) {
                    handleEditChange("taskMaintenanceId", value);
                    handleEditChange("title", selected?.name || editForm.title);
                  } else {
                    handleEditChange("title", value);
                  }
                }}
                onBlur={() => handleEditBlur("title")}
                error={!!titleError}
                sx={{ width: "100%" }}
                disabled={saving || maintenanceLoading}
              >
                {usesAvailableMaintenanceTask && maintenanceTasks.map((item) => (
                  <MenuItem key={item.id} value={item.id}>{item.name} ({item.code})</MenuItem>
                ))}
              </TextField>
            </Tooltip>

            <Tooltip title={budgetError || ""} open={!!budgetError}>
              <DecimalBudgetField
                size="small"
                label="Budget"
                value={editForm.budgetAllocated}
                onValueChange={(value) => handleEditChange("budgetAllocated", value)}
                onBlur={() => handleEditBlur("budgetAllocated")}
                error={!!budgetError}
                sx={{ width: "100%" }}
                disabled={saving}
              />
            </Tooltip>

            <Box display="flex" gap={0.5} height={40} alignItems="center">
              <IconButton
                size="small"
                onClick={handleEditSubmit}
                disabled={saving}
                sx={{ color: "#10b981" }}
              >
                {saving ? (
                  <CircularProgress size={20} />
                ) : (
                  <SaveIcon fontSize="small" />
                )}
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
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            gap={1}
          >
            <Box flex={1} minWidth={0}>
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <Chip label={`TASK ${orderLabel}`} size="small" sx={{ height: 21, bgcolor: "#e0f2fe", color: "#0369a1", fontSize: 9.5, fontWeight: 800 }} />
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "#0369a1" }}
                >
                  {task.title}
                </Typography>
              </Box>
              <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                <Typography
                  variant="caption"
                  sx={{ color: "#0c4a6e", fontWeight: 500 }}
                >
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
            taskOrderLabel={orderLabel}
            subtaskInputs={subtaskInputs}
            setSubtaskInputs={setSubtaskInputs}
            members={members}
            projectId={projectId}
            onUpdateSubtask={onUpdateSubtask}
            onDeleteSubtask={onDeleteSubtask}
            onEditSubtask={onEditSubtask}
            onAddSubtask={onAddSubtask}
            onReorderSubtasks={onReorderSubtasks}
          />
        )}
      </Box>
    </>
  );
}

export default React.memo(TaskCard);
