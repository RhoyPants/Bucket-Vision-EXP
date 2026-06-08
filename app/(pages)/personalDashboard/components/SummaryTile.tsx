"use client";

import React from "react";
import { Box, Typography } from "@mui/material";

type Tone = "CRITICAL" | "ONFLOW" | "HEALTHY" | "UNCLASSIFIED";

const statusColors: Record<Tone, { color: string }> = {
  CRITICAL: { color: "#b91c1c" },
  ONFLOW: { color: "#b45309" },
  HEALTHY: { color: "#047857" },
  UNCLASSIFIED: { color: "#4b5563" },
};

export default function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: Tone;
}) {
  const colors = statusColors[tone];
  const tileStyles: Record<Tone, { bg: string; border: string }> = {
    CRITICAL: {
      bg: "linear-gradient(135deg, #fff7f7 0%, #ffffff 100%)",
      border: "#fecaca",
    },
    ONFLOW: {
      bg: "linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)",
      border: "#fde68a",
    },
    HEALTHY: {
      bg: "linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)",
      border: "#bbf7d0",
    },
    UNCLASSIFIED: {
      bg: "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
      border: "#cbd5e1",
    },
  };
  const tile = tileStyles[tone];

  return (
    <Box
      sx={{
        minHeight: 92,
        border: `1px solid ${tile.border}`,
        borderRadius: 2,
        background: tile.bg,
        p: 2,
      }}
    >
      <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ color: colors.color, fontWeight: 800, mt: 0.5 }}>
        {value}
      </Typography>
    </Box>
  );
}
