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
        p: { xs: 2, md: 4 },

        width: "100%",
        maxWidth: "100%",

        minWidth: 0,

        boxSizing: "border-box",

        overflowX: "hidden",
      }}
    >
      <ProjectSetupWizard
        projectId={isNew ? undefined : (id as string)}
        mode={isNew ? "create" : "edit"} />
    </Box></>

  );
}
