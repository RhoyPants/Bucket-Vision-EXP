"use client";

import { useEffect, useState } from "react";
import { Alert, Box, CircularProgress } from "@mui/material";
import ProjectSchedulingStep from "@/app/(pages)/projects/[id]/setup/components/ProjectSchedulingStep";
import { useAppDispatch } from "@/app/redux/hook";
import { getProjectFull } from "@/app/redux/controllers/projectController";

export default function ProjectCpm({ projectId }: { projectId: string }) {
  const dispatch = useAppDispatch();
  const [scopes, setScopes] = useState<unknown[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setError("");
    dispatch(getProjectFull(projectId, { preferCache: true }))
      .then((project) => {
        if (active) setScopes(project?.scopes || []);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Unable to load the project schedule.");
      });
    return () => { active = false; };
  }, [dispatch, projectId]);

  return (
    <Box sx={{ p: { xs: 1.25, md: 2 }, maxWidth: 1500, mx: "auto" }}>
      {error ? (
        <Alert severity="error">{error}</Alert>
      ) : !scopes ? (
        <Box sx={{ minHeight: 320, display: "grid", placeItems: "center" }}><CircularProgress /></Box>
      ) : (
        <ProjectSchedulingStep projectId={projectId} canUpdate={false} scopes={scopes} />
      )}
    </Box>
  );
}
