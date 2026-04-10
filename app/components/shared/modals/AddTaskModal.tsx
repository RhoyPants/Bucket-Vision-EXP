"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
} from "@mui/material";

import { useAppDispatch } from "@/app/redux/hook";
import { createTask } from "@/app/redux/controllers/taskController";
import { setCurrentTask } from "@/app/redux/slices/taskSlice";

export default function AddTaskModal({
  open,
  onClose,
  projectId,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
}) {
  const dispatch = useAppDispatch();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = async () => {
    if (!title.trim()) return;

    try {
      const newTask = await dispatch(
        createTask({
          title,
          description,
          projectId,
        })
      );

      // 🔥 auto select new task
      dispatch(setCurrentTask(newTask.id));

      setTitle("");
      setDescription("");
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create Task</DialogTitle>

      <DialogContent>
        <TextField
          label="Task Title"
          fullWidth
          margin="normal"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <TextField
          label="Description"
          fullWidth
          multiline
          rows={3}
          margin="normal"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
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