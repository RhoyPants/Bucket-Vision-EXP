"use client";

import { Box, Paper, Typography } from "@mui/material";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  color = "#4B2E83",
}: StatCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 2.5,
        border: `1.5px solid ${color}25`,
        backgroundColor: "#fff",
        display: "flex",
        alignItems: "flex-start",
        gap: 2,
        transition: "all 0.2s ease",
        "&:hover": {
          boxShadow: "0 8px 16px rgba(0,0,0,0.06)",
          borderColor: `${color}40`,
        },
      }}
    >
      {/* Icon Container */}
      {icon && (
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 1.75,
            backgroundColor: `${color}12`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: color,
            fontSize: 22,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      )}

      {/* Content */}
      <Box sx={{ flex: 1 }}>
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            fontWeight: 600,
            fontSize: "12px",
            display: "block",
            mb: 0.75,
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            fontSize: "24px",
            fontWeight: 700,
            color: color,
            lineHeight: 1.2,
          }}
        >
          {value}
        </Typography>
      </Box>
    </Paper>
  );
}
