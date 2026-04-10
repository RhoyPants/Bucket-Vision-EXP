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
// import { createSubtask } from "@/app/redux/controllers/subTaskController";

export default function AddSubtaskModal({
  open,
  onClose,
  taskId,
}: {
  open: boolean;
  onClose: () => void;
  taskId: string;
}) {
  const dispatch = useAppDispatch();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleCreate = async () => {
    if (!title.trim()) return;

    try {
      // 🔥 later connect to backend
      // await dispatch(createSubtask({...}))

      console.log({
        title,
        description,
        priority,
        assignee,
        dueDate,
        taskId,
      });

      // reset
      setTitle("");
      setDescription("");
      setPriority("Medium");
      setAssignee("");
      setDueDate("");

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
        {/* Title */}
        <TextField
          label="Subtask Title"
          fullWidth
          margin="normal"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Description */}
        <TextField
          label="Description"
          fullWidth
          multiline
          rows={3}
          margin="normal"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Row: Priority + Assignee */}
        <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
          <TextField
            select
            label="Priority"
            fullWidth
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <MenuItem value="High">High</MenuItem>
            <MenuItem value="Medium">Medium</MenuItem>
            <MenuItem value="Low">Low</MenuItem>
          </TextField>

          <TextField
            label="Assignee"
            fullWidth
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
          />
        </Box>

        {/* Due Date */}
        <TextField
          type="date"
          label="Due Date"
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        {/* Info */}
        <Box sx={{ mt: 2 }}>
          <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
            Status will be automatically set based on progress.
          </Typography>
          <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
            Default sub-status: <b>In Progress</b>
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