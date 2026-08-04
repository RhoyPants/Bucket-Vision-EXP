"use client";

import { Suspense } from "react";
import { Box, CircularProgress } from "@mui/material";
import { ReportsContent } from "@/app/(pages)/reports/ReportsContent";

export default function ProjectReports({ projectId }: { projectId: string }) {
  return (
    <Suspense
      fallback={
        <Box sx={{ minHeight: 420, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      }
    >
      <ReportsContent lockedProjectId={projectId} embedded />
    </Suspense>
  );
}
