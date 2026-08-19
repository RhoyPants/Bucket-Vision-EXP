"use client";

import React, { useState } from "react";
import { Box, Card, CardContent, Chip, Dialog, DialogContent, DialogTitle, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
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

type StatusDetail = {
  id: string;
  title: string;
  context?: string;
  value?: string;
  status: "CRITICAL" | "ONFLOW" | "HEALTHY" | "UNCLASSIFIED";
};

export default function KpiStatusPieCard({ summary, details = [] }: { summary: DashboardSummary; details?: StatusDetail[] }) {
  const [selectedStatus, setSelectedStatus] = useState<StatusDetail["status"] | null>(null);
  const [visualization, setVisualization] = useState<"DONUT" | "BAR">("DONUT");
  const counts = {
    total: summary.total ?? summary.totalKpis,
    critical: summary.critical ?? summary.criticalKpis,
    onflow: summary.onflow ?? summary.onflowKpis,
    healthy: summary.healthy ?? summary.healthyKpis,
    unclassified: summary.unclassified ?? summary.unclassifiedKpis,
  };
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
  const statusKey = (name: string): StatusDetail["status"] | null =>
    name === "Critical" ? "CRITICAL" : name === "In Flow" ? "ONFLOW" :
    name === "Healthy" ? "HEALTHY" : name === "Unclassified" ? "UNCLASSIFIED" : null;
  const openStatus = (name: string) => {
    const status = statusKey(name);
    if (status) setSelectedStatus(status);
  };
  const matchingDetails = details.filter((item) => item.status === selectedStatus);

  return (
    <Card sx={{ ...flatCardSx, height: "100%" }}>
      <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column", boxSizing: "border-box", "&:last-child": { pb: 2 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
          <Box>
            <Typography fontWeight={900}>KPI Status Summary</Typography>
            <Typography sx={{ color: "#64748B", fontSize: 11.5, mt: 0.25, mb: 1 }}>
              Showing: Automatic Subtasks
            </Typography>
          </Box>
          <ToggleButtonGroup exclusive size="small" value={visualization} onChange={(_, value) => value && setVisualization(value)} aria-label="KPI summary chart view">
            <ToggleButton value="DONUT" sx={{ py: 0.35, px: 1, textTransform: "none", fontSize: 9.5, fontWeight: 800 }}>Donut</ToggleButton>
            <ToggleButton value="BAR" sx={{ py: 0.35, px: 1, textTransform: "none", fontSize: 9.5, fontWeight: 800 }}>Bar</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) 150px" }, alignItems: "center", gap: 1 }}>
          {visualization === "DONUT" ? <MeasuredChartContainer height={250}>
            {({ width, height }) => (
              <Box sx={{ position: "relative", height }}>
                <PieChart width={width} height={height}>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={100} paddingAngle={hasData ? 2 : 0} onClick={(entry) => openStatus(String(entry.name))} style={{ cursor: hasData ? "pointer" : "default" }}>
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
          </MeasuredChartContainer> : <MeasuredChartContainer height={250}>
            {({ width, height }) => (
              <BarChart width={width} height={height} data={pieData.filter((entry) => entry.name !== "No Data")} margin={{ top: 15, right: 10, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 9 }} />
                <RechartsTooltip />
                <Bar dataKey="value" radius={[5, 5, 0, 0]} onClick={(entry) => openStatus(String(entry.payload?.name))} style={{ cursor: hasData ? "pointer" : "default" }}>
                  {pieData.filter((entry) => entry.name !== "No Data").map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Bar>
              </BarChart>
            )}
          </MeasuredChartContainer>}

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "1fr" }, gap: 0.75 }}>
            {pieData.filter((entry) => entry.name !== "No Data").map((entry) => (
              <Box component="button" type="button" onClick={() => openStatus(entry.name)} key={entry.name} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, px: 1, py: 0.75, borderRadius: 1.5, bgcolor: "#F8FAFC", border: 0, cursor: "pointer", textAlign: "left" }}>
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

      </CardContent>
      <Dialog open={Boolean(selectedStatus)} onClose={() => setSelectedStatus(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900 }}>{selectedStatus === "ONFLOW" ? "In Flow" : selectedStatus} items</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1}>
            {matchingDetails.map((item) => <Box key={item.id} sx={{ p: 1.25, border: "1px solid #E2E8F0", borderRadius: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" gap={1}>
                <Box sx={{ minWidth: 0 }}><Typography sx={{ fontWeight: 800 }}>{item.title}</Typography>{item.context && <Typography sx={{ color: "#64748B", fontSize: 11 }}>{item.context}</Typography>}</Box>
                {item.value && <Chip label={item.value} size="small" />}
              </Stack>
            </Box>)}
            {!matchingDetails.length && <Typography sx={{ color: "#64748B" }}>No item details were returned for this status.</Typography>}
          </Stack>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
