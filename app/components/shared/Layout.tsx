"use client";

import { Box } from "@mui/material";
import Header from "./Header";
import Sidebar from "./sidebar/Sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", height: "100vh", backgroundColor: "#F1F5F9" }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <Header />

        {/* Page Content */}
        <Box sx={{ flexGrow: 1, overflowY: "auto", padding: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
