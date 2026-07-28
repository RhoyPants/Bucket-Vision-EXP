"use client";

import { Suspense } from "react";
import { Box, CircularProgress } from "@mui/material";
import { VersioningPageContent } from "@/app/(pages)/versioning/VersioningPageContent";

export default function ProjectVersioning({ projectId }: { projectId: string }) {
  return (
    <Box
      sx={{
        height: { xs: "auto", md: "calc(100vh - max(10vh, 125px))" },
        minHeight: 560,
        overflow: { xs: "visible", md: "auto" },
      }}
    >
      <Suspense
        fallback={
          <Box sx={{ minHeight: 420, display: "grid", placeItems: "center" }}>
            <CircularProgress />
          </Box>
        }
      >
        <VersioningPageContent projectId={projectId} embedded />
      </Suspense>
    </Box>
  );
}
