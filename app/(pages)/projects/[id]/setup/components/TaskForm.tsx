"use client";

import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Tooltip,
  CircularProgress,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import {
  validateTaskForm,
  calculateBudgetPercent,
  getFieldError,
  hasFieldError,
  ValidationError,
} from "@/app/utils/taskValidation";

interface TaskFormProps {
  scopeId: string;
  scopeBudget: number;
  taskInputs: Record<string, any>;
  setTaskInputs: (inputs: any) => void;
  onAddTask: (scopeId: string) => void;
  existingTasks?: Array<{ budgetAllocated: number }>;
}

export default function TaskForm({
  scopeId,
  scopeBudget,
  taskInputs,
  setTaskInputs,
  onAddTask,
  existingTasks = [],
}: TaskFormProps) {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const form = taskInputs[scopeId] || {};

  const handleChange = (field: string, value: any) => {
    setTaskInputs((prev: any) => ({
      ...prev,
      [scopeId]: {
        ...prev[scopeId],
        [field]: value,
      },
    }));
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  const handleSubmit = async () => {
    const validation = validateTaskForm(form, scopeBudget);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setSaving(true);
    try {
      onAddTask(scopeId);
      setTaskInputs((prev: any) => ({
        ...prev,
        [scopeId]: {},
      }));
      setErrors([]);
      setTouched({});
    } finally {
      setSaving(false);
    }
  };

  const titleError = touched["title"] && getFieldError("title", errors);
  const budgetError = touched["budgetAllocated"] && getFieldError("budgetAllocated", errors);
  const budgetPercent =
    form.budgetAllocated && scopeBudget > 0
      ? calculateBudgetPercent(form.budgetAllocated, scopeBudget)
      : 0;

  return (
    <Box
      mt={1}
      display="flex"
      gap={1}
      alignItems="center"
      flexWrap="wrap"
      sx={{ justifyContent: "flex-start" }}
    >
      <Tooltip title={titleError || ""} open={!!titleError}>
        <TextField
          size="small"
          label="Task"
          placeholder="Task name"
          value={form.title || ""}
          onChange={(e) => handleChange("title", e.target.value)}
          onBlur={() => handleBlur("title")}
          error={!!titleError}
          sx={{ flex: "0 1 300px", minWidth: 110 }}
          disabled={saving}
        />
      </Tooltip>

      <Tooltip title={budgetError || ""} open={!!budgetError}>
        <TextField
          size="small"
          label="Budget"
          placeholder="0.00"
          type="number"
          inputProps={{ step: "0.01" }}
          value={form.budgetAllocated || ""}
          onChange={(e) => handleChange("budgetAllocated", parseFloat(e.target.value) || 0)}
          onBlur={() => handleBlur("budgetAllocated")}
          error={!!budgetError}
          sx={{ flex: "0 1 200px" }}
          disabled={saving}
        />
      </Tooltip>

      <Typography
        variant="caption"
        sx={{
          backgroundColor: "#0ea5e9",
          color: "#fff",
          px: 0.75,
          py: 0.4,
          borderRadius: 0.5,
          fontWeight: 600,
          whiteSpace: "nowrap",
          minWidth: "45px",
          textAlign: "center",
        }}
      >
        {budgetPercent.toFixed(1)}%
      </Typography>

      <Button
        size="small"
        variant="contained"
        startIcon={saving ? <CircularProgress size={14} /> : <AddIcon />}
        onClick={handleSubmit}
        disabled={saving}
        sx={{
          backgroundColor: "#1e40af",
          color: "#fff",
          "&:hover": { backgroundColor: "#1e3a8a" },
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 1,
          fontSize: "0.85rem",
          padding: "6px 12px",
        }}
      >
        {saving ? "Adding..." : "Task"}
      </Button>
    </Box>
  );
}
