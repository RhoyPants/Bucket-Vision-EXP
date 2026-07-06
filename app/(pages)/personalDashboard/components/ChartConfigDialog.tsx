"use client";

import React, { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
} from "@mui/material";
import { useAppDispatch } from "@/app/redux/hook";
import {
  DashboardChartConfig,
  PersonalDashboard,
} from "@/app/api-service/personalDashboardService";
import { saveDashboardCharts } from "@/app/redux/controllers/personalDashboardController";
import { usePermissions } from "@/app/lib/usePermissions";

const chartOptions = [
  { chartType: "KPI_SUMMARY", label: "KPI Summary Cards" },
  { chartType: "SCURVE", label: "S-Curve Chart" },
  { chartType: "PROGRESS_TREND", label: "Progress Trend Chart" },
  { chartType: "SLA_DEADLINE_RISK", label: "SLA / Deadline Risk Chart" },
  { chartType: "KPI_STATUS_DISTRIBUTION", label: "KPI Status Distribution" },
  { chartType: "TASK_COMPLETION", label: "Task/Subtask Completion Chart" },
  { chartType: "DELAY_TREND", label: "Delay Trend Chart" },
];

const normalizeCharts = (charts?: DashboardChartConfig[]) =>
  chartOptions.map((option, index) => {
    const existing = charts?.find((chart) => chart.chartType === option.chartType);
    return {
      chartType: option.chartType,
      isEnabled: existing?.isEnabled ?? (index < 2),
      sortOrder: existing?.sortOrder ?? index,
    };
  });

export default function ChartConfigDialog({
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
  const { canUpdate } = usePermissions();
  const canUpdateDashboard = canUpdate("personal_dashboard");
  const [charts, setCharts] = useState<DashboardChartConfig[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setCharts(normalizeCharts(dashboard?.charts));
  }, [dashboard?.charts, open]);

  const handleToggle = (chartType: string) => {
    if (!canUpdateDashboard) return;
    setCharts((prev) =>
      prev.map((chart) =>
        chart.chartType === chartType ? { ...chart, isEnabled: !chart.isEnabled } : chart
      )
    );
  };

  const handleSave = async () => {
    if (!dashboard?.id || !canUpdateDashboard) return;
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
                control={<Checkbox checked={checked} disabled={!canUpdateDashboard} onChange={() => handleToggle(option.chartType)} />}
                label={option.label}
              />
            );
          })}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        {canUpdateDashboard && (
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Charts"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
