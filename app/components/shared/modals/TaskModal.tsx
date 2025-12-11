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
  Box
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useState } from "react";

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  defaultValues?: any;
}

export default function TaskModal({
  open,
  onClose,
  onSubmit,
  defaultValues,
}: TaskModalProps) {

  const [formData, setFormData] = useState({
    pin: defaultValues?.pin || "",
    taskName: defaultValues?.taskName || "",
    status: defaultValues?.status || "",
    description: defaultValues?.description || "",
    startDate: defaultValues?.startDate || "",
    endDate: defaultValues?.endDate || "",
    duration: defaultValues?.duration || "",
    assignedTo: defaultValues?.assignedTo || [],
    priority: defaultValues?.priority || "",
    progress: defaultValues?.progress || "",
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontSize: 24, fontWeight: 700 }}>
        Task
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ paddingTop: 2 }}>

        {/* First Row */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 4, md: 4 }}>
            <TextField
              label="PIN"
              fullWidth
              value={formData.pin}
              onChange={(e) => handleChange("pin", e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 4, md: 4 }}>
            <TextField
              label="Task Name"
              fullWidth
              value={formData.taskName}
              onChange={(e) => handleChange("taskName", e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 4, md: 4 }}>
            <TextField
              label="Status"
              fullWidth
              select
              value={formData.status}
              onChange={(e) => handleChange("status", e.target.value)}
            >
              <MenuItem value="Not Started">Not Started</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
            </TextField>
          </Grid>
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
        />

        {/* Dates & Duration */}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 4, md: 4 }}>
            <TextField
              label="Start Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.startDate}
              onChange={(e) => handleChange("startDate", e.target.value)}
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
            />
          </Grid>

          <Grid size={{ xs: 4, md: 4 }}>
            <TextField
              label="Duration"
              fullWidth
              value={formData.duration}
              onChange={(e) => handleChange("duration", e.target.value)}
            />
          </Grid>
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
                  {(selected as string[]).map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              ),
            }}
            value={formData.assignedTo}
            onChange={(e) => handleChange("assignedTo", e.target.value)}
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
            >
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 4, md: 4 }}>
            <TextField
              label="Progress %"
              fullWidth
              value={formData.progress}
              onChange={(e) => handleChange("progress", e.target.value)}
            />
          </Grid>
        </Grid>

      </DialogContent>

      <DialogActions sx={{ padding: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          color="primary"
          sx={{ bgcolor: "#210e64" }}
          onClick={handleSubmit}
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
}
