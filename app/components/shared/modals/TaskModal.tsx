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
  defaultValues?: any; // for update subtask
  mode?: "task" | "subtask"; // task = create task, subtask = create/update subtask
  parentTask?: any; // needed for subtask creation
  isViewOnly?: boolean; // subtask update mode
  currentProject?: any; // ⭐ required for task creation PIN
}

export default function TaskModal({
  open,
  onClose,
  onSubmit,
  defaultValues,
  mode = "task",
  parentTask,
  isViewOnly = false,
  currentProject,
}: TaskModalProps) {
  const isSubtask = mode === "subtask";

  // ----------------------------
  // ⭐ INITIAL FORM BUILDER
  // ----------------------------
  const buildInitialForm = () => ({
    // PIN only exists for TASK creation
    pin: !isSubtask ? currentProject?.ref_no ?? "" : "",

    taskName:
      defaultValues?.task_name ||
      defaultValues?.taskName ||
      defaultValues?.title ||
      "",

    status: defaultValues?.status || (isSubtask ? "todo" : "Not Started"),

    description: defaultValues?.description || "",

    startDate:
      defaultValues?.start_date ||
      defaultValues?.startDate ||
      parentTask?.start_date ||
      "",

    endDate:
      defaultValues?.end_date ||
      defaultValues?.endDate ||
      parentTask?.end_date ||
      "",

    duration: defaultValues?.duration || "",

    assignedTo: Array.isArray(defaultValues?.assignedTo)
      ? defaultValues.assignedTo
      : defaultValues?.assignee
      ? [defaultValues.assignee]
      : Array.isArray(parentTask?.assigned_to)
      ? parentTask.assigned_to
      : [],

    priority: defaultValues?.priority || parentTask?.priority || "Medium",

    progress: defaultValues?.progress ?? parentTask?.progress ?? 0,
  });

  const [formData, setFormData] = useState(buildInitialForm);
  const [initialValues, setInitialValues] = useState(buildInitialForm);
  const [editMode, setEditMode] = useState(!isViewOnly);

  // Reset form whenever modal opens
  useEffect(() => {
    if (!open) return;
    const fresh = buildInitialForm();
    setFormData(fresh);
    setInitialValues(fresh);
    setEditMode(!isViewOnly);
  }, [open]);

  // ----------------------------
  // ⭐ CHANGE HANDLER
  // ----------------------------
  const handleChange = (field: string, value: any) => {
    if (!editMode && isViewOnly) setEditMode(true);
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialValues);

  // ----------------------------
  // ⭐ SUBMIT LOGIC
  // ----------------------------
  const handleSubmit = () => {
    /**
     ****************************************************
     ⭐ UPDATE SUBTASK MODE
     ****************************************************
     */
    if (isSubtask && isViewOnly) {
      const updatePayload = {
        subtask_id: Number(defaultValues?.subtask_id || defaultValues?.id),

        task_name:
          formData.taskName || defaultValues?.task_name || defaultValues?.title,

        description: formData.description || defaultValues?.description,

        start_date:
          formData.startDate ||
          defaultValues?.start_date ||
          defaultValues?.startDate,

        end_date:
          formData.endDate || defaultValues?.end_date || defaultValues?.endDate,

        assigned_to:
          formData.assignedTo?.length > 0
            ? formData.assignedTo
            : defaultValues?.assigned_to ??
              (defaultValues?.assignee ? [defaultValues.assignee] : []),

        assigned_by:
          defaultValues?.assigned_by ||
          defaultValues?.assignedBy ||
          parentTask?.assigned_by,

        priority: formData.priority || defaultValues?.priority,

        progress: formData.progress ?? defaultValues?.progress ?? 0,

        status: formData.status || defaultValues?.status,

        subTaskIndex:
          defaultValues?.subTaskIndex ??
          defaultValues?.order ??
          defaultValues?.order_index ??
          0,
      };

      onSubmit(updatePayload);
      return;
    }

    /**
     ****************************************************
     ⭐ CREATE SUBTASK MODE
     ****************************************************
     */
    if (isSubtask && !isViewOnly) {
      const payload = {
        task_id: parentTask.task_id,
        task_name: formData.taskName,
        description: formData.description,
        start_date: formData.startDate,
        end_date: formData.endDate,
        assigned_to: formData.assignedTo,
        assigned_by: parentTask.assigned_by,
        priority: formData.priority,
        status: "To Do",
        progress: 0,
      };

      onSubmit(payload);
      return;
    }

    /** -------------------------------------------------
     *  TASK MODE  → CREATE TASK
     * ------------------------------------------------- */
    if (mode === "task" && !isViewOnly) {
      const taskPayload = {
        project_refno: currentProject?.ref_no, // REQUIRED
        task_name: formData.taskName, // REQUIRED
        description: formData.description, // REQUIRED
        start_date: formData.startDate, // REQUIRED
        end_date: formData.endDate, // REQUIRED
        assigned_to: formData.assignedTo ?? [], // REQUIRED
        assigned_by: formData.assignedTo[0] ?? "", // TEMP (use first assignee)
        priority: formData.priority, // REQUIRED
        progress: formData.progress ?? 0, // REQUIRED
      };

      console.log("CREATE TASK PAYLOAD:", taskPayload);
      onSubmit(taskPayload);
      return;
    }
  };

  // ----------------------------
  // ⭐ FIELD CONTROL
  // ----------------------------
  const readOnly = !editMode;
  const fieldProps = {
    InputProps: {
      readOnly,
      onClick: () => {
        if (readOnly && isViewOnly) setEditMode(true);
      },
    },
  };

  // ----------------------------
  // ⭐ UI RENDER
  // ----------------------------
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontSize: 24, fontWeight: 700 }}>
        {isSubtask
          ? isViewOnly
            ? "Subtask Details"
            : "Create Subtask"
          : "Create Task"}

        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ paddingTop: 2 }}>
        <Grid container spacing={2}>
          {/* PIN ONLY IN TASK CREATE */}
          {!isSubtask && (
            <Grid size={{ xs: 4, md: 4 }}>
              <TextField
                label="PIN"
                fullWidth
                value={formData.pin}
                InputProps={{ readOnly: true }}
              />
            </Grid>
          )}

          {/* NAME */}
          <Grid size={{ xs: 4, md: 4 }}>
            <TextField
              label="Name"
              fullWidth
              value={formData.taskName}
              onChange={(e) => handleChange("taskName", e.target.value)}
              {...fieldProps}
            />
          </Grid>

          {/* STATUS (Task only) */}
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

        {/* DESCRIPTION */}
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

        {/* DATES */}
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
              onChange={(e) => handleChange("endDate", e.target.value)}
              {...fieldProps}
            />
          </Grid>

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

        {/* ASSIGNED TO */}
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

        {/* PRIORITY / PROGRESS */}
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

      {/* FOOTER BUTTONS */}
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
