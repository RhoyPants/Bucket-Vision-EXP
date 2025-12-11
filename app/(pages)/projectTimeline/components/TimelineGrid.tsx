import { Box } from "@mui/material";
import { eachDayOfInterval } from "date-fns";
import { TimelineGridProps } from "../types";

const DAY_WIDTH = 50;

export default function TimelineGrid({ startDate, endDate }: TimelineGridProps) {
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        width: days.length * DAY_WIDTH,
        height: "100%",
        display: "flex",
      }}
    >
      {days.map((day) => (
        <Box
          key={day.toISOString()}
          sx={{
            width: DAY_WIDTH,
            borderRight: "1px solid #eee",
          }}
        />
      ))}
    </Box>
  );
}
