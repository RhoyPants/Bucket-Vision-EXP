"use client";

import { Alert, Box } from "@mui/material";
import { useSearchParams } from "next/navigation";
import LoginContainer from "./login/components/loginContainer";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const ssoStatus = searchParams.get("sso");

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#e0dae6",
        // backgroundImage: "url(/images/5.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {ssoStatus === "register" ? (
        <Alert severity="warning" sx={{ mb: 2, width: 380 }}>
          No registered account found. Please contact admin to register your account.
        </Alert>
      ) : null}

      {ssoStatus === "pending" ? (
        <Alert severity="info" sx={{ mb: 2, width: 380 }}>
          Your account is inactive. Please contact your administrator.
        </Alert>
      ) : null}

      {ssoStatus === "denied" ? (
        <Alert severity="error" sx={{ mb: 2, width: 380 }}>
          Your account has been denied access. Please contact your administrator.
        </Alert>
      ) : null}

      {ssoStatus === "failed" || ssoStatus === "invalid_state" || ssoStatus === "invalid_callback" ? (
        <Alert severity="error" sx={{ mb: 2, width: 380 }}>
          Microsoft SSO login failed. Please try again.
        </Alert>
      ) : null}

      <LoginContainer />
    </Box>
  );
}
