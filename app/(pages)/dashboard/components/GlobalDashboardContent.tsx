"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Divider, Stack,
  Typography,
} from "@mui/material";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import DashboardNotes from "@/app/(pages)/personalDashboard/components/DashboardNotes";
import {
  DashboardHealthStatus,
  DashboardTrendMetric,
  GlobalDashboardData,
  GlobalDashboardProject,
  dashboardService,
} from "@/app/api-service/dashboardService";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import {
  addChecklistItemToNote, createNote, deleteNote, editChecklistItem, editNote,
  fetchNotes, removeChecklistItemFromNote,
} from "@/app/redux/controllers/notesController";
import DashboardMetricDrilldownModal, { DashboardDrilldownMetric } from "./DashboardMetricDrilldownModal";

const notesKey = "global-dashboard";
const primary = "#210E64";
const healthTone: Record<DashboardHealthStatus, { color: string; bg: string; border: string }> = {
  CRITICAL: { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
  ONFLOW: { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  HEALTHY: { color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
  UNCLASSIFIED: { color: "#64748B", bg: "#F8FAFC", border: "#CBD5E1" },
};

const safeNumber = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const projectHealth = (project: GlobalDashboardProject): DashboardHealthStatus => {
  const value = String(project.healthStatus || project.kpiStatus || project.health || "UNCLASSIFIED").toUpperCase();
  return value in healthTone ? value as DashboardHealthStatus : "UNCLASSIFIED";
};
const businessUnitCode = (value: GlobalDashboardProject["businessUnit"]) =>
  typeof value === "string" ? value : value?.code || "";
const dateLabel = (value?: string | null) => {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
};

function SectionHeader({ title, caption, action }: { title: string; caption?: string; action?: React.ReactNode }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} sx={{ mb: 1.25 }}>
      <Box>
        <Typography sx={{ color: "#0F172A", fontSize: 14, fontWeight: 900 }}>{title}</Typography>
        {caption && <Typography sx={{ color: "#64748B", fontSize: 10.5, mt: 0.2 }}>{caption}</Typography>}
      </Box>
      {action}
    </Stack>
  );
}

function KpiTrend({
  trend,
  color,
  improvementDirection,
}: {
  trend?: DashboardTrendMetric;
  color: string;
  improvementDirection: "UP" | "DOWN" | "NEUTRAL";
}) {
  if (!trend) {
    return <Typography sx={{ mt: 1.5, color: "rgba(255,255,255,.55)", fontSize: 8 }}>Trend unavailable</Typography>;
  }

  const capturedSource = trend.points?.length
    ? trend.points
    : [{ date: "current", value: trend.value }];
  const capturedPoints = capturedSource.filter((point) => point.value !== null);
  const isDemo = capturedPoints.length < 2;
  const demoOffsets =
    trend.direction === "UP"
      ? [-2, -1, -1, 0, 1, 1, 2]
      : trend.direction === "DOWN"
        ? [2, 1, 1, 0, -1, -1, -2]
        : [-1, 0, 1, 0, 1, 0, 0];
  const source = isDemo
    ? demoOffsets.map((offset, index) => ({
        date: `demo-${index}`,
        value: Math.max(0, trend.value + offset),
      }))
    : capturedSource;
  const available = source.filter((point) => point.value !== null);
  const values = available.map((point) => Number(point.value));
  const min = Math.min(...values, trend.value);
  const max = Math.max(...values, trend.value);
  const range = Math.max(1, max - min);
  const coordinates = source
    .map((point, index) => point.value === null ? null : {
      x: source.length === 1 ? 50 : (index / (source.length - 1)) * 100,
      y: 25 - ((Number(point.value) - min) / range) * 19,
    })
    .filter((point): point is { x: number; y: number } => Boolean(point));
  const directionIsGood =
    trend.direction === "FLAT" ||
    improvementDirection === "NEUTRAL" ||
    trend.direction === improvementDirection;
  const directionColor =
    trend.direction === "FLAT"
      ? "#CBD5E1"
      : improvementDirection === "NEUTRAL"
        ? color
        : directionIsGood
          ? "#34D399"
          : "#FB7185";
  const directionSymbol = trend.direction === "UP" ? "▲" : trend.direction === "DOWN" ? "▼" : "→";

  return (
    <Box sx={{ mt: 0.65 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" gap={0.5}>
        <Typography sx={{ color: directionColor, fontSize: 11.5, fontWeight: 900 }}>
          {directionSymbol} {trend.changePercentage > 0 ? "+" : ""}{trend.changePercentage.toFixed(0)}%
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,.58)", fontSize: 7.5 }}>{isDemo ? "Demo preview" : "Last 7 days"}</Typography>
      </Stack>
      <Typography sx={{ mt: 0.1, color: "rgba(255,255,255,.48)", fontSize: 7.2 }}>
        {trend.change === 0 ? "No change from previous snapshot" : `${trend.change > 0 ? "+" : ""}${trend.change} from previous snapshot`}
      </Typography>
      <Box component="svg" viewBox="0 0 100 28" preserveAspectRatio="none" aria-label={`${isDemo ? "Demo" : "Seven day"} trend ${trend.direction.toLowerCase()}`} sx={{ display: "block", width: "100%", height: 30, mt: 0.35, overflow: "visible" }}>
        <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,.13)" strokeWidth="1" strokeDasharray="3 3" />
        {coordinates.length > 1 && (
          <polyline
            points={coordinates.map((point) => `${point.x},${point.y}`).join(" ")}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {coordinates.map((point, index) => (
          <circle key={`${point.x}-${index}`} cx={point.x} cy={point.y} r={coordinates.length === 1 ? 2.4 : 1.35} fill={color} />
        ))}
      </Box>
    </Box>
  );
}

export default function GlobalDashboardContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { notes, loading: notesLoading, error: notesError } = useAppSelector((state) => state.notes);
  const [data, setData] = useState<GlobalDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [drilldownMetric, setDrilldownMetric] = useState<DashboardDrilldownMetric | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboard] = await Promise.all([
        dashboardService.get(),
        dispatch(fetchNotes(notesKey)).catch(() => undefined),
      ]);
      setData(dashboard);
    } catch (requestError) {
      const candidate = requestError as { response?: { data?: { message?: string } }; message?: string };
      setError(candidate.response?.data?.message || candidate.message || "Unable to load the dashboard.");
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => { load(); }, [load]);

  const summary = data?.summary;
  const totalHealth = Math.max(1, safeNumber(summary?.critical) + safeNumber(summary?.onflow) + safeNumber(summary?.healthy) + safeNumber(summary?.unclassified));
  const kpiBreakdown = useMemo(
    () => data?.topProjects.reduce(
      (result, project) => ({
        automatic: result.automatic + safeNumber(project.kpiSummary?.subtasks?.total),
        configured: result.configured + safeNumber(project.kpiSummary?.configuredKpis?.total),
      }),
      { automatic: 0, configured: 0 },
    ) ?? { automatic: 0, configured: 0 },
    [data?.topProjects],
  );

  if (loading && !data) {
    return <Box sx={{ minHeight: 520, display: "grid", placeItems: "center" }}><CircularProgress sx={{ color: primary }} /></Box>;
  }

  if (error && !data) {
    return <Alert severity="error" action={<Button color="inherit" onClick={load}>Retry</Button>}>{error}</Alert>;
  }

  if (!data || !summary) return null;

  const metricCards = [
    ["Critical", summary.critical, "#FB7185", data.trends?.critical, "DOWN"],
    ["In Flow", summary.onflow, "#FBBF24", data.trends?.onflow, "NEUTRAL"],
    ["Healthy", summary.healthy, "#34D399", data.trends?.healthy, "UP"],
    ["Incident Reports", summary.incidentReports, "#60A5FA", data.trends?.incidentReports, "DOWN"],
  ] as const;

  return (
    <Box sx={{ p: { xs: 1.25, md: 2 }, maxWidth: 1600, mx: "auto" }}>
      {error && <Alert severity="warning" onClose={() => setError("")} sx={{ mb: 1.5 }}>{error}</Alert>}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 340px" }, gap: 1.5, alignItems: "start" }}>
        <Stack spacing={2} sx={{ minWidth: 0 }}>
          <Box>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" }, gap: 0.8 }}>
                {metricCards.map(([label, value, color, trend, improvementDirection]) => {
                  const metric = label === "Critical" ? "CRITICAL" : label === "In Flow" ? "ONFLOW" : label === "Healthy" ? "HEALTHY" : "INCIDENTS";
                  return (
                  <Box key={label} component="button" type="button" onClick={() => setDrilldownMetric(metric)} aria-label={`View ${label} breakdown`} sx={{ minHeight: 142, px: 1.25, pt: 1, pb: 0.7, borderRadius: 1, bgcolor: "#24145D", border: 0, borderTop: `3px solid ${color}`, boxShadow: "0 5px 14px rgba(36,20,93,.14)", textAlign: "left", cursor: "pointer", "&:hover": { bgcolor: "#2B186C", transform: "translateY(-1px)" }, "&:focus-visible": { outline: "3px solid #A78BFA", outlineOffset: 2 }, transition: "all .15s ease" }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="baseline" gap={0.5}>
                      <Typography sx={{ color: "rgba(255,255,255,.82)", fontSize: 10, fontWeight: 850 }}>{label}</Typography>
                      <Typography sx={{ color: "#FFFFFF", fontSize: 24, fontWeight: 900, lineHeight: 1 }}>{value}</Typography>
                    </Stack>
                    <KpiTrend trend={trend} color={color} improvementDirection={improvementDirection} />
                  </Box>
                )})}
              </Box>
          </Box>

          <Card variant="outlined" sx={{ borderRadius: 2, borderColor: "#E2E8F0" }}>
            <CardContent>
              <SectionHeader title="Top Projects" caption="Projects needing the most attention appear first." action={<Button size="small" variant="text" endIcon={<ArrowForwardOutlinedIcon sx={{ fontSize: 15 }} />} onClick={() => router.push("/projects")} sx={{ minWidth: 0, px: 0.5, color: "#210E64", textTransform: "none", fontSize: 10.5, fontWeight: 850, "&:hover": { bgcolor: "transparent", textDecoration: "underline" } }}>View all</Button>} />
              {!data.topProjects.length ? <Alert severity="info">No accessible projects to display.</Alert> : (
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    overflowX: "auto",
                    scrollSnapType: "x proximity",
                    pb: 0.75,
                    scrollbarWidth: "thin",
                  }}
                >
                  {data.topProjects.map((project) => {
                    const health = projectHealth(project);
                    const tone = healthTone[health];
                    const progress = Math.min(100, Math.max(0, safeNumber(project.progress)));
                    const criticalSubtasks = (project.topSubtasks ?? [])
                      .filter((subtask) => String(subtask.status || subtask.health).toUpperCase() === "CRITICAL")
                      .slice(0, 3);
                    return (
                      <Box
                        key={project.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => router.push(`/projectDashboard/${project.id}`)}
                        onKeyDown={(event) => { if (event.key === "Enter") router.push(`/projectDashboard/${project.id}`); }}
                        sx={{
                          flex: {
                            xs: "0 0 84%",
                            sm: "0 0 calc((100% - 8px) / 2)",
                            md: "0 0 calc((100% - 16px) / 3)",
                          },
                          minWidth: 0,
                          p: 0,
                          cursor: "pointer",
                          scrollSnapAlign: "start",
                          borderRadius: 1.5,
                          border: "1px solid #E5E7EB",
                          bgcolor: "#ffffff",
                          overflow: "hidden",
                          "&:hover": {
                            bgcolor: "#F5F2FF",
                          },
                          transition: "all .15s ease",
                        }}
                      >
                        <Box sx={{ minHeight: 30, px: 1.1, py: 1, background: "linear-gradient(23deg, #210E64 35%, #1B169D 100%)", }}>
                          <Typography noWrap title={project.name} sx={{ color: "#FFFFFF", fontSize: 11.5, fontWeight: 900 }}>{project.name}</Typography>
                        </Box>

                        <Stack direction="row" justifyContent="space-between" sx={{ px: 1, mt: -1.1, position: "relative", zIndex: 1 }}>
                          <Chip label={project.versionLabel || project.version || `Version ${project.versionNumber || 1}`} size="small" sx={{ height: 19, color: "#210E64", bgcolor: "#FFF", border: "1px solid #D9D2F3", fontSize: 7.5, fontWeight: 900, boxShadow: "0 2px 5px rgba(15,23,42,.08)" }} />
                          <Chip label={project.status || "ACTIVE"} size="small" sx={{ height: 19, color: "#210E64", bgcolor: "#F3F0FF", border: "1px solid #D9D2F3", fontSize: 7.5, fontWeight: 900, boxShadow: "0 2px 5px rgba(15,23,42,.08)" }} />
                        </Stack>

                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ px: 1, pt: 1, pb: 0.75 }}>
                          <Stack spacing={0.65} sx={{ flex: 1, minWidth: 0 }}>
                            {([
                              ["EXPECTED START DATE", dateLabel(project.expectedStartDate)],
                              ["EXPECTED END DATE", dateLabel(project.expectedEndDate)],
                              ["BUSINESS UNIT", businessUnitCode(project.businessUnit) || "Not assigned"],
                            
                            ] as const).map(([label, value]) => (
                              <Box key={label} sx={{ minWidth: 0 }}>
                                <Typography sx={{ color: "#94A3B8", fontSize: 6.8, fontWeight: 900 }}>{label}</Typography>
                                <Typography noWrap title={value} sx={{ color: "#334155", fontSize: 8.3, fontWeight: 750 }}>{value}</Typography>
                              </Box>
                            ))}
                          </Stack>
                          <Box sx={{ textAlign: "center", flexShrink: 0 }}>
                            <Box sx={{ width: 58, height: 58, borderRadius: "50%", background: `conic-gradient(from 0deg, #210E64 0%, #7656E8 ${progress}%, #E9EBF2 ${progress}% 100%)`, display: "grid", placeItems: "center" }}>
                              <Box sx={{ width: 44, height: 44, borderRadius: "50%", bgcolor: "#FFF", display: "grid", placeItems: "center" }}>
                                <Typography sx={{ color: "#210E64", fontSize: 10.5, fontWeight: 900 }}>{progress.toFixed(0)}%</Typography>
                              </Box>
                            </Box>
                            <Typography sx={{ mt: 0.3, color: "#64748B", fontSize: 7, fontWeight: 900 }}>PROGRESS</Typography>
                          </Box>
                        </Stack>

                        <Divider />
                        <Box sx={{ px: 1, py: 0.75 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography sx={{ color: "#475569", fontSize: 7.8, fontWeight: 900 }}>TOP CRITICAL SUBTASKS</Typography>
                          <Chip label={health === "ONFLOW" ? "IN FLOW" : health} size="small" sx={{ height: 16, color: tone.color, bgcolor: tone.bg, fontSize: 6.8, fontWeight: 900, "& .MuiChip-label": { px: 0.5 } }} />
                        </Stack>
                        {!criticalSubtasks.length ? (
                          <Typography sx={{ mt: 0.45, color: "#18A88E", fontSize: 8.5, fontWeight: 700 }}>No critical subtasks.</Typography>
                        ) : (
                          <Stack spacing={0.35} sx={{ mt: 0.45 }}>
                            {criticalSubtasks.map((subtask, index) => (
                              <Stack key={subtask.id} direction="row" alignItems="center" gap={0.7}>
                                <Box sx={{ width: 15, height: 15, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: 0.6, color: "#E34D6F", bgcolor: "#FFF0F4", fontSize: 7, fontWeight: 900 }}>{index + 1}</Box>
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                  <Typography noWrap title={subtask.title} sx={{ color: "#334155", fontSize: 8.5, fontWeight: 800 }}>{subtask.title}</Typography>
                                  <Typography noWrap sx={{ color: "#94A3B8", fontSize: 7 }}>{subtask.scope?.name || "Scope"} · {subtask.task?.title || "Task"}</Typography>
                                </Box>
                                <Typography sx={{ color: "#E34D6F", fontSize: 7.5, fontWeight: 900 }}>{safeNumber(subtask.variance).toFixed(0)}%</Typography>
                              </Stack>
                            ))}
                          </Stack>
                        )}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2 }}>
            <Card variant="outlined" sx={{ borderRadius: 2, borderColor: "#E2E8F0" }}>
              <CardContent>
                <SectionHeader title="Priority Incidents" caption="Highest-severity reports requiring attention." />
                {!data.topIncidents.length ? <Alert severity="success">No incident reports require attention.</Alert> : (
                  <Stack divider={<Divider />}>
                    {data.topIncidents.slice(0, 5).map((incident) => (
                      <Box key={incident.id} onClick={() => incident.project?.id && router.push(`/projectDashboard/${incident.project.id}?view=incident-reports`)} sx={{ py: 1, cursor: incident.project?.id ? "pointer" : "default" }}>
                        <Stack direction="row" justifyContent="space-between" gap={1}>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography noWrap sx={{ fontSize: 11.5, fontWeight: 850 }}>{incident.title}</Typography>
                            <Typography noWrap sx={{ color: "#64748B", fontSize: 9.5 }}>{incident.project?.name || "Project"} · {incident.incidentNumber || "Incident"}</Typography>
                          </Box>
                          <Chip label={incident.severity || "MEDIUM"} size="small" sx={{ height: 19, color: incident.severity === "CRITICAL" ? "#B91C1C" : "#C2410C", bgcolor: incident.severity === "CRITICAL" ? "#FEE2E2" : "#FFF7ED", fontSize: 8, fontWeight: 900 }} />
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 2, borderColor: "#E2E8F0" }}>
              <CardContent>
                <SectionHeader title="Review & Approval" caption="Projects currently waiting for a decision." action={<Button size="small" variant="text" endIcon={<ArrowForwardOutlinedIcon sx={{ fontSize: 15 }} />} onClick={() => router.push("/myApprovals")} sx={{ minWidth: 0, px: 0.5, color: "#210E64", textTransform: "none", fontSize: 10.5, fontWeight: 850, "&:hover": { bgcolor: "transparent", textDecoration: "underline" } }}>View all</Button>} />
                {!data.pendingReviewAndApproval.length ? <Alert severity="success">Nothing is waiting for your review.</Alert> : (
                  <Stack divider={<Divider />}>
                    {data.pendingReviewAndApproval.slice(0, 5).map((item, index) => {
                      const id = item.projectId || item.project?.id || item.id;
                      return (
                        <Box key={`${id || "review"}-${index}`} onClick={() => id && router.push(`/approvals/${id}`)} sx={{ py: 1, cursor: id ? "pointer" : "default" }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography noWrap sx={{ fontSize: 11.5, fontWeight: 850 }}>{item.projectName || item.project?.name || item.name || "Untitled Project"}</Typography>
                              <Typography sx={{ color: "#64748B", fontSize: 9.5 }}>{item.status || item.project?.status || "Pending review"}</Typography>
                            </Box>
                            <ArrowForwardOutlinedIcon sx={{ color: "#94A3B8", fontSize: 17 }} />
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Box>
        </Stack>

        <Stack spacing={2} sx={{ minWidth: 0 }}>
          <Card variant="outlined" sx={{ borderRadius: 2, borderColor: "#E2E8F0" }}>
            <CardContent>
              <SectionHeader title="KPI Status Summary" caption="Combined configured and automatic KPI health." />
              <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mt: 1, mb: 0.8 }}>
                <Typography sx={{ color: "#64748B", fontSize: 10, fontWeight: 700 }}>Status distribution</Typography>
                <Typography sx={{ color: "#0F172A", fontSize: 12, fontWeight: 900 }}>{summary.totalKpis} total</Typography>
              </Stack>
              <Stack spacing={1.15} sx={{ mt: 1.4 }} aria-label="KPI status distribution">
                {([
                  ["Critical", summary.critical, "#E34D6F"],
                  ["In Flow", summary.onflow, "#E9A126"],
                  ["Healthy", summary.healthy, "#18A88E"],
                  ["Unclassified", summary.unclassified, "#A3A9BD"],
                ] as const).map(([label, value, color]) => (
                  <Stack key={label} direction="row" alignItems="center" gap={1}>
                    <Typography sx={{ width: 72, flexShrink: 0, color: "#475569", fontSize: 10.5, fontWeight: 750 }}>{label}</Typography>
                    <Box sx={{ flex: 1, height: 10, overflow: "hidden", borderRadius: 0.75, bgcolor: "#ECECF4" }}>
                      <Box
                        title={`${label}: ${value}`}
                        sx={{
                          width: `${(value / totalHealth) * 100}%`,
                          minWidth: value > 0 ? 5 : 0,
                          height: "100%",
                          borderRadius: 0.75,
                          bgcolor: color,
                          transition: "width .25s ease",
                        }}
                      />
                    </Box>
                    <Typography sx={{ width: 20, flexShrink: 0, textAlign: "right", color: "#0F172A", fontSize: 11.5, fontWeight: 900 }}>{value}</Typography>
                  </Stack>
                ))}
              </Stack>
              <Divider sx={{ my: 1.25 }} />
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.8 }}>
                <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: "#EFF6FF" }}>
                  <Typography sx={{ color: "#64748B", fontSize: 8.5 }}>Automatic Subtasks</Typography>
                  <Typography sx={{ color: "#2563EB", fontSize: 14, fontWeight: 900 }}>{kpiBreakdown.automatic}</Typography>
                </Box>
                <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: "#F5F3FF" }}>
                  <Typography sx={{ color: "#64748B", fontSize: 8.5 }}>Configured KPIs</Typography>
                  <Typography sx={{ color: "#6D28D9", fontSize: 14, fontWeight: 900 }}>{kpiBreakdown.configured}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <DashboardNotes
            notes={notes}
            loading={notesLoading}
            error={notesError}
            onCreateNote={(payload) => dispatch(createNote(notesKey, payload))}
            onEditNote={(noteId, payload) => dispatch(editNote(notesKey, noteId, payload))}
            onDeleteNote={(noteId) => dispatch(deleteNote(notesKey, noteId))}
            onAddChecklistItem={(noteId, payload) => dispatch(addChecklistItemToNote(notesKey, noteId, payload))}
            onEditChecklistItem={(noteId, itemId, payload) => dispatch(editChecklistItem(notesKey, noteId, itemId, payload))}
            onDeleteChecklistItem={(noteId, itemId) => dispatch(removeChecklistItemFromNote(notesKey, noteId, itemId))}
          />
        </Stack>
      </Box>
      <DashboardMetricDrilldownModal
        open={Boolean(drilldownMetric)}
        metric={drilldownMetric}
        total={drilldownMetric === "CRITICAL" ? summary.critical : drilldownMetric === "ONFLOW" ? summary.onflow : drilldownMetric === "HEALTHY" ? summary.healthy : summary.incidentReports}
        projects={data.topProjects}
        onClose={() => setDrilldownMetric(null)}
      />
    </Box>
  );
}
