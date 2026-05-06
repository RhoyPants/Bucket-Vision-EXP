"use client";

import React, {
  useMemo,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import {
  Box,
  Typography,
  IconButton,
  Stack,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useAppSelector } from "@/app/redux/hook";

const LEFT_W     = 580;
const ROW_H      = 40;
const HDR_MONTH  = 26;
const HDR_SUB    = 26;
const HDR_H      = HDR_MONTH + HDR_SUB;
const VIEWPORT_H = 600;
const MIN_ROWS   = 10;
const OVERSCAN   = 6;
const MS_DAY     = 86_400_000;

type ZoomLevel = "day" | "week" | "month";
const ZOOM_PX: Record<ZoomLevel, number> = { day: 40, week: 10, month: 3 };

interface Props {
  projectId?: string | null;
  project?: any;
}

interface DragState {
  type: "move" | "resize-left" | "resize-right";
  id: string;
  startX: number;
  origStart: number;
  origEnd: number;
}

const toMs = (v: any): number | null => {
  if (v == null) return null;
  if (typeof v === "number") return isNaN(v) ? null : v;
  const ms = new Date(v).getTime();
  return isNaN(ms) ? null : ms;
};

const fmtDate = (ms: number | null | undefined): string => {
  if (!ms) return "0";
  return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
const isMonday  = (d: Date) => d.getDay() === 1;
const isToday   = (d: Date) => d.toDateString() === new Date().toDateString();

const barColor = (row: any): string => {
  if (row.type === "scope") return "#5E35B1";
  if (row.type === "task")  return "#0D47A1";
  if (row.progress === 100) return "#00C853";
  if (!row.actualStartDate) return "#FFA726";
  return "#29B6F6";
};
export default function GanttGridView({ projectId, project: externalProject }: Props) {
  const reduxProject = useAppSelector((s) => s.project.fullProject);
  const fullProject  = externalProject || reduxProject;

  const [expandedScopes, setExpandedScopes] = useState<Set<string>>(new Set());
  const [expandedTasks,  setExpandedTasks]  = useState<Set<string>>(new Set());
  const [zoom,           setZoom]           = useState<ZoomLevel>("day");
  const [scrollTop,      setScrollTop]      = useState(0);
  const [overrides,      setOverrides]      = useState<Record<string, { start: number; end: number }>>({});

  const dragRef   = useRef<DragState | null>(null);
  const rafRef    = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const pxPerDay = ZOOM_PX[zoom];
const dates = useMemo<Date[]>(() => {
    if (!fullProject?.scopes) return [];
    const all: number[] = [];
    fullProject.scopes.forEach((sc: any) =>
      sc.tasks?.forEach((t: any) =>
        t.subtasks?.forEach((s: any) => {
          const a = toMs(s.projectedStartDate || s.startDate);
          const b = toMs(s.projectedEndDate   || s.endDate);
          if (a && b) all.push(a, b);
        })
      )
    );
    if (!all.length) return [];
    const min = Math.min(...all);
    const max = Math.max(...all);
    const out: Date[] = [];
    const cur = new Date(min);
    while (cur.getTime() <= max) { out.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
    return out;
  }, [fullProject]);

  const timelineW = Math.max(dates.length * pxPerDay, 200);
const monthGroups = useMemo(() => {
    const groups: { label: string; days: number }[] = [];
    let cur = "", cnt = 0;
    dates.forEach((d) => {
      const k = d.toLocaleString("default", { month: "short", year: "numeric" });
      if (k !== cur) { if (cur) groups.push({ label: cur, days: cnt }); cur = k; cnt = 1; }
      else cnt++;
    });
    if (cur) groups.push({ label: cur, days: cnt });
    return groups;
  }, [dates]);
 const weekGroups = useMemo(() => {
    if (zoom !== "week") return [];
    const isoWeek = (d: Date) => {
      const tmp = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      tmp.setDate(tmp.getDate() + 4 - (tmp.getDay() || 7));
      const y0 = new Date(tmp.getFullYear(), 0, 1);
      return Math.ceil(((tmp.getTime() - y0.getTime()) / 86400000 + 1) / 7);
    };
    const groups: { label: string; days: number }[] = [];
    let wk = -1, cnt = 0;
    dates.forEach((d) => {
      const w = isoWeek(d);
      if (w !== wk) { if (wk >= 0) groups.push({ label: `W${wk}`, days: cnt }); wk = w; cnt = 1; }
      else cnt++;
    });
    if (wk >= 0) groups.push({ label: `W${wk}`, days: cnt });
    return groups;
  }, [dates, zoom]);
 const weekendBg = useMemo((): string | undefined => {
    if (zoom !== "day" || !dates.length) return undefined;
    const stops: string[] = [];
    let inWe = false;
    dates.forEach((d, i) => {
      const pos = i * pxPerDay;
      const we  = isWeekend(d);
      if (we && !inWe)  { stops.push(`transparent ${pos}px`, `rgba(241,201,161,0.3) ${pos}px`); inWe = true; }
      if (!we && inWe)  { stops.push(`rgba(241,201,161,0.3) ${pos}px`, `transparent ${pos}px`); inWe = false; }
    });
    if (inWe) stops.push(`rgba(241,201,161,0.3) ${timelineW}px`);
    return stops.length ? `linear-gradient(to right, transparent, ${stops.join(",")})` : undefined;
  }, [dates, pxPerDay, zoom, timelineW]);
 const todayX   = useMemo(() => { const i = dates.findIndex(isToday); return i >= 0 ? i * pxPerDay : null; }, [dates, pxPerDay]);
  const mondayXs = useMemo(() => zoom === "day" ? dates.reduce<number[]>((a, d, i) => { if (isMonday(d)) a.push(i * pxPerDay); return a; }, []) : [], [dates, pxPerDay, zoom]);
const baseRows = useMemo(() => {
    if (!fullProject?.scopes) return [];
    const out: any[] = [];
    fullProject.scopes.forEach((sc: any, si: number) => {
      out.push({ ...sc, type: "scope", _si: si });
      if (!expandedScopes.has(sc.id)) return;
      sc.tasks?.forEach((t: any, ti: number) => {
        out.push({ ...t, type: "task", _si: si, _ti: ti });
        if (!expandedTasks.has(t.id)) return;
        t.subtasks?.forEach((sub: any, xi: number) => {
          out.push({ ...sub, type: "subtask", _si: si, _ti: ti, _xi: xi });
        });
      });
    });
    return out;
  }, [fullProject, expandedScopes, expandedTasks]);

  // Pad to MIN_ROWS so the UI never looks empty
  const rows = useMemo(() => {
    const pad = Math.max(0, MIN_ROWS - baseRows.length);
    return [...baseRows, ...Array.from({ length: pad }, (_, i) => ({ type: "empty", _pad: i }))];
  }, [baseRows]);
 const visStart = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN);
  const visEnd   = Math.min(rows.length, Math.ceil((scrollTop + VIEWPORT_H) / ROW_H) + OVERSCAN);
  const topSp    = visStart * ROW_H;
  const botSp    = (rows.length - visEnd) * ROW_H;
 const getRowMs = useCallback((row: any): { start: number | null; end: number | null } => {
    if (row.type === "empty") return { start: null, end: null };

    if (row.type === "subtask") {
      const ov = overrides[row.id];
      return {
        start: ov ? ov.start : toMs(row.projectedStartDate || row.startDate),
        end:   ov ? ov.end   : toMs(row.projectedEndDate   || row.endDate),
      };
    }

    if (row.type === "task") {
      const subs = row.subtasks || [];
      const starts = subs.map((s: any) => { const ov = overrides[s.id]; return ov ? ov.start : toMs(s.projectedStartDate || s.startDate); }).filter(Boolean) as number[];
      const ends   = subs.map((s: any) => { const ov = overrides[s.id]; return ov ? ov.end   : toMs(s.projectedEndDate   || s.endDate);   }).filter(Boolean) as number[];
      if (!starts.length) return { start: null, end: null };
      return { start: Math.min(...starts), end: Math.max(...ends) };
    }

    if (row.type === "scope") {
      const starts: number[] = [], ends: number[] = [];
      row.tasks?.forEach((t: any) =>
        t.subtasks?.forEach((s: any) => {
          const ov = overrides[s.id];
          const a  = ov ? ov.start : toMs(s.projectedStartDate || s.startDate);
          const b  = ov ? ov.end   : toMs(s.projectedEndDate   || s.endDate);
          if (a) starts.push(a);
          if (b) ends.push(b);
        })
      );
      if (!starts.length) return { start: null, end: null };
      return { start: Math.min(...starts), end: Math.max(...ends) };
    }

    return { start: null, end: null };
  }, [overrides]);

  const getOffsetPx = useCallback((ms: number | null) =>
    !ms || !dates.length ? 0 : Math.max(0, (ms - dates[0].getTime()) / MS_DAY * pxPerDay),
  [dates, pxPerDay]);

  const getDurPx = useCallback((s: number | null, e: number | null) =>
    !s || !e ? 0 : Math.max(2, ((e - s) / MS_DAY + 1) * pxPerDay),
  [pxPerDay]);
const toggleScope = (id: string) => setExpandedScopes(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const toggleTask  = (id: string) => setExpandedTasks(p  => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });
 const startDrag = useCallback((e: React.MouseEvent, row: any, type: DragState["type"]) => {
    e.preventDefault();
    e.stopPropagation();
    const { start, end } = getRowMs(row);
    if (!start || !end) return;
    dragRef.current = { type, id: row.id, startX: e.clientX, origStart: start, origEnd: end };
  }, [getRowMs]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const delta = ((e.clientX - d.startX) / pxPerDay) * MS_DAY;
      let ns = d.origStart, ne = d.origEnd;
      if      (d.type === "move")         { ns = d.origStart + delta; ne = d.origEnd + delta; }
      else if (d.type === "resize-left")  { ns = Math.min(d.origStart + delta, d.origEnd - MS_DAY); }
      else if (d.type === "resize-right") { ne = Math.max(d.origEnd + delta, d.origStart + MS_DAY); }
      setOverrides(prev => ({ ...prev, [d.id]: { start: ns, end: ne } }));
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [pxPerDay]);
const wbs = (row: any) => {
    const s = (row._si ?? 0) + 1, t = (row._ti ?? 0) + 1, x = (row._xi ?? 0) + 1;
    if (row.type === "scope")   return `${s}`;
    if (row.type === "task")    return `${s}.${t}`;
    if (row.type === "subtask") return `${s}.${t}.${x}`;
    return "";
  };
 if (!projectId || !fullProject) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="text.secondary">Select a project to view the timeline</Typography>
      </Box>
    );
  }

  if (!dates.length) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="text.secondary">
          No subtask dates defined â€” add start/end dates to subtasks to generate the Gantt chart
        </Typography>
      </Box>
    );
  }

   return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, userSelect: "none" }}>

      {/* TOOLBAR */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ px: 0.5 }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary">Zoom:</Typography>
        <ToggleButtonGroup
          exclusive
          value={zoom}
          onChange={(_, v) => v && setZoom(v)}
          size="small"
          sx={{ "& .MuiToggleButton-root": { px: 2, py: 0.5, fontSize: 12, textTransform: "none" } }}
        >
          {(["month", "week", "day"] as ZoomLevel[]).map(z => (
            <ToggleButton key={z} value={z}>{z.charAt(0).toUpperCase() + z.slice(1)}</ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Typography variant="caption" color="text.secondary">
          {dates.length} days Â· {baseRows.length} rows
        </Typography>
        {Object.keys(overrides).length > 0 && (
          <Box
            component="span"
            onClick={() => setOverrides({})}
            sx={{ fontSize: 12, color: "#ef4444", cursor: "pointer", textDecoration: "underline" }}
          >
            Reset changes ({Object.keys(overrides).length})
          </Box>
        )}
      </Stack>

      {/* MAIN SCROLL CONTAINER â€” single overflow:auto for both axes */}
      <Box
        ref={containerRef}
        onScroll={(e) => {
          const top = (e.target as HTMLDivElement).scrollTop;
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          rafRef.current = requestAnimationFrame(() => setScrollTop(top));
        }}
        sx={{
          height: VIEWPORT_H,
          overflow: "auto",
          border: "1px solid #DDE1E8",
          borderRadius: 1,
          position: "relative",
          "&::-webkit-scrollbar": { width: 8, height: 8 },
          "&::-webkit-scrollbar-track": { bgcolor: "#f8f9fa" },
          "&::-webkit-scrollbar-thumb": { bgcolor: "#c8cdd4", borderRadius: 4 },
        }}
      >
        {/* INNER â€” sets total scrollable dimensions */}
        <Box sx={{ minWidth: LEFT_W + timelineW, minHeight: HDR_H + rows.length * ROW_H }}>

          {/* â”€â”€ STICKY HEADER (top) â”€â”€ */}
          <Box sx={{ position: "sticky", top: 0, zIndex: 30, display: "flex", height: HDR_H }}>

            {/* Left header â€” sticky both top AND left */}
            <Box sx={{
              position: "sticky", left: 0, zIndex: 40,
              width: LEFT_W, flexShrink: 0, height: HDR_H,
              display: "flex", alignItems: "center",
              background: "#F0F2F8",
              borderRight: "2px solid #C8CDD8",
              borderBottom: "2px solid #C8CDD8",
              fontWeight: 700, fontSize: 12, color: "#444",
            }}>
              <Box sx={{ width: 60, px: 1, flexShrink: 0 }}>WBS</Box>
              <Box sx={{ flex: 1, px: 1, overflow: "hidden" }}>Phase / Task</Box>
              <Box sx={{ width: 88, px: 1, textAlign: "right", flexShrink: 0 }}>Start</Box>
              <Box sx={{ width: 88, px: 1, textAlign: "right", flexShrink: 0 }}>End</Box>
              <Box sx={{ width: 60, px: 1, textAlign: "center", flexShrink: 0 }}>Days</Box>
              <Box sx={{ width: 50, px: 1, textAlign: "center", flexShrink: 0 }}>%</Box>
            </Box>

            {/* Right header */}
            <Box sx={{ minWidth: timelineW }}>
              {/* Month row */}
              <Box sx={{ display: "flex", height: HDR_MONTH, bgcolor: "#E8EBF4", borderBottom: "1px solid #C8CDD8", overflow: "hidden" }}>
                {monthGroups.map((m, i) => (
                  <Box key={i} sx={{
                    width: m.days * pxPerDay, flexShrink: 0,
                    textAlign: "center", fontSize: 11, fontWeight: 700,
                    lineHeight: `${HDR_MONTH}px`,
                    borderRight: "1px solid #B0B8C8",
                    color: "#4B2E83", overflow: "hidden", whiteSpace: "nowrap", px: 0.5,
                  }}>
                    {m.label}
                  </Box>
                ))}
              </Box>
              {/* Day / Week sub-header row */}
              <Box sx={{ display: "flex", height: HDR_SUB, bgcolor: "#F0F2F8", borderBottom: "2px solid #C8CDD8", overflow: "hidden" }}>
                {zoom === "day" && dates.map((d, i) => (
                  <Box key={i} sx={{
                    width: pxPerDay, flexShrink: 0,
                    textAlign: "center", fontSize: 10,
                    lineHeight: `${HDR_SUB}px`,
                    borderRight: "1px solid #E0E4EC",
                    bgcolor: isToday(d) ? "#FFE082" : isWeekend(d) ? "#E8EAEF" : "transparent",
                    fontWeight: isToday(d) ? 700 : 400,
                    color: isToday(d) ? "#E65100" : isWeekend(d) ? "#AAA" : "#666",
                    overflow: "hidden",
                  }}>
                    {pxPerDay >= 20 ? d.getDate() : ""}
                  </Box>
                ))}
                {zoom === "week" && weekGroups.map((w, i) => (
                  <Box key={i} sx={{
                    width: w.days * pxPerDay, flexShrink: 0,
                    textAlign: "center", fontSize: 10, lineHeight: `${HDR_SUB}px`,
                    borderRight: "1px solid #C8CDD8", color: "#666", overflow: "hidden",
                  }}>
                    {w.label}
                  </Box>
                ))}
                {zoom === "month" && (
                  <Box sx={{ flex: 1, lineHeight: `${HDR_SUB}px`, textAlign: "center", fontSize: 10, color: "#999" }}>
                    Monthly view
                  </Box>
                )}
              </Box>
            </Box>
          </Box>

          {/* TOP SPACER */}
          {topSp > 0 && <Box sx={{ height: topSp, minWidth: LEFT_W + timelineW }} />}

          {/* VISIBLE ROWS */}
          {rows.slice(visStart, visEnd).map((row, vIdx) => {
            const absIdx = visStart + vIdx;

            if (row.type === "empty") {
              return (
                <Box key={`e-${absIdx}`} sx={{ display: "flex", height: ROW_H, minWidth: LEFT_W + timelineW }}>
                  <Box sx={{ position: "sticky", left: 0, zIndex: 8, width: LEFT_W, flexShrink: 0, height: ROW_H, bgcolor: "#fff", borderRight: "2px solid #C8CDD8", borderBottom: "1px solid #F2F2F2" }} />
                  <Box sx={{ minWidth: timelineW, height: ROW_H, bgcolor: "#FAFBFF", borderBottom: "1px solid #F2F2F2" }} />
                </Box>
              );
            }

            const isSc = row.type === "scope";
            const isTk = row.type === "task";
            const isSb = row.type === "subtask";
            const { start, end } = getRowMs(row);
            const durDays  = start && end ? Math.round((end - start) / MS_DAY + 1) : 0;
            const progress = Math.round(row.progress ?? 0);
            const rowBg    = isSc ? "#EEF1F8" : isTk ? "#FFFFFF" : "#FAFBFF";
            const leftPx   = getOffsetPx(start);
            const widthPx  = getDurPx(start, end);
            const color    = barColor(row);

            return (
              <Box key={row.id ?? `r-${absIdx}`} sx={{ display: "flex", height: ROW_H, minWidth: LEFT_W + timelineW }}>

                {/* LEFT CELL â€” sticky left */}
                <Box sx={{
                  position: "sticky", left: 0, zIndex: 8,
                  width: LEFT_W, flexShrink: 0, height: ROW_H,
                  display: "flex", alignItems: "center",
                  bgcolor: rowBg,
                  borderRight: "2px solid #C8CDD8",
                  borderBottom: "1px solid #E8E8E8",
                  borderLeft: isSc ? "3px solid #4B2E83" : "3px solid transparent",
                }}>
                  <Box sx={{ width: 60, px: 1, flexShrink: 0, fontSize: 10, fontWeight: 600, color: "#888", whiteSpace: "nowrap" }}>
                    {wbs(row)}
                  </Box>

                  <Box sx={{ flex: 1, px: 0.5, display: "flex", alignItems: "center", gap: 0.5, overflow: "hidden", minWidth: 0 }}>
                    {isSc && (
                      <IconButton size="small" onClick={() => toggleScope(row.id)} sx={{ p: 0.2, flexShrink: 0 }}>
                        {expandedScopes.has(row.id)
                          ? <ExpandMoreIcon sx={{ fontSize: 16, color: "#4B2E83" }} />
                          : <ChevronRightIcon sx={{ fontSize: 16, color: "#4B2E83" }} />}
                      </IconButton>
                    )}
                    {isTk && (
                      <IconButton size="small" onClick={() => toggleTask(row.id)} sx={{ p: 0.2, flexShrink: 0 }}>
                        {expandedTasks.has(row.id)
                          ? <ExpandMoreIcon sx={{ fontSize: 15, color: "#0D47A1" }} />
                          : <ChevronRightIcon sx={{ fontSize: 15, color: "#0D47A1" }} />}
                      </IconButton>
                    )}
                    {isSb && <Box sx={{ width: 20, flexShrink: 0 }} />}
                    <Typography noWrap sx={{
                      fontSize: isSc ? 12 : isTk ? 11 : 10,
                      fontWeight: isSc ? 700 : isTk ? 600 : 400,
                      color: isSc ? "#1a1040" : isTk ? "#1a2560" : "#555",
                    }}>
                      {row.name || row.title}
                    </Typography>
                  </Box>

                  <Box sx={{ width: 88, px: 1, flexShrink: 0, fontSize: 10, textAlign: "right", color: "#666", whiteSpace: "nowrap" }}>{fmtDate(start)}</Box>
                  <Box sx={{ width: 88, px: 1, flexShrink: 0, fontSize: 10, textAlign: "right", color: "#666", whiteSpace: "nowrap" }}>{fmtDate(end)}</Box>
                  <Box sx={{ width: 60, px: 1, flexShrink: 0, fontSize: 10, textAlign: "center", fontWeight: 500 }}>{durDays > 0 ? `${durDays}d` : "0"}</Box>
                  <Box sx={{ width: 50, px: 1, flexShrink: 0, fontSize: 10, textAlign: "center" }}>
                    {progress > 0
                      ? <Typography sx={{ fontSize: 10, fontWeight: 700, color: progress === 100 ? "#00C853" : "#FFA726" }}>{progress}%</Typography>
                      : "0"}
                  </Box>
                </Box>

                {/* TIMELINE CELL */}
                <Box sx={{
                  minWidth: timelineW,
                  height: ROW_H,
                  position: "relative",
                  bgcolor: rowBg,
                  backgroundImage: weekendBg,
                  backgroundRepeat: "no-repeat",
                  borderBottom: "1px solid #E8E8E8",
                }}>
                  {/* Monday separator lines */}
                  {mondayXs.map((x, i) => (
                    <Box key={i} sx={{ position: "absolute", left: x, top: 0, bottom: 0, width: 1, bgcolor: "#C8D0DE", opacity: 0.8, zIndex: 1, pointerEvents: "none" }} />
                  ))}

                  {/* Today line */}
                  {todayX !== null && (
                    <Box sx={{ position: "absolute", left: todayX, top: 0, bottom: 0, width: 2, bgcolor: "#E65100", zIndex: 3, pointerEvents: "none" }} />
                  )}

                  {/* GANTT BAR */}
                  {start && end && (
                    <Tooltip
                      title={`${row.name || row.title}  Â·  ${fmtDate(start)} â†’ ${fmtDate(end)}  (${durDays}d)`}
                      placement="top"
                      arrow
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          left: leftPx,
                          width: Math.max(widthPx, 4),
                          height: isSc ? 20 : isTk ? 16 : 13,
                          top: "50%",
                          transform: "translateY(-50%)",
                          borderRadius: isSc ? "3px" : "4px",
                          bgcolor: color,
                          border: isSc ? "2px solid #4527A0" : isTk ? "1.5px solid #0A3D91" : "1px solid rgba(0,0,0,0.12)",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                          zIndex: 2,
                          cursor: isSb ? "grab" : "default",
                          "&:active": isSb ? { cursor: "grabbing" } : {},
                          "&:hover": isSb ? { filter: "brightness(1.1)", boxShadow: "0 2px 6px rgba(0,0,0,0.25)" } : {},
                          overflow: "hidden",
                        }}
                        onMouseDown={isSb ? (e) => startDrag(e, row, "move") : undefined}
                      >
                        {/* Progress fill overlay */}
                        {progress > 0 && (
                          <Box sx={{ position: "absolute", inset: 0, width: `${progress}%`, bgcolor: "rgba(255,255,255,0.35)", pointerEvents: "none" }} />
                        )}

                        {/* Resize handles (subtask only) */}
                        {isSb && widthPx > 24 && (
                          <>
                            <Box
                              sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 7, cursor: "w-resize", zIndex: 5, bgcolor: "transparent", "&:hover": { bgcolor: "rgba(0,0,0,0.15)" } }}
                              onMouseDown={(e) => { e.stopPropagation(); startDrag(e, row, "resize-left"); }}
                            />
                            <Box
                              sx={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 7, cursor: "e-resize", zIndex: 5, bgcolor: "transparent", "&:hover": { bgcolor: "rgba(0,0,0,0.15)" } }}
                              onMouseDown={(e) => { e.stopPropagation(); startDrag(e, row, "resize-right"); }}
                            />
                          </>
                        )}

                        {/* Bar label (wide bars only) */}
                        {widthPx > 50 && (
                          <Typography noWrap sx={{
                            fontSize: 9,
                            color: "rgba(255,255,255,0.92)",
                            pl: 1,
                            lineHeight: `${isSc ? 20 : isTk ? 16 : 13}px`,
                            pointerEvents: "none",
                          }}>
                            {row.name || row.title}
                          </Typography>
                        )}
                      </Box>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            );
          })}

          {/* BOTTOM SPACER */}
          {botSp > 0 && <Box sx={{ height: botSp, minWidth: LEFT_W + timelineW }} />}

        </Box>
      </Box>
    </Box>
  );
}

