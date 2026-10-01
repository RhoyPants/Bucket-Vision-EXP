"use client";

import { Box, Button, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

interface CalendarHeaderProps { month: number; year: number; onPrevMonth: () => void; onNextMonth: () => void; onToday: () => void }

export default function CalendarHeader({ month, year, onPrevMonth, onNextMonth, onToday }: CalendarHeaderProps) {
  const monthName = new Date(year, month - 1).toLocaleDateString("en-US", { month: "long" });
  return <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5, gap: 1, px: 1.25, py: 1, border: "1px solid #E2E8F0", borderRadius: 1.5, bgcolor: "#F8FAFC" }}>
    <Box><Typography sx={{ color: "#0F172A", fontSize: 16, fontWeight: 900 }}>{monthName} {year}</Typography><Typography sx={{ color: "#64748B", fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Monthly delivery plan</Typography></Box>
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Tooltip title="Previous month"><IconButton size="small" onClick={onPrevMonth} sx={{ border: "1px solid #CBD5E1", bgcolor: "#FFF" }}><ArrowBackIcon fontSize="small" /></IconButton></Tooltip>
      <Button variant="contained" size="small" onClick={onToday} sx={{ minWidth: 72, textTransform: "none", fontWeight: 800, boxShadow: "none" }}>Today</Button>
      <Tooltip title="Next month"><IconButton size="small" onClick={onNextMonth} sx={{ border: "1px solid #CBD5E1", bgcolor: "#FFF" }}><ArrowForwardIcon fontSize="small" /></IconButton></Tooltip>
    </Stack>
  </Box>;
}
