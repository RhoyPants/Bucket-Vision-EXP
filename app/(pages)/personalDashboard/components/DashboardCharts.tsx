"use client";

import React from "react";
import { Alert, Box, Card, CardContent, Typography } from "@mui/material";
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
import SummaryTile from "./SummaryTile";
import MeasuredChartContainer from "./MeasuredChartContainer";

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
}: {
  dashboard: PersonalDashboard | null;
  chartData: ChartData | null;
}) {
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
  const trendData = chartData?.progressTrend ?? [];
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

        if (chart.chartType === "SCURVE") {
          const projectId = dashboard.projectId || dashboard.project?.id;

          return (
            <Card key={chart.chartType} sx={flatCardSx}>
              <CardContent>
                <Typography fontWeight={900} sx={{ mb: 2 }}>
                  S-Curve
                </Typography>
                <Box
                  sx={{
                    minHeight: { xs: 300, md: 380 },
                    overflow: "auto",
                    width: "100%",
                  }}
                >
                  {projectId ? (
                    <SCurveChart projectId={projectId} />
                  ) : (
                    <Alert severity="info">Project is not linked for this dashboard yet.</Alert>
                  )}
                </Box>
              </CardContent>
            </Card>
          );
        }

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
  );
}
