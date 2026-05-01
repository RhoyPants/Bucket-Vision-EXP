"use client";

import React, { useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Stack,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useAppSelector } from "@/app/redux/hook";

interface Props {
  projectId?: string | null;
}

export default function GanttGridView({ projectId }: Props) {
  const fullProject = useAppSelector((state) => state.project.fullProject);

  const [expandedScopes, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // Ã°Å¸â€Â¥ DATE RESOLVER - AGGREGATE UPWARD FROM SUBTASKS
  const getRowDates = (row: any) => {
    // Ã°Å¸â€Â¹ SUBTASK Ã¢â€ â€™ direct dates
    if (row.type === "subtask") {
      return {
        start: row.projectedStartDate || row.startDate,
        end: row.projectedEndDate || row.endDate,
      };
    }

    // Ã°Å¸â€Â¹ TASK Ã¢â€ â€™ derive from subtasks
    if (row.type === "task") {
      const subs = row.subtasks || [];
      const valid = subs.filter(
        (s: any) => s.projectedStartDate || s.startDate
      );

      if (valid.length === 0) return { start: undefined, end: undefined };

      const startDates = valid.map(
        (s: any) => new Date((s.projectedStartDate || s.startDate) as string).getTime()
      );
      const endDates = valid.map(
        (s: any) => new Date((s.projectedEndDate || s.endDate) as string).getTime()
      );

      return {
        start: new Date(Math.min(...startDates)),
        end: new Date(Math.max(...endDates)),
      };
    }

    // Ã°Å¸â€Â¹ Scope Ã¢â€ â€™ derive from all subtasks across tasks
    if (row.type === "scope") {
      let allSubs: any[] = [];
      row.tasks?.forEach((t: any) => {
        allSubs = [...allSubs, ...(t.subtasks || [])];
      });

      const valid = allSubs.filter(
        (s) => s.projectedStartDate || s.startDate
      );

      if (valid.length === 0) return { start: undefined, end: undefined };

      const startDates = valid.map(
        (s: any) => new Date((s.projectedStartDate || s.startDate) as string).getTime()
      );
      const endDates = valid.map(
        (s: any) => new Date((s.projectedEndDate || s.endDate) as string).getTime()
      );

      return {
        start: new Date(Math.min(...startDates)),
        end: new Date(Math.max(...endDates)),
      };
    }

    return { start: undefined, end: undefined };
  };

  // Ã°Å¸â€Â¥ GENERATE DATE RANGE (GLOBAL) - FROM SUBTASKS ONLY
  const dates = useMemo(() => {
    if (!fullProject?.scopes) return [];

    const allDates: number[] = [];

    fullProject.scopes.forEach((cat: any) => {
      cat.tasks?.forEach((task: any) => {
        task.subtasks?.forEach((sub: any) => {
          const start = sub.projectedStartDate || sub.startDate;
          const end = sub.projectedEndDate || sub.endDate;

          // Ã°Å¸â€Â¥ STRICT CHECK - BOTH must exist
          if (!start || !end) return;

          const s = new Date(start).getTime();
          const e = new Date(end).getTime();

          // Ã°Å¸â€Â¥ Validate dates are valid numbers
          if (!isNaN(s) && !isNaN(e)) {
            allDates.push(s, e);
          }
        });
      });
    });

    // Ã°Å¸â€Â´ CRITICAL: no valid dates
    if (allDates.length === 0) {
      console.warn("Ã¢ÂÅ’ No valid subtask dates found in project");
      return [];
    }

    const min = Math.min(...allDates);
    const max = Math.max(...allDates);

    const result: Date[] = [];
    let current = new Date(min);

    while (current.getTime() <= max) {
      result.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    console.log("Ã¢Å“â€¦ GENERATED DATES:", result.length, "from", new Date(min), "to", new Date(max));

    return result;
  }, [fullProject]);

  // Ã°Å¸â€Â¥ FLATTEN DATA (FOR ROW ALIGNMENT)
  const rows = useMemo(() => {
    if (!fullProject?.scopes) return [];

    const result: any[] = [];

    fullProject.scopes.forEach((scope: any) => {
      result.push({ type: "scope", ...scope });

      if (expandedScopes.has(scope.id)) {
        scope.tasks?.forEach((task: any) => {
          result.push({ type: "task", ...task, parentId: scope.id });

          if (expandedTasks.has(task.id)) {
            task.subtasks?.forEach((subtask: any) => {
              result.push({ type: "subtask", ...subtask, parentId: task.id });
            });
          }
        });
      }
    });

    return result;
  }, [fullProject, expandedScopes, expandedTasks]);

  const toggleScope = (id: string) => {
    const set = new Set(expandedScopes);
    set.has(id) ? set.delete(id) : set.add(id);
    setExpandedCategories(set);
  };

  const toggleTask = (id: string) => {
    const set = new Set(expandedTasks);
    set.has(id) ? set.delete(id) : set.add(id);
    setExpandedTasks(set);
  };

  const isActive = (date: Date, start?: any, end?: any) => {
    if (!start || !end) return false;
    const startDate = new Date(start);
    const endDate = new Date(end);
    return date >= startDate && date <= endDate;
  };

  const getColor = (item: any) => {
    // Different colors by type (HIERARCHY)
    if (item.type === "scope") return "#5E35B1"; // Purple (thick bars)
    if (item.type === "task") return "#0D47A1"; // Dark Blue (medium bars)
    
    // Subtask - color by status
    if (item.progress === 100) return "#00C853"; // Bright Green (complete)
    if (!item.actualStartDate) return "#FFA726"; // Orange (planned)
    return "#29B6F6"; // Light Blue (ongoing)
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatDate = (date: any) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;

  // Ã°Å¸â€Â¥ BAR POSITIONING HELPERS
  const totalDays = dates.length > 0 ? dates.length : 1;

  const getOffset = (start: any) => {
    if (!start || dates.length === 0) return 0;
    const diff =
      (new Date(start).getTime() - dates[0]?.getTime()) /
      (1000 * 60 * 60 * 24);
    return Math.max(0, diff);
  };

  const getDuration = (start: any, end: any) => {
    if (!start || !end) return 0;
    const duration =
      (new Date(end).getTime() - new Date(start).getTime()) /
      (1000 * 60 * 60 * 24) + 1; // +1 to include end day
    return Math.max(0, duration);
  };

  // Ã°Å¸â€Â¥ GROUP DATES BY MONTH
  const groupByMonth = (dateList: Date[]) => {
    const groups: Array<{ month: string; days: number; startIndex: number }> = [];
    let currentMonth = "";
    let monthStart = 0;

    dateList.forEach((d, idx) => {
      const key = d.toLocaleString("default", { month: "short", year: "numeric" });
      if (key !== currentMonth) {
        if (currentMonth) {
          groups.push({
            month: currentMonth,
            days: idx - monthStart,
            startIndex: monthStart,
          });
        }
        currentMonth = key;
        monthStart = idx;
      }
    });

    if (currentMonth) {
      groups.push({
        month: currentMonth,
        days: dateList.length - monthStart,
        startIndex: monthStart,
      });
    }

    return groups;
  };

  if (!projectId || !fullProject) {
    return (
      <Paper sx={{ p: 3, textAlign: "center" }}>
        <Typography>Select project</Typography>
      </Paper>
    );
  }
  console.log("DATES:", dates.length, dates);  

  return (
    <Box sx={{ overflow: "hidden" }}>
      <Paper sx={{ display: "flex", overflow: "hidden" }}>
        
        {/* Ã°Å¸â€Â¥ LEFT PANEL (DATA COLUMNS) */}
        <Box sx={{ minWidth: 680, borderRight: "2px solid #DDE1E8" }}>
          
          {/* HEADER ROW */}
          <Box sx={{ position: "sticky", top: 0, zIndex: 5, background: "#F7F8FA", display: "flex", fontWeight: 700, fontSize: 12, borderBottom: "1px solid #DDE1E8" }}>
            <Box sx={{ width: 60, px: 1, py: 1 }}>WBS</Box>
            <Box sx={{ width: 280, px: 1, py: 1 }}>Phase / Task</Box>
            <Box sx={{ width: 90, px: 1, py: 1, textAlign: "right" }}>Start</Box>
            <Box sx={{ width: 90, px: 1, py: 1, textAlign: "right" }}>End</Box>
            <Box sx={{ width: 70, px: 1, py: 1, textAlign: "center" }}>Days</Box>
            <Box sx={{ width: 110, px: 1, py: 1, textAlign: "center" }}>Status</Box>
          </Box>

          {/* DATA ROWS */}
          {rows.map((row: any, idx: number) => {
            const isScope = row.type === "scope";
            const isTask = row.type === "task";
            const isSubtask = row.type === "subtask";
            const { start, end } = getRowDates(row);
            const duration = getDuration(start, end);
            const wbs = isScope ? row.id?.substring(0, 2)?.toUpperCase() : isTask ? `${row.parentId?.substring(0, 2)?.toUpperCase()}.${idx % 10}` : "-";
            const status = row.progress === 100 ? "Ã¢Å“â€œ Done" : row.progress ? `${Math.round(row.progress)}%` : "Planned";

            return (
              <Box
                key={idx}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  height: 40,
                  background:
                    isScope ? "#EEF2F6" :
                    isTask ? "#FFFFFF" : "#FAFBFC",
                  borderBottom: "1px solid #E0E0E0",
                }}
              >
                {/* WBS */}
                <Box sx={{ width: 60, px: 1, fontSize: 11, fontWeight: 600 }}>
                  {wbs}
                </Box>

                {/* NAME WITH EXPAND ICONS */}
                <Box sx={{ width: 280, px: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
                  {isScope && (
                    <IconButton size="small" onClick={() => toggleScope(row.id)} sx={{ p: 0.25 }}>
                      {expandedScopes.has(row.id) ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                    </IconButton>
                  )}
                  {isTask && (
                    <IconButton size="small" onClick={() => toggleTask(row.id)} sx={{ p: 0.25 }}>
                      {expandedTasks.has(row.id) ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                    </IconButton>
                  )}
                  <Typography
                    sx={{
                      fontSize: isScope ? 13 : isTask ? 12 : 11,
                      fontWeight: isScope ? 700 : isTask ? 600 : 400,
                      pl: isTask ? 1 : isSubtask ? 2 : 0,
                      flex: 1,
                    }}
                  >
                    {row.name || row.title}
                  </Typography>
                </Box>

                {/* START DATE */}
                <Box sx={{ width: 90, px: 1, fontSize: 11, textAlign: "right" }}>
                  {formatDate(start)}
                </Box>

                {/* END DATE */}
                <Box sx={{ width: 90, px: 1, fontSize: 11, textAlign: "right" }}>
                  {formatDate(end)}
                </Box>

                {/* DURATION (DAYS) */}
                <Box sx={{ width: 70, px: 1, fontSize: 11, textAlign: "center", fontWeight: 500 }}>
                  {duration > 0 ? `${Math.round(duration)}d` : "-"}
                </Box>

                {/* STATUS */}
                <Box sx={{ width: 110, px: 1, fontSize: 11, textAlign: "center" }}>
                  <Typography sx={{ fontSize: 10, color: row.progress === 100 ? "#00C853" : "#FFA726", fontWeight: 600 }}>
                    {status}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Ã°Å¸â€Â¥ RIGHT PANEL (TIMELINE) */}
        <Box sx={{ overflowX: "auto", flex: 1, position: "relative" }}>
          
          {/* MONTH HEADER */}
          <Box sx={{ display: "flex", position: "sticky", top: 0, zIndex: 3, background: "#EEF2F6", borderBottom: "2px solid #DDE1E8" }}>
            {dates.length > 0 && groupByMonth(dates).map((month, i) => (
              <Box
                key={i}
                sx={{
                  width: month.days * 40,
                  textAlign: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  p: 0.5,
                  borderRight: "1px solid #BCC4CD",
                  color: "#4B2E83",
                }}
              >
                {month.month}
              </Box>
            ))}
          </Box>

          {/* DAY HEADER */}
          <Box sx={{ display: "flex", position: "sticky", top: 32, zIndex: 4, background: "#F7F8FA", borderBottom: "1px solid #DDE1E8" }}>
            {dates.map((d, i) => (
              <Box
                key={i}
                sx={{
                  width: 40,
                  textAlign: "center",
                  fontSize: 10,
                  borderRight: "1px solid #E0E0E0",
                  p: 0.5,
                  backgroundColor: isToday(d) ? "#FFE082" : isWeekend(d) ? "#FAFAFA" : "transparent",
                  fontWeight: isToday(d) ? 700 : 400,
                  color: isToday(d) ? "#F57F17" : "#666",
                }}
              >
                {d.getDate()}
              </Box>
            ))}
          </Box>

          {/* TIMELINE BARS WITH GRID */}
          {rows.map((row: any, i: number) => {
            const { start, end } = getRowDates(row);
            const offset = getOffset(start);
            const duration = getDuration(start, end);

            return (
              <Box
                key={i}
                sx={{
                  display: "flex",
                  height: 40,
                  position: "relative",
                  borderBottom: "1px solid #E0E0E0",
                  backgroundColor:
                    row.type === "scope" ? "#EEF2F6" :
                    row.type === "task" ? "#FFFFFF" : "#FAFBFC",
                  backgroundImage: dates.length > 0 ? `repeating-linear-gradient(
                    to right,
                    transparent 0px,
                    transparent 39px,
                    #E0E0E0 39px,
                    #E0E0E0 40px
                  )` : "none",
                }}
              >
                {/* Ã°Å¸â€Â¥ WEEKEND SHADING */}
                {dates.map((d, idx) => (
                  isWeekend(d) && (
                    <Box
                      key={idx}
                      sx={{
                        position: "absolute",
                        left: `${(idx / dates.length) * 100}%`,
                        width: `${(1 / dates.length) * 100}%`,
                        height: "100%",
                        backgroundColor: "#FAFAFA",
                        pointerEvents: "none",
                        zIndex: 0,
                      }}
                    />
                  )
                ))}

                {/* Ã°Å¸â€Â¥ TODAY VERTICAL LINE */}
                {dates.length > 0 && (() => {
                  const todayIdx = dates.findIndex((d) => isToday(d));
                  const todayOffset = (todayIdx / totalDays) * 100;
                  return (
                    todayIdx >= 0 && (
                      <Box
                        sx={{
                          position: "absolute",
                          left: `${todayOffset}%`,
                          top: 0,
                          bottom: 0,
                          width: "2px",
                          backgroundColor: "#F57F17",
                          zIndex: 5,
                        }}
                      />
                    )
                  );
                })()}

                {/* Ã°Å¸â€Â¥ CONTINUOUS BAR */}
                {start && end && (
                  <Box
                    sx={{
                      position: "absolute",
                      left: `${(offset / totalDays) * 100}%`,
                      width: `${(duration / totalDays) * 100}%`,
                      height: 16,
                      top: "50%",
                      transform: "translateY(-50%)",
                      borderRadius: 2,
                      backgroundColor: getColor(row),
                      border: row.type === "scope" ? "2px solid #5E35B1" : row.type === "task" ? "2px solid #0D47A1" : "1px solid rgba(0,0,0,0.1)",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      zIndex: 2,
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Box>

      </Paper>
    </Box>
  );
}