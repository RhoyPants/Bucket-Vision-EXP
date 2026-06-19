"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Paper, Typography, Alert } from "@mui/material";
import ErrorIcon from "@mui/icons-material/Error";

interface Registration {
  id: string;
  referenceNo: string;
  status: string;
  rejectReason?: string;
}

export default function SSORejectPage() {
  const router = useRouter();
  const [registration, setRegistration] = useState<Registration | null>(null);

  useEffect(() => {
    const regStr = localStorage.getItem("sso_registration");
    if (regStr) {
      try {
        const parsed = JSON.parse(regStr);
        setRegistration(parsed);
      } catch (e) {
        console.error("Failed to parse registration data:", e);
      }
    }
  }, []);

  const handleResubmit = () => {
    // Clear old registration data but keep prefill and idToken
    localStorage.removeItem("sso_registration");
    router.push("/sso/register");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at 10% 20%, #dbeafe 0%, transparent 35%), radial-gradient(circle at 90% 80%, #e0f2fe 0%, transparent 40%), linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
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
        <ErrorIcon
          sx={{ fontSize: 64, color: "#ef4444", mb: 2 }}
        />

        <Typography sx={{ fontSize: 28, fontWeight: 700, color: "#111827", mb: 1 }}>
          Registration Rejected
        </Typography>

        <Typography sx={{ color: "#6b7280", mb: 3 }}>
          Your registration request was not approved. Please review the reason below
          and resubmit if you'd like to try again.
        </Typography>

        {registration?.rejectReason && (
          <Alert severity="error" sx={{ mb: 3, textAlign: "left" }}>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>Reason for Rejection:</Typography>
            <Typography>{registration.rejectReason}</Typography>
          </Alert>
        )}

        {registration?.referenceNo && (
          <Alert severity="info" sx={{ mb: 3, textAlign: "left" }}>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>Reference Number:</Typography>
            <Typography sx={{ fontFamily: "monospace" }}>
              {registration.referenceNo}
            </Typography>
          </Alert>
        )}

        <Typography sx={{ color: "#6b7280", mb: 3, fontSize: 14 }}>
          If you believe this is an error or have additional information, you can
          resubmit your registration below.
        </Typography>

        <Box sx={{ display: "flex", gap: 2, flexDirection: "column" }}>
          <Button
            variant="contained"
            fullWidth
            onClick={handleResubmit}
          >
            Resubmit Registration
          </Button>

          <Button
            variant="outlined"
            fullWidth
            onClick={() => {
              // Clear all SSO data
              localStorage.removeItem("sso_idToken");
              localStorage.removeItem("sso_prefill");
              localStorage.removeItem("sso_registration");
              router.replace("/");
            }}
          >
            Back to Login
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
