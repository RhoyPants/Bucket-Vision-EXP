"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import KPIModal from "@/app/components/shared/modals/KPIModal";
import DashboardCharts from "@/app/(pages)/personalDashboard/components/DashboardCharts";
import DashboardReportTable from "@/app/(pages)/personalDashboard/components/DashboardReportTable";
import ProjectedActualTimelineChart from "@/app/(pages)/personalDashboard/components/ProjectedActualTimelineChart";
import KpiStatusPieCard from "@/app/(pages)/personalDashboard/components/KpiStatusPieCard";
import type { DashboardSummary, PersonalDashboardKpi } from "@/app/api-service/personalDashboardService";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import {
  fetchDashboardChartData,
  fetchDashboardReportTable,
  fetchPersonalDashboardDetail,
  removeKpi,
} from "@/app/redux/controllers/personalDashboardController";
import { getProjectFull } from "@/app/redux/controllers/projectController";
import SubtaskHealthKpi from "./SubtaskHealthKpi";
import type { ComputedSubtaskKpi } from "@/app/api-service/subtaskKpiService";
import { notifySubtaskKpiRefresh } from "@/app/api-service/subtaskKpiService";

const emptySummary = {
  totalKpis: 0,
  criticalKpis: 0,
  onflowKpis: 0,
  healthyKpis: 0,
  unclassifiedKpis: 0,
};

const statusColor = {
  CRITICAL: { color: "#B91C1C", bg: "#FEF2F2", border: "#FECACA" },
  ONFLOW: { color: "#B45309", bg: "#FFFBEB", border: "#FDE68A" },
  HEALTHY: { color: "#047857", bg: "#ECFDF5", border: "#BBF7D0" },
  UNCLASSIFIED: { color: "#475569", bg: "#F8FAFC", border: "#CBD5E1" },
};

export default function ProjectDashboardContent({ projectId }: { projectId: string }) {
  const dispatch = useAppDispatch();
  const { selectedDashboard, chartData, reportTable, detailLoading, reportLoading, error } =
    useAppSelector((state) => state.personalDashboard);
  const fullProject = useAppSelector((state) =>
    state.project.fullProjectsById[projectId] ??
    (String(state.project.fullProject?.id || "") === projectId ? state.project.fullProject : null),
  );
  const [kpiOpen, setKpiOpen] = useState(false);
  const [editingKpi, setEditingKpi] = useState<PersonalDashboardKpi | null>(null);
  const [subtaskHealthSummary, setSubtaskHealthSummary] = useState<ComputedSubtaskKpi["summary"] | null>(null);

  const refresh = useCallback(async () => {
    await Promise.all([
      dispatch(fetchPersonalDashboardDetail(projectId)),
      dispatch(fetchDashboardChartData(projectId)),
      dispatch(fetchDashboardReportTable(projectId)),
      dispatch(getProjectFull(projectId, { preferCache: true })),
    ]);
  }, [dispatch, projectId]);

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  const dashboard = selectedDashboard?.id === projectId ? selectedDashboard : null;
  const summary: DashboardSummary = dashboard?.summary ?? emptySummary;
  const pieSummary: DashboardSummary = subtaskHealthSummary
    ? {
        ...emptySummary,
        total: subtaskHealthSummary.total,
        critical: subtaskHealthSummary.critical,
        onflow: subtaskHealthSummary.onflow,
        healthy: subtaskHealthSummary.healthy,
        unclassified: subtaskHealthSummary.unclassified,
        subtasks: subtaskHealthSummary.subtasks,
        configuredKpis: subtaskHealthSummary.configuredKpis,
      }
    : summary;

  const handleDeleteKpi = async (kpi: PersonalDashboardKpi) => {
    if (!window.confirm(`Delete KPI "${kpi.name}"?`)) return;
    await dispatch(removeKpi(projectId, kpi.id));
    await refresh();
    notifySubtaskKpiRefresh();
  };

  return (
    <Box sx={{ p: { xs: 1.25, md: 2 }, maxWidth: 1500, mx: "auto" }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {detailLoading && !dashboard ? (
        <Box sx={{ minHeight: 360, display: "grid", placeItems: "center" }}><CircularProgress /></Box>
      ) : dashboard ? (
        <Stack spacing={2}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "minmax(340px, 0.8fr) minmax(0, 1.2fr)" },
              gap: 2,
              alignItems: "stretch",
            }}
          >
            <Box sx={{ minWidth: 0, "& > *": { height: "100%" } }}>
              <KpiStatusPieCard summary={pieSummary} />
            </Box>

            <Card variant="outlined" sx={{ minWidth: 0, height: "100%", borderRadius: 2, borderColor: "#DBEAFE" }}>
              <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1.5} sx={{ mb: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <InsightsOutlinedIcon sx={{ color: "#2563EB" }} />
                  <Typography sx={{ fontWeight: 900 }}>Configured KPIs</Typography>
                </Stack>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => { setEditingKpi(null); setKpiOpen(true); }}
                  sx={{ textTransform: "none", fontWeight: 800, boxShadow: "none" }}
                >
                  Create KPI
                </Button>
              </Stack>

              {!dashboard.kpis?.length ? (
                <Alert severity="info">No KPIs configured yet.</Alert>
              ) : (
                <Box sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(4, minmax(0, 1fr))",
                  },
                  gap: 1,
                }}>
                  {dashboard.kpis.map((kpi) => {
                    const tone = statusColor[kpi.status ?? "UNCLASSIFIED"];
                    return (
                      <Box key={kpi.id} sx={{ p: 1, minWidth: 0, borderRadius: 1.75, border: `1px solid ${tone.border}`, bgcolor: tone.bg }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography noWrap title={kpi.name} sx={{ fontSize: 11.5, fontWeight: 850 }}>{kpi.name}</Typography>
                            <Typography noWrap title={kpi.sourceDetails?.title ?? kpi.sourceType ?? "PROJECT"} sx={{ color: "#64748B", fontSize: 9.5 }}>{kpi.sourceDetails?.title ?? kpi.sourceType ?? "PROJECT"}</Typography>
                          </Box>
                          <Chip label={kpi.status ?? "UNCLASSIFIED"} size="small" sx={{ height: 17, color: tone.color, bgcolor: "#FFF", fontSize: 7.5, fontWeight: 800, "& .MuiChip-label": { px: 0.65 } }} />
                        </Stack>
                        <Stack direction="row" alignItems="baseline" spacing={0.35} sx={{ mt: 0.65 }}>
                          <Typography sx={{ color: tone.color, fontSize: 18, fontWeight: 900 }}>{kpi.currentValue ?? "—"}</Typography>
                          <Typography sx={{ color: "#64748B", fontSize: 10 }}>{kpi.unit ?? "%"}</Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="flex-end" sx={{ mt: -0.25 }}>
                          <Tooltip title="Edit KPI">
                            <IconButton size="small" sx={{ p: 0.45 }} onClick={() => { setEditingKpi(kpi); setKpiOpen(true); }}><EditOutlinedIcon sx={{ fontSize: 15 }} /></IconButton>
                          </Tooltip>
                          <Tooltip title="Delete KPI">
                            <IconButton size="small" sx={{ p: 0.45 }} color="error" onClick={() => handleDeleteKpi(kpi)}><DeleteOutlineIcon sx={{ fontSize: 15 }} /></IconButton>
                          </Tooltip>
                        </Stack>
                      </Box>
                    );
                  })}
                </Box>
              )}
              </CardContent>
            </Card>
          </Box>

          <SubtaskHealthKpi projectId={projectId} showSummary={false} onSummaryChange={setSubtaskHealthSummary} />
          <DashboardCharts dashboard={dashboard} chartData={chartData} projectTree={fullProject} />
          <ProjectedActualTimelineChart reportTable={reportTable ?? chartData?.reportTable ?? null} projectTree={fullProject} loading={reportLoading} />
          <DashboardReportTable reportTable={reportTable ?? chartData?.reportTable ?? null} loading={reportLoading} />
        </Stack>
      ) : (
        <Alert severity="info">Project dashboard data is not available.</Alert>
      )}

      <KPIModal
        open={kpiOpen}
        onClose={() => setKpiOpen(false)}
        onSaved={async () => {
          await refresh();
          notifySubtaskKpiRefresh();
        }}
        dashboard={dashboard}
        editingKpi={editingKpi}
      />
    </Box>
  );
}
