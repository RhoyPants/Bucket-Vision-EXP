"use client";

import React, { useState } from "react";
import { Box, Button, Card, CardContent, Typography } from "@mui/material";
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
  const configured = summary.configuredKpis;
  const [source, setSource] = useState<"combined" | "subtasks" | "configured">("combined");
  const combinedCounts = {
    total: summary.total ?? configured?.total ?? summary.totalKpis,
    critical: summary.critical ?? configured?.critical ?? summary.criticalKpis,
    onflow: summary.onflow ?? configured?.onflow ?? summary.onflowKpis,
    healthy: summary.healthy ?? configured?.healthy ?? summary.healthyKpis,
    unclassified: summary.unclassified ?? configured?.unclassified ?? summary.unclassifiedKpis,
  };
  const selectedBreakdown =
    source === "subtasks" ? summary.subtasks :
    source === "configured" ? configured :
    null;
  const counts = selectedBreakdown
    ? {
        total: selectedBreakdown.total,
        critical: selectedBreakdown.critical,
        onflow: selectedBreakdown.onflow,
        healthy: selectedBreakdown.healthy,
        unclassified: selectedBreakdown.unclassified,
      }
    : combinedCounts;
  const sourceLabel =
    source === "subtasks" ? "Automatic Subtasks" :
    source === "configured" ? "Configured KPIs" :
    "Combined Summary";
  const hasData =
    counts.critical > 0 ||
    counts.onflow > 0 ||
    counts.healthy > 0 ||
    counts.unclassified > 0;

  const pieData = hasData
    ? [
        { name: "Critical", value: counts.critical, color: statusColors.critical },
        { name: "In Flow", value: counts.onflow, color: statusColors.onflow },
        { name: "Healthy", value: counts.healthy, color: statusColors.healthy },
        { name: "Unclassified", value: counts.unclassified, color: statusColors.unclassified },
      ]
    : [{ name: "No Data", value: 1, color: statusColors.empty }];

  return (
    <Card sx={{ ...flatCardSx, height: "100%" }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
          <Box>
            <Typography fontWeight={900}>KPI Status Summary</Typography>
            <Typography sx={{ color: "#64748B", fontSize: 11.5, mt: 0.25, mb: 1 }}>
              Showing: {sourceLabel}
            </Typography>
          </Box>
          {source !== "combined" && (
            <Button size="small" onClick={() => setSource("combined")} sx={{ textTransform: "none", fontSize: 10.5 }}>
              View Combined
            </Button>
          )}
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) 150px" }, alignItems: "center", gap: 1 }}>
          <MeasuredChartContainer height={220}>
            {({ width, height }) => (
              <Box sx={{ position: "relative", height }}>
                <PieChart width={width} height={height}>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={88} paddingAngle={hasData ? 2 : 0}>
                    {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
                <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none" }}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography sx={{ color: "#0F172A", fontSize: 24, lineHeight: 1, fontWeight: 900 }}>
                      {hasData ? counts.total : 0}
                    </Typography>
                    <Typography sx={{ color: "#64748B", fontSize: 10.5, fontWeight: 700, mt: 0.5 }}>
                      Total
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </MeasuredChartContainer>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "1fr" }, gap: 0.75 }}>
            {pieData.filter((entry) => entry.name !== "No Data").map((entry) => (
              <Box key={entry.name} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, px: 1, py: 0.75, borderRadius: 1.5, bgcolor: "#F8FAFC" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                  <Box sx={{ width: 9, height: 9, flexShrink: 0, borderRadius: "50%", bgcolor: entry.color }} />
                  <Typography noWrap sx={{ color: "#475569", fontSize: 10.5, fontWeight: 700 }}>{entry.name}</Typography>
                </Box>
                <Typography sx={{ color: "#0F172A", fontSize: 12, fontWeight: 900 }}>{entry.value}</Typography>
              </Box>
            ))}
            {!hasData && <Typography sx={{ color: "#64748B", fontSize: 11, textAlign: "center" }}>No KPI status data</Typography>}
          </Box>
        </Box>

        {(summary.subtasks || configured) && (
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, pt: 1.25, mt: 0.5, borderTop: "1px solid #E2E8F0" }}>
            <Box
              component="button"
              type="button"
              onClick={() => setSource("subtasks")}
              sx={{
                px: 1, py: 0.75, borderRadius: 1.5, textAlign: "left", cursor: "pointer",
                bgcolor: "#EFF6FF", border: source === "subtasks" ? "2px solid #3B82F6" : "1px solid transparent",
                transition: "border-color .15s ease, transform .15s ease",
                "&:hover": { transform: "translateY(-1px)", borderColor: "#93C5FD" },
              }}
            >
              <Typography sx={{ color: "#64748B", fontSize: 10 }}>Automatic Subtasks</Typography>
              <Typography sx={{ color: "#1D4ED8", fontSize: 16, fontWeight: 900 }}>{summary.subtasks?.total ?? 0}</Typography>
            </Box>
            <Box
              component="button"
              type="button"
              onClick={() => setSource("configured")}
              sx={{
                px: 1, py: 0.75, borderRadius: 1.5, textAlign: "left", cursor: "pointer",
                bgcolor: "#F5F3FF", border: source === "configured" ? "2px solid #8B5CF6" : "1px solid transparent",
                transition: "border-color .15s ease, transform .15s ease",
                "&:hover": { transform: "translateY(-1px)", borderColor: "#C4B5FD" },
              }}
            >
              <Typography sx={{ color: "#64748B", fontSize: 10 }}>Configured KPIs</Typography>
              <Typography sx={{ color: "#6D28D9", fontSize: 16, fontWeight: 900 }}>{configured?.total ?? 0}</Typography>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
