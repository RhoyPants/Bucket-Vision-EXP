"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Button,
  IconButton,
  MenuItem,
  Chip,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useState, useEffect } from "react";

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  defaultValues?: any;
  mode?: "task" | "subtask";
  parentTask?: any;
  isViewOnly?: boolean; // NEW for subtask view mode
}

export default function TaskModal({
  open,
  onClose,
  onSubmit,
  defaultValues,
  mode = "task",
  parentTask,
  isViewOnly = false,
}: TaskModalProps) {
  const isSubtask = mode === "subtask";

  // -------------------------
  // INITIAL FORM VALUES
  // -------------------------
  const buildInitialForm = () => ({
    pin: defaultValues?.pin || (isSubtask ? "AUTO-SUB" : ""),
    taskName: defaultValues?.taskName || defaultValues?.title || "",
    status: defaultValues?.status || (isSubtask ? "todo" : ""),
    description: defaultValues?.description || "",
    startDate: defaultValues?.startDate || parentTask?.start_date || "",
    endDate: defaultValues?.endDate || parentTask?.end_date || "",
    duration: defaultValues?.duration || "",
    assignedTo: Array.isArray(defaultValues?.assignedTo)
      ? defaultValues.assignedTo
      : defaultValues?.assignee
      ? [defaultValues.assignee]
      : Array.isArray(parentTask?.assigned_to)
      ? parentTask.assigned_to
      : [],

    priority: defaultValues?.priority || parentTask?.priority || "",
    progress: defaultValues?.progress ?? parentTask?.progress ?? 0,
  });

  const [formData, setFormData] = useState(buildInitialForm);
  const [initialValues, setInitialValues] = useState(buildInitialForm);
  const [editMode, setEditMode] = useState(!isViewOnly);

  // Reset modal values when opened
  useEffect(() => {
    if (!open) return;
    const fresh = buildInitialForm();
    setFormData(fresh);
    setInitialValues(fresh);
    setEditMode(!isViewOnly);
  }, [open]);

  // -------------------------
  // CHANGE HANDLER
  // -------------------------
  const handleChange = (field: string, value: any) => {
    if (!editMode && isViewOnly) setEditMode(true);
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // -------------------------
  // DETECT REAL CHANGES
  // -------------------------
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialValues);

  // -------------------------
  // SUBMIT HANDLER
  // -------------------------
  const handleSubmit = () => {
    if (isSubtask) {
      onSubmit({
        task_id: parentTask.task_id,
        task_name: formData.taskName,
        description: formData.description,
        start_date: formData.startDate,
        end_date: formData.endDate,
        assigned_to: formData.assignedTo,
        assigned_by: parentTask.assigned_by,
        priority: formData.priority,
        progress: parentTask.progress ?? 0,
        subTaskIndex: parentTask.subtasks?.length + 1 || 1,
        // For updateSubtask payload (if editing existing subtask)
        id: defaultValues?.id || undefined,
        status: formData.status,
        assignee: formData.assignedTo?.[0] ?? null,
      });
      return;
    }

    // Normal Task flow
    onSubmit(formData);
  };

  // -------------------------
  // FIELD RENDER HELP
  // -------------------------
  const readOnly = !editMode;

  const fieldProps = {
    InputProps: {
      readOnly,
      onClick: () => {
        if (readOnly && isViewOnly) setEditMode(true);
      },
    },
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontSize: 24, fontWeight: 700 }}>
        {isSubtask
          ? isViewOnly
            ? "Subtask Details"
            : "Create Subtask"
          : "Task"}
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ paddingTop: 2 }}>
        <Grid container spacing={2}>
          {/* PIN (hidden for subtasks) */}
          {!isSubtask && (
            <Grid size={{ xs: 4, md: 4 }}>
              <TextField
                label="PIN"
                fullWidth
                value={formData.pin}
                onChange={(e) => handleChange("pin", e.target.value)}
                {...fieldProps}
              />
            </Grid>
          )}

          {/* Name */}
          <Grid size={{ xs: 4, md: 4 }}>
            <TextField
              label="Name"
              fullWidth
              value={formData.taskName}
              onChange={(e) => handleChange("taskName", e.target.value)}
              {...fieldProps}
            />
          </Grid>

          {/* Status (visible only for tasks or when updating subtasks) */}
          {!isSubtask && (
            <Grid size={{ xs: 4, md: 4 }}>
              <TextField
                label="Status"
                fullWidth
                select
                value={formData.status}
                onChange={(e) => handleChange("status", e.target.value)}
                {...fieldProps}
              >
                <MenuItem value="Not Started">Not Started</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
              </TextField>
            </Grid>
          )}
        </Grid>

        {/* Description */}
        <TextField
          label="Description"
          fullWidth
          multiline
          rows={2}
          sx={{ mt: 2 }}
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          {...fieldProps}
        />

        {/* Dates */}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 4, md: 4 }}>
            <TextField
              label="Start Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.startDate}
              onChange={(e) => handleChange("startDate", e.target.value)}
              {...fieldProps}
            />
          </Grid>

          <Grid size={{ xs: 4, md: 4 }}>
            <TextField
              label="End Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.endDate}
              onChange={(e) => handleChange("enddate", e.target.value)}
              {...fieldProps}
            />
          </Grid>

          {/* Duration (task only) */}
          {!isSubtask && (
            <Grid size={{ xs: 4, md: 4 }}>
              <TextField
                label="Duration"
                fullWidth
                value={formData.duration}
                onChange={(e) => handleChange("duration", e.target.value)}
                {...fieldProps}
              />
            </Grid>
          )}
        </Grid>

        {/* Assigned To */}
        <Box sx={{ mt: 2 }}>
          <TextField
            label="Assigned To"
            fullWidth
            select
            SelectProps={{
              multiple: true,
              renderValue: (selected) => (
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {(selected as string[]).map((v) => (
                    <Chip key={v} label={v} />
                  ))}
                </Box>
              ),
            }}
            value={formData.assignedTo}
            onChange={(e) => handleChange("assignedTo", e.target.value)}
            {...fieldProps}
          >
            <MenuItem value="Ann Reyes">Ann Reyes</MenuItem>
            <MenuItem value="James Smith">James Smith</MenuItem>
            <MenuItem value="Michael Cruz">Michael Cruz</MenuItem>
          </TextField>
        </Box>

        {/* Priority & Progress */}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 4, md: 4 }}>
            <TextField
              label="Priority"
              fullWidth
              select
              value={formData.priority}
              onChange={(e) => handleChange("priority", e.target.value)}
              {...fieldProps}
            >
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
            </TextField>
          </Grid>

          {!isSubtask && (
            <Grid size={{ xs: 4, md: 4 }}>
              <TextField
                label="Progress %"
                fullWidth
                value={formData.progress}
                onChange={(e) => handleChange("progress", e.target.value)}
                {...fieldProps}
              />
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ padding: 2 }}>
        {isViewOnly ? (
          <>
            <Button onClick={onClose}>Return</Button>
            <Button
              variant="contained"
              disabled={!hasChanges}
              onClick={handleSubmit}
            >
              Update
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmit}>
              Submit
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
