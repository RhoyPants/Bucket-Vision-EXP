"use client";

import React from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  CheckCircle,
  TrendingUp,
  AlertCircle,
  DollarSign,
  Calendar,
} from "lucide-react";
import { useAppSelector } from "@/app/redux/hook";

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  status?: "success" | "warning" | "critical";
  icon: React.ReactNode;
  tooltip?: string;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  unit = "",
  status = "success",
  icon,
  tooltip = "",
}) => {
  const statusColors = {
    success: { bg: "#e8f5e9", border: "#4caf50", text: "#2e7d32" },
    warning: { bg: "#fff3e0", border: "#ff9800", text: "#f57c00" },
    critical: { bg: "#ffebee", border: "#f44336", text: "#c62828" },
  };

  const colors = statusColors[status];

  return (
    <Tooltip title={tooltip} arrow>
      <Card
        sx={{
          border: `2px solid ${colors.border}`,
          background: colors.bg,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Box sx={{ color: colors.text, display: "flex" }}>{icon}</Box>
            <Typography
              variant="subtitle2"
              sx={{ color: colors.text, fontWeight: 600 }}
            >
              {title}
            </Typography>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: "bold", color: colors.text }}
            >
              {value}
              {unit && <span style={{ fontSize: "0.7em" }}> {unit}</span>}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Tooltip>
  );
};

export const ExecutiveKPIStrip: React.FC = () => {
  const { kpi, loading } = useAppSelector((state) => state.dashboard);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const data = kpi || {
    activeProjects: 0,
    overallProgress: 0,
    budgetUtilization: 0,
    delayedProjects: 0,
    highRiskProjects: 0,
    forecastCompletion: "-",
  };

  const getProgressStatus = (progress: number) => {
    if (progress >= 80) return "success";
    if (progress >= 50) return "warning";
    return "critical";
  };

  const getDelayedStatus = (delayed: number) => {
    if (delayed === 0) return "success";
    if (delayed <= 2) return "warning";
    return "critical";
  };

  const getBudgetStatus = (utilization: number) => {
    if (utilization <= 75) return "success";
    if (utilization <= 90) return "warning";
    return "critical";
  };

  return (
    <Card sx={{ mb: 3, p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
        Executive KPI Strip
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            md: "1fr 1fr 1fr",
            lg: "repeat(6, 1fr)",
          },
          gap: 2,
        }}
      >
        <KPICard
          title="Active Projects"
          value={data.activeProjects}
          icon={<CheckCircle size={20} />}
          status="success"
          tooltip="Number of active projects"
        />

        <KPICard
          title="Overall Progress"
          value={data.overallProgress.toFixed(1)}
          unit="%"
          icon={<TrendingUp size={20} />}
          status={getProgressStatus(data.overallProgress)}
          tooltip="Overall project completion percentage"
        />

        <KPICard
          title="Budget Utilization"
          value={data.budgetUtilization.toFixed(1)}
          unit="%"
          icon={<DollarSign size={20} />}
          status={getBudgetStatus(data.budgetUtilization)}
          tooltip="Percentage of budget spent"
        />

        <KPICard
          title="Delayed Projects"
          value={data.delayedProjects}
          icon={<AlertCircle size={20} />}
          status={getDelayedStatus(data.delayedProjects)}
          tooltip="Number of projects behind schedule"
        />

        <KPICard
          title="High-Risk Projects"
          value={data.highRiskProjects}
          icon={<AlertCircle size={20} />}
          status={data.highRiskProjects > 0 ? "critical" : "success"}
          tooltip="Projects with variance < -10% or budget overrun > 20%"
        />

        <KPICard
          title="Forecast Completion"
          value={data.forecastCompletion === "-" ? "-" : "✓"}
          icon={<Calendar size={20} />}
          status="success"
          tooltip={`Expected completion: ${data.forecastCompletion}`}
        />
      </Box>
    </Card>
  );
};

export default ExecutiveKPIStrip;
