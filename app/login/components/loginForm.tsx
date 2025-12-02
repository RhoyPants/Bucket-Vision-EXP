"use client";

import { Box, Button, Divider, TextField, Typography } from "@mui/material";
import Image from "next/image";

export default function LoginForm() {
  return (
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
      {/* Logo */}
       <Box alignSelf="center" component="img" src="/images/GVI_LOGO_DARK.png" alt="Login Image" width="150px" />

      {/* Title */}
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        Employee Login
      </Typography>

      {/* Email */}
      <TextField
        fullWidth
        label="Email"
        variant="outlined"
        size="small"
        sx={{ mb: 2 }}
      />

      {/* Password */}
      <TextField
        fullWidth
        label="Password"
        type="password"
        variant="outlined"
        size="small"
        sx={{ mb: 2 }}
      />

      {/* Login Button */}
      <Button
        fullWidth
        variant="contained"
        color="primary"
        sx={{ mb: 2, height: 42 }}
      >
        Login
      </Button>

      {/* Divider */}
      <Divider sx={{ my: 2 }}>
        <Typography variant="caption" sx={{ color: "#888" }}>
          or continue with
        </Typography>
      </Divider>

      {/* Microsoft Login */}
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

      {/* Footer */}
      <Typography
        variant="caption"
        sx={{ mt: 3, display: "block", color: "#555" }}
      >
        © {new Date().getFullYear()} Global Visions, Inc. All Rights Reserved
      </Typography>
    </Box>
  );
}
