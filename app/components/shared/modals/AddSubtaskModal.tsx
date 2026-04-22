"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Box,
  MenuItem,
  Typography,
} from "@mui/material";

import { useAppDispatch } from "@/app/redux/hook";
import { createSubtask } from "@/app/redux/controllers/subTaskController";

export default function AddSubtaskModal({
  open,
  onClose,
  taskId,
  statusId,
}: {
  open: boolean;
  onClose: () => void;
  taskId: string;
  statusId: string;
}) {
  const dispatch = useAppDispatch();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [remarks, setRemarks] = useState("");

  // 🔥 NEW
  const [budgetAllocated, setBudgetAllocated] = useState<number | "">("");

  const handleCreate = async () => {
    if (!title.trim()) return;

    try {
      await dispatch(
        createSubtask(
          {
            taskId,
            statusId,

            title,
            description,
            priority,
            remarks,

            projectedStartDate: startDate || null,
            projectedEndDate: endDate || null,

            // 🔥 IMPORTANT FOR S-CURVE
            budgetAllocated:
              budgetAllocated === "" ? null : Number(budgetAllocated),

            // 🔥 DO NOT SET → backend should compute
            budgetPercent: null,
          },
          taskId
        )
      );

      // RESET
      setTitle("");
      setDescription("");
      setPriority("Medium");
      setStartDate("");
      setEndDate("");
      setRemarks("");
      setBudgetAllocated("");

      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>
        Add Subtask
      </DialogTitle>

      <DialogContent>
        {/* TITLE */}
        <TextField
          label="Subtask Title"
          fullWidth
          margin="normal"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* DESCRIPTION */}
        <TextField
          label="Description"
          fullWidth
          multiline
          rows={3}
          margin="normal"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* PRIORITY */}
        <TextField
          select
          label="Priority"
          fullWidth
          margin="normal"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <MenuItem value="High">High</MenuItem>
          <MenuItem value="Medium">Medium</MenuItem>
          <MenuItem value="Low">Low</MenuItem>
        </TextField>

        {/* 🔥 BUDGET */}
        <TextField
          label="Budget Allocation"
          type="number"
          fullWidth
          margin="normal"
          value={budgetAllocated}
          onChange={(e) =>
            setBudgetAllocated(
              e.target.value === "" ? "" : Number(e.target.value)
            )
          }
        />

        {/* DATE RANGE */}
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            type="date"
            label="Projected Start Date"
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <TextField
            type="date"
            label="Projected End Date"
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </Box>

        {/* REMARKS */}
        <TextField
          label="Remarks"
          fullWidth
          multiline
          rows={2}
          margin="normal"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />

        {/* INFO */}
        <Box sx={{ mt: 2 }}>
          <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
            Budget is used for weighted progress (S-Curve).
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>

        <Button
          variant="contained"
          onClick={handleCreate}
          sx={{
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          Create Subtask
        </Button>
      </DialogActions>
    </Dialog>
  );
}