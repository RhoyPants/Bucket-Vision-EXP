"use client";

import { useState } from "react";
import { Box, Card, CardContent, Chip, Dialog, DialogContent, DialogTitle, IconButton, Stack, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import type { KpiStatus, PersonalDashboardKpi } from "@/app/api-service/personalDashboardService";
import MeasuredChartContainer from "@/app/(pages)/personalDashboard/components/MeasuredChartContainer";

const statusMeta: Record<KpiStatus, { label: string; color: string; bg: string }> = {
  CRITICAL: { label: "Critical", color: "#EF4444", bg: "#FEF2F2" },
  ONFLOW: { label: "In Flow", color: "#F59E0B", bg: "#FFFBEB" },
  HEALTHY: { label: "Healthy", color: "#10B981", bg: "#ECFDF5" },
  UNCLASSIFIED: { label: "Unclassified", color: "#94A3B8", bg: "#F8FAFC" },
};

export default function CustomKpiChart({ kpi, onEdit, onDelete }: { kpi: PersonalDashboardKpi; onEdit: () => void; onDelete: () => void }) {
  const [selectedStatus, setSelectedStatus] = useState<KpiStatus | null>(null);
  const [visualization, setVisualization] = useState<"DONUT" | "BAR">("DONUT");
  const data = (Object.keys(statusMeta) as KpiStatus[]).map((status) => ({ status, name: statusMeta[status].label, value: status === "ONFLOW" ? kpi.summary.onflow : kpi.summary[status.toLowerCase() as "critical" | "healthy" | "unclassified"], color: statusMeta[status].color }));
  const targets = kpi.targets.filter((target) => target.status === selectedStatus);

  return <Card variant="outlined" sx={{ borderRadius: 2, borderColor: "#DBEAFE" }}><CardContent>
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
      <Box sx={{ minWidth: 0 }}><Typography noWrap sx={{ fontWeight: 900 }}>{kpi.name}</Typography>{kpi.description && <Typography noWrap sx={{ color: "#64748B", fontSize: 10.5 }}>{kpi.description}</Typography>}</Box>
      <Stack direction="row" alignItems="center" spacing={0.5}><ToggleButtonGroup exclusive size="small" value={visualization} onChange={(_, value) => value && setVisualization(value)} aria-label="KPI chart view"><ToggleButton value="DONUT" sx={{ py: 0.35, px: 1, textTransform: "none", fontSize: 9.5, fontWeight: 800 }}>Donut</ToggleButton><ToggleButton value="BAR" sx={{ py: 0.35, px: 1, textTransform: "none", fontSize: 9.5, fontWeight: 800 }}>Bar</ToggleButton></ToggleButtonGroup><Tooltip title="Edit KPI"><IconButton size="small" onClick={onEdit}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip><Tooltip title="Delete KPI"><IconButton size="small" color="error" onClick={onDelete}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip></Stack>
    </Stack>

    <Box>
      {visualization === "DONUT" ? <MeasuredChartContainer height={190}>{({ width, height }) => <Box sx={{ position: "relative", height }}><PieChart width={width} height={height}><Pie data={data} dataKey="value" nameKey="name" innerRadius={43} outerRadius={70} paddingAngle={2} onClick={(entry) => setSelectedStatus((entry.payload as { status: KpiStatus }).status)} style={{ cursor: "pointer" }}>{data.map((entry) => <Cell key={entry.status} fill={entry.color} />)}</Pie><RechartsTooltip /></PieChart><Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none" }}><Box sx={{ textAlign: "center" }}><Typography sx={{ fontSize: 22, fontWeight: 900 }}>{kpi.summary.total}</Typography><Typography sx={{ color: "#64748B", fontSize: 9 }}>Targets</Typography></Box></Box></Box>}</MeasuredChartContainer>
      : <MeasuredChartContainer height={190}>{({ width, height }) => <BarChart width={width} height={height} data={data} margin={{ top: 15, right: 10, bottom: 5, left: -20 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 9 }} /><YAxis allowDecimals={false} tick={{ fontSize: 9 }} /><RechartsTooltip /><Bar dataKey="value" radius={[5, 5, 0, 0]} onClick={(entry) => setSelectedStatus((entry.payload as { status: KpiStatus }).status)} style={{ cursor: "pointer" }}>{data.map((entry) => <Cell key={entry.status} fill={entry.color} />)}</Bar></BarChart>}</MeasuredChartContainer>}
    </Box>

    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>{data.map((entry) => <Box component="button" type="button" key={entry.status} onClick={() => setSelectedStatus(entry.status)} sx={{ display: "flex", gap: 0.6, alignItems: "center", border: 0, borderRadius: 1.25, px: 0.8, py: 0.5, bgcolor: statusMeta[entry.status].bg, cursor: "pointer" }}><Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: entry.color }} /><Typography sx={{ fontSize: 9.5, fontWeight: 800 }}>{entry.name}: {entry.value}</Typography></Box>)}</Stack>

    <Dialog open={Boolean(selectedStatus)} onClose={() => setSelectedStatus(null)} fullWidth maxWidth="md"><DialogTitle sx={{ fontWeight: 900 }}>{kpi.name} · {selectedStatus ? statusMeta[selectedStatus].label : ""} targets</DialogTitle><DialogContent dividers><Stack spacing={1}>{targets.map((target) => <Box key={target.id} sx={{ p: 1.25, border: "1px solid #E2E8F0", borderRadius: 1.5 }}><Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}><Box><Typography sx={{ fontWeight: 850 }}>{target.sourceDetails?.title ?? target.sourceType}</Typography><Typography sx={{ color: "#64748B", fontSize: 11 }}>{[target.sourceDetails?.scopeName, target.sourceDetails?.taskTitle].filter(Boolean).join(" / ")}</Typography></Box><Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap><Chip size="small" label={`Actual ${target.actualProgress ?? "—"}%`} /><Chip size="small" label={`Expected ${target.expectedProgress ?? "—"}%`} /><Chip size="small" label={`Variance ${target.variance == null ? "—" : `${target.variance > 0 ? "+" : ""}${target.variance}%`}`} sx={{ color: statusMeta[target.status].color, bgcolor: statusMeta[target.status].bg, fontWeight: 800 }} /></Stack></Stack><Typography sx={{ color: "#64748B", fontSize: 10, mt: 0.75 }}>Critical below {target.thresholds.criticalBelow}% · Healthy at or above {target.thresholds.healthyAtOrAbove}%</Typography></Box>)}{!targets.length && <Typography sx={{ color: "#64748B" }}>No targets in this status.</Typography>}</Stack></DialogContent></Dialog>
  </CardContent></Card>;
}
