"use client";

import { Dialog, DialogContent, DialogTitle, Box } from "@mui/material";

// ✅ NEW IMPORT
import ProgressCalendar from "../progress/ProgressCalendar";

interface Props {
  open: boolean;
  onClose: () => void;
  subtaskId: string;
  onSuccess?: () => void;
  isTaskBoard?: boolean;

  // 🔥 OPTIONAL (pass from subtask if available)
  expectedStart?: string;
  expectedEnd?: string;
}

export default function ProgressCalendarModal({
  open,
  onClose,
  subtaskId,
  onSuccess,
  isTaskBoard = false,
  expectedStart,
  expectedEnd,
}: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>📅 Progress Calendar</DialogTitle>

        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <ProgressCalendar
              subtaskId={subtaskId}
              isTaskBoard={isTaskBoard}
              projectedStartDate={expectedStart}
              projectedEndDate={expectedEnd}
            />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }
