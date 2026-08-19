"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Card, CardContent, CircularProgress, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import KPIModal from "@/app/components/shared/modals/KPIModal";
import DashboardCharts from "@/app/(pages)/personalDashboard/components/DashboardCharts";
import DashboardReportTable from "@/app/(pages)/personalDashboard/components/DashboardReportTable";
import ProjectedActualTimelineChart from "@/app/(pages)/personalDashboard/components/ProjectedActualTimelineChart";
import KpiStatusPieCard from "@/app/(pages)/personalDashboard/components/KpiStatusPieCard";
import type { DashboardSummary, PersonalDashboardKpi } from "@/app/api-service/personalDashboardService";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { fetchDashboardChartData, fetchDashboardReportTable, fetchPersonalDashboardDetail, removeKpi } from "@/app/redux/controllers/personalDashboardController";
import { getProjectFull } from "@/app/redux/controllers/projectController";
import SubtaskHealthKpi from "./SubtaskHealthKpi";
import CustomKpiChart from "./CustomKpiChart";
import type { ComputedSubtaskKpi } from "@/app/api-service/subtaskKpiService";
import { notifySubtaskKpiRefresh } from "@/app/api-service/subtaskKpiService";

const emptySummary: DashboardSummary = { totalKpis: 0, criticalKpis: 0, onflowKpis: 0, healthyKpis: 0, unclassifiedKpis: 0 };

export default function ProjectDashboardContent({ projectId }: { projectId: string }) {
  const dispatch = useAppDispatch();
  const state = useAppSelector((value) => value.personalDashboard);
  const { selectedDashboard, chartData, reportTable, detailLoading, reportLoading, error } = state;
  const fullProject = useAppSelector((value) => value.project.fullProjectsById[projectId] ?? (String(value.project.fullProject?.id || "") === projectId ? value.project.fullProject : null));
  const [kpiOpen, setKpiOpen] = useState(false);
  const [editingKpi, setEditingKpi] = useState<PersonalDashboardKpi | null>(null);
  const [healthSummary, setHealthSummary] = useState<ComputedSubtaskKpi["summary"] | null>(null);
  const [healthData, setHealthData] = useState<ComputedSubtaskKpi | null>(null);

  const refresh = useCallback(async () => {
    await Promise.all([
      dispatch(fetchPersonalDashboardDetail(projectId)),
      dispatch(fetchDashboardChartData(projectId)),
      dispatch(fetchDashboardReportTable(projectId)),
      dispatch(getProjectFull(projectId, { preferCache: true })),
    ]);
  }, [dispatch, projectId]);

  useEffect(() => { refresh().catch(() => undefined); }, [refresh]);
  const dashboard = selectedDashboard?.id === projectId ? selectedDashboard : null;
  const dashboardSummary = dashboard?.summary ?? emptySummary;
  const automatic = healthSummary ?? dashboardSummary.subtasks ?? (
    dashboardSummary.total !== undefined
      ? {
          total: dashboardSummary.total,
          critical: dashboardSummary.critical ?? 0,
          onflow: dashboardSummary.onflow ?? 0,
          healthy: dashboardSummary.healthy ?? 0,
          unclassified: dashboardSummary.unclassified ?? 0,
        }
      : null
  );
  const pieSummary: DashboardSummary = automatic
    ? { ...emptySummary, total: automatic.total, critical: automatic.critical, onflow: automatic.onflow, healthy: automatic.healthy, unclassified: automatic.unclassified, subtasks: automatic }
    : emptySummary;

  const handleDelete = async (kpi: PersonalDashboardKpi) => {
    if (!window.confirm(`Delete KPI "${kpi.name}" and all of its targets?`)) return;
    await dispatch(removeKpi(projectId, kpi.id));
    await refresh();
  };

  return (
    <Box sx={{ p: { xs: 1.25, md: 2 }, maxWidth: 1500, mx: "auto" }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {detailLoading && !dashboard ? (
        <Box sx={{ minHeight: 360, display: "grid", placeItems: "center" }}><CircularProgress /></Box>
      ) : dashboard ? (
        <Stack spacing={2}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(340px, .8fr) minmax(0, 1.2fr)" }, gap: 2, alignItems: "stretch" }}>
            <Box sx={{ minWidth: 0, "& > *": { height: "100%" } }}>
              <KpiStatusPieCard
                summary={pieSummary}
                details={(healthData?.subtasks ?? []).map((item) => ({
                  id: item.id,
                  title: item.title,
                  context: `${item.scope.name} / ${item.task.title}`,
                  value: `Actual ${item.actualProgress}% - Expected ${item.expectedProgress}% - Variance ${item.variance > 0 ? "+" : ""}${item.variance}%`,
                  status: item.status,
                }))}
              />
            </Box>
            <Card variant="outlined" sx={{ borderRadius: 2, borderColor: "#DBEAFE" }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1.5} sx={{ mb: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <InsightsOutlinedIcon sx={{ color: "#2563EB" }} />
                    <Box><Typography sx={{ fontWeight: 900 }}>Custom KPI Charts</Typography><Typography sx={{ color: "#64748B", fontSize: 10.5 }}>Each chart summarizes only its selected targets.</Typography></Box>
                  </Stack>
                  <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => { setEditingKpi(null); setKpiOpen(true); }} sx={{ textTransform: "none", fontWeight: 800, boxShadow: "none" }}>Create KPI</Button>
                </Stack>
                {!dashboard.kpis?.length ? (
                  <Alert severity="info">No custom KPIs configured yet.</Alert>
                ) : (
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 1.5 }}>
                    {dashboard.kpis.map((kpi) => <CustomKpiChart key={kpi.id} kpi={kpi} onEdit={() => { setEditingKpi(kpi); setKpiOpen(true); }} onDelete={() => handleDelete(kpi)} />)}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
          <SubtaskHealthKpi projectId={projectId} showSummary={false} onSummaryChange={setHealthSummary} onDataChange={setHealthData} />
          <DashboardCharts dashboard={dashboard} chartData={chartData} projectTree={fullProject} />
          <ProjectedActualTimelineChart reportTable={reportTable ?? chartData?.reportTable ?? null} projectTree={fullProject} loading={reportLoading} />
          <DashboardReportTable reportTable={reportTable ?? chartData?.reportTable ?? null} loading={reportLoading} />
        </Stack>
      ) : (
        <Alert severity="info">Project dashboard data is not available.</Alert>
      )}
      <KPIModal open={kpiOpen} onClose={() => setKpiOpen(false)} onSaved={async () => { await refresh(); notifySubtaskKpiRefresh(); }} dashboard={dashboard} editingKpi={editingKpi} />
    </Box>
  );
}
