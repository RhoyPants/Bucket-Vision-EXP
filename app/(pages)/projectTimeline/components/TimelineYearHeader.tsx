import { Box, Typography } from "@mui/material";
import { eachYearOfInterval, format, startOfYear, endOfYear } from "date-fns";
import { TimelineGridProps } from "../types";

const DAY_WIDTH = 50;

export default function TimelineYearHeader({
  startDate,
  endDate,
}: TimelineGridProps) {
  const years = eachYearOfInterval({ start: startDate, end: endDate });

  return (
    <Box
      sx={{
        display: "flex",
        background: "#fafafa",
        borderBottom: "1px solid #ddd",
      }}
    >
      {years.map((year) => {
        const start = startOfYear(year);
        const end = endOfYear(year);
        const daysInYear = (end.getTime() - start.getTime()) / 86400000 + 1;

        return (
          <Box
            key={year.toISOString()}
            sx={{
              width: daysInYear * DAY_WIDTH,
              textAlign: "center",
              py: 1,
              borderRight: "1px solid #ddd",
            }}
          >
            <Typography sx={{ fontSize: 14, fontWeight: 900 }}>
              {format(year, "yyyy")}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
