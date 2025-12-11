"use client";

import { Box, Typography } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  startOfYear,
  endOfYear,
  addDays,
  eachDayOfInterval,
  format,
} from "date-fns";
import TimelineContainer from "./components/TimelineContainer";
import TimelineHeader from "./components/TimelineHeader";
import TimelineGrid from "./components/TimelineGrid";
import TimelineProjectBar from "./components/TimelineProjectBar";
import TimelineFilter from "./components/TimelineFilter";
// import AddProjectDialog from "./components/AddProjectDialog";
import { ProjectTimelineItem } from "./types";
import TimelineYearHeader from "./components/TimelineYearHeader";
import { addYears, subYears } from "date-fns";

export default function ProjectTimelinePage() {
  // Dummy data initial
  const [projects, setProjects] = useState<ProjectTimelineItem[]>([
    {
      id: "P-001",
      name: "Project 1",
      startDate: "2025-12-01",
      endDate: "2026-01-15",
    },
    {
      id: "P-002",
      name: "Project 2",
      startDate: "2024-11-15",
      endDate: "2025-02-10",
    },
    {
      id: "P-003",
      name: "Project 3",
      startDate: "2025-12-05",
      endDate: "2026-04-15",
    },
    {
      id: "P-004",
      name: "Project 4",
      startDate: "2025-12-15",
      endDate: "2026-02-10",
    },
    {
      id: "P-005",
      name: "Project 5",
      startDate: "2026-02-01",
      endDate: "2026-10-15",
    },
    {
      id: "P-006",
      name: "Project 6",
      startDate: "2026-04-15",
      endDate: "2026-08-10",
    },
  ]);

  const YEARS_BACK = 3;
  const YEARS_FORWARD = 2;
  const DAY_WIDTH = 50;

  const now = new Date();

  const defaultStart = startOfYear(subYears(now, YEARS_BACK));
  const defaultEnd = endOfYear(addYears(now, YEARS_FORWARD));

  const [filter, setFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDate, setDialogDate] = useState<string | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // If you prefer a larger window (prev year -> next year), you can expand:
  // const defaultStart = addDays(startOfYear(now), -180);
  // const defaultEnd = addDays(endOfYear(now), 365);

  // Use memo to avoid recalculations
  const timelineStart = useMemo(() => defaultStart, [defaultStart]);
  const timelineEnd = useMemo(() => defaultEnd, [defaultEnd]);

  // Optionally compute the allDays array if other components need it
  const allDays = useMemo(
    () => eachDayOfInterval({ start: timelineStart, end: timelineEnd }),
    [timelineStart, timelineEnd]
  );

  // Filtering by ID or name
  const filtered = projects.filter(
    (p) =>
      p.id.toLowerCase().includes(filter.toLowerCase()) ||
      p.name.toLowerCase().includes(filter.toLowerCase())
  );

  // onDayClick: opens dialog with clicked day
  const handleDayClick = (date: Date) => {
    // format to yyyy-MM-dd for input[type=date]
    const iso = format(date, "yyyy-MM-dd");
    setDialogDate(iso);
    setDialogOpen(true);
  };

  // handle create project from dialog
  const handleCreateProject = (payload: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  }) => {
    setProjects((prev) => [...prev, payload]);
  };
  useEffect(() => {
    if (!containerRef.current) return;

    const today = new Date();

    // Calculate days from defaultStart → today
    const diff = Math.floor(
      (today.getTime() - defaultStart.getTime()) / 86400000
    );

    const scrollX = diff * DAY_WIDTH;

    containerRef.current.scrollTo({
      left: scrollX - 200, // move slightly left so today isn’t hugging edge
      behavior: "smooth",
    });
  }, [defaultStart]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography sx={{ fontSize: 26, fontWeight: 900, mb: 2 }}>
        Project Timeline (Full Calendar)
      </Typography>

      <TimelineFilter filter={filter} setFilter={setFilter} />

      <TimelineContainer ref={containerRef}>
        <TimelineYearHeader startDate={defaultStart} endDate={defaultEnd} />
        <TimelineHeader
          startDate={defaultStart}
          endDate={defaultEnd}
          onDayClick={handleDayClick}
        />
        <Box sx={{ position: "relative", height: filtered.length * 45 }}>
          <TimelineGrid startDate={defaultStart} endDate={defaultEnd} />
          <Box sx={{ position: "absolute", top: 0, left: 0 }}>
            {filtered.map((project) => (
              <TimelineProjectBar
                key={project.id}
                project={project}
                timelineStart={defaultStart}
              />
            ))}
          </Box>
        </Box>
      </TimelineContainer>

      {/* Add Project Dialog
      <AddProjectDialog
        open={dialogOpen}
        initialDate={dialogDate}
        onClose={() => setDialogOpen(false)}
        onCreate={handleCreateProject}
      /> */}
      <Box sx={{ position: "absolute", top: 0, left: 0 }}>
        {filtered.map((project) => (
          <TimelineProjectBar
            key={project.id}
            project={project}
            timelineStart={defaultStart}
          />
        ))}
      </Box>
    </Box>
  );
}
