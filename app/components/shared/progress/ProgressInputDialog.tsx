"use client";

import { Dialog, DialogTitle, DialogContent, TextField, Button } from "@mui/material";
import { useState } from "react";
import axiosApi from "@/app/lib/axios";

interface Props {
  open: boolean;
  onClose: () => void;
  subtaskId: string;
  date: string;
}

export default function ProgressInputDialog({
  open,
  onClose,
  subtaskId,
  date,
}: Props) {
  const [value, setValue] = useState("");

  const handleSave = async () => {
    await axiosApi.post("/progress", {
      subtaskId,
      date,
      value: Number(value),
    });

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{date}</DialogTitle>

      <DialogContent>
        <TextField
          label="Progress %"
          fullWidth
          value={value}
          onChange={(e) => setValue(e.target.value)}
          type="number"
        />

        <Button
          onClick={handleSave}
          variant="contained"
          sx={{ mt: 2 }}
          fullWidth
        >
          Save
        </Button>
      </DialogContent>
    </Dialog>
  );
}