"use client";

import React from "react";
import { Box, Button, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

interface CalendarHeaderProps {
  month: number;
  year: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

export default function CalendarHeader({
  month,
  year,
  onPrevMonth,
  onNextMonth,
  onToday,
}: CalendarHeaderProps) {
  const monthName = new Date(year, month - 1).toLocaleDateString("en-US", {
    month: "long",
  });

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: 2,
        gap: 1,
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 600, flex: 1 }}>
        📅 {monthName} {year}
      </Typography>

      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={onPrevMonth}
        >
          Prev
        </Button>

        <Button
          variant="outlined"
          size="small"
          onClick={onToday}
        >
          Today
        </Button>

        <Button
          variant="outlined"
          size="small"
          endIcon={<ArrowForwardIcon />}
          onClick={onNextMonth}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
}
