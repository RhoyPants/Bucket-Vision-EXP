"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Autocomplete, Box, Button, Card, CardContent, Checkbox, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, IconButton, Stack,
  FormControlLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField,
  Slider, Tab, Tabs, Tooltip, Typography,
} from "@mui/material";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import CloseIcon from "@mui/icons-material/Close";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import FitScreenIcon from "@mui/icons-material/FitScreen";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import dagre from "dagre";
import {
  CpmActivity, CpmData, CpmDependency, getProjectCpm, previewProjectCpm,
  saveProjectCpmDependencies,
} from "@/app/api-service/cpmService";

interface WbsSubtask { id: string; order?: number }
interface WbsTask { order?: number; subtasks?: WbsSubtask[] }
interface WbsScope { order?: number; tasks?: WbsTask[] }
interface Props { projectId: string; canUpdate: boolean; scopes: unknown[] }
type DependencyDraft = Record<string, string[]>;
type WbsInfo = { scopeWbs: string; taskWbs: string; subtaskWbs: string };

const COLORS = { critical: "#d32f2f", normal: "#334155", ink: "#17233c", border: "#d8dee9" };

const formatDate = (value?: string | null, compact = false) => {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return date.toLocaleDateString(undefined, compact
    ? { month: "short", day: "numeric" }
    : { month: "short", day: "numeric", year: "numeric" });
};

const errorMessage = (error: unknown) => {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const item = error as { message?: string; error?: { message?: string } };
    return item.error?.message || item.message || "Unable to update the CPM schedule.";
  }
  return "Unable to update the CPM schedule.";
};

const shortTitle = (title: string, max = 18) => title.length > max ? `${title.slice(0, max - 1)}…` : title;

type TimelineRow = {
  key: string;
  type: "scope" | "task" | "activity";
  wbs: string;
  label: string;
  activity?: CpmActivity;
};

const buildTimelineRows = (activities: CpmActivity[], wbsById: Map<string, WbsInfo>): TimelineRow[] => {
  const ordered = [...activities].sort((a, b) => {
    const left = (wbsById.get(a.subtaskId)?.subtaskWbs || "").split(".").map(Number);
    const right = (wbsById.get(b.subtaskId)?.subtaskWbs || "").split(".").map(Number);
    return (left[0] - right[0]) || (left[1] - right[1]) || (left[2] - right[2]);
  });
  const rows: TimelineRow[] = [];
  const scopes = new Set<string>();
  const tasks = new Set<string>();
  ordered.forEach((activity) => {
    const wbs = wbsById.get(activity.subtaskId);
    if (!scopes.has(activity.scopeId)) {
      scopes.add(activity.scopeId);
      rows.push({ key: `scope-${activity.scopeId}`, type: "scope", wbs: wbs?.scopeWbs || "", label: activity.scopeName });
    }
    if (!tasks.has(activity.taskId)) {
      tasks.add(activity.taskId);
      rows.push({ key: `task-${activity.taskId}`, type: "task", wbs: wbs?.taskWbs || "", label: activity.taskTitle });
    }
    rows.push({ key: activity.subtaskId, type: "activity", wbs: wbs?.subtaskWbs || "", label: activity.subtaskTitle, activity });
  });
  return rows;
};

const createsCycle = (draft: DependencyDraft, predecessorId: string, successorId: string) => {
  if (predecessorId === successorId) return true;
  const successors = new Map<string, string[]>();
  Object.entries(draft).forEach(([successor, predecessors]) => predecessors.forEach((predecessor) => {
    successors.set(predecessor, [...(successors.get(predecessor) || []), successor]);
  }));
  successors.set(predecessorId, [...(successors.get(predecessorId) || []), successorId]);
  const pending = [successorId];
  const visited = new Set<string>();
  while (pending.length) {
    const current = pending.pop()!;
    if (current === predecessorId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    pending.push(...(successors.get(current) || []));
  }
  return false;
};

function Legend() {
  return <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
    {[[COLORS.critical, "Critical path"], [COLORS.normal, "Non-critical"]].map(([color, label]) =>
      <Stack direction="row" spacing={0.65} alignItems="center" key={label}>
        <Box sx={{ width: 18, height: 5, borderRadius: 4, bgcolor: color }} />
        <Typography sx={{ fontSize: 10.5, color: "#526078" }}>{label}</Typography>
      </Stack>)}
  </Stack>;
}

function GanttOverview({ activities, duration, wbsById, showHierarchy, fullHeight = false }: { activities: CpmActivity[]; duration: number; wbsById: Map<string, WbsInfo>; showHierarchy: boolean; fullHeight?: boolean }) {
  const maxDay = Math.max(duration, 1);
  const markerCount = Math.min(maxDay, 8);
  const boundaryDates = new Map<number, string>();
  activities.forEach((activity) => {
    if (activity.earlyStart != null && activity.calculatedStartDate) boundaryDates.set(activity.earlyStart, activity.calculatedStartDate);
    if (activity.earlyFinish != null && activity.calculatedFinishDate) boundaryDates.set(activity.earlyFinish, activity.calculatedFinishDate);
  });
  const boundaryMarkers = [...boundaryDates.entries()].sort((a, b) => a[0] - b[0]);
  const sampledBoundaries = boundaryMarkers.length <= 8
    ? boundaryMarkers
    : boundaryMarkers.filter((_, index) => index === 0 || index === boundaryMarkers.length - 1 || index % Math.ceil(boundaryMarkers.length / 8) === 0).slice(0, 8);
  const markers = sampledBoundaries.length
    ? sampledBoundaries.map(([day, date]) => ({ day, date }))
    : Array.from({ length: markerCount }, (_, index) => ({
        day: Math.max(1, Math.round((index * (maxDay - 1)) / Math.max(markerCount - 1, 1)) + 1),
        date: null,
      }));
  const rowHeight = 31;
  const barInset = 3;
  const timelinePixelWidth = Math.max(430, maxDay * 24);
  const ganttColumns = `65px 260px 62px ${timelinePixelWidth}px`;
  const ganttLeftWidth = 387;
  const rows = buildTimelineRows(activities, wbsById).filter((row) => showHierarchy || row.type === "activity");
  const activityIndex = new Map(rows.map((row, index) => [row.activity?.subtaskId, index]).filter((item): item is [string, number] => Boolean(item[0])));
  const activityById = new Map(activities.map((activity) => [activity.subtaskId, activity]));
  const connectors = activities.flatMap((successor) => successor.predecessorIds.map((predecessorId) => ({
    predecessor: activityById.get(predecessorId),
    successor,
  }))).filter((item): item is { predecessor: CpmActivity; successor: CpmActivity } => Boolean(item.predecessor));

  const contentHeight = 38 + rows.length * rowHeight;
  return <Box sx={{ overflow: "auto", height: fullHeight ? "100%" : "auto", maxHeight: fullHeight ? "none" : 480 }}><Box sx={{ minWidth: ganttLeftWidth + timelinePixelWidth, minHeight: fullHeight ? "100%" : contentHeight }}>
    <Box sx={{ display: "grid", gridTemplateColumns: ganttColumns, position: "sticky", top: 0, zIndex: 8, bgcolor: "#fff", pb: 0.75, borderBottom: "1px solid #e4e9f0" }}>
      <Typography sx={{ ...headingSx, position: "sticky", left: 0, zIndex: 10, bgcolor: "#fff" }}>WBS</Typography><Typography sx={{ ...headingSx, position: "sticky", left: 65, zIndex: 10, bgcolor: "#fff" }}>Scope of work</Typography><Typography sx={headingSx}>Duration</Typography>
      <Stack direction="row" justifyContent="space-between">{markers.map(({ day, date }, index) => <Box key={`${day}-${index}`} sx={{ textAlign: "center" }}><Typography sx={{ fontSize: 9, fontWeight: 750, color: "#697386" }}>D{day}</Typography>{date && <Typography sx={{ fontSize: 8.5, color: "#98a2b3", whiteSpace: "nowrap" }}>{formatDate(date, true)}</Typography>}</Box>)}</Stack>
    </Box>
    <Box sx={{ position: "relative" }}>
      <Box sx={{ position: "absolute", left: ganttLeftWidth, width: timelinePixelWidth, top: 0, height: rows.length * rowHeight, zIndex: 1, pointerEvents: "none" }}>
        <svg width={timelinePixelWidth} height={Math.max(rows.length * rowHeight, 1)} style={{ display: "block", overflow: "visible" }}>
          <defs>
            <marker id="gantt-arrow-critical" viewBox="0 0 10 10" refX="10" refY="5" markerUnits="userSpaceOnUse" markerWidth="3.5" markerHeight="3.5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill={COLORS.critical} /></marker>
            <marker id="gantt-arrow-normal" viewBox="0 0 10 10" refX="10" refY="5" markerUnits="userSpaceOnUse" markerWidth="3.5" markerHeight="3.5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill={COLORS.normal} /></marker>
          </defs>
          {connectors.map(({ predecessor, successor }) => {
            if (predecessor.earlyFinish == null || successor.earlyStart == null) return null;
            const predecessorRow = activityIndex.get(predecessor.subtaskId);
            const successorRow = activityIndex.get(successor.subtaskId);
            if (predecessorRow == null || successorRow == null) return null;
            // Use the exact same pixel coordinate system as the activity bars.
            // This keeps every connector attached during resize, browser zoom and fullscreen.
            const boundaryStartX = (predecessor.earlyFinish / maxDay) * timelinePixelWidth;
            const boundaryEndX = ((successor.earlyStart - 1) / maxDay) * timelinePixelWidth;
            const startX = Math.max(0, boundaryStartX - barInset);
            const endX = Math.min(timelinePixelWidth, boundaryEndX + barInset);
            const startY = predecessorRow * rowHeight + rowHeight / 2;
            const endY = successorRow * rowHeight + rowHeight / 2;
            const critical = predecessor.isCritical && successor.isCritical;
            const elbowX = (startX + endX) / 2;
            const path = `M ${startX} ${startY} L ${elbowX} ${startY} L ${elbowX} ${endY} L ${endX} ${endY}`;
            return <g key={`${predecessor.subtaskId}-${successor.subtaskId}`}>
              <path d={path} fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" opacity="0.95" vectorEffect="non-scaling-stroke" />
              <path d={path} fill="none" stroke={critical ? COLORS.critical : COLORS.normal} strokeWidth="1.35" strokeLinecap="square" strokeLinejoin="miter" opacity="0.96" vectorEffect="non-scaling-stroke" markerEnd={`url(#gantt-arrow-${critical ? "critical" : "normal"})`} />
            </g>;
          })}
        </svg>
      </Box>
    {rows.map((row) => {
      if (!row.activity) return <Box key={row.key} sx={{ display: "grid", gridTemplateColumns: ganttColumns, alignItems: "center", minHeight: rowHeight, bgcolor: row.type === "scope" ? "#b8cce4" : "#d9eaf7", borderBottom: "1px solid #c7d5e5" }}>
        <Typography sx={{ px: 0.75, position: "sticky", left: 0, zIndex: 5, alignSelf: "stretch", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "inherit", fontSize: 9.5, fontWeight: 850, color: "#17365d" }}>{row.wbs}</Typography>
        <Typography noWrap title={row.label} sx={{ px: 0.75, position: "sticky", left: 65, zIndex: 5, alignSelf: "stretch", display: "flex", alignItems: "center", bgcolor: "inherit", fontSize: 10, fontWeight: 800, color: "#17365d", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis" }}>{row.label}</Typography>
        <Box /><Box />
      </Box>;
      const activity = row.activity;
      const start = activity.earlyStart;
      const finish = activity.earlyFinish;
      const left = start == null ? 0 : ((start - 1) / maxDay) * 100;
      const width = start == null || finish == null ? 0 : ((finish - start + 1) / maxDay) * 100;
      return <Box key={row.key} sx={{ display: "grid", gridTemplateColumns: ganttColumns, alignItems: "center", minHeight: rowHeight, borderBottom: "1px solid #edf0f4" }}>
        <Typography noWrap title={row.wbs} sx={{ px: 0.75, position: "sticky", left: 0, zIndex: 4, alignSelf: "stretch", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#fff", fontSize: 9.5, color: COLORS.ink }}>{row.wbs}</Typography>
        <Typography title={activity.subtaskTitle} noWrap sx={{ pl: 2, pr: 1, position: "sticky", left: 65, zIndex: 4, alignSelf: "stretch", display: "flex", alignItems: "center", bgcolor: "#fff", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", fontSize: 10, color: COLORS.ink }}>{activity.subtaskTitle}</Typography>
        <Typography sx={{ fontSize: 10, color: "#657086" }}>{activity.durationDays}d</Typography>
        <Box sx={{ height: 22, position: "relative", backgroundImage: "linear-gradient(to right, #e9edf4 1px, transparent 1px)", backgroundSize: "12.5% 100%" }}>
          {start != null && <Box title={`Day ${start}–${finish}`} sx={{ position: "absolute", zIndex: 2, left: `calc(${left}% + ${barInset}px)`, width: `calc(${Math.max(width, 1.8)}% - ${barInset * 2}px)`, minWidth: 4, top: 6, height: 10, borderRadius: 0.75, bgcolor: activity.isCritical ? COLORS.critical : COLORS.normal, boxShadow: "0 1px 2px rgba(17,36,71,.25)" }} />}
        </Box>
      </Box>;
    })}
    </Box>
    {!activities.length && <Typography sx={{ py: 5, textAlign: "center", color: "text.secondary" }}>No subtasks available.</Typography>}
  </Box></Box>;
}

function BaselineTimeline({ activities, wbsById, showHierarchy, fullHeight = false }: { activities: CpmActivity[]; wbsById: Map<string, WbsInfo>; showHierarchy: boolean; fullHeight?: boolean }) {
  const dated = activities.filter((activity) => activity.projectedStartDate && activity.projectedEndDate);
  const starts = dated.map((activity) => new Date(`${activity.projectedStartDate.slice(0, 10)}T00:00:00`).getTime());
  const finishes = dated.map((activity) => new Date(`${activity.projectedEndDate.slice(0, 10)}T00:00:00`).getTime());
  if (!dated.length) return <Alert severity="info">No original projected dates are available.</Alert>;

  const dayMs = 86_400_000;
  const minDate = Math.min(...starts);
  const maxDate = Math.max(...finishes);
  const totalDays = Math.max(1, Math.round((maxDate - minDate) / dayMs) + 1);
  const ticks = Array.from({ length: Math.min(totalDays, 6) }, (_, index) => {
    const offset = Math.round((index * (totalDays - 1)) / Math.max(Math.min(totalDays, 6) - 1, 1));
    return new Date(minDate + offset * dayMs).toISOString().slice(0, 10);
  });

  const rows = buildTimelineRows(activities, wbsById).filter((row) => showHierarchy || row.type === "activity");
  const baselineTimelineWidth = Math.max(430, totalDays * 24);
  const baselineColumns = `65px 260px 62px ${baselineTimelineWidth}px`;
  const contentHeight = 38 + rows.length * 28;
  return <Box sx={{ overflow: "auto", height: fullHeight ? "100%" : "auto", maxHeight: fullHeight ? "none" : 480 }}><Box sx={{ minWidth: 387 + baselineTimelineWidth, minHeight: fullHeight ? "100%" : contentHeight }}>
    <Box sx={{ display: "grid", gridTemplateColumns: baselineColumns, position: "sticky", top: 0, zIndex: 8, bgcolor: "#fff", pb: 0.75, borderBottom: "1px solid #e4e9f0" }}>
      <Typography sx={{ ...headingSx, position: "sticky", left: 0, zIndex: 10, bgcolor: "#fff" }}>WBS</Typography><Typography sx={{ ...headingSx, position: "sticky", left: 65, zIndex: 10, bgcolor: "#fff" }}>Scope of work</Typography><Typography sx={headingSx}>Duration</Typography>
      <Stack direction="row" justifyContent="space-between">{ticks.map((date) => <Typography key={date} sx={{ fontSize: 8.5, color: "#8791a5" }}>{formatDate(date, true)}</Typography>)}</Stack>
    </Box>
    {rows.map((row) => {
      if (!row.activity) return <Box key={row.key} sx={{ display: "grid", gridTemplateColumns: baselineColumns, alignItems: "center", minHeight: 28, bgcolor: row.type === "scope" ? "#b8cce4" : "#d9eaf7", borderBottom: "1px solid #c7d5e5" }}>
        <Typography sx={{ px: 0.75, position: "sticky", left: 0, zIndex: 5, alignSelf: "stretch", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "inherit", fontSize: 9.5, fontWeight: 850, color: "#17365d" }}>{row.wbs}</Typography>
        <Typography noWrap title={row.label} sx={{ px: 0.75, position: "sticky", left: 65, zIndex: 5, alignSelf: "stretch", display: "flex", alignItems: "center", bgcolor: "inherit", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", fontSize: 10, fontWeight: 800, color: "#17365d" }}>{row.label}</Typography>
        <Box /><Box />
      </Box>;
      const activity = row.activity;
      const start = activity.projectedStartDate ? new Date(`${activity.projectedStartDate.slice(0, 10)}T00:00:00`).getTime() : null;
      const finish = activity.projectedEndDate ? new Date(`${activity.projectedEndDate.slice(0, 10)}T00:00:00`).getTime() : null;
      const offset = start == null ? 0 : Math.round((start - minDate) / dayMs);
      const calendarDuration = start == null || finish == null ? 0 : Math.max(1, Math.round((finish - start) / dayMs) + 1);
      return <Box key={row.key} sx={{ display: "grid", gridTemplateColumns: baselineColumns, alignItems: "center", minHeight: 28, borderBottom: "1px solid #edf0f4" }}>
        <Typography noWrap title={row.wbs} sx={{ px: 0.75, position: "sticky", left: 0, zIndex: 4, alignSelf: "stretch", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#fff", fontSize: 9.5, color: COLORS.ink }}>{row.wbs}</Typography>
        <Typography noWrap title={activity.subtaskTitle} sx={{ pl: 2, pr: 1, position: "sticky", left: 65, zIndex: 4, alignSelf: "stretch", display: "flex", alignItems: "center", bgcolor: "#fff", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", fontSize: 10, color: COLORS.ink }}>{activity.subtaskTitle}</Typography>
        <Typography sx={{ fontSize: 9.5, color: "#657086" }}>{calendarDuration || "—"}d</Typography>
        <Box sx={{ height: 20, position: "relative", backgroundImage: "linear-gradient(to right, #e9edf4 1px, transparent 1px)", backgroundSize: "20% 100%" }}>
          {start != null && finish != null && <Box title={`${formatDate(activity.projectedStartDate)} – ${formatDate(activity.projectedEndDate)}`} sx={{ position: "absolute", left: `${(offset / totalDays) * 100}%`, width: `${Math.max((calendarDuration / totalDays) * 100, 1.8)}%`, top: 5, height: 10, borderRadius: 0.75, bgcolor: "#f59e0b", boxShadow: "0 1px 2px rgba(17,36,71,.2)" }} />}
        </Box>
      </Box>;
    })}
  </Box></Box>;
}

function NetworkActivityTable({ activities, wbsById }: { activities: CpmActivity[]; wbsById: Map<string, WbsInfo> }) {
  const rows = buildTimelineRows(activities, wbsById);
  return <Box sx={{ height: "calc(100vh - 165px)", overflow: "auto" }}>
    <Table stickyHeader size="small" sx={{ tableLayout: "fixed" }}>
      <TableHead><TableRow><TableCell sx={{ ...tableHeadSx, width: 64 }}>WBS</TableCell><TableCell sx={tableHeadSx}>Scope of work</TableCell><TableCell align="center" sx={{ ...tableHeadSx, width: 72 }}>Duration</TableCell></TableRow></TableHead>
      <TableBody>{rows.map((row) => {
        const activity = row.activity;
        const group = row.type !== "activity";
        return <TableRow key={row.key} sx={{ bgcolor: row.type === "scope" ? "#b8cce4" : row.type === "task" ? "#d9eaf7" : "#fff" }}>
          <TableCell sx={{ py: 0.8, fontSize: 10, fontWeight: group ? 850 : 600, color: group ? "#17365d" : COLORS.ink, textAlign: "center" }}>{row.wbs}</TableCell>
          <TableCell sx={{ py: 0.8 }}><Tooltip title={activity ? `${activity.scopeName} / ${activity.taskTitle} / ${activity.subtaskTitle}` : row.label} placement="top-start"><Typography noWrap sx={{ pl: activity ? 1.25 : 0, fontSize: 10.5, fontWeight: group ? 800 : 600, color: group ? "#17365d" : COLORS.ink }}>{row.label}</Typography></Tooltip>{activity && <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25, pl: 1.25 }}><Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: activity.isCritical ? COLORS.critical : COLORS.normal }} /><Typography sx={{ fontSize: 8.5, color: "#697386" }}>{activity.isCritical ? "Critical" : `Slack ${activity.slackDays ?? "—"}d`}</Typography></Stack>}</TableCell>
          <TableCell align="center" sx={{ py: 0.8, fontSize: 10, fontWeight: activity ? 700 : 400 }}>{activity ? `${activity.durationDays}d` : ""}</TableCell>
        </TableRow>;
      })}</TableBody>
    </Table>
  </Box>;
}

interface NetworkDiagramProps {
  activities: CpmActivity[];
  wbsById?: Map<string, WbsInfo>;
  expanded?: boolean;
  zoom?: number;
  metricsValid?: boolean;
  editable?: boolean;
  selectedId?: string | null;
  onNodeClick?: (id: string) => void;
  onEdgeClick?: (predecessorId: string, successorId: string) => void;
  canTarget?: (id: string) => boolean;
}

function NetworkDiagram({ activities, wbsById, expanded = false, zoom = 1, metricsValid = true, editable = false, selectedId, onNodeClick, onEdgeClick, canTarget }: NetworkDiagramProps) {
  const nodeWidth = expanded ? 230 : 190;
  const nodeHeight = 72;
  const sideWidth = 45;
  const graph = useMemo(() => {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: "LR", ranksep: 54, nodesep: 25, marginx: 16, marginy: 16 });
    g.setDefaultEdgeLabel(() => ({}));
    activities.forEach((activity) => g.setNode(activity.subtaskId, { width: nodeWidth, height: nodeHeight }));
    const ids = new Set(activities.map((item) => item.subtaskId));
    activities.forEach((activity) => activity.predecessorIds.forEach((id) => { if (ids.has(id)) g.setEdge(id, activity.subtaskId); }));
    dagre.layout(g);
    return g;
  }, [activities, nodeHeight, nodeWidth]);
  const dimensions = graph.graph() as { width?: number; height?: number };
  const width = Math.max(dimensions.width || 320, 320);
  const height = Math.max(dimensions.height || 190, 190);
  const byId = new Map(activities.map((item) => [item.subtaskId, item]));

  if (!activities.length) return <Typography sx={{ py: 5, textAlign: "center", color: "text.secondary" }}>No activities available.</Typography>;
  return <Box sx={{ width: "100%", height: expanded ? "calc(100vh - 210px)" : "auto", overflow: "auto" }}><svg viewBox={`0 0 ${width} ${height}`} width={expanded ? Math.max(width * zoom, 760) : "100%"} height={expanded ? Math.max(height * zoom, 520) : undefined} style={{ minWidth: 340, maxHeight: expanded ? "none" : 300, display: "block" }}>
    <defs>
      <marker id="cpm-arrow-green" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill={COLORS.critical} /></marker>
      <marker id="cpm-arrow-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill={COLORS.normal} /></marker>
    </defs>
    {graph.edges().map((edge) => {
      const points = graph.edge(edge).points as Array<{ x: number; y: number }>;
      const critical = Boolean(metricsValid && byId.get(edge.v)?.isCritical && byId.get(edge.w)?.isCritical);
      const path = points.map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ");
      return <path key={`${edge.v}-${edge.w}`} d={path} fill="none" stroke={critical ? COLORS.critical : COLORS.normal} strokeWidth={editable ? 4 : 2} opacity={editable ? 0.82 : 1} markerEnd={`url(#cpm-arrow-${critical ? "green" : "blue"})`} onClick={() => onEdgeClick?.(edge.v, edge.w)} style={{ cursor: editable ? "pointer" : "default" }} />;
    })}
    {activities.map((activity) => {
      const node = graph.node(activity.subtaskId) as { x: number; y: number; width: number; height: number };
      const selected = selectedId === activity.subtaskId;
      const validTarget = Boolean(selectedId && canTarget?.(activity.subtaskId));
      const critical = metricsValid && activity.isCritical;
      const color = selected ? "#6d28d9" : validTarget ? "#22a35a" : critical ? COLORS.critical : COLORS.normal;
      return <g key={activity.subtaskId} transform={`translate(${node.x - node.width / 2},${node.y - node.height / 2})`} onClick={() => onNodeClick?.(activity.subtaskId)} style={{ cursor: editable ? "pointer" : "default" }}>
        <title>{`${activity.scopeName} / ${activity.taskTitle} / ${activity.subtaskTitle}`}</title>
        <rect width={node.width} height={node.height} rx="3" fill={selected ? "#f4efff" : validTarget ? "#effcf4" : "#fff"} stroke={color} strokeWidth={selected || validTarget || critical ? 2.5 : 1.5} opacity={selectedId && !selected && !validTarget ? 0.48 : 1} />
        <line x1="0" y1={nodeHeight / 2} x2={nodeWidth} y2={nodeHeight / 2} stroke={color} strokeWidth="1" />
        <line x1={sideWidth} y1="0" x2={sideWidth} y2={nodeHeight} stroke={color} strokeWidth="1" />
        <line x1={nodeWidth - sideWidth} y1="0" x2={nodeWidth - sideWidth} y2={nodeHeight} stroke={color} strokeWidth="1" />
        <text x={sideWidth / 2} y="23" textAnchor="middle" fontSize="10" fontWeight="700" fill={COLORS.ink}>{metricsValid ? activity.earlyStart ?? "—" : "—"}</text>
        <text x={nodeWidth / 2} y="14" textAnchor="middle" fontSize="8" fontWeight="800" fill="#64748b">{wbsById?.get(activity.subtaskId)?.subtaskWbs || "WBS"}</text>
        <text x={nodeWidth / 2} y="28" textAnchor="middle" fontSize="9.5" fontWeight="800" fill={COLORS.ink}>{shortTitle(activity.subtaskTitle, expanded ? 24 : 18)}</text>
        <text x={nodeWidth - sideWidth / 2} y="23" textAnchor="middle" fontSize="10" fontWeight="700" fill={COLORS.ink}>{metricsValid ? activity.earlyFinish ?? "—" : "—"}</text>
        <text x={sideWidth / 2} y="58" textAnchor="middle" fontSize="10" fontWeight="700" fill={COLORS.ink}>{metricsValid ? activity.lateStart ?? "—" : "—"}</text>
        <text x={nodeWidth / 2} y="58" textAnchor="middle" fontSize="10" fontWeight="800" fill={COLORS.ink}>{activity.durationDays}d</text>
        <text x={nodeWidth - sideWidth / 2} y="58" textAnchor="middle" fontSize="10" fontWeight="700" fill={COLORS.ink}>{metricsValid ? activity.lateFinish ?? "—" : "—"}</text>
      </g>;
    })}
  </svg></Box>;
}

const headingSx = { fontSize: 9.5, fontWeight: 800, color: "#667085", textTransform: "uppercase" } as const;

export default function ProjectSchedulingStep({ projectId, canUpdate, scopes }: Props) {
  const [data, setData] = useState<CpmData | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<DependencyDraft>({});
  const [editorMessage, setEditorMessage] = useState("");
  const [previewData, setPreviewData] = useState<CpmData | null>(null);
  const [previewedGraphKey, setPreviewedGraphKey] = useState<string | null>(null);
  const [showHierarchy, setShowHierarchy] = useState(true);
  const [fullView, setFullView] = useState<"gantt" | "network" | null>(null);
  const [fullTimelineTab, setFullTimelineTab] = useState<"cpm" | "original">("cpm");
  const [networkZoom, setNetworkZoom] = useState(1);

  const wbsById = useMemo(() => {
    const result = new Map<string, WbsInfo>();
    const projectScopes = scopes as WbsScope[];
    [...projectScopes].sort((a, b) => Number(a?.order ?? 0) - Number(b?.order ?? 0)).forEach((scope, scopeIndex) => {
      [...(scope?.tasks || [])].sort((a, b) => Number(a?.order ?? 0) - Number(b?.order ?? 0)).forEach((task, taskIndex) => {
        [...(task?.subtasks || [])].sort((a, b) => Number(a?.order ?? 0) - Number(b?.order ?? 0)).forEach((subtask, subtaskIndex) => {
          result.set(String(subtask.id), {
            scopeWbs: `${scopeIndex + 1}.0`,
            taskWbs: `${scopeIndex + 1}.${taskIndex + 1}`,
            subtaskWbs: `${scopeIndex + 1}.${taskIndex + 1}.${subtaskIndex + 1}`,
          });
        });
      });
    });
    return result;
  }, [scopes]);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await getProjectCpm(projectId)); }
    catch (loadError) { setError(errorMessage(loadError)); }
    finally { setLoading(false); }
  }, [projectId]);
  useEffect(() => { void load(); }, [load]);

  const byId = useMemo(() => new Map((data?.activities || []).map((item) => [item.subtaskId, item])), [data]);
  const openEditor = () => {
    if (!data) return;
    setDraft(Object.fromEntries(data.activities.map((item) => [item.subtaskId, [...item.predecessorIds]])));
    setPreviewData(data); setPreviewedGraphKey(null);
    setEditorMessage(""); setError(""); setEditorOpen(true);
  };
  const updatePredecessors = (successorId: string, predecessorIds: string[]) => {
    const baseDraft = { ...draft, [successorId]: [] };
    const nextIds: string[] = [];
    for (const predecessorId of predecessorIds) {
      const candidateDraft = { ...baseDraft, [successorId]: nextIds };
      if (createsCycle(candidateDraft, predecessorId, successorId)) {
        setEditorMessage("That preceding task was not added because it would create a circular dependency.");
        return;
      }
      nextIds.push(predecessorId);
    }
    setDraft({ ...draft, [successorId]: nextIds });
    setPreviewData(null); setPreviewedGraphKey(null);
    setEditorMessage("Network updated. Click Calculate to preview the CPM results.");
  };
  const getDraftDependencies = (): CpmDependency[] => (data?.activities || []).flatMap((activity) =>
    (draft[activity.subtaskId] || []).map((predecessorSubtaskId) => ({
      predecessorSubtaskId,
      successorSubtaskId: activity.subtaskId,
    })),
  );
  const calculatePreview = async () => {
    setCalculating(true); setError(""); setEditorMessage("");
    try {
      const preview = await previewProjectCpm(projectId, getDraftDependencies());
      setPreviewData(preview);
      setPreviewedGraphKey(draftGraphKey);
      setEditorMessage("Preview calculated. Review the CPM values and critical path, then click Save.");
    } catch (previewError) {
      setPreviewData(null); setPreviewedGraphKey(null); setError(errorMessage(previewError));
    } finally { setCalculating(false); }
  };
  const saveDependencies = async () => {
    if (!data) return;
    const dependencies: CpmDependency[] = getDraftDependencies();
    setSaving(true); setError("");
    try { setData(await saveProjectCpmDependencies(projectId, dependencies)); setEditorOpen(false); }
    catch (saveError) { setError(errorMessage(saveError)); }
    finally { setSaving(false); }
  };

  if (loading) return <Box sx={{ minHeight: 360, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  if (!data) return <Alert severity="error" action={<Button onClick={() => void load()}>Retry</Button>}>{error || "Unable to load the CPM schedule."}</Alert>;

  const criticalPaths = data.summary.criticalPaths;
  const variance = data.summary.deadlineVarianceDays;
  const draftActivities = data.activities.map((activity) => ({ ...activity, predecessorIds: draft[activity.subtaskId] || [] }));
  const savedGraphKey = JSON.stringify(data.activities.map((activity) => [activity.subtaskId, [...activity.predecessorIds].sort()]));
  const draftGraphKey = JSON.stringify(data.activities.map((activity) => [activity.subtaskId, [...(draft[activity.subtaskId] || [])].sort()]));
  const draftDirty = savedGraphKey !== draftGraphKey;
  const previewIsCurrent = previewedGraphKey === draftGraphKey && Boolean(previewData);
  const editorActivities = previewIsCurrent && previewData ? previewData.activities : draftActivities;

  return <Stack spacing={1.5}>
    <Card elevation={0} sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 2.5 }}><CardContent sx={{ p: { xs: 1.5, md: 2 }, "&:last-child": { pb: { xs: 1.5, md: 2 } } }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} gap={1.25}>
        <Box><Stack direction="row" spacing={0.8} alignItems="center"><AccountTreeOutlinedIcon sx={{ color: "#234d7f" }} /><Typography variant="h6" fontWeight={800} color={COLORS.ink}>CPM Schedule Overview</Typography></Stack><Typography sx={{ mt: 0.25, fontSize: 12.5, color: "#697386" }}>See the project flow, critical activities, and expected completion at a glance.</Typography></Box>
        <Stack direction="row" spacing={1} alignItems="center"><Button size="small" variant="outlined" startIcon={<RefreshIcon />} onClick={() => void load()}>Refresh</Button>{canUpdate && <Button size="small" variant="contained" startIcon={<EditOutlinedIcon />} onClick={openEditor}>Set dependencies</Button>}</Stack>
      </Stack>
      {error && !editorOpen && <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert>}
      {data.warnings.map((warning) => <Alert severity="warning" key={warning.code} sx={{ mt: 1.5 }}>{warning.message}</Alert>)}
    </CardContent></Card>

    <Grid container spacing={1.5}>
      <Grid size={{ xs: 12, lg: canUpdate ? 7 : 12 }}><Card elevation={0} sx={panelSx}><CardContent><Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}><Typography sx={{ ...panelHeadingSx, mb: 0 }}>CPM calculated timeline</Typography><Stack direction="row" alignItems="center"><FormControlLabel control={<Checkbox size="small" checked={showHierarchy} onChange={(event) => setShowHierarchy(event.target.checked)} />} label="Show hierarchy" sx={{ mr: 0.5, "& .MuiFormControlLabel-label": { fontSize: 11, color: "#526078" } }} /><Tooltip title="View full timeline"><IconButton size="small" onClick={() => { setFullTimelineTab("cpm"); setFullView("gantt"); }}><FullscreenIcon fontSize="small" /></IconButton></Tooltip></Stack></Stack><GanttOverview activities={data.activities} duration={data.summary.projectDurationDays || 1} wbsById={wbsById} showHierarchy={showHierarchy} /><Divider sx={{ my: 1.25 }} /><Legend /></CardContent></Card></Grid>
      <Grid size={{ xs: 12, lg: canUpdate ? 5 : 12 }}><Card elevation={0} sx={panelSx}><CardContent><Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}><Typography sx={{ ...panelHeadingSx, mb: 0 }}>Network diagram</Typography><Tooltip title="View full network"><IconButton size="small" onClick={() => setFullView("network")}><FullscreenIcon fontSize="small" /></IconButton></Tooltip></Stack><NetworkDiagram activities={data.activities} wbsById={wbsById} /></CardContent></Card></Grid>
      <Grid size={{ xs: 12, md: canUpdate ? 7 : 12 }}><Card elevation={0} sx={panelSx}><CardContent><Stack direction="row" justifyContent="space-between" alignItems="center"><Typography sx={panelHeadingSx}>Original / baseline timeline</Typography><Tooltip title="View full timeline"><IconButton size="small" onClick={() => { setFullTimelineTab("original"); setFullView("gantt"); }}><FullscreenIcon fontSize="small" /></IconButton></Tooltip></Stack><Typography sx={{ mt: -0.75, mb: 1.25, fontSize: 10.5, color: "#697386" }}>Based on the projected dates entered in Project Structure.</Typography><BaselineTimeline activities={data.activities} wbsById={wbsById} showHierarchy={showHierarchy} /></CardContent></Card></Grid>
      <Grid size={{ xs: 12, md: canUpdate ? 5 : 12 }}><Card elevation={0} sx={panelSx}><CardContent><Typography sx={panelHeadingSx}>Schedule summary</Typography>
        {[["Project start", formatDate(data.project.startDate)], ["Calculated finish", formatDate(data.summary.calculatedFinishDate)], ["Total duration", data.summary.projectDurationDays == null ? "—" : `${data.summary.projectDurationDays} days`], ["Critical activities", String(data.summary.criticalActivityCount)], ["Deadline variance", variance == null ? "—" : `${Math.abs(variance)} day(s) ${variance >= 0 ? "available" : "late"}`]].map(([label, value]) => <Stack key={label} direction="row" justifyContent="space-between" sx={{ py: 0.48 }}><Typography sx={{ fontSize: 10.5, color: "#657086" }}>{label}</Typography><Typography sx={{ fontSize: 10.5, fontWeight: 750, color: COLORS.ink }}>{value}</Typography></Stack>)}
        <Divider sx={{ my: 0.75 }} /><Chip size="small" color={data.summary.status === "CALCULATED" ? "success" : data.summary.status === "INVALID" ? "error" : "warning"} label={data.summary.status.replaceAll("_", " ")} />
      </CardContent></Card></Grid>
    </Grid>

    {criticalPaths.length > 0 && <Card elevation={0} sx={{ border: "1px solid #f1a1a1", bgcolor: "#fff8f8", borderRadius: 2.5 }}><CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
      <Typography sx={{ fontSize: 12, fontWeight: 850, color: "#a41e22" }}>Critical activity sequence</Typography>
      <Typography sx={{ mt: 0.25, fontSize: 10.5, color: "#7f3437" }}>These activities must finish in this order and directly control the project completion date.</Typography>
      {criticalPaths.map((path, pathIndex) => <Box key={`critical-path-${pathIndex}`} sx={{ mt: 1.25 }}>
        {criticalPaths.length > 1 && <Typography sx={{ mb: 0.6, fontSize: 10, fontWeight: 800, color: "#a41e22" }}>Path {pathIndex + 1}</Typography>}
        <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} spacing={0.65} useFlexGap sx={{ flexWrap: { sm: "wrap" } }}>
          {path.map((id, activityIndex) => {
            const activity = byId.get(id);
            const wbs = wbsById.get(id)?.subtaskWbs;
            const hierarchy = activity ? `${activity.scopeName} / ${activity.taskTitle} / ${activity.subtaskTitle}` : id;
            return <Stack key={`${id}-${activityIndex}`} direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "center", sm: "center" }} spacing={0.65}>
              <Tooltip title={hierarchy} placement="top">
                <Box sx={{ minWidth: 150, maxWidth: 240, px: 1.1, py: 0.75, border: "1px solid #ed9a9d", borderRadius: 1.5, bgcolor: "#fff" }}>
                  <Typography sx={{ fontSize: 9.5, fontWeight: 850, color: "#a41e22" }}>{wbs || `Step ${activityIndex + 1}`}</Typography>
                  <Typography noWrap sx={{ fontSize: 11, fontWeight: 750, color: COLORS.ink }}>{activity?.subtaskTitle || id}</Typography>
                  {activity && <Typography sx={{ fontSize: 9.5, color: "#697386" }}>{activity.durationDays} day{activity.durationDays === 1 ? "" : "s"}</Typography>}
                </Box>
              </Tooltip>
              {activityIndex < path.length - 1 && <ArrowForwardRoundedIcon sx={{ color: COLORS.critical, fontSize: 20, transform: { xs: "rotate(90deg)", sm: "none" } }} />}
            </Stack>;
          })}
        </Stack>
      </Box>)}
    </CardContent></Card>}

    <Dialog open={Boolean(fullView)} onClose={() => setFullView(null)} fullScreen>
      <Box sx={{ px: { xs: 1.5, md: 2.5 }, py: 1.25, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #d8dee9", bgcolor: "#fff" }}>
        <Typography sx={{ fontSize: 16, fontWeight: 850, color: COLORS.ink }}>{fullView === "gantt" ? "Schedule Timeline" : "CPM Network Diagram"}</Typography>
        {fullView === "gantt" && <Tabs value={fullTimelineTab} onChange={(_, value: "cpm" | "original") => setFullTimelineTab(value)} sx={{ minHeight: 38, "& .MuiTab-root": { minHeight: 38, px: 2.5, fontSize: 12, fontWeight: 800, textTransform: "none" } }}><Tab value="cpm" label="CPM" /><Tab value="original" label="Original" /></Tabs>}
        <Stack direction="row" alignItems="center" spacing={1}>
          {fullView === "gantt" && <FormControlLabel control={<Checkbox size="small" checked={showHierarchy} onChange={(event) => setShowHierarchy(event.target.checked)} />} label="Show hierarchy" sx={{ mr: 0, "& .MuiFormControlLabel-label": { fontSize: 12 } }} />}
          <IconButton aria-label="Close full view" onClick={() => setFullView(null)}><CloseIcon /></IconButton>
        </Stack>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden", p: { xs: 1, md: 1.5 }, bgcolor: "#f6f8fc" }}>
        <Card elevation={0} sx={{ height: "100%", border: "1px solid #d8dee9", borderRadius: 2, overflow: "hidden" }}><CardContent sx={{ height: "100%", p: { xs: 1.25, md: 1.5 }, "&:last-child": { pb: { xs: 1.25, md: 1.5 } }, boxSizing: "border-box", overflow: "hidden" }}>
          {fullView === "gantt" && fullTimelineTab === "cpm" && <Box sx={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column" }}><Box sx={{ flex: 1, minHeight: 0 }}><GanttOverview activities={data.activities} duration={data.summary.projectDurationDays || 1} wbsById={wbsById} showHierarchy={showHierarchy} fullHeight /></Box><Divider sx={{ my: 1.25 }} /><Legend /></Box>}
          {fullView === "gantt" && fullTimelineTab === "original" && <Box sx={{ height: "100%", minHeight: 0 }}><BaselineTimeline activities={data.activities} wbsById={wbsById} showHierarchy={showHierarchy} fullHeight /></Box>}
          {fullView === "network" && <Grid container sx={{ height: "100%", minHeight: 0 }}>
            <Grid size={{ xs: 12, md: 4 }} sx={{ minHeight: 0, borderRight: { md: "1px solid #d8dee9" }, borderBottom: { xs: "1px solid #d8dee9", md: 0 } }}>
              <Box sx={{ px: 1.25, py: 1, borderBottom: "1px solid #d8dee9", bgcolor: "#f8fafc" }}><Typography sx={{ fontSize: 11, fontWeight: 850, color: COLORS.ink, textTransform: "uppercase" }}>Activity reference</Typography></Box>
              <NetworkActivityTable activities={data.activities} wbsById={wbsById} />
            </Grid>
            <Grid size={{ xs: 12, md: 8 }} sx={{ minHeight: 0, overflow: "hidden" }}>
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ height: 44, px: 1.5, borderBottom: "1px solid #d8dee9", bgcolor: "#f8fafc" }}>
                <Tooltip title="Zoom out"><span><IconButton size="small" disabled={networkZoom <= 0.5} onClick={() => setNetworkZoom((value) => Math.max(0.5, Number((value - 0.1).toFixed(1))))}><ZoomOutIcon fontSize="small" /></IconButton></span></Tooltip>
                <Slider size="small" min={0.5} max={2.5} step={0.1} value={networkZoom} onChange={(_, value) => setNetworkZoom(value as number)} sx={{ width: { xs: 130, sm: 220 } }} aria-label="Network zoom" />
                <Typography sx={{ width: 44, fontSize: 10.5, fontWeight: 750, color: "#526078" }}>{Math.round(networkZoom * 100)}%</Typography>
                <Tooltip title="Zoom in"><span><IconButton size="small" disabled={networkZoom >= 2.5} onClick={() => setNetworkZoom((value) => Math.min(2.5, Number((value + 0.1).toFixed(1))))}><ZoomInIcon fontSize="small" /></IconButton></span></Tooltip>
                <Tooltip title="Reset to fit"><IconButton size="small" onClick={() => setNetworkZoom(1)}><FitScreenIcon fontSize="small" /></IconButton></Tooltip>
              </Stack>
              <Box sx={{ p: 1 }}><NetworkDiagram activities={data.activities} wbsById={wbsById} expanded zoom={networkZoom} /></Box>
            </Grid>
          </Grid>}
        </CardContent></Card>
      </Box>
    </Dialog>

    <Dialog open={editorOpen} onClose={() => !saving && setEditorOpen(false)} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Build dependency network</DialogTitle>
      <DialogContent dividers>
        <Typography sx={{ mb: 1.5, fontSize: 12.5, color: "#344054" }}>
          Choose each task&apos;s preceding task on the left. The network diagram updates immediately on the right.
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
        {editorMessage && <Alert severity={editorMessage.includes("circular") ? "warning" : "info"} sx={{ mb: 1.5 }}>{editorMessage}</Alert>}
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <TableContainer sx={{ maxHeight: 470, overflowX: "hidden", border: "1px solid #d8dee9", borderRadius: 2 }}>
              <Table stickyHeader size="small" sx={{ tableLayout: "fixed", width: "100%" }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ ...tableHeadSx, width: "11%" }}>WBS</TableCell>
                    <TableCell sx={{ ...tableHeadSx, width: "25%" }}>Activity</TableCell>
                    <TableCell sx={{ ...tableHeadSx, width: "49%" }}>Predecessor (comes first)</TableCell>
                    <TableCell align="center" sx={{ ...tableHeadSx, width: "15%", whiteSpace: "normal" }}>Duration</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.activities.map((activity) => {
                    const options = data.activities.filter((item) => item.subtaskId !== activity.subtaskId);
                    const selected = (draft[activity.subtaskId] || []).map((id) => byId.get(id)).filter((item): item is CpmActivity => Boolean(item));
                    return <TableRow key={activity.subtaskId} hover>
                      <TableCell sx={{ fontSize: 10.5, fontWeight: 800, color: "#475467" }}>{wbsById.get(activity.subtaskId)?.subtaskWbs || "—"}</TableCell>
                      <TableCell sx={{ overflow: "hidden" }}><Tooltip title={`${wbsById.get(activity.subtaskId)?.subtaskWbs || ""} — ${activity.scopeName} / ${activity.taskTitle} / ${activity.subtaskTitle}`} placement="top-start"><Typography sx={{ fontSize: 11.5, fontWeight: 750, color: COLORS.ink, display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden", wordBreak: "break-word" }}>{activity.subtaskTitle}</Typography></Tooltip></TableCell>
                      <TableCell sx={{ overflow: "hidden" }}><Autocomplete multiple limitTags={1} getLimitTagsText={(more) => `+${more}`} size="small" options={options} value={selected} getOptionLabel={(item) => `${wbsById.get(item.subtaskId)?.subtaskWbs || ""} — ${item.subtaskTitle}`} isOptionEqualToValue={(option, value) => option.subtaskId === value.subtaskId} onChange={(_, values) => updatePredecessors(activity.subtaskId, values.map((item) => item.subtaskId))} sx={{ width: "100%", "& .MuiAutocomplete-tag": { maxWidth: "calc(100% - 54px)" }, "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" } }} renderInput={(params) => <TextField {...params} placeholder={selected.length ? "" : "Select"} />} /></TableCell>
                      <TableCell align="center"><Chip size="small" variant="outlined" label={`${activity.durationDays} day${activity.durationDays === 1 ? "" : "s"}`} /></TableCell>
                    </TableRow>;
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Stack direction="row" justifyContent="center" spacing={2} sx={{ mb: 0.75 }}>
              <Typography sx={{ fontSize: 9.5, color: "#657086" }}>Top: ES | Activity | EF</Typography>
              <Typography sx={{ fontSize: 9.5, color: "#657086" }}>Bottom: LS | Duration | LF</Typography>
            </Stack>
            <Box sx={{ minHeight: 470, display: "grid", placeItems: "center", border: "1px solid #d8dee9", borderRadius: 2, bgcolor: "#fbfcfe", p: 1 }}>
              <NetworkDiagram activities={editorActivities} wbsById={wbsById} metricsValid={previewIsCurrent || !draftDirty} />
            </Box>
          </Grid>
        </Grid>
        <Box sx={{ mt: 1.25 }}><Legend /></Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={() => setEditorOpen(false)} disabled={saving || calculating}>Cancel</Button>
        <Button variant="outlined" onClick={() => void calculatePreview()} disabled={saving || calculating} startIcon={calculating ? <CircularProgress size={15} /> : undefined}>{calculating ? "Calculating…" : "Calculate"}</Button>
        <Button variant="contained" onClick={() => void saveDependencies()} disabled={saving || calculating || !previewIsCurrent} startIcon={saving ? <CircularProgress size={15} color="inherit" /> : undefined}>{saving ? "Saving…" : "Save"}</Button>
      </DialogActions>
    </Dialog>
  </Stack>;
}

const panelSx = { height: "100%", border: `1px solid ${COLORS.border}`, borderRadius: 2.5 } as const;
const panelHeadingSx = { mb: 1.25, fontSize: 11, fontWeight: 850, color: COLORS.ink, textTransform: "uppercase" } as const;
const tableHeadSx = { bgcolor: "#f3f6fa", color: "#445069", fontSize: 10, fontWeight: 850, textTransform: "uppercase", whiteSpace: "nowrap" } as const;
