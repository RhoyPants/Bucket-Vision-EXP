"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  TextField,
  CircularProgress,
  Typography,
  Backdrop,
  Stack,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DecimalBudgetField from "@/app/components/shared/DecimalBudgetField";
import {
  validateTaskForm,
  calculateBudgetPercent,
  getFieldError,
  hasFieldError,
  ValidationError,
} from "@/app/utils/taskValidation";
import {
  getProjectMaintenanceHierarchy,
  MaintenanceRecord,
} from "@/app/api-service/workBreakdownMaintenanceService";

interface TaskFormProps {
  scopeId: string;
  scopeMaintenanceId?: string;
  scopeBudget: number;
  budgetRequired?: boolean;
  existingTasks?: any[];
  taskInputs: Record<string, any>;
  setTaskInputs: (inputs: any) => void;
  onAddTask: (scopeId: string) => void;
  projectId?: string;
}

export default function TaskForm({
  scopeId,
  scopeMaintenanceId,
  scopeBudget,
  budgetRequired = true,
  existingTasks = [],
  taskInputs,
  setTaskInputs,
  onAddTask,
  projectId,
}: TaskFormProps) {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceRecord[]>([]);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);

  const form = taskInputs[scopeId] || {};
  const selectedTaskMaintenanceIds = new Set(
    existingTasks.map((task) => task.taskMaintenanceId).filter(Boolean),
  );
  const availableMaintenanceTasks = maintenanceTasks.filter(
    (task) => !selectedTaskMaintenanceIds.has(task.id),
  );

  useEffect(() => {
    if (!scopeMaintenanceId || !projectId) {
      setMaintenanceTasks([]);
      return;
    }

    let active = true;
    setMaintenanceLoading(true);
    getProjectMaintenanceHierarchy(projectId)
      .then((hierarchy) => {
        if (active) {
          const scope = hierarchy.find((item) => item.id === scopeMaintenanceId);
          setMaintenanceTasks((scope?.tasks ?? []).filter((item) => item.isActive !== false));
        }
      })
      .finally(() => {
        if (active) setMaintenanceLoading(false);
      });
    return () => {
      active = false;
    };
  }, [scopeMaintenanceId, projectId]);

  const handleChange = (field: string, value: any) => {
    setTaskInputs((prev: any) => ({
      ...prev,
      [scopeId]: {
        ...prev[scopeId],
        [field]: value,
      },
    }));
    const fieldHasValue =
      field === "budgetAllocated"
        ? Number(value) > 0
        : typeof value !== "string" || value.trim().length > 0;
    if (fieldHasValue) {
      setErrors((current) => current.filter((error) => error.field !== field));
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  const handleSubmit = async () => {
    const validation = validateTaskForm(form, scopeBudget, budgetRequired);

    if (!validation.isValid) {
      setErrors(validation.errors);
      setTouched((current) => ({
        ...current,
        ...Object.fromEntries(
          validation.errors.map((validationError) => [validationError.field, true]),
        ),
      }));
      return;
    }

    setSaving(true);
    try {
      await onAddTask(scopeId);
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
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "minmax(0, 1fr)",
          sm: "minmax(240px, 300px) minmax(160px, 200px) auto auto",
        },
        gap: 1,
        alignItems: "start",
        justifyContent: "start",
      }}
    >
      {scopeMaintenanceId ? (
          <TextField
            select
            size="small"
            label="Task"
            value={form.taskMaintenanceId || ""}
            onChange={(e) => {
              const value = e.target.value;
              const selected = maintenanceTasks.find(
                (item) => item.id === value,
              );
              handleChange("sourceType", "MAINTENANCE");
              handleChange("taskMaintenanceId", value);
              handleChange("title", selected?.name || "");
            }}
            onBlur={() => handleBlur("title")}
            error={!!titleError}
            sx={{ flex: "0 1 300px", minWidth: 110 }}
            disabled={saving || maintenanceLoading}
            SelectProps={{
              MenuProps: {
                PaperProps: { sx: { maxHeight: 280 } },
              },
            }}
            helperText="Select a task allowed under this scope."
          >
            <MenuItem value="" disabled>
              Select task
            </MenuItem>
            {availableMaintenanceTasks.map((task) => (
              <MenuItem key={task.id} value={task.id}>
                {task.name} ({task.code})
              </MenuItem>
            ))}
          </TextField>
        ) : (
          <TextField
            size="small"
            label="Task"
            placeholder="Task name"
            value={form.title || ""}
            onChange={(e) => {
              handleChange("sourceType", "CUSTOM");
              handleChange("taskMaintenanceId", "");
              handleChange("title", e.target.value);
            }}
            onBlur={() => handleBlur("title")}
            error={!!titleError}
            sx={{ flex: "0 1 300px", minWidth: 110 }}
            disabled={saving}
            helperText="Legacy custom scope"
          />
        )}

      <DecimalBudgetField
          size="small"
          label="Budget"
          placeholder="0"
          value={form.budgetAllocated}
          onValueChange={(value) => handleChange("budgetAllocated", value)}
          onBlur={() => handleBlur("budgetAllocated")}
          error={!!budgetError}
          helperText={budgetError || undefined}
          sx={{ flex: "0 1 200px" }}
          disabled={saving || !budgetRequired}
      />

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
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
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
          height: 40,
          padding: "6px 12px",
          whiteSpace: "nowrap",
        }}
      >
        {saving ? "Adding..." : "Task"}
      </Button>

      {/* LOADING MODAL */}
      <Backdrop
        open={saving}
        sx={{
          color: "#fff",
          zIndex: 1300,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
      >
        <Stack alignItems="center" gap={2}>
          <CircularProgress color="inherit" size={50} />
          <Typography fontWeight={600} fontSize={16}>
            Adding Task...
          </Typography>
        </Stack>
      </Backdrop>
    </Box>
  );
}
