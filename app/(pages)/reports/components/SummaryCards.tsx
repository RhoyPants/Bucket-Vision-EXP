"use client";

import { Box, Paper, Typography, Tooltip } from "@mui/material";
import { WeeklyReportSummary } from "@/app/redux/slices/weeklyReportSlice";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ListAltIcon from "@mui/icons-material/ListAlt";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

interface Props {
  summary: WeeklyReportSummary | null;
}

export default function SummaryCards({ summary }: Props) {
  if (!summary) return null;

  const cards = [
    {
      title: "Total Submitted",
      value: summary.totalSubmitted,
      icon: <CheckCircleIcon sx={{ fontSize: 28 }} />,
      color: "#10B981",
      bgColor: "rgba(16, 185, 129, 0.08)",
      desc: "This month",
    },
    {
      title: "Pending Review",
      value: summary.totalPending,
      icon: <HourglassTopIcon sx={{ fontSize: 28 }} />,
      color: "#F59E0B",
      bgColor: "rgba(245, 158, 11, 0.08)",
      desc: "Awaiting feedback",
    },
    {
      title: "Reviewed",
      value: summary.totalReviewed,
      icon: <ListAltIcon sx={{ fontSize: 28 }} />,
      color: "#3B82F6",
      bgColor: "rgba(59, 130, 246, 0.08)",
      desc: "Completed",
    },
    {
      title: "Late Reports",
      value: summary.lateReports,
      icon: <WarningAmberIcon sx={{ fontSize: 28 }} />,
      color: summary.lateReports > 0 ? "#EF4444" : "#9CA3AF",
      bgColor:
        summary.lateReports > 0
          ? "rgba(239, 68, 68, 0.08)"
          : "rgba(156, 163, 175, 0.08)",
      desc: "Require attention",
    },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(4, 1fr)",
        },
        gap: 2.5,
        mb: 4,
      }}
    >
      {cards.map((card, idx) => (
        <Tooltip key={idx} title={card.desc} arrow>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2.5,
              border: `1.5px solid ${card.color}20`,
              backgroundColor: card.bgColor,
              cursor: "default",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: card.color,
                backgroundColor: card.bgColor,
                transform: "translateY(-2px)",
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                mb: 1.5,
              }}
            >
              <Box
                sx={{
                  p: 1,
                  borderRadius: 1.5,
                  backgroundColor: `${card.color}15`,
                  color: card.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {card.icon}
              </Box>
            </Box>

            <Typography
              variant="body2"
              sx={{
                color: "#666",
                fontWeight: 500,
                fontSize: 12,
                mb: 0.5,
              }}
            >
              {card.title}
            </Typography>

            <Typography
              sx={{
                fontSize: 28,
                fontWeight: 800,
                color: card.color,
              }}
            >
              {card.value}
            </Typography>
          </Paper>
        </Tooltip>
      ))}
    </Box>
  );
}
