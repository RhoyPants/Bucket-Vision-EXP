"use client";

import { Box, Button, Paper, Typography } from "@mui/material";
import { useRouter } from "next/navigation";

export default function PendingAccessPage() {
  const router = useRouter();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8fafc",
        p: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 640,
          p: 4,
          borderRadius: "16px",
          border: "1px solid #e5e7eb",
          textAlign: "center",
        }}
      >
        <Typography sx={{ fontSize: 28, fontWeight: 700, color: "#111827", mb: 1 }}>
          Pending Access Approval
        </Typography>
        <Typography sx={{ color: "#6b7280", mb: 3 }}>
          Your account is registered but not active yet. Please contact your administrator for activation.
        </Typography>

        <Button variant="contained" onClick={() => router.replace("/")}>
          Back to Login
        </Button>
      </Paper>
    </Box>
  );
}
