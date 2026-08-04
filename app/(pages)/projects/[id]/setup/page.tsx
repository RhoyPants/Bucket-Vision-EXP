"use client";

import { useParams } from "next/navigation";
import { Box } from "@mui/material";
import Layout from "@/app/components/shared/Layout";
import ProjectSetupWizard from "@/app/components/ProjectSetupWizard";
import Header from "@/app/components/shared/Header";

export default function ProjectSetupPage() {
  const { id } = useParams();
  const isNew = id === "new";

  return (
    <><Header /><Box
      sx={{
        px: { xs: 2, md: 4 },
        pt: { xs: 1, md: 1.5 },
        pb: { xs: 2, md: 4 },

        width: "100%",
        maxWidth: "100%",

        minWidth: 0,

        boxSizing: "border-box",
        height: { xs: "calc(100vh - 60px)", sm: "calc(100vh - 72px)" },
        overflowY: "auto",
        overflowX: "hidden",
        overscrollBehavior: "contain",
      }}
    >
      <ProjectSetupWizard
        projectId={isNew ? undefined : (id as string)}
        mode={isNew ? "create" : "edit"} />
    </Box></>

  );
}
