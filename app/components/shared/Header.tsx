"use client";

import { AppBar, Toolbar, Typography, Box } from "@mui/material";

export default function Header() {
    
  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #e8e7e2",
        paddingX: 2,
      }}
    >
      <Toolbar disableGutters sx={{ minHeight: 64 }}>
        <Typography
          sx={{
            color: "#210e64",
            fontWeight: 600,
            fontSize: "1.25rem",
            fontFamily: "var(--font-ftsterling)",
          }}
        >
          Dashboard
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        <Typography
          sx={{
            color: "#555",
            fontFamily: "var(--font-ftsterling)",
          }}
        >
          User
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
