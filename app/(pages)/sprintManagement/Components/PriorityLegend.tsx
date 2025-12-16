"use client";

import { Box } from "@mui/material";

export default function PriorityLegend() {
  const items = [
    { label: "High", color: "#E5494D" },
    { label: "Medium", color: "#FF9800" },
    { label: "Normal", color: "#57A55A" },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        p: 1,
        mb: 1,
        borderBottom: "1px solid #E0E4EA",
        background: "#ffffff90",
        borderRadius: "4px",
      }}
    >
      {items.map((item) => (
        <Box
          key={item.label}
          sx={{ display: "flex", alignItems: "center", gap: 0.8 }}
        >
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: item.color,
            }}
          />
          <span style={{ fontSize: 12, color: "#3A3F47" }}>{item.label}</span>
        </Box>
      ))}
    </Box>
  );
}
