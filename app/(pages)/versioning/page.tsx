"use client";

import { Suspense } from "react";
import { Box, CircularProgress } from "@mui/material";
import { VersioningPageContent } from "./VersioningPageContent";

export default function VersioningPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "grid", placeItems: "center", minHeight: "100vh", bgcolor: "#F8FAFC" }}>
          <CircularProgress />
        </Box>
      }
    >
      <VersioningPageContent />
    </Suspense>
  );
}
