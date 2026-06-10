"use client";

import { Box } from "@mui/material";
import Header from "./Header";
import Sidebar from "./sidebar/Sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", height: "100vh", backgroundColor: "#f8fafc" }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Header */}
        <Header />

        {/* Page Content */}
        <Box sx={{ flexGrow: 1, overflowY: "auto", overflowX: "hidden", padding: 0.2, minWidth: 0, backgroundColor: "#f8fafc" }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
