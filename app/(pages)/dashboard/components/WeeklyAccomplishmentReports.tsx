"use client";

import React from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Button,
  CircularProgress,
} from "@mui/material";
import { FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useAppSelector } from "@/app/redux/hook";

export const WeeklyAccomplishmentReports: React.FC = () => {
  const { weeklyStats, loading } = useAppSelector((state) => state.dashboard);

  const data = weeklyStats || {
    totalSubmitted: 0,
    totalPending: 0,
    totalReviewed: 0,
    lateReports: 0,
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const getSubmissionStatus = (submitted: number, pending: number) => {
    const total = submitted + pending;
    if (total === 0) return "info";
    const submissionRate = (submitted / total) * 100;
    if (submissionRate >= 90) return "success";
    if (submissionRate >= 70) return "warning";
    return "critical";
  };

  const status = getSubmissionStatus(data.totalSubmitted, data.totalPending);

  const statusConfig = {
    success: {
      bg: "#e8f5e9",
      border: "#4caf50",
      text: "#2e7d32",
      icon: "✓",
    },
    warning: {
      bg: "#fff3e0",
      border: "#ff9800",
      text: "#f57c00",
      icon: "⚠",
    },
    critical: {
      bg: "#ffebee",
      border: "#f44336",
      text: "#c62828",
      icon: "🔴",
    },
    info: {
      bg: "#e3f2fd",
      border: "#2196f3",
      text: "#1565c0",
      icon: "ℹ",
    },
  };

  const colors = statusConfig[status];

  return (
    <Card sx={{ mb: 3, border: `2px solid ${colors.border}`, background: colors.bg }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <FileText size={24} color={colors.text} />
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Weekly Accomplishment Reports
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" },
            gap: 2,
            mb: 3,
          }}
        >
          {/* Submitted */}
          <Box>
            <Box
              sx={{
                p: 2,
                backgroundColor: "rgba(255,255,255,0.5)",
                borderRadius: 1,
                border: "1px solid rgba(0,0,0,0.1)",
                textAlign: "center",
              }}
            >
              <Typography variant="caption" sx={{ color: "#666", display: "block" }}>
                Submitted
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: "bold",
                  color: "#2e7d32",
                  mt: 1,
                }}
              >
                {data.totalSubmitted}
              </Typography>
              <Chip
                label="On Time"
                size="small"
                color="success"
                variant="outlined"
                icon={<CheckCircle size={14} />}
                sx={{ mt: 1 }}
              />
            </Box>
          </Box>

          {/* Pending */}
          <Box>
            <Box
              sx={{
                p: 2,
                backgroundColor: "rgba(255,255,255,0.5)",
                borderRadius: 1,
                border: "1px solid rgba(0,0,0,0.1)",
                textAlign: "center",
              }}
            >
              <Typography variant="caption" sx={{ color: "#666", display: "block" }}>
                Pending
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: "bold",
                  color: "#f57c00",
                  mt: 1,
                }}
              >
                {data.totalPending}
              </Typography>
              <Chip
                label="Awaiting"
                size="small"
                color="warning"
                variant="outlined"
                icon={<AlertCircle size={14} />}
                sx={{ mt: 1 }}
              />
            </Box>
          </Box>

          {/* Late Reports */}
          <Box>
            <Box
              sx={{
                p: 2,
                backgroundColor: "rgba(255,255,255,0.5)",
                borderRadius: 1,
                border: "1px solid rgba(0,0,0,0.1)",
                textAlign: "center",
              }}
            >
              <Typography variant="caption" sx={{ color: "#666", display: "block" }}>
                Late Reports
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: "bold",
                  color: data.lateReports > 0 ? "#c62828" : "#2e7d32",
                  mt: 1,
                }}
              >
                {data.lateReports}
              </Typography>
              <Chip
                label={data.lateReports > 0 ? "Action Needed" : "None"}
                size="small"
                color={data.lateReports > 0 ? "error" : "success"}
                variant="outlined"
                sx={{ mt: 1 }}
              />
            </Box>
          </Box>

          {/* Reviewed */}
          <Box>
            <Box
              sx={{
                p: 2,
                backgroundColor: "rgba(255,255,255,0.5)",
                borderRadius: 1,
                border: "1px solid rgba(0,0,0,0.1)",
                textAlign: "center",
              }}
            >
              <Typography variant="caption" sx={{ color: "#666", display: "block" }}>
                Reviewed
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: "bold",
                  color: "#1565c0",
                  mt: 1,
                }}
              >
                {data.totalReviewed}
              </Typography>
              <Chip
                label="Completed"
                size="small"
                variant="outlined"
                sx={{ mt: 1 }}
              />
            </Box>
          </Box>
        </Box>

        {/* Summary Section */}
        <Box
          sx={{
            p: 2,
            backgroundColor: "rgba(0,0,0,0.05)",
            borderRadius: 1,
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Submission Rate
            </Typography>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: "bold",
                color: colors.text,
              }}
            >
              {(
                (data.totalSubmitted /
                  (data.totalSubmitted + data.totalPending || 1)) *
                100
              ).toFixed(0)}
              %
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Box
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: "#4caf50",
                flex: data.totalSubmitted,
              }}
            />
            <Box
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: "#ff9800",
                flex: data.totalPending,
              }}
            />
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="contained"
            size="small"
            sx={{
              backgroundColor: "#1976d2",
              "&:hover": { backgroundColor: "#1565c0" },
            }}
          >
            View All Reports
          </Button>
          <Button
            variant="outlined"
            size="small"
            sx={{
              borderColor: "#1976d2",
              color: "#1976d2",
              "&:hover": { backgroundColor: "#f5f5f5" },
            }}
          >
            Create New Report
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default WeeklyAccomplishmentReports;
