"use client";

import { Box } from "@mui/material";
import Layout from "@/app/components/shared/Layout";
import GlobalDashboardContent from "./components/GlobalDashboardContent";

export default function DashboardPage() {
  return (
    <Layout>
      <Box component="main" aria-label="Dashboard content" sx={{ minHeight: "100%", width: "100%", bgcolor: "#F8FAFC" }}>
        <GlobalDashboardContent />
      </Box>
    </Layout>
  );
}
