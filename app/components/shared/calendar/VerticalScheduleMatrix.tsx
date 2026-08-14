"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import ProgressCalendarModal from "@/app/components/shared/modals/ProgressCalendarModal";
import { usePermissions } from "@/app/lib/usePermissions";

type MatrixSubtask = {
  id: string;
  title: string;
  progress: number;
  start: Date | null;
  end: Date | null;
};

type MatrixTask = {
  id: string;
  title: string;
  subtasks: MatrixSubtask[];
};

type MatrixScope = {
  id: string;
  title: string;
  tasks: MatrixTask[];
};

type Props = {
  projectTree: any;
  initialDate?: string | null;
  height?: number;
};

const DATE_COLUMN_WIDTH = 112;
const SUBTASK_COLUMN_WIDTH = 116;
const DAY_ROW_HEIGHT = 34;
const HEADER_ROW_HEIGHT = 38;
const MATRIX_COLORS = {
  draft: "#A78BFA",
  draftSoft: "#EDE9FE",
  forReview: "#FBBF24",
  forApproval: "#60A5FA",
  needsRevision: "#FB7185",
  active: "#34D399",
  activeSoft: "#D1FAE5",
  completed: "#818CF8",
  ink: "#110947",
};

const parseDate = (value: unknown): Date | null => {
  if (!value) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const normalizedProgress = (value: unknown) => {
  const progress = Number(value ?? 0);
  return Number.isFinite(progress) ? Math.min(100, Math.max(0, progress)) : 0;
};

export default function VerticalScheduleMatrix({ projectTree, initialDate, height = 650 }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { canView } = usePermissions();
  const canViewProgress = canView("progress");
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedSubtaskId(null);
  }, [projectTree?.id]);

  const scopes = useMemo<MatrixScope[]>(() =>
    (projectTree?.scopes || []).map((scope: any, scopeIndex: number) => ({
      id: String(scope.id || `scope-${scopeIndex}`),
      title: scope.name || scope.title || `Scope ${scopeIndex + 1}`,
      tasks: (scope.tasks || []).map((task: any, taskIndex: number) => ({
        id: String(task.id || `task-${scopeIndex}-${taskIndex}`),
        title: task.title || task.name || `Task ${taskIndex + 1}`,
        subtasks: (task.subtasks || []).map((subtask: any, subtaskIndex: number) => ({
          id: String(subtask.id || `subtask-${scopeIndex}-${taskIndex}-${subtaskIndex}`),
          title: subtask.title || subtask.name || `Subtask ${subtaskIndex + 1}`,
          progress: normalizedProgress(subtask.progress),
          start: parseDate(subtask.projectedStartDate || subtask.startDate),
          end: parseDate(subtask.projectedEndDate || subtask.endDate),
        })),
      })).filter((task: MatrixTask) => task.subtasks.length > 0),
    })).filter((scope: MatrixScope) => scope.tasks.length > 0),
  [projectTree]);

  const columns = useMemo(
    () => scopes.flatMap((scope) => scope.tasks.flatMap((task) => task.subtasks.map((subtask) => ({ scope, task, subtask })))),
    [scopes],
  );

  const dates = useMemo(() => {
    const scheduledDates = columns.flatMap(({ subtask }) => [subtask.start, subtask.end]).filter(Boolean) as Date[];
    const fallback = parseDate(initialDate) || new Date();
    const earliest = scheduledDates.length ? new Date(Math.min(...scheduledDates.map((date) => date.getTime()))) : fallback;
    const latest = scheduledDates.length ? new Date(Math.max(...scheduledDates.map((date) => date.getTime()))) : fallback;
    const rangeStart = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
    const rangeEnd = new Date(latest.getFullYear(), latest.getMonth() + 1, 0);
    const result: Date[] = [];
    const cursor = new Date(rangeStart);
    while (cursor <= rangeEnd) {
      result.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  }, [columns, initialDate]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !dates.length) return;
    const today = startOfDay(new Date()).getTime();
    const first = startOfDay(dates[0]).getTime();
    const last = startOfDay(dates[dates.length - 1]).getTime();
    const firstScheduled = columns
      .map(({ subtask }) => subtask.start?.getTime())
      .filter((value): value is number => typeof value === "number")
      .sort((left, right) => left - right)[0];
    const target = today >= first && today <= last ? today : firstScheduled ?? first;
    const targetIndex = Math.max(0, Math.round((target - first) / 86_400_000));
    const frame = requestAnimationFrame(() => {
      container.scrollTop = Math.max(0, HEADER_ROW_HEIGHT * 3 + targetIndex * DAY_ROW_HEIGHT - DAY_ROW_HEIGHT * 2);
    });
    return () => cancelAnimationFrame(frame);
  }, [columns, dates, projectTree?.id]);

  const todayKey = dateKey(new Date());
  const totalWidth = DATE_COLUMN_WIDTH + Math.max(columns.length, 1) * SUBTASK_COLUMN_WIDTH;

  const scheduleBlocks = useMemo(() => {
    const monthStart = dates[0] ? startOfDay(dates[0]).getTime() : 0;
    const monthEnd = dates.length ? startOfDay(dates[dates.length - 1]).getTime() : 0;

    return columns.flatMap(({ subtask }, columnIndex) => {
      if (!subtask.start || !subtask.end || !monthStart || !monthEnd) return [];
      const rawStart = startOfDay(subtask.start).getTime();
      const rawEnd = startOfDay(subtask.end).getTime();
      if (rawEnd < monthStart || rawStart > monthEnd) return [];

      const visibleStart = Math.max(rawStart, monthStart);
      const visibleEnd = Math.min(rawEnd, monthEnd);
      const startIndex = Math.round((visibleStart - monthStart) / 86_400_000);
      const endIndex = Math.round((visibleEnd - monthStart) / 86_400_000);
      const visibleDays = endIndex - startIndex + 1;
      const totalDays = Math.max(1, Math.round((rawEnd - rawStart) / 86_400_000) + 1);
      const completedDays = Math.round(totalDays * (subtask.progress / 100));
      const completedEnd = completedDays > 0 ? rawStart + (completedDays - 1) * 86_400_000 : rawStart - 1;
      const visibleCompletedDays = completedEnd < visibleStart
        ? 0
        : Math.min(visibleDays, Math.round((Math.min(completedEnd, visibleEnd) - visibleStart) / 86_400_000) + 1);

      return [{
        subtask,
        columnIndex,
        startIndex,
        visibleDays,
        visibleProgress: (visibleCompletedDays / visibleDays) * 100,
        continuesBefore: rawStart < monthStart,
        continuesAfter: rawEnd > monthEnd,
      }];
    });
  }, [columns, dates]);

  if (!columns.length) {
    return (
      <Box sx={{ p: 4, textAlign: "center", border: "1px dashed #CBD5E1", borderRadius: 2 }}>
        <Typography fontWeight={800}>No scheduled subtasks available</Typography>
        <Typography sx={{ mt: 0.5, color: "#64748B", fontSize: 12 }}>Add projected start and end dates to project subtasks.</Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1.5} sx={{ minWidth: 0 }}>
      <Box>
        <Typography sx={{ fontWeight: 900 }}>
          {dates[0]?.toLocaleDateString("en-US", { month: "short", year: "numeric" })} – {dates[dates.length - 1]?.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
        </Typography>
        <Typography sx={{ color: "#64748B", fontSize: 11.5 }}>{dates.length} continuous days · {columns.length} subtask columns</Typography>
      </Box>

      <Box ref={scrollRef} sx={{ height, overflow: "auto", border: "1px solid #CBD5E1", borderRadius: 1.5, bgcolor: "#FFF", scrollbarWidth: "thin" }}>
        <Box sx={{ width: totalWidth, minWidth: "100%", position: "relative" }}>
          <Box sx={{ position: "sticky", top: 0, zIndex: 20, display: "flex", height: HEADER_ROW_HEIGHT * 3, bgcolor: "#FFF", boxShadow: "0 2px 5px rgba(15,23,42,.12)" }}>
            <Box sx={{ position: "sticky", left: 0, zIndex: 24, width: DATE_COLUMN_WIDTH, flexShrink: 0, display: "grid", placeItems: "center", bgcolor: MATRIX_COLORS.completed, color: "#FFF", borderRight: "2px solid #DDD8FF" }}>
              <Typography sx={{ color: "#FFF", fontSize: 12, fontWeight: 900 }}>DATE</Typography>
            </Box>
            <Box sx={{ width: columns.length * SUBTASK_COLUMN_WIDTH, flexShrink: 0 }}>
              <Box sx={{ display: "flex", height: HEADER_ROW_HEIGHT }}>
                {scopes.map((scope) => {
                  const count = scope.tasks.reduce((sum, task) => sum + task.subtasks.length, 0);
                  return <HeaderCell key={scope.id} width={count * SUBTASK_COLUMN_WIDTH} color={MATRIX_COLORS.active} label={scope.title} darkText />;
                })}
              </Box>
              <Box sx={{ display: "flex", height: HEADER_ROW_HEIGHT }}>
                {scopes.flatMap((scope) => scope.tasks.map((task) =>
                  <HeaderCell key={`${scope.id}-${task.id}`} width={task.subtasks.length * SUBTASK_COLUMN_WIDTH} color={MATRIX_COLORS.forReview} label={task.title} darkText />
                ))}
              </Box>
              <Box sx={{ display: "flex", height: HEADER_ROW_HEIGHT }}>
                {columns.map(({ subtask }) => <HeaderCell key={subtask.id} width={SUBTASK_COLUMN_WIDTH} color={MATRIX_COLORS.draft} label={subtask.title} darkText />)}
              </Box>
            </Box>
          </Box>

          {dates.map((date) => {
            const isToday = dateKey(date) === todayKey;
            const weekend = date.getDay() === 0 || date.getDay() === 6;
            const isMonthStart = date.getDate() === 1;
            return (
              <Box key={dateKey(date)} sx={{ display: "flex", height: DAY_ROW_HEIGHT, bgcolor: isToday ? "#ECFDF5" : weekend ? "#F8FAFC" : "#FFF", borderTop: isMonthStart ? `2px solid ${MATRIX_COLORS.forApproval}` : 0 }}>
                <Box sx={{ position: "sticky", left: 0, zIndex: 10, width: DATE_COLUMN_WIDTH, flexShrink: 0, px: 1.25, display: "flex", alignItems: "center", gap: 0.75, bgcolor: isToday ? MATRIX_COLORS.activeSoft : isMonthStart ? "#F1F0FF" : weekend ? "#F1F5F9" : "#FFF", borderRight: "2px solid #DDD8FF", borderBottom: "1px solid #E2E8F0" }}>
                  <Typography sx={{ width: 24, color: isToday ? "#047857" : MATRIX_COLORS.ink, fontSize: 13, fontWeight: 900 }}>{date.getDate()}</Typography>
                  <Typography sx={{ color: isMonthStart ? "#5045B8" : "#64748B", fontSize: 10.5, fontWeight: isMonthStart ? 900 : 700 }}>
                    {isMonthStart ? `${date.toLocaleDateString("en-US", { month: "short" })} · ` : ""}{date.toLocaleDateString("en-US", { weekday: "short" })}
                  </Typography>
                </Box>
                {columns.map(({ subtask }) => (
                  <Box key={subtask.id} sx={{ width: SUBTASK_COLUMN_WIDTH, flexShrink: 0, borderRight: "1px solid #E7E5F4", borderBottom: "1px solid #E7E5F4", boxShadow: isToday ? `inset 0 2px ${MATRIX_COLORS.active}, inset 0 -2px ${MATRIX_COLORS.active}` : "none" }} />
                ))}
              </Box>
            );
          })}

          {scheduleBlocks.map(({ subtask, columnIndex, startIndex, visibleDays, visibleProgress, continuesBefore, continuesAfter }) => {
            const blockHeight = visibleDays * DAY_ROW_HEIGHT - 6;
            return (
              <Tooltip
                key={subtask.id}
                title={`${subtask.title} · ${subtask.progress.toFixed(2)}% · ${subtask.start?.toLocaleDateString()} – ${subtask.end?.toLocaleDateString()}`}
                placement="top"
                arrow
              >
                <Box
                  role={canViewProgress ? "button" : undefined}
                  tabIndex={canViewProgress ? 0 : undefined}
                  aria-label={canViewProgress ? `Open progress calendar for ${subtask.title}` : undefined}
                  onClick={canViewProgress ? () => setSelectedSubtaskId(subtask.id) : undefined}
                  onKeyDown={canViewProgress ? (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedSubtaskId(subtask.id);
                    }
                  } : undefined}
                  sx={{
                    position: "absolute",
                    zIndex: 5,
                    left: DATE_COLUMN_WIDTH + columnIndex * SUBTASK_COLUMN_WIDTH + 7,
                    top: HEADER_ROW_HEIGHT * 3 + startIndex * DAY_ROW_HEIGHT + 3,
                    width: SUBTASK_COLUMN_WIDTH - 14,
                    height: Math.max(8, blockHeight),
                    overflow: "hidden",
                    borderRadius: `${continuesBefore ? 0 : 8}px ${continuesBefore ? 0 : 8}px ${continuesAfter ? 0 : 8}px ${continuesAfter ? 0 : 8}px`,
                    bgcolor: MATRIX_COLORS.draftSoft,
                    border: `1px solid ${MATRIX_COLORS.draft}`,
                    boxShadow: "0 3px 8px rgba(76,29,149,.18)",
                    cursor: canViewProgress ? "pointer" : "default",
                    transition: "transform .15s ease, box-shadow .15s ease",
                    "&:hover": canViewProgress ? { transform: "translateY(-1px)", boxShadow: "0 5px 12px rgba(76,29,149,.25)" } : undefined,
                    "&:focus-visible": canViewProgress ? { outline: `3px solid ${MATRIX_COLORS.forApproval}`, outlineOffset: 2 } : undefined,
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      bottom: "auto",
                      height: `${visibleProgress}%`,
                      bgcolor: subtask.progress >= 100 ? MATRIX_COLORS.completed : MATRIX_COLORS.active,
                      borderBottom: subtask.progress > 0 && subtask.progress < 100 ? "2px solid #10B981" : 0,
                    }}
                  />
                  <Typography
                    sx={{
                      position: "sticky",
                      top: 4,
                      zIndex: 1,
                      px: 0.75,
                      py: 0.4,
                      color: subtask.progress >= 45 ? "#FFF" : MATRIX_COLORS.ink,
                      fontSize: 9.5,
                      fontWeight: 900,
                      lineHeight: 1.15,
                      textAlign: "center",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      textShadow: subtask.progress >= 45 ? "0 1px 2px rgba(0,0,0,.3)" : "none",
                    }}
                  >
                    {subtask.progress.toFixed(subtask.progress % 1 ? 1 : 0)}%
                  </Typography>
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      </Box>

      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        <Legend color={MATRIX_COLORS.completed} label="Completed" />
        <Legend color={MATRIX_COLORS.active} label="Active progress" />
        <Legend color={MATRIX_COLORS.draftSoft} label="Remaining schedule" />
        <Legend color={MATRIX_COLORS.activeSoft} label="Today" />
      </Stack>

      {selectedSubtaskId && (
        <ProgressCalendarModal
          open
          subtaskId={selectedSubtaskId}
          onClose={() => setSelectedSubtaskId(null)}
          onSuccess={() => setSelectedSubtaskId(null)}
        />
      )}
    </Stack>
  );
}

function HeaderCell({ width, color, label, darkText = false }: { width: number; color: string; label: string; darkText?: boolean }) {
  return (
    <Tooltip title={label} arrow>
      <Box sx={{ width, flexShrink: 0, px: 1, display: "grid", placeItems: "center", bgcolor: color, color: "#FFF", borderRight: "1px solid rgba(255,255,255,.45)", borderBottom: "1px solid rgba(255,255,255,.45)" }}>
        <Typography noWrap sx={{ width: "100%", color: darkText ? "#1F2937" : "#FFF", textAlign: "center", fontSize: 11, fontWeight: 850, textShadow: darkText ? "none" : "0 1px 2px rgba(0,0,0,.24)" }}>{label}</Typography>
      </Box>
    </Tooltip>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <Stack direction="row" spacing={0.65} alignItems="center">
      <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: color, border: "1px solid rgba(15,23,42,.12)" }} />
      <Typography sx={{ color: "#64748B", fontSize: 11 }}>{label}</Typography>
    </Stack>
  );
}
