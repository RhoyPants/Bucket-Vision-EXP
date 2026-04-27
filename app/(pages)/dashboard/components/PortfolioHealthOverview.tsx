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
import { useAppSelector } from "@/app/redux/hook";

interface HealthMetricProps {
  label: string;
  count: number;
  color: "green" | "yellow" | "red";
  percentage: number;
  description: string;
}

const HealthMetric: React.FC<HealthMetricProps> = ({
  label,
  count,
  color,
  percentage,
  description,
}) => {
  const colorMap = {
    green: {
      bg: "#e8f5e9",
      text: "#2e7d32",
      progress: "#4caf50",
      dark: "#1b5e20",
    },
    yellow: {
      bg: "#fff3e0",
      text: "#f57c00",
      progress: "#ff9800",
      dark: "#e65100",
    },
    red: {
      bg: "#ffebee",
      text: "#c62828",
      progress: "#f44336",
      dark: "#b71c1c",
    },
  };

  const colors = colorMap[color];

  return (
    <Tooltip title={description} arrow>
      <Box
        sx={{
          p: 2,
          borderRadius: 1,
          background: colors.bg,
          border: `2px solid ${colors.progress}`,
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, color: colors.text }}
          >
            {label}
          </Typography>
          <Typography
            variant="h6"
            sx={{ fontWeight: "bold", color: colors.dark }}
          >
            {count}
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={100}
          sx={{
            height: 6,
            borderRadius: 3,
            backgroundColor: "rgba(0,0,0,0.1)",
            "& .MuiLinearProgress-bar": {
              backgroundColor: colors.progress,
              borderRadius: 3,
            },
          }}
        />

        <Typography variant="caption" sx={{ color: colors.text, mt: 1 }}>
          {percentage.toFixed(0)}% of portfolio
        </Typography>
      </Box>
    </Tooltip>
  );
};

export const PortfolioHealthOverview: React.FC = () => {
  const { healthStatus, loading } = useAppSelector(
    (state) => state.dashboard
  );

  const data = healthStatus || {
    onTrack: 0,
    watchlist: 0,
    critical: 0,
  };

  const total = data.onTrack + data.watchlist + data.critical || 1;
  const onTrackPercent = (data.onTrack / total) * 100;
  const watchlistPercent = (data.watchlist / total) * 100;
  const criticalPercent = (data.critical / total) * 100;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
          Portfolio Health Overview (Traffic-Light Scorecard)
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
            gap: 2,
          }}
        >
          <HealthMetric
            label="On Track"
            count={data.onTrack}
            color="green"
            percentage={onTrackPercent}
            description="Projects on track (variance -5% to +5%, budget ≤85%)"
          />

          <HealthMetric
            label="Watchlist"
            count={data.watchlist}
            color="yellow"
            percentage={watchlistPercent}
            description="Projects on caution (variance < -5% or budget > 85%)"
          />

          <HealthMetric
            label="Critical"
            count={data.critical}
            color="red"
            percentage={criticalPercent}
            description="Critical projects (variance < -10% or budget > 90%)"
          />
        </Box>

        {/* Health Summary Row */}
        <Box
          sx={{
            mt: 3,
            p: 2,
            backgroundColor: "#f5f5f5",
            borderRadius: 1,
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ flex: 1, minWidth: 150 }}>
            <Typography variant="caption" sx={{ color: "#666", display: "block" }}>
              Total Projects
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
              {total}
            </Typography>
          </Box>

          <Box sx={{ flex: 1, minWidth: 150 }}>
            <Typography variant="caption" sx={{ color: "#2e7d32", display: "block" }}>
              ✓ Healthy Projects
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#2e7d32" }}>
              {onTrackPercent.toFixed(0)}%
            </Typography>
          </Box>

          <Box sx={{ flex: 1, minWidth: 150 }}>
            <Typography variant="caption" sx={{ color: "#f57c00", display: "block" }}>
              ⚠ Attention Needed
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#f57c00" }}>
              {(watchlistPercent + criticalPercent).toFixed(0)}%
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PortfolioHealthOverview;
