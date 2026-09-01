"use client";

import { useEffect, useState } from "react";
import { Alert, Box, CircularProgress, FormControlLabel, Switch, Tooltip } from "@mui/material";
import StructuredView from "@/app/(pages)/approvals/[projectId]/components/StructuredView";
import ProjectSetupWizard from "@/app/components/ProjectSetupWizard";
import type { Scope } from "@/app/(pages)/approvals/[projectId]/components/types";
import { useAppDispatch } from "@/app/redux/hook";
import { getProjectFull } from "@/app/redux/controllers/projectController";
import { usePermissions } from "@/app/lib/usePermissions";

type StructureProject = {
  id: string;
  name: string;
  totalBudget?: number;
  scopes: Scope[];
};

export default function ProjectStructure({ projectId }: { projectId: string }) {
  const dispatch = useAppDispatch();
  const { canUpdate } = usePermissions();
  const canEditStructure = canUpdate("projects");
  const [project, setProject] = useState<StructureProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingEnabled, setEditingEnabled] = useState(false);

  const applyProjectResponse = (response: any) => {
    const scopes = [...(response.scopes || [])]
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
      .map((scope: any) => ({
        ...scope,
        tasks: [...(scope.tasks || [])]
          .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
          .map((task: any) => ({
            ...task,
            subtasks: [...(task.subtasks || [])].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)),
          })),
      }));
    setProject({
      id: response.id,
      name: response.name || "Untitled Project",
      totalBudget: Number(response.totalBudget || 0),
      scopes: scopes as unknown as Scope[],
    });
  };

  const handleEditingToggle = (enabled: boolean) => {
    setEditingEnabled(enabled);
    if (enabled) return;
    setLoading(true);
    setError("");
    dispatch(getProjectFull(projectId))
      .then((response) => { if (response) applyProjectResponse(response); })
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Unable to refresh project structure"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    dispatch(getProjectFull(projectId, { preferCache: true }))
      .then((response) => {
        if (!active || !response) return;
        applyProjectResponse(response);
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
        <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mb: 1 }}>
          <Tooltip title={canEditStructure ? "Enable scope, task, and subtask reordering" : "You need project update permission to reorder the structure"}>
            <span>
              <FormControlLabel
                control={(
                  <Switch
                    checked={editingEnabled}
                    disabled={!canEditStructure}
                    onChange={(event) => handleEditingToggle(event.target.checked)}
                    inputProps={{ "aria-label": "Enable project structure reordering" }}
                  />
                )}
                label={editingEnabled ? "Reordering enabled" : "Enable reordering"}
                sx={{ m: 0, "& .MuiFormControlLabel-label": { fontSize: 13, fontWeight: 800, color: editingEnabled ? "#4338CA" : "#475569" } }}
              />
            </span>
          </Tooltip>
        </Box>
        {editingEnabled ? (
          <ProjectSetupWizard projectId={projectId} initialStep={2} mode="edit" structureOnly reorderOnly />
        ) : loading ? (
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
