"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useAppDispatch } from "@/app/redux/hook";
import { createTask, updateTask } from "@/app/redux/controllers/taskController";
import {
  validateTaskForm,
  calculateBudgetPercent,
  getFieldError,
  hasFieldError,
} from "@/app/utils/taskValidation";
import { setCurrentTask } from "@/app/redux/slices/taskSlice";
import EditIcon from "@mui/icons-material/Edit";

export default function TaskModal({
  open,
  onClose,
  mode = "create",
  task = null,
  scopeId = "",
  scopeBudget = 0,
}: {
  open: boolean;
  onClose: () => void;
  mode?: "create" | "view" | "edit";
  task?: any | null;
  scopeId?: string;
  scopeBudget?: number;
}) {
  const dispatch = useAppDispatch();

  const [form, setForm] = useState({
    title: "",
    description: "",
    budgetAllocated: 0,
  });

  const [localMode, setLocalMode] = useState<"create" | "view" | "edit">(mode);
  const [errors, setErrors] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === "create") {
      setForm({
        title: "",
        description: "",
        budgetAllocated: 0,
      });
      setLocalMode("create");
    } else if (mode === "view" || mode === "edit") {
      if (task) {
        setForm({
          title: task.title || "",
          description: task.description || "",
          budgetAllocated: task.budgetAllocated || 0,
        });
        setLocalMode("view");
      }
    }
  }, [open, task, mode]);

  const budgetPercent =
    form.budgetAllocated && scopeBudget > 0
      ? calculateBudgetPercent(form.budgetAllocated, scopeBudget)
      : 0;

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    const validation = validateTaskForm(
      {
        title: form.title,
        description: form.description,
        scopeId,
        budgetAllocated: form.budgetAllocated,
      },
      scopeBudget
    );

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setSaving(true);
    try {
      if (localMode === "create") {
        const newTask = await dispatch(
          createTask({
            title: form.title,
            description: form.description,
            budgetAllocated: form.budgetAllocated,
            budgetPercent: budgetPercent,
            scopeId,
          })
        );
        dispatch(setCurrentTask(newTask.id));
      } else if (localMode === "edit" && task) {
        await dispatch(
          updateTask(task.id, {
            title: form.title,
            description: form.description,
            budgetAllocated: form.budgetAllocated,
            budgetPercent: budgetPercent,
          })
        );
      }

      setErrors([]);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const isViewOnly = localMode === "view";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {localMode === "create" && "Create Task"}
        {localMode === "view" && "View Task"}
        {localMode === "edit" && "Edit Task"}
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Box display="flex" flexDirection="column" gap={2}>
          {/* Title */}
          <TextField
            label="Title"
            fullWidth
            size="small"
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            error={hasFieldError("title", errors)}
            helperText={getFieldError("title", errors) || ""}
            disabled={isViewOnly || saving}
          />

          {/* Budget */}
          <TextField
            label="Budget Allocated"
            fullWidth
            size="small"
            type="number"
            inputProps={{ step: "0.01" }}
            value={form.budgetAllocated}
            onChange={(e) =>
              handleChange("budgetAllocated", parseFloat(e.target.value) || 0)
            }
            error={hasFieldError("budgetAllocated", errors)}
            helperText={getFieldError("budgetAllocated", errors) || ""}
            disabled={isViewOnly || saving}
          />

          {/* Budget Percent */}
          {form.budgetAllocated > 0 && (
            <Box
              sx={{
                backgroundColor: "#0ea5e9",
                color: "#fff",
                px: 2,
                py: 1,
                borderRadius: 1,
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              {form.budgetAllocated.toLocaleString()} ({budgetPercent.toFixed(1)}% of 
              {scopeBudget.toLocaleString()})
            </Box>
          )}

          {/* Description */}
          <TextField
            label="Description (Optional)"
            fullWidth
            size="small"
            multiline
            rows={3}
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            error={hasFieldError("description", errors)}
            helperText={
              getFieldError("description", errors) ||
              `${form.description?.length || 0}/500`
            }
            disabled={isViewOnly || saving}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          {isViewOnly ? "Close" : "Cancel"}
        </Button>
        {isViewOnly && (
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => setLocalMode("edit")}
          >
            Edit
          </Button>
        )}
        {(localMode === "create" || localMode === "edit") && (
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : null}
          >
            {localMode === "create" ? "Create" : "Save"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
