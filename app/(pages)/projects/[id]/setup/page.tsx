"use client";

import { useParams } from "next/navigation";
import { Box } from "@mui/material";
import Layout from "@/app/components/shared/Layout";
import ProjectSetupWizard from "@/app/components/ProjectSetupWizard";

export default function ProjectSetupPage() {
  const { id } = useParams();

  return (
    <Layout>
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <ProjectSetupWizard projectId={id as string} />
      </Box>
    </Layout>
  );
}
