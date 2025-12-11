"use client";

import { Box, Button, Divider, TextField, Typography } from "@mui/material";
import { useState } from "react";

interface LoginFormProps {
  onSubmit: (email: string, password: string) => void;
  loading: boolean;
}

export default function LoginForm({ onSubmit, loading }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password); // 🔥 CALL PARENT FUNCTION
  };

  return (
    <form onSubmit={handleLogin}>
      <Box
        sx={{
          width: 380,
          padding: 4,
          borderRadius: 3,
          backgroundColor: "#e8e7e2",
          textAlign: "center",
          border: "2px solid #162b5fff",
        }}
      >
        <Box
          alignSelf="center"
          component="img"
          src="/images/GVI_LOGO_DARK.png"
          alt="Login Image"
          width="150px"
        />

        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Employee Login
        </Typography>

        <TextField
          fullWidth
          label="Email"
          variant="outlined"
          size="small"
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Password"
          type="password"
          variant="outlined"
          size="small"
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Button disabled={loading} type="submit" fullWidth variant="contained">
          {loading ? "Processing..." : "Login"}
        </Button>

        <Divider sx={{ my: 2 }}>
          <Typography variant="caption" sx={{ color: "#888" }}>
            or continue with
          </Typography>
        </Divider>

        <Button
          fullWidth
          variant="outlined"
          color="primary"
        >
          Microsoft Login
        </Button>

        <Typography
          variant="caption"
          sx={{ mt: 3, display: "block", color: "#555" }}
        >
          © {new Date().getFullYear()} Global Visions, Inc. All Rights Reserved
        </Typography>
      </Box>
    </form>
  );
}
