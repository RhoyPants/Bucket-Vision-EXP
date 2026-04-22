"use client";

import { Dialog, DialogContent, DialogTitle, Box } from "@mui/material";
import { SetStateAction, useState } from "react";
import dayjs from "dayjs";

// ✅ NEW IMPORT
import ProgressCalendar from "../progress/ProgressCalendar";
import ProgressInputDialog from "../progress/ProgressInputDialog";

interface Props {
  open: boolean;
  onClose: () => void;
  subtaskId: string;

  // 🔥 OPTIONAL (pass from subtask if available)
  expectedStart?: string;
  expectedEnd?: string;
}

export default function ProgressCalendarModal({
  open,
  onClose,
  subtaskId,
  expectedStart,
  expectedEnd,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>📅 Progress Calendar</DialogTitle>

        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <ProgressCalendar
              subtaskId={subtaskId}
              projectedStartDate={expectedStart}
              projectedEndDate={expectedEnd}
            />
          </Box>
        </DialogContent>
      </Dialog>

      {/* ✅ INPUT DIALOG */}
      {selectedDate && (
        <ProgressInputDialog
          open={!!selectedDate}
          date={dayjs(selectedDate).format("YYYY-MM-DD")} // ✅ convert here
          subtaskId={subtaskId}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </>
  );
}
