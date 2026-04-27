"use client";

import React from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  LinearProgress,
  Tooltip,
} from "@mui/material";
import { DollarSign, TrendingDown, AlertCircle } from "lucide-react";
import { useAppSelector } from "@/app/redux/hook";

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
};

export const BudgetSnapshot: React.FC = () => {
  const { budgetData, loading } = useAppSelector((state) => state.dashboard);

  const data = budgetData || {
    totalBudget: 0,
    usedBudget: 0,
    remainingBudget: 0,
    budgetUtilization: 0,
  };

  const utilization = data.budgetUtilization || 0;
  const getStatus = (util: number) => {
    if (util <= 75) return "success";
    if (util <= 90) return "warning";
    return "critical";
  };

  const status = getStatus(utilization);
  const statusColors = {
    success: { bg: "#e8f5e9", border: "#4caf50", text: "#2e7d32" },
    warning: { bg: "#fff3e0", border: "#ff9800", text: "#f57c00" },
    critical: { bg: "#ffebee", border: "#f44336", text: "#c62828" },
  };

  const colors = statusColors[status];

  return (
    <Card sx={{ mb: 3, border: `2px solid ${colors.border}`, background: colors.bg }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <DollarSign size={24} color={colors.text} />
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Budget Snapshot
          </Typography>
          {utilization > 85 && (
            <Tooltip title={`${utilization.toFixed(1)}% of budget used`}>
              <AlertCircle size={20} color={colors.text} style={{ marginLeft: "auto" }} />
            </Tooltip>
          )}
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
            gap: 3,
          }}
        >
          {/* Budget Bars */}
          <Box sx={{ gridColumn: { xs: 1, md: "1 / -1" } }}>
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Budget Utilization
                </Typography>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: "bold", color: colors.text }}
                >
                  {utilization.toFixed(1)}%
                </Typography>
              </Box>

              <LinearProgress
                variant="determinate"
                value={Math.min(utilization, 100)}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: "rgba(0,0,0,0.1)",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor:
                      status === "success"
                        ? "#4caf50"
                        : status === "warning"
                        ? "#ff9800"
                        : "#f44336",
                    borderRadius: 5,
                  },
                }}
              />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mt: 1,
                  fontSize: "0.75rem",
                  color: "#666",
                }}
              >
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </Box>
            </Box>
          </Box>

          {/* Budget Breakdown */}
          <Tooltip title="Total approved budget">
            <Box
                sx={{
                  p: 2,
                  backgroundColor: "rgba(255,255,255,0.5)",
                  borderRadius: 1,
                  border: "1px solid rgba(0,0,0,0.1)",
                }}
              >
                <Typography variant="caption" sx={{ color: "#666" }}>
                  Total Budget
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", mt: 0.5 }}>
                  {formatCurrency(data.totalBudget)}
                </Typography>
              </Box>
            </Tooltip>

          <Tooltip title="Amount spent to date">
            <Box
                sx={{
                  p: 2,
                  backgroundColor: "rgba(255,255,255,0.5)",
                  borderRadius: 1,
                  border: "1px solid rgba(0,0,0,0.1)",
                }}
              >
                <Typography variant="caption" sx={{ color: "#666" }}>
                  Used Budget
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", mt: 0.5 }}>
                  {formatCurrency(data.usedBudget)}
                </Typography>
              </Box>
            </Tooltip>

          <Tooltip title="Available budget remaining">
            <Box
                sx={{
                  p: 2,
                  backgroundColor: "rgba(255,255,255,0.5)",
                  borderRadius: 1,
                  border: "1px solid rgba(0,0,0,0.1)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TrendingDown size={16} />
                  <Box>
                    <Typography variant="caption" sx={{ color: "#666" }}>
                      Remaining
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: "bold", mt: 0.5 }}>
                      {formatCurrency(data.remainingBudget)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Tooltip>
        </Box>

        {/* Status Message */}
        <Box sx={{ mt: 2, p: 1, backgroundColor: "rgba(0,0,0,0.05)", borderRadius: 1 }}>
          <Typography variant="caption" sx={{ color: colors.text, fontWeight: 600 }}>
            {status === "success" && "✓ Budget is healthy"}
            {status === "warning" && "⚠ Budget approaching limit"}
            {status === "critical" && "🔴 Budget nearly exhausted"}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default BudgetSnapshot;
