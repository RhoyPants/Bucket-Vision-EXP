import { Box } from "@mui/material";
import { differenceInDays } from "date-fns";
import { TimelineProjectBarProps } from "../types";

const DAY_WIDTH = 50;

export default function TimelineProjectBar({
  project,
  timelineStart,
}: TimelineProjectBarProps) {
  const offset = differenceInDays(new Date(project.startDate), timelineStart);
  const duration =
    differenceInDays(new Date(project.endDate), new Date(project.startDate)) + 1;

  return (
    <Box sx={{ position: "relative", height: 40 }}>
      <Box
        sx={{
          position: "absolute",
          left: offset * DAY_WIDTH,
          width: duration * DAY_WIDTH,
          height: 22,
          borderRadius: 1.5,
          background: "#4B2E83",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        {project.name}
      </Box>
    </Box>
  );
}
