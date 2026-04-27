"use client";

import { Box, Chip, Tooltip } from "@mui/material";
import { DailyReportReceiver } from "@/app/redux/slices/dailyReportSlice";
import { WeeklyReportReceiver } from "@/app/redux/slices/weeklyReportSlice";

interface ReceiverChipsProps {
  receivers: (DailyReportReceiver | WeeklyReportReceiver)[];
  maxShow?: number;
}

export default function ReceiverChips({
  receivers,
  maxShow = 3,
}: ReceiverChipsProps) {
  if (!receivers || receivers.length === 0) {
    return (
      <Chip
        label="No receivers"
        variant="outlined"
        size="small"
        sx={{ color: "#999", borderColor: "#ddd" }}
      />
    );
  }

  const shown = receivers.slice(0, maxShow);
  const remaining = receivers.length - maxShow;

  return (
    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", alignItems: "center" }}>
      {shown.map((receiver) => (
        <Tooltip key={receiver.user.id} title={receiver.user.email} arrow>
          <Chip
            label={receiver.user.name}
            size="small"
            variant="outlined"
            sx={{
              borderColor: "#4B2E83",
              color: "#4B2E83",
              fontWeight: 600,
              fontSize: 11,
              height: 24,
              "& .MuiChip-label": {
                px: 1,
              },
            }}
          />
        </Tooltip>
      ))}
      {remaining > 0 && (
        <Tooltip
          title={receivers
            .slice(maxShow)
            .map((r) => r.user.name)
            .join(", ")}
          arrow
        >
          <Chip
            label={`+${remaining}`}
            size="small"
            variant="outlined"
            sx={{
              borderColor: "#4B2E83",
              color: "#4B2E83",
              fontWeight: 600,
              fontSize: 11,
              height: 24,
              "& .MuiChip-label": {
                px: 1,
              },
            }}
          />
        </Tooltip>
      )}
    </Box>
  );
}
