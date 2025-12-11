// TimelineHeader.tsx
import { Box, Typography } from "@mui/material";
import { eachDayOfInterval, format } from "date-fns";
import { TimelineHeaderProps } from "../types";

const DAY_WIDTH = 50;

export default function TimelineHeader({
  startDate,
  endDate,
  onDayClick,
}: TimelineHeaderProps & { onDayClick?: (date: Date) => void }) {
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <Box
      sx={{
        display: "flex",
        width: days.length * DAY_WIDTH,
        position: "sticky",
        top: 0,
        background: "#fff",
        zIndex: 2,
        borderBottom: "1px solid #eee",
      }}
    >
      {days.map((day) => (
        <Box
          key={day.toISOString()}
          onClick={() => onDayClick?.(day)}
          sx={{
            width: DAY_WIDTH,
            textAlign: "center",
            borderRight: "1px solid #eee",
            py: 1,
            cursor: onDayClick ? "pointer" : "default",
            userSelect: "none",
          }}
        >
          <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{format(day, "d")}</Typography>
          <Typography sx={{ fontSize: 10, color: "gray" }}>{format(day, "MMM")}</Typography>
        </Box>
      ))}
    </Box>
  );
}
