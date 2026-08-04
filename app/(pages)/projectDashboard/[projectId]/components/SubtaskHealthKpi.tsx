"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Collapse, Dialog,
  DialogActions, DialogContent, DialogTitle, FormControl,
  IconButton, InputAdornment, InputLabel, Menu, MenuItem, Select, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Slider, TextField, Tooltip, Typography,
} from "@mui/material";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import HealthAndSafetyOutlinedIcon from "@mui/icons-material/HealthAndSafetyOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import {
  ComputedSubtaskKpi,
  notifySubtaskKpiRefresh,
  SUBTASK_KPI_REFRESH_EVENT,
  SubtaskHealthStatus,
  subtaskKpiService,
} from "@/app/api-service/subtaskKpiService";

const tones: Record<SubtaskHealthStatus | "TOTAL", { color: string; bg: string; iconBg: string; border: string }> = {
  TOTAL: { color: "#4F46E5", bg: "#FFF", iconBg: "#F3F0FF", border: "#DDD6FE" },
  CRITICAL: { color: "#DC2626", bg: "#FFF", iconBg: "#FEF2F2", border: "#FECACA" },
  ONFLOW: { color: "#D97706", bg: "#FFF", iconBg: "#FFF7E6", border: "#FDE7BA" },
  HEALTHY: { color: "#059669", bg: "#FFF", iconBg: "#EAFBF4", border: "#C7F0DF" },
  UNCLASSIFIED: { color: "#64748B", bg: "#FFF", iconBg: "#F1F5F9", border: "#E2E8F0" },
};

const errorMessage = (error: unknown) => {
  if (typeof error === "string") return error;
  const value = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
  return value.response?.data?.message || value.message || "Unable to load automatic Subtask Health KPI.";
};

export default function SubtaskHealthKpi({
  projectId,
  summaryOnly = false,
  bareSummary = false,
  showSummary = true,
  onSummaryChange,
}: {
  projectId: string;
  summaryOnly?: boolean;
  bareSummary?: boolean;
  showSummary?: boolean;
  onSummaryChange?: (summary: ComputedSubtaskKpi["summary"]) => void;
}) {
  const [data, setData] = useState<ComputedSubtaskKpi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<SubtaskHealthStatus | "ALL">("ALL");
  const [scopeId, setScopeId] = useState("ALL");
  const [taskId, setTaskId] = useState("ALL");
  const [subtaskId, setSubtaskId] = useState("ALL");
  const [filterMenu, setFilterMenu] = useState<{
    column: "scope" | "task" | "subtask";
    anchor: HTMLElement;
  } | null>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [calculationOpen, setCalculationOpen] = useState(false);
  const [criticalBelow, setCriticalBelow] = useState("-15");
  const [healthyAtOrAbove, setHealthyAtOrAbove] = useState("-5");
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await subtaskKpiService.get(projectId);
      setData(result);
      onSummaryChange?.(result.summary);
      setCriticalBelow(String(result.config.criticalBelow));
      setHealthyAtOrAbove(String(result.config.healthyAtOrAbove));
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [onSummaryChange, projectId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const refresh = () => { load(); };
    window.addEventListener(SUBTASK_KPI_REFRESH_EVENT, refresh);
    return () => window.removeEventListener(SUBTASK_KPI_REFRESH_EVENT, refresh);
  }, [load]);

  const scopeOptions = useMemo(() => {
    const scopes = new Map<string, string>();
    data?.subtasks.forEach((subtask) => scopes.set(subtask.scope.id, subtask.scope.name));
    return Array.from(scopes, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);
  const taskOptions = useMemo(() => {
    const tasks = new Map<string, string>();
    data?.subtasks
      .filter((subtask) => scopeId === "ALL" || subtask.scope.id === scopeId)
      .forEach((subtask) => tasks.set(subtask.task.id, subtask.task.title));
    return Array.from(tasks, ([id, title]) => ({ id, title })).sort((a, b) => a.title.localeCompare(b.title));
  }, [data, scopeId]);
  const subtaskOptions = useMemo(
    () =>
      (data?.subtasks ?? [])
        .filter(
          (subtask) =>
            (scopeId === "ALL" || subtask.scope.id === scopeId) &&
            (taskId === "ALL" || subtask.task.id === taskId),
        )
        .map((subtask) => ({ id: subtask.id, title: subtask.title }))
        .sort((a, b) => a.title.localeCompare(b.title)),
    [data, scopeId, taskId],
  );
  const filtered = useMemo(
    () =>
      data?.subtasks.filter(
        (subtask) =>
          (status === "ALL" || subtask.status === status) &&
          (scopeId === "ALL" || subtask.scope.id === scopeId) &&
          (taskId === "ALL" || subtask.task.id === taskId) &&
          (subtaskId === "ALL" || subtask.id === subtaskId),
      ) ?? [],
    [data, scopeId, status, subtaskId, taskId],
  );

  const activeHeaderFilter =
    filterMenu?.column === "scope" ? scopeId :
    filterMenu?.column === "task" ? taskId :
    subtaskId;
  const activeHeaderOptions =
    filterMenu?.column === "scope"
      ? scopeOptions.map((option) => ({ id: option.id, label: option.name }))
      : filterMenu?.column === "task"
        ? taskOptions.map((option) => ({ id: option.id, label: option.title }))
        : subtaskOptions.map((option) => ({ id: option.id, label: option.title }));
  const selectHeaderFilter = (value: string) => {
    if (filterMenu?.column === "scope") {
      setScopeId(value);
      setTaskId("ALL");
      setSubtaskId("ALL");
    } else if (filterMenu?.column === "task") {
      setTaskId(value);
      setSubtaskId("ALL");
    } else {
      setSubtaskId(value);
    }
    setFilterMenu(null);
  };
  const criticalValue = Number(criticalBelow);
  const healthyValue = Number(healthyAtOrAbove);
  const validConfig =
    criticalBelow.trim() !== "" &&
    healthyAtOrAbove.trim() !== "" &&
    Number.isFinite(criticalValue) &&
    Number.isFinite(healthyValue) &&
    criticalValue < healthyValue;
  const sliderValue: [number, number] = [
    Number.isFinite(criticalValue)
      ? Math.min(
          Math.max(-100, Math.min(100, criticalValue)),
          Number.isFinite(healthyValue) ? Math.max(-100, Math.min(100, healthyValue)) : -5,
        )
      : -15,
    Number.isFinite(healthyValue)
      ? Math.max(
          Math.max(-100, Math.min(100, healthyValue)),
          Number.isFinite(criticalValue) ? Math.max(-100, Math.min(100, criticalValue)) : -15,
        )
      : -5,
  ];
  const normalizeTypedThreshold = (type: "critical" | "healthy") => {
    if (type === "critical") {
      const next = Number(criticalBelow);
      if (!Number.isFinite(next)) {
        setCriticalBelow("-15.00");
        return;
      }
      const upperLimit = Number.isFinite(healthyValue) ? healthyValue - 0.01 : 99.99;
      setCriticalBelow(Math.max(-100, Math.min(upperLimit, next)).toFixed(2));
      return;
    }
    const next = Number(healthyAtOrAbove);
    if (!Number.isFinite(next)) {
      setHealthyAtOrAbove("-5.00");
      return;
    }
    const lowerLimit = Number.isFinite(criticalValue) ? criticalValue + 0.01 : -99.99;
    setHealthyAtOrAbove(Math.min(100, Math.max(lowerLimit, next)).toFixed(2));
  };
  const thresholdSlider = (
    <Box sx={{ px: { xs: 0.5, sm: 1 } }}>
      <Typography sx={{ color: "#64748B", fontSize: 11.5, mb: 3 }}>
        Drag each handle to define the Critical and Healthy variance boundaries.
      </Typography>
      <Slider
        value={sliderValue}
        min={-100}
        max={100}
        step={0.01}
        disableSwap
        valueLabelDisplay="on"
        valueLabelFormat={(value) => `${value > 0 ? "+" : ""}${value.toFixed(2)}%`}
        marks={[
          { value: -100, label: "−100%" },
          { value: 0, label: "0%" },
          { value: 100, label: "+100%" },
        ]}
        onChange={(_, value) => {
          if (!Array.isArray(value)) return;
          setCriticalBelow(value[0].toFixed(2));
          setHealthyAtOrAbove(value[1].toFixed(2));
        }}
        sx={{
          color: "transparent",
          height: 10,
          "& .MuiSlider-rail": {
            opacity: 1,
            height: 10,
            background: "linear-gradient(90deg, #EF4444 0%, #F59E0B 50%, #10B981 100%)",
          },
          "& .MuiSlider-track": {
            height: 10,
            border: 0,
            background: "transparent",
          },
          "& .MuiSlider-thumb": {
            width: 22,
            height: 22,
            bgcolor: "#FFFFFF",
            border: "3px solid",
            boxShadow: "0 2px 8px rgba(15,23,42,.22)",
          },
          '& .MuiSlider-thumb[data-index="0"]': { borderColor: "#EF4444" },
          '& .MuiSlider-thumb[data-index="1"]': { borderColor: "#10B981" },
          "& .MuiSlider-valueLabel": {
            bgcolor: "#0F172A",
            fontSize: 10.5,
            fontWeight: 800,
          },
          "& .MuiSlider-markLabel": {
            color: "#64748B",
            fontSize: 10,
            fontWeight: 700,
          },
        }}
      />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" }, gap: 1, mt: 3 }}>
        <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: "#FEF2F2", border: "1px solid #FECACA" }}>
          <Typography sx={{ color: "#B91C1C", fontSize: 10, fontWeight: 800 }}>CRITICAL BELOW</Typography>
          <TextField
            type="number"
            size="small"
            variant="standard"
            value={criticalBelow}
            onChange={(event) => setCriticalBelow(event.target.value)}
            onBlur={() => normalizeTypedThreshold("critical")}
            inputProps={{ min: -100, max: 100, step: 0.01 }}
            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
            sx={{ mt: 0.25, maxWidth: 120, "& input": { color: "#991B1B", fontSize: 16, fontWeight: 900 } }}
          />
        </Box>
        <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: "#FFFBEB", border: "1px solid #FDE68A", textAlign: "center" }}>
          <Typography sx={{ color: "#B45309", fontSize: 10, fontWeight: 800 }}>IN FLOW</Typography>
          <Typography sx={{ color: "#92400E", fontSize: 14, fontWeight: 900 }}>
            {criticalValue.toFixed(2)}% to {healthyValue.toFixed(2)}%
          </Typography>
        </Box>
        <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: "#ECFDF5", border: "1px solid #A7F3D0", textAlign: { xs: "left", sm: "right" } }}>
          <Typography sx={{ color: "#047857", fontSize: 10, fontWeight: 800 }}>HEALTHY AT OR ABOVE</Typography>
          <TextField
            type="number"
            size="small"
            variant="standard"
            value={healthyAtOrAbove}
            onChange={(event) => setHealthyAtOrAbove(event.target.value)}
            onBlur={() => normalizeTypedThreshold("healthy")}
            inputProps={{ min: -100, max: 100, step: 0.01 }}
            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
            sx={{ mt: 0.25, maxWidth: 120, "& input": { color: "#065F46", fontSize: 16, fontWeight: 900, textAlign: { xs: "left", sm: "right" } } }}
          />
        </Box>
      </Box>
      {!validConfig && <Alert severity="error" sx={{ mt: 1.5 }}>Critical below must be less than Healthy at or above.</Alert>}
    </Box>
  );

  const saveConfig = async () => {
    if (!validConfig) return;
    setSaving(true);
    try {
      await subtaskKpiService.updateConfig(projectId, criticalValue, healthyValue);
      setConfigOpen(false);
      notifySubtaskKpiRefresh();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };
  const openConfig = async () => {
    setSaving(true);
    setError("");
    try {
      const config = await subtaskKpiService.getConfig(projectId);
      setCriticalBelow(String(config.criticalBelow));
      setHealthyAtOrAbove(String(config.healthyAtOrAbove));
      setConfigOpen(true);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };
  const resetConfig = async () => {
    if (!window.confirm("Restore the default Subtask Health thresholds?")) return;
    setSaving(true);
    try {
      await subtaskKpiService.resetConfig(projectId);
      setConfigOpen(false);
      notifySubtaskKpiRefresh();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const summaryCards = data ? (
    <Box sx={{
      display: "grid",
      gridTemplateColumns: bareSummary
        ? "repeat(5, minmax(125px, 1fr))"
        : { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(5, minmax(0, 1fr))" },
      gap: 1,
      minWidth: bareSummary ? 665 : 0,
    }}>
      {([
        ["TOTAL", "Total", data.summary.total],
        ["CRITICAL", "Critical", data.summary.critical],
        ["ONFLOW", "In Flow", data.summary.onflow],
        ["HEALTHY", "Healthy", data.summary.healthy],
        ["UNCLASSIFIED", "Unclassified", data.summary.unclassified],
      ] as const).map(([key, label, value]) => {
        const tone = tones[key];
        if (bareSummary) {
          const description = {
            TOTAL: "Subtasks tracked",
            CRITICAL: "Need attention",
            ONFLOW: "Within flow",
            HEALTHY: "On schedule",
            UNCLASSIFIED: "Not classified",
          }[key];
          return (
            <Box
              key={key}
              sx={{
                minHeight: 64,
                px: 1.25,
                py: 1,
                borderRadius: 1.5,
                bgcolor: "#FFFFFF",
                border: `1px solid ${tone.border}`,
                borderTop: `3px solid ${tone.color}`,
                boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
              }}
            >
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                <Stack direction="row" spacing={0.65} alignItems="center" sx={{ minWidth: 0 }}>
                  <Box sx={{ width: 22, height: 22, display: "grid", placeItems: "center", borderRadius: 1, color: tone.color, bgcolor: tone.iconBg }}>
                    <HealthAndSafetyOutlinedIcon sx={{ fontSize: 14 }} />
                  </Box>
                  <Typography sx={{ color: "#475569", fontSize: 10.5, fontWeight: 700, lineHeight: 1.2 }}>
                    {label}
                  </Typography>
                </Stack>
                <Typography sx={{ color: tone.color, fontSize: 22, fontWeight: 800, lineHeight: 1 }}>
                  {value}
                </Typography>
              </Stack>
              <Typography sx={{ color: "#64748B", fontSize: 9, mt: 0.75, pl: 3.6, whiteSpace: "nowrap" }}>
                {description}
              </Typography>
            </Box>
          );
        }
        return (
          <Box key={key} sx={{ minHeight: 66, px: 1.25, py: 0.85, display: "flex", alignItems: "center", gap: 1, borderRadius: 2.25, bgcolor: tone.bg, border: `1px solid ${tone.border}` }}>
            <Box sx={{ width: 36, height: 36, display: "grid", placeItems: "center", flexShrink: 0, borderRadius: "50%", color: tone.color, bgcolor: tone.iconBg }}><HealthAndSafetyOutlinedIcon sx={{ fontSize: 19 }} /></Box>
            <Box><Typography sx={{ color: "#475569", fontSize: 10.5, fontWeight: 700 }}>{label}</Typography><Typography sx={{ color: tone.color, fontSize: 21, fontWeight: 900, lineHeight: 1.1 }}>{value}</Typography></Box>
          </Box>
        );
      })}
    </Box>
  ) : null;

  if (summaryOnly && bareSummary) {
    if (loading) {
      return <Box sx={{ minHeight: 58, display: "grid", placeItems: "center" }}><CircularProgress size={22} /></Box>;
    }
    if (error || !data) {
      return <Alert severity="error" action={<Button color="inherit" size="small" onClick={load}>Retry</Button>}>{error || "Unable to load KPI summary."}</Alert>;
    }
    return summaryCards;
  }

  if (summaryOnly) {
    return (
      <>
        <Card variant="outlined" sx={{ borderRadius: 2, borderColor: "#DBEAFE" }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1.5} sx={{ mb: 1.5 }}>
              <Typography sx={{ fontWeight: 900 }}>KPI Summary</Typography>
              {data && (
                <Button variant="outlined" size="small" startIcon={<SettingsOutlinedIcon />} disabled={saving} onClick={openConfig} sx={{ textTransform: "none", fontWeight: 800 }}>
                  Thresholds
                </Button>
              )}
            </Stack>
            {loading ? (
              <Box sx={{ minHeight: 70, display: "grid", placeItems: "center" }}><CircularProgress size={24} /></Box>
            ) : error || !data ? (
              <Alert severity="error" action={<Button color="inherit" size="small" onClick={load}>Retry</Button>}>{error || "Unable to load KPI summary."}</Alert>
            ) : summaryCards}
          </CardContent>
        </Card>

        <Dialog open={configOpen} onClose={() => !saving && setConfigOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle sx={{ fontWeight: 900 }}>Subtask Health Thresholds</DialogTitle>
          <DialogContent dividers>
            <Typography sx={{ color: "#64748B", fontSize: 12, mb: 2 }}>Variance equals actual progress minus expected progress.</Typography>
            {thresholdSlider}
          </DialogContent>
          <DialogActions>
            {data?.config.isCustom && <Button color="warning" disabled={saving} onClick={resetConfig}>Restore Defaults</Button>}
            <Box sx={{ flex: 1 }} />
            <Button onClick={() => setConfigOpen(false)}>Cancel</Button>
            <Button variant="contained" disabled={saving || !validConfig} onClick={saveConfig}>{saving ? "Saving…" : "Save Thresholds"}</Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: 2, borderColor: "#DBEAFE" }}>
      <CardContent>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} gap={1.5} sx={{ mb: 2 }}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <HealthAndSafetyOutlinedIcon sx={{ color: "#2563EB" }} />
              <Typography sx={{ fontWeight: 900 }}>Automatic Subtask Health</Typography>
            </Stack>
            <Typography sx={{ color: "#64748B", fontSize: 11.5, mt: 0.4 }}>
              Compares actual progress against schedule-expected progress.
            </Typography>
          </Box>
          {data && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Button variant="outlined" size="small" startIcon={<SettingsOutlinedIcon />} disabled={saving} onClick={openConfig} sx={{ textTransform: "none", fontWeight: 800 }}>
                Thresholds
              </Button>
              <Tooltip title="How Subtask Health is computed">
                <IconButton
                  size="small"
                  color={calculationOpen ? "primary" : "default"}
                  onClick={() => setCalculationOpen((open) => !open)}
                  aria-label={calculationOpen ? "Hide Subtask Health calculation" : "Show Subtask Health calculation"}
                  aria-expanded={calculationOpen}
                  sx={{ border: "1px solid", borderColor: calculationOpen ? "#93C5FD" : "#E2E8F0" }}
                >
                  <InfoOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
        </Stack>

        <Collapse in={calculationOpen} unmountOnExit>
          <Box sx={{ mb: 2, p: { xs: 1.5, md: 2 }, border: "1px solid #DBEAFE", borderRadius: 2, bgcolor: "#F8FAFC" }}>
            <Alert severity="info" sx={{ mb: 2, fontSize: 11.5 }}>
              Variance compares the subtask&apos;s actual progress with its expected progress based on the projected schedule. A negative value means the subtask is behind schedule, while a positive value means it is ahead of schedule.
            </Alert>

            {data && (
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" }, gap: 1.5 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "#FFFFFF", border: "1px solid #E2E8F0" }}>
                  <Typography sx={{ color: "#334155", fontSize: 11, fontWeight: 900, mb: 1 }}>EXPECTED PROGRESS</Typography>
                  <Typography component="div" sx={{ color: "#0F172A", fontFamily: "monospace", fontSize: 11.5, lineHeight: 1.7 }}>
                    ((Current Date − Projected Start Date)<br />
                    ÷ (Projected End Date − Projected Start Date)) × 100
                  </Typography>
                  <Stack spacing={0.4} sx={{ mt: 1.25 }}>
                    <Typography sx={{ color: "#64748B", fontSize: 10.5 }}>Before projected start → 0%</Typography>
                    <Typography sx={{ color: "#64748B", fontSize: 10.5 }}>On or after projected end → 100%</Typography>
                    <Typography sx={{ color: "#64748B", fontSize: 10.5 }}>Between dates → calculated using the formula</Typography>
                    <Typography sx={{ color: "#64748B", fontSize: 10.5 }}>Missing schedule dates → unavailable</Typography>
                  </Stack>
                </Box>

                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "#FFFFFF", border: "1px solid #E2E8F0" }}>
                  <Typography sx={{ color: "#334155", fontSize: 11, fontWeight: 900, mb: 1 }}>VARIANCE AND STATUS</Typography>
                  <Typography sx={{ color: "#0F172A", fontFamily: "monospace", fontSize: 11.5, fontWeight: 700 }}>
                    Variance = Actual Progress − Expected Progress
                  </Typography>
                  <Stack spacing={0.4} sx={{ mt: 1.25 }}>
                    <Typography sx={{ color: "#059669", fontSize: 10.5, fontWeight: 700 }}>Actual progress ≥ 100% → HEALTHY</Typography>
                    <Typography sx={{ color: "#64748B", fontSize: 10.5, fontWeight: 700 }}>Schedule dates missing → UNCLASSIFIED</Typography>
                    <Typography sx={{ color: "#DC2626", fontSize: 10.5, fontWeight: 700 }}>Variance &lt; {data.config.criticalBelow}% → CRITICAL</Typography>
                    <Typography sx={{ color: "#D97706", fontSize: 10.5, fontWeight: 700 }}>
                      Variance ≥ {data.config.criticalBelow}% and &lt; {data.config.healthyAtOrAbove}% → ONFLOW
                    </Typography>
                    <Typography sx={{ color: "#059669", fontSize: 10.5, fontWeight: 700 }}>Variance ≥ {data.config.healthyAtOrAbove}% → HEALTHY</Typography>
                  </Stack>
                </Box>
              </Box>
            )}
          </Box>
        </Collapse>

        {error && data && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ minHeight: 160, display: "grid", placeItems: "center" }}><CircularProgress size={28} /></Box>
        ) : error && !data ? (
          <Alert
            severity="error"
            action={<Button color="inherit" size="small" onClick={load}>Retry</Button>}
          >
            {error}
          </Alert>
        ) : data ? (
          <Stack spacing={2}>
            {showSummary && summaryCards}

            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} gap={1}>
              <Typography sx={{ color: "#64748B", fontSize: 11.5 }}>
                Critical below {data.config.criticalBelow}% • Healthy at {data.config.healthyAtOrAbove}% or above
                {data.config.isCustom ? " • Custom thresholds" : " • Default thresholds"}
              </Typography>
              <FormControl size="small" sx={{ minWidth: 150 }}><InputLabel>Status</InputLabel><Select label="Status" value={status} onChange={(event) => setStatus(event.target.value as SubtaskHealthStatus | "ALL")}><MenuItem value="ALL">All statuses</MenuItem><MenuItem value="CRITICAL">Critical</MenuItem><MenuItem value="ONFLOW">In Flow</MenuItem><MenuItem value="HEALTHY">Healthy</MenuItem><MenuItem value="UNCLASSIFIED">Unclassified</MenuItem></Select></FormControl>
            </Stack>

            <TableContainer sx={{ border: "1px solid #E2E8F0", borderRadius: 2, maxHeight: 480 }}>
              <Table stickyHeader size="small" sx={{ minWidth: 780 }}>
                <TableHead>
                  <TableRow>
                    {(["scope", "task", "subtask"] as const).map((column) => {
                      const selected = column === "scope" ? scopeId !== "ALL" : column === "task" ? taskId !== "ALL" : subtaskId !== "ALL";
                      return (
                        <TableCell key={column} sx={{ fontWeight: 800 }}>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 0.5 }}>
                            <Box component="span" sx={{ textTransform: "capitalize" }}>{column}</Box>
                            <IconButton
                              size="small"
                              aria-label={`Filter ${column}`}
                              onClick={(event) => setFilterMenu({ column, anchor: event.currentTarget })}
                              sx={{ p: 0.35, color: selected ? "#2563EB" : "#64748B", bgcolor: selected ? "#EFF6FF" : "transparent" }}
                            >
                              <FilterAltOutlinedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
                        </TableCell>
                      );
                    })}
                    <TableCell align="right" sx={{ fontWeight: 800 }}>Actual</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>Expected</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>Variance</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Health</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((subtask) => {
                    const tone = tones[subtask.status];
                    return (
                      <TableRow key={subtask.id} hover>
                        <TableCell sx={{ fontSize: 11.5 }}>{subtask.scope.name}</TableCell>
                        <TableCell sx={{ fontSize: 11.5 }}>{subtask.task.title}</TableCell>
                        <TableCell sx={{ fontSize: 11.5, fontWeight: 700 }}>{subtask.title}</TableCell>
                        <TableCell align="right">{subtask.actualProgress}%</TableCell>
                        <TableCell align="right">{subtask.expectedProgress}%</TableCell>
                        <TableCell align="right" sx={{ color: subtask.variance < 0 ? "#DC2626" : "#059669", fontWeight: 800 }}>{subtask.variance > 0 ? "+" : ""}{subtask.variance}%</TableCell>
                        <TableCell><Chip size="small" label={subtask.status === "ONFLOW" ? "IN FLOW" : subtask.status} sx={{ height: 20, color: tone.color, bgcolor: tone.iconBg, fontSize: 9, fontWeight: 800 }} /></TableCell>
                      </TableRow>
                    );
                  })}
                  {!filtered.length && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: "#64748B" }}>No subtasks match this status.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>

            <Menu
              anchorEl={filterMenu?.anchor ?? null}
              open={Boolean(filterMenu)}
              onClose={() => setFilterMenu(null)}
              slotProps={{ paper: { sx: { width: 260, maxHeight: 360 } } }}
            >
              <MenuItem selected={activeHeaderFilter === "ALL"} onClick={() => selectHeaderFilter("ALL")}>
                Select All
              </MenuItem>
              {activeHeaderOptions.map((option) => (
                <MenuItem key={option.id} selected={activeHeaderFilter === option.id} onClick={() => selectHeaderFilter(option.id)}>
                  <Typography noWrap sx={{ fontSize: 12 }}>{option.label}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Stack>
        ) : null}
      </CardContent>

      <Dialog open={configOpen} onClose={() => !saving && setConfigOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900 }}>Subtask Health Thresholds</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ color: "#64748B", fontSize: 12, mb: 2 }}>Variance equals actual progress minus expected progress.</Typography>
          {thresholdSlider}
        </DialogContent>
        <DialogActions>
          {data?.config.isCustom && <Button color="warning" disabled={saving} onClick={resetConfig}>Restore Defaults</Button>}
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => setConfigOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={saving || !validConfig} onClick={saveConfig}>{saving ? "Saving…" : "Save Thresholds"}</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
