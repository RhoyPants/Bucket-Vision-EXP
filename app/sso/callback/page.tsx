"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { handleMicrosoftCallback } from "@/app/api-service/authService";

type CallbackStatus = "processing" | "error";

const normalizePrefill = (
  claims: Record<string, unknown>,
  graphProfile?: any
) => {
  const firstName =
    graphProfile?.givenName ||
    (claims?.given_name as string) ||
    (claims?.givenName as string) ||
    "";
  const lastName =
    graphProfile?.surname ||
    (claims?.family_name as string) ||
    (claims?.surname as string) ||
    "";

  return {
    firstName,
    lastName,
    fullName:
      graphProfile?.displayName ||
      `${firstName} ${lastName}`.trim() ||
      "",
    email:
      graphProfile?.mail ||
      graphProfile?.userPrincipalName ||
      (claims?.preferred_username as string) ||
      (claims?.email as string) ||
      "",
    position:
      graphProfile?.jobTitle ||
      (claims?.jobTitle as string) ||
      (claims?.jobtitle as string) ||
      (claims?.title as string) ||
      "",
    department:
      graphProfile?.department ||
      (claims?.department as string) ||
      "",
    officeLocation:
      graphProfile?.officeLocation ||
      (claims?.officeLocation as string) ||
      "",
    company:
      graphProfile?.companyName ||
      (claims?.companyName as string) ||
      "",
    businessUnitId: "",
  };
};

export default function SSOCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<CallbackStatus>("processing");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        const callbackResult = await handleMicrosoftCallback();

        if (!callbackResult) {
          throw new Error("No Microsoft callback result found. Please login again.");
        }

        const { exchange, idToken, idTokenClaims, accessToken } = callbackResult;
        const data = exchange?.data as any;

        if (!exchange?.success || !data) {
          throw new Error(exchange?.message || "SSO login failed.");
        }

        localStorage.setItem("sso_idToken", idToken);

        const claims = (idTokenClaims || {}) as Record<string, unknown>;

        // Fetch Microsoft Graph profile to populate prefill data
        let graphProfile: any = null;
        if (accessToken) {
          try {
            const graphRes = await fetch(
              "https://graph.microsoft.com/v1.0/me?$select=displayName,givenName,surname,mail,userPrincipalName,jobTitle,department,officeLocation,companyName",
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );

            if (graphRes.ok) {
              graphProfile = await graphRes.json();
            }
          } catch (graphErr) {
            // Graph fetch failed, continue with claims fallback
            console.warn("Graph profile fetch failed, using claims fallback");
          }
        }

        const normalizedPrefill = normalizePrefill(claims, graphProfile);

        const statusCode = data.statusCode;

        if (statusCode === "LOGIN_SUCCESS") {
          const { accessToken, refreshToken, user, permissions } = data;
          localStorage.setItem("token", accessToken);
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", refreshToken || "");
          localStorage.setItem("user", JSON.stringify(user));
          localStorage.setItem("permissions", JSON.stringify(permissions || {}));

          localStorage.removeItem("sso_prefill");
          localStorage.removeItem("sso_registration");
          router.replace("/personalDashboard");
          return;
        }

        if (statusCode === "REGISTRATION_REQUIRED") {
          localStorage.setItem("sso_prefill", JSON.stringify(normalizedPrefill));
          localStorage.removeItem("sso_registration");
          router.replace("/sso/register");
          return;
        }

        if (statusCode === "PENDING_APPROVAL") {
          localStorage.setItem("sso_registration", JSON.stringify(data.registration || {}));
          localStorage.setItem("sso_prefill", JSON.stringify(normalizedPrefill));
          router.replace("/sso/pending");
          return;
        }

        if (statusCode === "REJECTED") {
          localStorage.setItem("sso_registration", JSON.stringify(data.registration || {}));
          localStorage.setItem("sso_prefill", JSON.stringify(normalizedPrefill));
          router.replace("/sso/rejected");
          return;
        }

        if (statusCode === "INACTIVE_ACCOUNT") {
          router.replace("/pending-access");
          return;
        }

        throw new Error(data?.message || exchange?.message || "Unhandled SSO status.");
      } catch (err: any) {
        setErrorMessage(err?.message || "Microsoft login callback failed.");
        setStatus("error");
      }
    };

    run();
  }, [router]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        background:
          "radial-gradient(circle at 10% 20%, #dbeafe 0%, transparent 35%), radial-gradient(circle at 90% 80%, #e0f2fe 0%, transparent 40%), linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
      }}
    >
      <Paper
        elevation={6}
        sx={{
          width: "100%",
          maxWidth: 560,
          p: 4,
          borderRadius: "20px",
          border: "1px solid #e5e7eb",
          textAlign: "center",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)",
          boxShadow: "0 16px 48px rgba(15, 23, 42, 0.12)",
          overflow: "hidden",
          position: "relative",
          "@keyframes pulseBar": {
            "0%": { transform: "translateX(-100%)" },
            "100%": { transform: "translateX(300%)" },
          },
          "@keyframes float": {
            "0%, 100%": { transform: "translateY(0px)" },
            "50%": { transform: "translateY(-6px)" },
          },
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "linear-gradient(120deg, rgba(37,99,235,0.03) 0%, rgba(6,182,212,0.02) 50%, rgba(37,99,235,0.03) 100%)",
          }}
        />

        {status === "processing" ? (
          <Box sx={{ position: "relative", zIndex: 1 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                mx: "auto",
                mb: 2,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "4px",
                animation: "float 2.4s ease-in-out infinite",
              }}
            >
              <Box sx={{ backgroundColor: "#f25022", borderRadius: "3px" }} />
              <Box sx={{ backgroundColor: "#7fba00", borderRadius: "3px" }} />
              <Box sx={{ backgroundColor: "#00a4ef", borderRadius: "3px" }} />
              <Box sx={{ backgroundColor: "#ffb900", borderRadius: "3px" }} />
            </Box>

            <Typography sx={{ fontSize: 26, fontWeight: 800, color: "#0f172a", mb: 0.5 }}>
              Signing You In
            </Typography>
            <Typography sx={{ color: "#475569", mb: 2.5 }}>
              Syncing your Microsoft identity with Bucket Vision.
            </Typography>

            <Box
              sx={{
                position: "relative",
                height: 8,
                borderRadius: 999,
                backgroundColor: "#e2e8f0",
                overflow: "hidden",
                mb: 1.5,
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "28%",
                  height: "100%",
                  borderRadius: 999,
                  background: "linear-gradient(90deg, #2563eb 0%, #06b6d4 100%)",
                  animation: "pulseBar 1.4s linear infinite",
                }}
              />
            </Box>

            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
              <CircularProgress size={16} thickness={5} />
              <Typography sx={{ color: "#64748b", fontSize: 14 }}>
                This usually takes a few seconds...
              </Typography>
            </Stack>
          </Box>
        ) : (
          <Box sx={{ position: "relative", zIndex: 1 }}>
            <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#111827", mb: 2 }}>
              Sign-In Failed
            </Typography>
            <Alert severity="error" sx={{ mb: 3, textAlign: "left" }}>
              {errorMessage || "Unable to complete Microsoft login."}
            </Alert>
            <Button variant="contained" fullWidth onClick={() => router.replace("/")}>
              Back to Login
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
