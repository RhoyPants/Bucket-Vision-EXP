"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Grid,
  MenuItem,
} from "@mui/material";

import { useAppDispatch } from "@/app/redux/hook";
import { createTask } from "@/app/redux/controllers/taskController";
import { setCurrentTask } from "@/app/redux/slices/taskSlice";

export default function AddTaskModal({
  open,
  onClose,
  categoryId, // ✅ FIXED
}: {
  open: boolean;
  onClose: () => void;
  categoryId: string;
}) {
  const dispatch = useAppDispatch();

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    budgetAllocated: 0,
    budgetPercent: 0,
  });

  const handleCreate = async () => {
    if (!form.title.trim()) return;

    try {
      const newTask = await dispatch(
        createTask({
          ...form,
          categoryId, // ✅ IMPORTANT
        }),
      );

      dispatch(setCurrentTask(newTask.id));

      setForm({
        title: "",
        description: "",
        priority: "Medium",
        budgetAllocated: 0,
        budgetPercent: 0,
      });

      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create Task</DialogTitle>

      <DialogContent>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Task Title"
              fullWidth
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              label="Priority"
              fullWidth
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Budget Allocated"
              type="number"
              fullWidth
              value={form.budgetAllocated}
              onChange={(e) =>
                setForm({
                  ...form,
                  budgetAllocated: Number(e.target.value),
                })
              }
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Budget %"
              type="number"
              fullWidth
              value={form.budgetPercent}
              onChange={(e) =>
                setForm({
                  ...form,
                  budgetPercent: Number(e.target.value),
                })
              }
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleCreate}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
