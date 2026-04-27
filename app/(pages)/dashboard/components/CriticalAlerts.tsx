"use client";

import React from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Alert,
  AlertTitle,
  Chip,
  Tooltip,
} from "@mui/material";
import { AlertTriangle, AlertCircle, Zap } from "lucide-react";
import { useAppSelector } from "@/app/redux/hook";

export const CriticalAlerts: React.FC = () => {
  const { alerts } = useAppSelector((state) => state.dashboard);

  const data = alerts || [];

  const criticalAlerts = data.filter((a) => a.severity === "critical");
  const warningAlerts = data.filter((a) => a.severity === "warning");

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "budget":
        return "💰";
      case "schedule":
        return "📅";
      case "risk":
        return "⚠️";
      default:
        return "ℹ️";
    }
  };

  const getAlertColor = (
    severity: string
  ): "error" | "warning" | "info" | "success" => {
    switch (severity) {
      case "critical":
        return "error";
      case "warning":
        return "warning";
      default:
        return "info";
    }
  };

  if (data.length === 0) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <AlertTriangle size={24} color="#4caf50" />
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Executive Alerts / Critical Issues
            </Typography>
          </Box>

          <Alert severity="success" variant="filled">
            <AlertTitle>All Clear!</AlertTitle>
            No critical issues detected at this time. Keep monitoring project progress.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Zap size={24} color="#f44336" />
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Executive Alerts / Critical Issues
          </Typography>
          {data.length > 0 && (
            <Chip
              label={`${data.length} Alert(s)`}
              size="small"
              color={criticalAlerts.length > 0 ? "error" : "warning"}
              variant="filled"
              sx={{ ml: "auto" }}
            />
          )}
        </Box>

        {/* Critical Alerts */}
        {criticalAlerts.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, color: "#c62828", mb: 1 }}
            >
              🔴 Critical Issues ({criticalAlerts.length})
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {criticalAlerts.map((alert, idx) => (
                <Box key={idx}>
                  <Alert severity="error" variant="filled">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ flex: 1 }}>
                        <AlertTitle>
                          {getAlertIcon(alert.type)} {alert.projectName}
                        </AlertTitle>
                        <Typography variant="body2">
                          {alert.message}
                        </Typography>
                      </Box>
                      <Chip
                        label={
                          alert.type.charAt(0).toUpperCase() +
                          alert.type.slice(1)
                        }
                        size="small"
                        color="error"
                        variant="outlined"
                      />
                    </Box>
                  </Alert>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Warning Alerts */}
        {warningAlerts.length > 0 && (
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, color: "#f57c00", mb: 1 }}
            >
              🟡 Warning Issues ({warningAlerts.length})
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {warningAlerts.map((alert, idx) => (
                <Box key={idx}>
                  <Alert severity="warning" variant="filled">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ flex: 1 }}>
                        <AlertTitle>
                          {getAlertIcon(alert.type)} {alert.projectName}
                        </AlertTitle>
                        <Typography variant="body2">
                          {alert.message}
                        </Typography>
                      </Box>
                      <Chip
                        label={
                          alert.type.charAt(0).toUpperCase() +
                          alert.type.slice(1)
                        }
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    </Box>
                  </Alert>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Summary */}
        <Box
          sx={{
            mt: 2,
            p: 1.5,
            backgroundColor: "#f5f5f5",
            borderRadius: 1,
            display: "flex",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ color: "#666", display: "block" }}>
              Requires Immediate Action
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "#c62828" }}>
              {criticalAlerts.length}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: "#666", display: "block" }}>
              Monitor Closely
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "#f57c00" }}>
              {warningAlerts.length}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CriticalAlerts;
