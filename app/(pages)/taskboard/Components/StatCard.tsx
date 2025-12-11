"use client";

import { Box, Typography } from "@mui/material";

export default function StatCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <Box
      sx={{
        backgroundColor: "#FFFFFF",
        padding: 2,
        borderRadius: 2,
        border: "1px solid #e0dae6",
        width: "100%",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <Typography
        sx={{
          fontSize: "14px",
          fontWeight: 600,
          fontFamily: "var(--font-ftsterling)",
          color: "#210e64",
          mb: 1,
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          fontSize: "26px",
          fontWeight: 700,
          fontFamily: "var(--font-ftsterling)",
          color: "#1E1E1E",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}
