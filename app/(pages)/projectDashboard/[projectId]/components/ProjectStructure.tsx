"use client";

import { useEffect, useState } from "react";
import { Alert, Box, CircularProgress } from "@mui/material";
import StructuredView from "@/app/(pages)/approvals/[projectId]/components/StructuredView";
import type { Scope } from "@/app/(pages)/approvals/[projectId]/components/types";
import { useAppDispatch } from "@/app/redux/hook";
import { getProjectFull } from "@/app/redux/controllers/projectController";

type StructureProject = {
  id: string;
  name: string;
  totalBudget?: number;
  scopes: Scope[];
};

export default function ProjectStructure({ projectId }: { projectId: string }) {
  const dispatch = useAppDispatch();
  const [project, setProject] = useState<StructureProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    dispatch(getProjectFull(projectId, { preferCache: true }))
      .then((response) => {
        if (!active || !response) return;
        setProject({
          id: response.id,
          name: response.name || "Untitled Project",
          totalBudget: Number(response.totalBudget || 0),
          scopes: (response.scopes || []) as unknown as Scope[],
        });
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Unable to load project structure");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [dispatch, projectId]);

  return (
    <Box sx={{ height: { xs: "auto", md: "calc(100vh - max(10vh, 125px))" }, minHeight: 560, p: 1.25 }}>
      <Box sx={{ height: "100%", overflow: "auto", bgcolor: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 2, p: { xs: 1.5, md: 2 } }}>
        {loading ? (
          <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}><CircularProgress /></Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : project ? (
          <StructuredView project={project} />
        ) : (
          <Alert severity="info">No project structure is available.</Alert>
        )}
      </Box>
    </Box>
  );
}
