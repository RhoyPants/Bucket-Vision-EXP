"use client";

import React from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { Cell, Pie, PieChart, Tooltip as RechartsTooltip } from "recharts";
import { DashboardSummary } from "@/app/api-service/personalDashboardService";
import MeasuredChartContainer from "./MeasuredChartContainer";

const flatCardSx = {
  borderRadius: 2,
  border: "1px solid #dbeafe",
  boxShadow: "none",
  backgroundColor: "#fff",
};

const statusColors = {
  critical: "#ef4444",
  onflow: "#f59e0b",
  healthy: "#10b981",
  unclassified: "#9ca3af",
  empty: "#cbd5e1",
};

export default function KpiStatusPieCard({ summary }: { summary: DashboardSummary }) {
  const hasData =
    summary.criticalKpis > 0 ||
    summary.onflowKpis > 0 ||
    summary.healthyKpis > 0 ||
    summary.unclassifiedKpis > 0;

  const pieData = hasData
    ? [
        { name: "Critical", value: summary.criticalKpis, color: statusColors.critical },
        { name: "Onflow", value: summary.onflowKpis, color: statusColors.onflow },
        { name: "Healthy", value: summary.healthyKpis, color: statusColors.healthy },
        { name: "Unclassified", value: summary.unclassifiedKpis, color: statusColors.unclassified },
      ]
    : [{ name: "No Data", value: 1, color: statusColors.empty }];

  return (
    <Card sx={{ ...flatCardSx, height: "100%" }}>
      <CardContent>
        <Typography fontWeight={900} sx={{ mb: 1.5 }}>
          KPI Status Distribution
        </Typography>
        <MeasuredChartContainer>
          {({ width, height }) => (
            <Box sx={{ position: "relative", height }}>
              <PieChart width={width} height={height}>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label={hasData}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
              {!hasData && (
                <Typography
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    color: "#64748b",
                    pointerEvents: "none",
                    fontWeight: 700,
                  }}
                >
                  No KPI status data
                </Typography>
              )}
            </Box>
          )}
        </MeasuredChartContainer>
      </CardContent>
    </Card>
  );
}
