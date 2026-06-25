"use client";

import { Box, Button, Divider, Stack, TextField, Typography } from "@mui/material";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import MicrosoftIcon from "@mui/icons-material/Window";
import { useState } from "react";

interface LoginFormProps {
  onSubmit: (email: string, password: string) => void;
  onMicrosoftLogin: () => void;
  loading: boolean;
}

export default function LoginForm({ onSubmit, onMicrosoftLogin, loading }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const textFieldSx = {
    "& .MuiOutlinedInput-root": {
      height: 46,
      borderRadius: 2,
      backgroundColor: "rgba(255,255,255,0.74)",
      "& fieldset": { borderColor: "#d9dce8" },
      "&:hover fieldset": { borderColor: "#8a7ae6" },
      "&.Mui-focused fieldset": { borderColor: "#4f3fd0" },
    },
    "& .MuiInputLabel-root": {
      fontSize: 12,
      fontWeight: 700,
      color: "#46485d",
    },
    "& .MuiInputLabel-shrink": {
      transform: "translate(14px, -9px) scale(0.75)",
      backgroundColor: "rgba(247,248,255,0.95)",
      px: 0.5,
    },
    "& .MuiInputBase-input": {
      fontWeight: 700,
      color: "#14142d",
      caretColor: "#20106b",
      "&:-webkit-autofill": {
        WebkitBoxShadow: "0 0 0 100px rgba(255,255,255,0.84) inset",
        WebkitTextFillColor: "#14142d",
        transition: "background-color 9999s ease-out 0s",
      },
      "&:-webkit-autofill:hover": {
        WebkitBoxShadow: "0 0 0 100px rgba(255,255,255,0.84) inset",
        WebkitTextFillColor: "#14142d",
      },
      "&:-webkit-autofill:focus": {
        WebkitBoxShadow: "0 0 0 100px rgba(255,255,255,0.84) inset",
        WebkitTextFillColor: "#14142d",
      },
    },
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const autofilledEmail = String(formData.get("email") || "");
    const autofilledPassword = String(formData.get("password") || "");

    if ((!email || !password) && (autofilledEmail || autofilledPassword)) {
      onSubmit(email || autofilledEmail, password || autofilledPassword);
      return;
    }
    onSubmit(email, password); // 🔥 CALL PARENT FUNCTION
  };

  return (
    <Box
      component="form"
      onSubmit={handleLogin}
      sx={{ width: "100%" }}
    >
      <Box
        sx={{
          width: "100%",
          p: { xs: 3, sm: 3.75 },
          borderRadius: 3,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.12) 100%)",
          textAlign: "center",
          border: "1px solid rgba(255,255,255,0.46)",
          boxShadow:
            "0 24px 58px rgba(33, 14, 100, 0.14), inset 0 1px 0 rgba(255,255,255,0.28)",
          backdropFilter: "blur(12px) saturate(1.12)",
        }}
      >
        <Stack spacing={2} sx={{ width: "100%" }}>
          <Box>
            <Box
              component="img"
              src="/images/GVI_LOGO_DARK.png"
              alt="Global Visions"
              sx={{ width: 148, height: "auto", mb: 2.25 }}
            />

            <Typography
              component="h2"
              sx={{
                color: "#17113f",
                fontSize: 25,
                lineHeight: 1.15,
                fontWeight: 900,
              }}
            >
              Sign In
            </Typography>
            <Typography
              sx={{
                mt: 0.75,
                color: "#6d7280",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Sign in to continue to your workspace
            </Typography>
          </Box>

          <Stack spacing={1.35}>
            <TextField
              fullWidth
              name="email"
              label="Email"
              variant="outlined"
              size="small"
              autoComplete="email"
              slotProps={{ inputLabel: { shrink: true } }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={textFieldSx}
            />

            <TextField
              fullWidth
              name="password"
              label="Password"
              type="password"
              variant="outlined"
              size="small"
              autoComplete="current-password"
              slotProps={{ inputLabel: { shrink: true } }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={textFieldSx}
            />
          </Stack>

          <Button
            disabled={loading}
            type="submit"
            fullWidth
            variant="contained"
            startIcon={<LoginOutlinedIcon />}
            sx={{
              height: 46,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 900,
              background: "linear-gradient(90deg, #20106b 0%, #4f3fd0 100%)",
              boxShadow: "0 12px 24px rgba(45, 29, 137, 0.24)",
              "&:hover": {
                background: "linear-gradient(90deg, #190c58 0%, #4032bd 100%)",
                boxShadow: "0 14px 28px rgba(45, 29, 137, 0.32)",
              },
            }}
          >
            {loading ? "Processing..." : "Login"}
          </Button>

          <Divider>
            <Typography variant="caption" sx={{ color: "#888", fontWeight: 700 }}>
              or continue with
            </Typography>
          </Divider>

          <Button
            fullWidth
            variant="outlined"
            type="button"
            disabled={loading}
            onClick={onMicrosoftLogin}
            startIcon={<MicrosoftIcon />}
            sx={{
              height: 46,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 850,
              color: "#17113f",
              borderColor: "#cfd3e3",
              backgroundColor: "#ffffff",
              "&:hover": {
                borderColor: "#4f3fd0",
                backgroundColor: "#f7f7ff",
              },
            }}
          >
            Microsoft Login
          </Button>

          <Typography
            variant="caption"
            sx={{ pt: 0.5, display: "block", color: "#737782", fontWeight: 700 }}
          >
          © {new Date().getFullYear()} Global Visions, Inc. All Rights Reserved
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
