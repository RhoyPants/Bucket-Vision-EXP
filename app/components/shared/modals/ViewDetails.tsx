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
  Typography,
  IconButton,
  Slider,
  MenuItem,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

export default function SubtaskDetailsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  // 🔥 LOCAL STATE (UI ONLY)
  const [title, setTitle] = useState("Fix Login Bug");
  const [description, setDescription] = useState("");

  // ✅ Dynamic SubStatus list
  const [subStatuses, setSubStatuses] = useState([
    "In Progress",
    "QA",
    "Testing",
  ]);

  const [selectedStatus, setSelectedStatus] = useState("In Progress");

  // 🔥 Add new substatus
  const [newStatus, setNewStatus] = useState("");

  const handleAddStatus = () => {
    if (!newStatus.trim()) return;

    setSubStatuses((prev) => [...prev, newStatus]);
    setSelectedStatus(newStatus);
    setNewStatus("");
  };

  // ✅ Checklist
  const [checklists, setChecklists] = useState<any[]>([]);
  const [newItem, setNewItem] = useState("");

  const addChecklist = () => {
    if (!newItem.trim()) return;

    setChecklists([
      ...checklists,
      { id: Date.now(), title: newItem, progress: 0 },
    ]);
    setNewItem("");
  };

  const updateChecklist = (id: number, value: number) => {
    setChecklists((prev) =>
      prev.map((c) => (c.id === id ? { ...c, progress: value } : c)),
    );
  };

  const deleteChecklist = (id: number) => {
    setChecklists((prev) => prev.filter((c) => c.id !== id));
  };

  // 🔥 Progress logic
  const hasChecklist = checklists.length > 0;

  const progress = hasChecklist
    ? Math.round(
        checklists.reduce((sum, c) => sum + c.progress, 0) / checklists.length,
      )
    : 0;

    function setAssignee(value: string): void {
        throw new Error("Function not implemented.");
    }

    function setPriority(value: string): void {
        throw new Error("Function not implemented.");
    }

    function setDueDate(value: string): void {
        throw new Error("Function not implemented.");
    }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Subtask Details</DialogTitle>

      <DialogContent>
        {/* Title */}
        <TextField
          fullWidth
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mt: 1 }}
        />

        {/* Description */}
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{ mt: 2 }}
        />

        {/* 🔥 SubStatus (Dynamic) */}
        <Box sx={{ mt: 3 }}>
          <Typography fontSize={13}>Sub Status</Typography>

          <TextField
            select
            fullWidth
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            sx={{ mt: 1 }}
          >
            {subStatuses.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>

          {/* ➕ Add new status */}
          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
            <TextField
              size="small"
              placeholder="Add new status..."
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              fullWidth
            />
            <Button onClick={handleAddStatus}>Add</Button>
          </Box>
        </Box>

        {/* Row: Priority + Assignee */}
        <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
          <TextField
            select
            label="Priority"
            fullWidth
            value={""}
            onChange={(e) => setPriority(e.target.value)}
          >
            <MenuItem value="High">High</MenuItem>
            <MenuItem value="Medium">Medium</MenuItem>
            <MenuItem value="Low">Low</MenuItem>
          </TextField>

          <TextField
            label="Assignee"
            fullWidth
            value={""}
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
          value={"dueDate"}
          onChange={(e) => setDueDate(e.target.value)}
        />

        {/* 🔥 Progress */}
        <Box sx={{ mt: 3 }}>
          <Typography fontSize={13}>Progress</Typography>

          <Slider value={progress} disabled={hasChecklist} />

          <Typography fontSize={12} color="text.secondary">
            {hasChecklist ? "Auto from checklist" : "Manual (no checklist)"}
          </Typography>
        </Box>

        {/* 🔥 Checklist */}
        <Box sx={{ mt: 3 }}>
          <Typography fontWeight={600}>Checklist</Typography>

          {checklists.map((item) => (
            <Box
              key={item.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mt: 1,
              }}
            >
              <Typography sx={{ flex: 1 }}>{item.title}</Typography>

              <Slider
                size="small"
                value={item.progress}
                onChange={(_, val) => updateChecklist(item.id, val as number)}
                sx={{ width: 100 }}
              />

              <IconButton onClick={() => deleteChecklist(item.id)}>
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}

          {/* Add checklist */}
          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
            <TextField
              size="small"
              placeholder="New checklist..."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              fullWidth
            />
            <Button onClick={addChecklist}>Add</Button>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
}
