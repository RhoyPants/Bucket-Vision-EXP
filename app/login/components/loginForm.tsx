"use client";

import { loginUser } from "@/app/redux/controllers/loginController";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { Box, Button, Divider, TextField, Typography } from "@mui/material";
import { useState } from "react";

export default function LoginForm() {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }))
      .then(() => {
        window.location.href = "/dashboard";
      });
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

        <Button
          disabled={loading}
          fullWidth
          variant="contained"
          color="primary"
          type="submit"
          sx={{ mb: 2, height: 42 }}
        >
          Login
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
          sx={{
            height: 42,
            textTransform: "none",
            borderColor: "#210e64",
          }}
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
