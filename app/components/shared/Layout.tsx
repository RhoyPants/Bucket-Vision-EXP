"use client";

import { Box } from "@mui/material";
import { Suspense } from "react";
import Header from "./Header";
import Sidebar from "./sidebar/Sidebar";
import RouteGuard from "./RouteGuard";
import AccessDeniedModal from "./modals/AccessDeniedModal";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", height: "100vh", backgroundColor: "#f8fafc" }}>
      {/* Sidebar */}
      <Suspense fallback={null}>
        <Sidebar />
      </Suspense>

      {/* Main Area */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Header */}
        <Header />

        {/* Page Content */}
        <Box sx={{ flexGrow: 1, overflowY: "auto", overflowX: "hidden", padding: 0.2, minWidth: 0, backgroundColor: "#f8fafc" }}>
          <RouteGuard>{children}</RouteGuard>
        </Box>
      </Box>
      <AccessDeniedModal />
    </Box>
  );
}
