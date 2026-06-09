"use client";

import { Dialog, DialogContent, DialogTitle, Box, CircularProgress } from "@mui/material";
import dynamic from "next/dynamic";

// ✅ DYNAMICALLY IMPORT TO PREVENT SSR ISSUES WITH PDF VIEWER
const ProgressCalendar = dynamic(
  () => import("../progress/ProgressCalendar"),
  { 
    ssr: false,
    loading: () => <CircularProgress sx={{ display: "block", margin: "2rem auto" }} />
  }
);

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
              onSuccess={onSuccess}
            />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }
