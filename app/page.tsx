"use client";

import { Box } from "@mui/material";
import LoginContainer from "./login/components/loginContainer";

export default function LoginPage() {
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
      <LoginContainer />
    </Box>
  );
}
