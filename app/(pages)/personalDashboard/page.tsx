"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import InsightsIcon from "@mui/icons-material/Insights";
import SettingsIcon from "@mui/icons-material/Settings";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import Layout from "@/app/components/shared/Layout";
import KPIModal from "@/app/components/shared/modals/KPIModal";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { getProjects } from "@/app/redux/controllers/projectController";
import { Projects } from "@/app/redux/slices/projectSlice";
import {
  ChartData,
  DashboardChartConfig,
  DashboardSummary,
  PersonalDashboard,
  PersonalDashboardKpi,
} from "@/app/api-service/personalDashboardService";
import {
  createDashboard,
  fetchDashboardChartData,
  fetchPersonalDashboardDetail,
  fetchPersonalDashboards,
  removeDashboard,
  removeKpi,
  saveDashboardCharts,
  updateDashboard,
} from "@/app/redux/controllers/personalDashboardController";

const statusColors: Record<string, { bg: string; color: string; accent: string }> = {
  CRITICAL: { bg: "#fef2f2", color: "#b91c1c", accent: "#ef4444" },
  ONFLOW: { bg: "#fffbeb", color: "#b45309", accent: "#f59e0b" },
  HEALTHY: { bg: "#ecfdf5", color: "#047857", accent: "#10b981" },
  UNCLASSIFIED: { bg: "#f3f4f6", color: "#4b5563", accent: "#9ca3af" },
};

const chartOptions = [
  { chartType: "KPI_SUMMARY", label: "KPI Summary Cards" },
  { chartType: "SCURVE", label: "S-Curve Chart" },
  { chartType: "PROGRESS_TREND", label: "Progress Trend Chart" },
  { chartType: "SLA_DEADLINE_RISK", label: "SLA / Deadline Risk Chart" },
  { chartType: "KPI_STATUS_DISTRIBUTION", label: "KPI Status Distribution" },
  { chartType: "TASK_COMPLETION", label: "Task/Subtask Completion Chart" },
  { chartType: "DELAY_TREND", label: "Delay Trend Chart" },
];

const defaultSummary: DashboardSummary = {
  totalKpis: 0,
  criticalKpis: 0,
  onflowKpis: 0,
  healthyKpis: 0,
  unclassifiedKpis: 0,
};

type ProjectOption = Pick<Projects, "id" | "name">;

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const getSummary = (dashboard?: PersonalDashboard | null) => dashboard?.summary ?? defaultSummary;

const getProjectName = (dashboard: PersonalDashboard, projects: ProjectOption[]) => {
  if (dashboard.project?.name) return dashboard.project.name;
  const project = projects.find((item) => item.id === dashboard.projectId);
  return project?.name ?? "Project not loaded";
};

const normalizeCharts = (charts?: DashboardChartConfig[]) =>
  chartOptions.map((option, index) => {
    const existing = charts?.find((chart) => chart.chartType === option.chartType);
    return {
      chartType: option.chartType,
      isEnabled: existing?.isEnabled ?? (index < 2),
      sortOrder: existing?.sortOrder ?? index,
    };
  });

function MeasuredChartContainer({
  height = 260,
  children,
}: {
  height?: number;
  children: (size: { width: number; height: number }) => React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateSize = () => {
      const nextWidth = Math.max(0, Math.floor(element.clientWidth));
      setWidth(nextWidth);
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <Box ref={containerRef} sx={{ height, width: "100%", minWidth: 0, minHeight: height }}>
      {width > 0 ? children({ width, height }) : null}
    </Box>
  );
}


function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "CRITICAL" | "ONFLOW" | "HEALTHY" | "UNCLASSIFIED";
}) {
  const colors = statusColors[tone];
  return (
    <Box
      sx={{
        minHeight: 92,
        border: "1px solid #e5e7eb",
        borderRadius: 2,
        backgroundColor: "#fff",
        p: 2,
        borderLeft: `4px solid ${colors.accent}`,
      }}
    >
      <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ color: "#111827", fontWeight: 800, mt: 0.5 }}>
        {value}
      </Typography>
    </Box>
  );
}

function DashboardModal({
  open,
  onClose,
  onSaved,
  projects,
  dashboard,
  dashboardCount,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  projects: ProjectOption[];
  dashboard?: PersonalDashboard | null;
  dashboardCount: number;
}) {
  const dispatch = useAppDispatch();
  const isEdit = Boolean(dashboard?.id);
  const [form, setForm] = useState({ name: "", description: "", projectId: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm({
      name: dashboard?.name ?? "",
      description: dashboard?.description ?? "",
      projectId: dashboard?.projectId ?? dashboard?.project?.id ?? "",
    });
  }, [dashboard, open]);

  const canSave = form.name.trim().length > 0 && Boolean(form.projectId) && (isEdit || dashboardCount < 5);

  const handleSubmit = async () => {
    if (!canSave) return;
    try {
      setSaving(true);
      setError("");
      if (isEdit && dashboard?.id) {
        await dispatch(updateDashboard(dashboard.id, {
          name: form.name.trim(),
          description: form.description.trim(),
        }));
      } else {
        await dispatch(createDashboard({
          name: form.name.trim(),
          description: form.description.trim(),
          projectId: form.projectId,
        }));
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to save dashboard."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 800 }}>
        {isEdit ? "Edit Dashboard" : "Create Personal Dashboard"}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 0.5 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {!isEdit && dashboardCount >= 5 && (
            <Alert severity="warning">You already have the maximum of 5 personal dashboards.</Alert>
          )}
          <TextField
            label="Dashboard Name"
            fullWidth
            required
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <TextField
            label="Dashboard Description"
            fullWidth
            multiline
            rows={3}
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          />
          <TextField
            select
            label="Project"
            fullWidth
            required
            disabled={isEdit}
            value={form.projectId}
            onChange={(event) => setForm((prev) => ({ ...prev, projectId: event.target.value }))}
          >
            {projects.map((project) => (
              <MenuItem key={project.id} value={project.id}>
                {project.name}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!canSave || saving} onClick={handleSubmit}>
          {saving ? "Saving..." : isEdit ? "Update Dashboard" : "Create Dashboard"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ChartConfigDialog({
  open,
  onClose,
  dashboard,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  dashboard: PersonalDashboard | null;
  onSaved: () => void;
}) {
  const dispatch = useAppDispatch();
  const [charts, setCharts] = useState<DashboardChartConfig[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setCharts(normalizeCharts(dashboard?.charts));
  }, [dashboard?.charts, open]);

  const handleToggle = (chartType: string) => {
    setCharts((prev) =>
      prev.map((chart) =>
        chart.chartType === chartType ? { ...chart, isEnabled: !chart.isEnabled } : chart
      )
    );
  };

  const handleSave = async () => {
    if (!dashboard?.id) return;
    setSaving(true);
    try {
      await dispatch(saveDashboardCharts(dashboard.id, charts));
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 800 }}>Chart Configuration</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1}>
          {chartOptions.map((option) => {
            const checked = charts.find((chart) => chart.chartType === option.chartType)?.isEnabled ?? false;
            return (
              <FormControlLabel
                key={option.chartType}
                control={<Checkbox checked={checked} onChange={() => handleToggle(option.chartType)} />}
                label={option.label}
              />
            );
          })}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Charts"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DashboardCharts({ dashboard, chartData }: { dashboard: PersonalDashboard | null; chartData: ChartData | null }) {
  const enabledCharts = normalizeCharts(dashboard?.charts)
    .filter((chart) => chart.isEnabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const summary = chartData?.summary ?? dashboard?.summary ?? defaultSummary;
  const statusData = [
    { name: "Critical", value: summary.criticalKpis, color: statusColors.CRITICAL.accent },
    { name: "Onflow", value: summary.onflowKpis, color: statusColors.ONFLOW.accent },
    { name: "Healthy", value: summary.healthyKpis, color: statusColors.HEALTHY.accent },
    { name: "Unclassified", value: summary.unclassifiedKpis, color: statusColors.UNCLASSIFIED.accent },
  ];
  const scurveData = chartData?.scurve?.data ?? chartData?.progressTrend ?? [];
  const completionData = chartData?.taskCompletion
    ? [
        { name: "Completed", value: chartData.taskCompletion.completed },
        { name: "Pending", value: chartData.taskCompletion.pending },
      ]
    : [];

  if (!dashboard) return null;

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" }, gap: 2, minWidth: 0 }}>
      {enabledCharts.map((chart) => {
        if (chart.chartType === "KPI_SUMMARY") {
          return (
            <Card key={chart.chartType} sx={{ borderRadius: 2, border: "1px solid #e5e7eb", boxShadow: "none", minWidth: 0 }}>
              <CardContent>
                <Typography fontWeight={900} sx={{ mb: 2 }}>
                  KPI Summary
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 1.5 }}>
                  <SummaryTile label="Critical" value={summary.criticalKpis} tone="CRITICAL" />
                  <SummaryTile label="Onflow" value={summary.onflowKpis} tone="ONFLOW" />
                  <SummaryTile label="Healthy" value={summary.healthyKpis} tone="HEALTHY" />
                  <SummaryTile label="Total" value={summary.totalKpis} tone="UNCLASSIFIED" />
                </Box>
              </CardContent>
            </Card>
          );
        }

        if (chart.chartType === "SCURVE" || chart.chartType === "PROGRESS_TREND" || chart.chartType === "DELAY_TREND") {
          return (
            <Card key={chart.chartType} sx={{ borderRadius: 2, border: "1px solid #e5e7eb", boxShadow: "none" }}>
              <CardContent>
                <Typography fontWeight={900} sx={{ mb: 2 }}>
                  {chart.chartType === "SCURVE" ? "S-Curve" : chart.chartType === "DELAY_TREND" ? "Delay Trend" : "Progress Trend"}
                </Typography>
                <MeasuredChartContainer>
                  {({ width, height }) =>
                    scurveData.length ? (
                      <LineChart width={width} height={height} data={scurveData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip />
                        <Line type="monotone" dataKey="planned" stroke="#64748b" strokeWidth={2} />
                        <Line type="monotone" dataKey="actual" stroke="#4B2E83" strokeWidth={3} />
                      </LineChart>
                    ) : (
                      <Alert severity="info">Chart data is not available yet.</Alert>
                    )
                  }
                </MeasuredChartContainer>
              </CardContent>
            </Card>
          );
        }

        if (chart.chartType === "KPI_STATUS_DISTRIBUTION" || chart.chartType === "SLA_DEADLINE_RISK") {
          return (
            <Card key={chart.chartType} sx={{ borderRadius: 2, border: "1px solid #e5e7eb", boxShadow: "none", minWidth: 0 }}>
              <CardContent>
                <Typography fontWeight={900} sx={{ mb: 2 }}>
                  {chart.chartType === "SLA_DEADLINE_RISK" ? "SLA / Deadline Risk" : "KPI Status Distribution"}
                </Typography>
                <MeasuredChartContainer>
                  {({ width, height }) => (
                    <PieChart width={width} height={height}>
                      <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={90} label>
                        {statusData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  )}
                </MeasuredChartContainer>
              </CardContent>
            </Card>
          );
        }

        if (chart.chartType === "TASK_COMPLETION") {
          return (
            <Card key={chart.chartType} sx={{ borderRadius: 2, border: "1px solid #e5e7eb", boxShadow: "none", minWidth: 0 }}>
              <CardContent>
                <Typography fontWeight={900} sx={{ mb: 2 }}>
                  Task/Subtask Completion
                </Typography>
                <MeasuredChartContainer>
                  {({ width, height }) =>
                    completionData.length ? (
                      <BarChart width={width} height={height} data={completionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="value" fill="#4B2E83" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    ) : (
                      <Alert severity="info">Completion data is not available yet.</Alert>
                    )
                  }
                </MeasuredChartContainer>
              </CardContent>
            </Card>
          );
        }

        return null;
      })}
    </Box>
  );
}

export default function PersonalDashboardPage() {
  const dispatch = useAppDispatch();
  const projects = useAppSelector((state) => state.project.projects);
  const {
    dashboards,
    selectedDashboard,
    chartData,
    loading,
    detailLoading,
    error,
  } = useAppSelector((state) => state.personalDashboard);
  const authToken = useAppSelector((state) => state.auth.token);
  const [selectedId, setSelectedId] = useState("");
  const [dashboardModalOpen, setDashboardModalOpen] = useState(false);
  const [editingDashboard, setEditingDashboard] = useState<PersonalDashboard | null>(null);
  const [kpiModalOpen, setKpiModalOpen] = useState(false);
  const [editingKpi, setEditingKpi] = useState<PersonalDashboardKpi | null>(null);
  const [chartConfigOpen, setChartConfigOpen] = useState(false);
  const [localTokenAvailable] = useState(
    () => typeof window !== "undefined" && Boolean(window.localStorage.getItem("token"))
  );
  const hasAccessToken = Boolean(authToken) || localTokenAvailable;

  const selectedDashboardId = useMemo(() => {
    if (selectedId && dashboards.some((dashboard) => dashboard.id === selectedId)) {
      return selectedId;
    }
    return dashboards[0]?.id ?? "";
  }, [dashboards, selectedId]);

  const loadDashboards = useCallback(async () => {
    try {
      await dispatch(fetchPersonalDashboards());
    } catch {
      // Controller stores the error in Redux.
    }
  }, [dispatch]);

  const loadDetail = useCallback(async () => {
    if (!selectedDashboardId) return;
    try {
      await Promise.all([
        dispatch(fetchPersonalDashboardDetail(selectedDashboardId)),
        dispatch(fetchDashboardChartData(selectedDashboardId)),
      ]);
    } catch {
      // Controller stores the error in Redux.
    }
  }, [dispatch, selectedDashboardId]);

  useEffect(() => {
    if (!hasAccessToken) return;
    if (!projects?.length) dispatch(getProjects());
    loadDashboards();
  }, [dispatch, hasAccessToken, loadDashboards, projects?.length]);

  useEffect(() => {
    if (!hasAccessToken) return;
    loadDetail();
  }, [hasAccessToken, loadDetail]);

  const selectedSummary = getSummary(selectedDashboard);
  const canCreateDashboard = dashboards.length < 5;

  const refreshSelected = async () => {
    await loadDashboards();
    await loadDetail();
  };

  const handleDeleteDashboard = async (dashboard: PersonalDashboard) => {
    if (!window.confirm(`Delete "${dashboard.name}"?`)) return;
    await dispatch(removeDashboard(dashboard.id));
    if (selectedId === dashboard.id) setSelectedId("");
    await loadDashboards();
  };

  const handleDeleteKpi = async (kpi: PersonalDashboardKpi) => {
    if (!selectedDashboard?.id || !window.confirm(`Delete KPI "${kpi.name}"?`)) return;
    await dispatch(removeKpi(selectedDashboard.id, kpi.id));
    await refreshSelected();
  };

  return (
    <Layout>
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1680, mx: "auto" }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <DashboardCustomizeIcon sx={{ color: "#4B2E83" }} />
              <Typography variant="h4" fontWeight={800}>
                Personal Dashboards
              </Typography>
            </Stack>
            <Typography sx={{ color: "#6b7280", fontSize: 14 }}>
              {dashboards.length}/5 dashboards configured
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            disabled={!canCreateDashboard}
            onClick={() => {
              setEditingDashboard(null);
              setDashboardModalOpen(true);
            }}
            sx={{ textTransform: "none", fontWeight: 800, backgroundColor: "#4B2E83" }}
          >
            Create Dashboard
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "340px 1fr" }, gap: 2 }}>
          <Box>
            <Card sx={{ borderRadius: 2, border: "1px solid #e5e7eb", boxShadow: "none" }}>
              <CardContent>
                <Typography fontWeight={900} sx={{ mb: 2 }}>
                  My Dashboards
                </Typography>
                {loading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : dashboards.length === 0 ? (
                  <Alert severity="info">Create your first personal dashboard to start monitoring project KPIs.</Alert>
                ) : (
                  <Stack spacing={1}>
                    {dashboards.map((dashboard) => {
                      const summary = getSummary(dashboard);
                          const active = dashboard.id === selectedDashboardId;
                      return (
                        <Box
                          key={dashboard.id}
                          onClick={() => setSelectedId(dashboard.id)}
                          sx={{
                            border: active ? "2px solid #4B2E83" : "1px solid #e5e7eb",
                            borderRadius: 2,
                            p: 1.5,
                            cursor: "pointer",
                            backgroundColor: active ? "#f5f3ff" : "#fff",
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography fontWeight={900} sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {dashboard.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "#6b7280" }}>
                                {getProjectName(dashboard, projects)}
                              </Typography>
                            </Box>
                            <Chip size="small" label={`${summary.totalKpis} KPIs`} />
                          </Stack>
                          <Stack direction="row" spacing={0.75} sx={{ mt: 1 }}>
                            <Chip size="small" label={summary.criticalKpis} sx={{ bgcolor: statusColors.CRITICAL.bg, color: statusColors.CRITICAL.color }} />
                            <Chip size="small" label={summary.onflowKpis} sx={{ bgcolor: statusColors.ONFLOW.bg, color: statusColors.ONFLOW.color }} />
                            <Chip size="small" label={summary.healthyKpis} sx={{ bgcolor: statusColors.HEALTHY.bg, color: statusColors.HEALTHY.color }} />
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Box>

          <Box>
            {!selectedDashboard && !detailLoading ? (
              <Card sx={{ borderRadius: 2, border: "1px solid #e5e7eb", boxShadow: "none" }}>
                <CardContent>
                  <Alert severity="info">Select a dashboard or create a new one.</Alert>
                </CardContent>
              </Card>
            ) : detailLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Stack spacing={2}>
                <Card sx={{ borderRadius: 2, border: "1px solid #e5e7eb", boxShadow: "none" }}>
                  <CardContent>
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", md: "center" }}
                      spacing={2}
                    >
                      <Box>
                        <Typography variant="h5" fontWeight={900}>
                          {selectedDashboard?.name}
                        </Typography>
                        <Typography sx={{ color: "#6b7280", fontSize: 14 }}>
                          {selectedDashboard?.description || "No description"}
                        </Typography>
                        <Chip
                          size="small"
                          sx={{ mt: 1, bgcolor: "#eef2ff", color: "#3730a3", fontWeight: 700 }}
                          label={selectedDashboard?.project?.name ?? getProjectName(selectedDashboard!, projects)}
                        />
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Edit dashboard">
                          <IconButton
                            onClick={() => {
                              setEditingDashboard(selectedDashboard);
                              setDashboardModalOpen(true);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Chart settings">
                          <IconButton onClick={() => setChartConfigOpen(true)}>
                            <SettingsIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete dashboard">
                          <IconButton color="error" onClick={() => selectedDashboard && handleDeleteDashboard(selectedDashboard)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => {
                            setEditingKpi(null);
                            setKpiModalOpen(true);
                          }}
                          sx={{ textTransform: "none", fontWeight: 800, backgroundColor: "#4B2E83" }}
                        >
                          Create KPI
                        </Button>
                      </Stack>
                    </Stack>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(5, 1fr)" }, gap: 1.5 }}>
                      <SummaryTile label="Total KPIs" value={selectedSummary.totalKpis} tone="UNCLASSIFIED" />
                      <SummaryTile label="Critical" value={selectedSummary.criticalKpis} tone="CRITICAL" />
                      <SummaryTile label="Onflow" value={selectedSummary.onflowKpis} tone="ONFLOW" />
                      <SummaryTile label="Healthy" value={selectedSummary.healthyKpis} tone="HEALTHY" />
                      <SummaryTile label="Unclassified" value={selectedSummary.unclassifiedKpis} tone="UNCLASSIFIED" />
                    </Box>
                  </CardContent>
                </Card>

                <Card sx={{ borderRadius: 2, border: "1px solid #e5e7eb", boxShadow: "none" }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <InsightsIcon sx={{ color: "#4B2E83" }} />
                        <Typography fontWeight={900}>Configured KPIs</Typography>
                      </Stack>
                    </Stack>
                    {!selectedDashboard?.kpis?.length ? (
                      <Alert severity="info">No KPIs configured yet. Create one to classify project health.</Alert>
                    ) : (
                      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", xl: "repeat(3, 1fr)" }, gap: 2 }}>
                        {selectedDashboard.kpis.map((kpi) => {
                          const colors = statusColors[kpi.status ?? "UNCLASSIFIED"];
                          return (
                            <Box key={kpi.id} sx={{ border: "1px solid #e5e7eb", borderRadius: 2, p: 2, backgroundColor: "#fff" }}>
                              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography fontWeight={900}>{kpi.name}</Typography>
                                  <Typography variant="caption" sx={{ color: "#6b7280" }}>
                                    {kpi.sourceType ?? "PROJECT"} / {kpi.field ?? "PROGRESS"}
                                  </Typography>
                                </Box>
                                <Chip label={kpi.status ?? "UNCLASSIFIED"} sx={{ bgcolor: colors.bg, color: colors.color, fontWeight: 800 }} />
                              </Stack>
                              <Stack direction="row" spacing={1} alignItems="baseline" sx={{ mt: 2 }}>
                                <Typography variant="h4" fontWeight={900}>
                                  {kpi.currentValue ?? "--"}
                                </Typography>
                                <Typography sx={{ color: "#6b7280" }}>{kpi.unit ?? "%"}</Typography>
                              </Stack>
                              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                                <Button
                                  size="small"
                                  startIcon={<EditIcon />}
                                  onClick={() => {
                                    setEditingKpi(kpi);
                                    setKpiModalOpen(true);
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => handleDeleteKpi(kpi)}>
                                  Delete
                                </Button>
                              </Stack>
                            </Box>
                          );
                        })}
                      </Box>
                    )}
                  </CardContent>
                </Card>

                <Stack direction="row" spacing={1} alignItems="center">
                  <AutoGraphIcon sx={{ color: "#4B2E83" }} />
                  <Typography fontWeight={900}>Dashboard Charts</Typography>
                  {chartData?.scurve?.status && <Chip size="small" icon={<WarningAmberIcon />} label={chartData.scurve.status} />}
                </Stack>
                <DashboardCharts dashboard={selectedDashboard} chartData={chartData} />
              </Stack>
            )}
          </Box>
        </Box>

        <DashboardModal
          open={dashboardModalOpen}
          onClose={() => setDashboardModalOpen(false)}
          onSaved={refreshSelected}
          projects={projects}
          dashboard={editingDashboard}
          dashboardCount={dashboards.length}
        />
        <KPIModal
          open={kpiModalOpen}
          onClose={() => setKpiModalOpen(false)}
          onSaved={refreshSelected}
          dashboard={selectedDashboard}
          editingKpi={editingKpi}
        />
        <ChartConfigDialog
          open={chartConfigOpen}
          onClose={() => setChartConfigOpen(false)}
          dashboard={selectedDashboard}
          onSaved={refreshSelected}
        />
      </Box>
    </Layout>
  );
}
