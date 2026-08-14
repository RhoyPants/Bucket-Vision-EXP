"use client";

import { useParams } from "next/navigation";
import { Box } from "@mui/material";
import ProjectSetupWizard from "@/app/components/ProjectSetupWizard";
import Header from "@/app/components/shared/Header";

export default function ProjectSetupPage() {
  const { id } = useParams();
  const isNew = id === "new";

  return (
    <Box sx={{ height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Header />
      <Box
      sx={{
        px: { xs: 2, md: 4 },
        pt: { xs: 1, md: 1.5 },
        pb: { xs: 2, md: 4 },

        width: "100%",
        minWidth: 0,
        minHeight: 0,
        flex: 1,
        boxSizing: "border-box",
        overflowY: "auto",
        overflowX: "hidden",
        overscrollBehavior: "contain",
      }}
      >
        <ProjectSetupWizard
          projectId={isNew ? undefined : (id as string)}
          mode={isNew ? "create" : "edit"}
        />
      </Box>
    </Box>
  );
}
