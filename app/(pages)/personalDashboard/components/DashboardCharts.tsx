"use client";

import React from "react";
import { Alert, Box, Card, CardContent, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import SCurveChart from "@/app/components/shared/Scurved/SCurveChart";
import {
  ChartData,
  DashboardChartConfig,
  DashboardSummary,
  PersonalDashboard,
} from "@/app/api-service/personalDashboardService";
import MeasuredChartContainer from "./MeasuredChartContainer";
import GanttGridView from "@/app/components/shared/GanttGridView";
import DashboardCalendar from "@/app/components/shared/calendar/DashboardCalendar";
import VerticalScheduleMatrix from "@/app/components/shared/calendar/VerticalScheduleMatrix";

const statusColors: Record<string, { accent: string }> = {
  CRITICAL: { accent: "#ef4444" },
  ONFLOW: { accent: "#f59e0b" },
  HEALTHY: { accent: "#10b981" },
  UNCLASSIFIED: { accent: "#9ca3af" },
};

const chartOptions = [
  { chartType: "KPI_SUMMARY" },
  { chartType: "SCURVE" },
  { chartType: "SLA_DEADLINE_RISK" },
  { chartType: "KPI_STATUS_DISTRIBUTION" },
  { chartType: "TASK_COMPLETION" },
  { chartType: "DELAY_TREND" },
];

const defaultSummary: DashboardSummary = {
  totalKpis: 0,
  criticalKpis: 0,
  onflowKpis: 0,
  healthyKpis: 0,
  unclassifiedKpis: 0,
};

const flatCardSx = {
  borderRadius: 2,
  border: "1px solid #dbeafe",
  boxShadow: "none",
  backgroundColor: "#fff",
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

export default function DashboardCharts({
  dashboard,
  chartData,
  projectTree,
}: {
  dashboard: PersonalDashboard | null;
  chartData: ChartData | null;
  projectTree?: any;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedVisualization = searchParams.get("visual");
  const visualization = requestedVisualization === "timeline" || requestedVisualization === "calendar" || requestedVisualization === "matrix"
    ? requestedVisualization
    : "scurve";
  const projectId = dashboard?.projectId || dashboard?.project?.id;
  const setVisualization = (next: "scurve" | "timeline" | "calendar" | "matrix") => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "scurve") params.delete("visual");
    else params.set("visual", next);
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  };
  const enabledCharts = normalizeCharts(dashboard?.charts)
    .filter((chart) => chart.isEnabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const summary = chartData?.summary ?? dashboard?.summary ?? defaultSummary;
  const combinedSummary = {
    totalKpis: summary.total ?? summary.totalKpis,
    criticalKpis: summary.critical ?? summary.criticalKpis,
    onflowKpis: summary.onflow ?? summary.onflowKpis,
    healthyKpis: summary.healthy ?? summary.healthyKpis,
    unclassifiedKpis: summary.unclassified ?? summary.unclassifiedKpis,
  };
  const statusData = [
    { name: "Critical", value: combinedSummary.criticalKpis, color: statusColors.CRITICAL.accent },
    { name: "Onflow", value: combinedSummary.onflowKpis, color: statusColors.ONFLOW.accent },
    { name: "Healthy", value: combinedSummary.healthyKpis, color: statusColors.HEALTHY.accent },
    { name: "Unclassified", value: combinedSummary.unclassifiedKpis, color: statusColors.UNCLASSIFIED.accent },
  ];
  const trendData = chartData?.progressTrend ?? [];
  const completionData = chartData?.taskCompletion
    ? [
        { name: "Pending", value: chartData.taskCompletion.pending },
        {
          name: "Ongoing",
          value:
            chartData.taskCompletion.ongoing ??
            chartData.taskCompletion.inProgress ??
            Math.max(
              (chartData.taskCompletion.total ?? 0) -
                (chartData.taskCompletion.pending ?? 0) -
                (chartData.taskCompletion.completed ?? 0),
              0,
            ),
        },
        { name: "Completed", value: chartData.taskCompletion.completed },
      ]
    : [];

  if (!dashboard) return null;

  return (
    <Stack spacing={2} sx={{ minWidth: 0 }}>
      <Card sx={flatCardSx}>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} gap={1.5} sx={{ mb: 2 }}>
            <Box>
              <Typography fontWeight={900}>Project schedule and progress</Typography>
              <Typography sx={{ mt: 0.25, color: "#64748B", fontSize: 12 }}>
                Switch views without reloading the project structure.
              </Typography>
            </Box>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={visualization}
              onChange={(_, value) => value && setVisualization(value)}
              aria-label="Project visualization"
            >
              <ToggleButton value="scurve" sx={{ textTransform: "none", fontWeight: 800 }}>S-Curve</ToggleButton>
              <ToggleButton value="timeline" sx={{ textTransform: "none", fontWeight: 800 }}>Timeline</ToggleButton>
              <ToggleButton value="calendar" sx={{ textTransform: "none", fontWeight: 800 }}>Calendar</ToggleButton>
              <ToggleButton value="matrix" sx={{ textTransform: "none", fontWeight: 800 }}>Schedule Matrix</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          {visualization === "scurve" ? (
            <Box sx={{ minHeight: { xs: 300, md: 380 }, overflow: "auto", width: "100%" }}>
              {projectId ? <SCurveChart projectId={projectId} /> : <Alert severity="info">Project is not linked for this dashboard yet.</Alert>}
            </Box>
          ) : visualization === "timeline" ? (
            projectId && projectTree ? <GanttGridView projectId={projectId} project={projectTree} /> : <Alert severity="info">Project timeline data is loading.</Alert>
          ) : visualization === "calendar" ? (
            projectId ? (
              <DashboardCalendar
                projectId={projectId}
                projectStartDate={dashboard.project?.startDate ?? null}
                projectTree={projectTree}
              />
            ) : <Alert severity="info">Project calendar data is not available.</Alert>
          ) : (
            projectTree ? (
              <VerticalScheduleMatrix projectTree={projectTree} initialDate={dashboard.project?.startDate ?? null} />
            ) : <Alert severity="info">Schedule matrix data is loading.</Alert>
          )}
        </CardContent>
      </Card>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" }, gap: 2, minWidth: 0 }}>
      {enabledCharts.filter((chart) => chart.chartType !== "SCURVE").map((chart) => {

        if (chart.chartType === "DELAY_TREND") {
          return (
            <Card key={chart.chartType} sx={flatCardSx}>
              <CardContent>
                <Typography fontWeight={900} sx={{ mb: 2 }}>
                  Delay Trend
                </Typography>
                <MeasuredChartContainer>
                  {({ width, height }) =>
                    trendData.length ? (
                      <LineChart width={width} height={height} data={trendData}>
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

        if (chart.chartType === "KPI_STATUS_DISTRIBUTION") {
          return null;
        }

        if (chart.chartType === "SLA_DEADLINE_RISK") {
          return (
            <Card key={chart.chartType} sx={{ ...flatCardSx, minWidth: 0 }}>
              <CardContent>
                <Typography fontWeight={900} sx={{ mb: 2 }}>
                  SLA / Deadline Risk
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
            <Card key={chart.chartType} sx={{ ...flatCardSx, minWidth: 0 }}>
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
    </Stack>
  );
}
