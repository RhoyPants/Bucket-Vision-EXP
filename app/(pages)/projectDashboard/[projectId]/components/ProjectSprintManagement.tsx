"use client";

import { useEffect, useState } from "react";
import { Box, Chip, CircularProgress, LinearProgress, Stack, Typography } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { getProjectFull } from "@/app/redux/controllers/projectController";
import { loadKanbanByTask } from "@/app/redux/controllers/subTaskController";
import KanbanBoard from "@/app/components/shared/kanban/KanbanBoard";
import { formatBudget } from "@/app/utils/formatters";

type Task = {
  id: string;
  title?: string;
  name?: string;
  progress?: number;
  budgetAllocated?: number;
  budgetPercent?: number;
  priority?: string;
};

type Scope = {
  id: string;
  name?: string;
  progress?: number;
  budgetAllocated?: number;
  budgetPercent?: number;
  tasks?: Task[];
};

export default function ProjectSprintManagement({ projectId }: { projectId: string }) {
  const dispatch = useAppDispatch();
  const subtasks = useAppSelector((state) => state.kanban.subtasks);
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [selectedScopeId, setSelectedScopeId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [kanbanColumns, setKanbanColumns] = useState<{ id: number; title: string }[]>([
    { id: 0, title: "Pending" },
    { id: 1, title: "In Progress" },
    { id: 2, title: "Completed" },
  ]);

  useEffect(() => {
    let active = true;
    dispatch(getProjectFull(projectId))
      .then((project) => {
        if (!active) return;
        const nextScopes = (project?.scopes ?? []) as Scope[];
        setScopes(nextScopes);
        setSelectedScopeId(nextScopes[0]?.id ?? null);
        setSelectedTaskId(nextScopes[0]?.tasks?.[0]?.id ?? null);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setError(requestError instanceof Error ? requestError.message : "Unable to load sprint management data");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [dispatch, projectId]);

  const selectedScope = scopes.find((scope) => scope.id === selectedScopeId) ?? null;
  const tasks = selectedScope?.tasks ?? [];
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? tasks[0] ?? null;

  useEffect(() => {
    if (!selectedTaskId) return;
    let active = true;
    dispatch(loadKanbanByTask(selectedTaskId)).then((kanban) => {
      if (active && kanban?.columns?.length) setKanbanColumns(kanban.columns);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [dispatch, selectedTaskId]);

  const refreshKanban = async () => {
    if (!selectedTaskId) return;
    const kanban = await dispatch(loadKanbanByTask(selectedTaskId));
    if (kanban?.columns?.length) setKanbanColumns(kanban.columns);
  };

  const selectScope = (scope: Scope) => {
    setSelectedScopeId(scope.id);
    setSelectedTaskId(scope.tasks?.[0]?.id ?? null);
  };

  if (loading) {
    return <Box sx={{ minHeight: 420, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Box sx={{ p: 3 }}><Typography color="error" fontWeight={700}>{error}</Typography></Box>;
  }

  return (
    <Box
      sx={{
        height: { xs: "auto", md: "calc(100vh - max(10vh, 125px))" },
        minHeight: 520,
        p: 1.5,
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "195px minmax(0, 1fr)" },
        gridTemplateRows: { xs: "auto", md: "175px minmax(0, 1fr)" },
        gap: 2,
        overflow: { xs: "visible", md: "hidden" },
      }}
    >
      <Box
        sx={{
          gridRow: { md: "1 / 3" },
          border: "1px solid #CBD5E1",
          borderRadius: 1.5,
          bgcolor: "#FFFFFF",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ px: 1.25, py: 1, borderBottom: "1px solid #E2E8F0" }}>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Box sx={{ width: 21, height: 21, display: "grid", placeItems: "center", borderRadius: "50%", bgcolor: "#2563EB", color: "#FFF", fontSize: 10, fontWeight: 900 }}>1</Box>
            <Typography sx={{ fontSize: 14, fontWeight: 900, color: "#0F172A" }}>Choose a scope</Typography>
          </Stack>
          <Typography sx={{ mt: 0.35, color: "#64748B", fontSize: 9.5 }}>Start by selecting a project work area.</Typography>
        </Box>
        <Stack
          direction={{ xs: "row", md: "column" }}
          spacing={0.75}
          sx={{
            p: 1,
            overflowX: { xs: "auto", md: "hidden" },
            overflowY: { xs: "hidden", md: "auto" },
            scrollbarWidth: "thin",
          }}
        >
          {scopes.length ? scopes.map((scope) => {
            const active = scope.id === selectedScope?.id;
            return (
              <Box
                key={scope.id}
                onClick={() => selectScope(scope)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    selectScope(scope);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-pressed={active}
                aria-label={`Select scope ${scope.name || "Untitled Scope"}`}
                sx={{
                  flex: { xs: "0 0 220px", md: "initial" },
                  minWidth: 0,
                  p: 1.25,
                  borderRadius: 1,
                  cursor: "pointer",
                  bgcolor: active ? "#EFF6FF" : "#FFFFFF",
                  border: active ? "2px solid #3B82F6" : "1px solid #CBD5E1",
                  boxShadow: active ? "0 4px 12px rgba(37, 99, 235, 0.14)" : "0 2px 5px rgba(15, 23, 42, 0.06)",
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
                  "&:hover": { borderColor: "#60A5FA", boxShadow: "0 5px 14px rgba(15, 23, 42, 0.10)", transform: "translateY(-1px)" },
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ position: "relative", width: 42, height: 42, flexShrink: 0 }}>
                    <CircularProgress variant="determinate" value={100} size={42} thickness={5} sx={{ color: "#E2E8F0", position: "absolute" }} />
                    <CircularProgress variant="determinate" value={Math.min(100, Math.max(0, Number(scope.progress ?? 0)))} size={42} thickness={5} sx={{ color: active ? "#2563EB" : "#0EA5E9", position: "absolute" }} />
                    <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                      <Typography sx={{ fontSize: 9.5, fontWeight: 900, color: "#334155" }}>{Number(scope.progress ?? 0).toFixed(0)}%</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography noWrap sx={{ fontSize: 12.5, fontWeight: active ? 900 : 800, color: active ? "#1D4ED8" : "#334155" }}>{scope.name || "Untitled Scope"}</Typography>
                    <Typography sx={{ mt: 0.15, color: active ? "#2563EB" : "#94A3B8", fontSize: 8.5, fontWeight: 800 }}>
                      {active ? "SELECTED" : `${scope.tasks?.length ?? 0} TASK${scope.tasks?.length === 1 ? "" : "S"}`}
                    </Typography>
                  </Box>
                </Stack>

                <Box sx={{ mt: 1, pt: 0.9, borderTop: "1px solid #E2E8F0", display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 1 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 9, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase" }}>Budget</Typography>
                    <Typography noWrap sx={{ fontSize: 10.5, fontWeight: 800, color: "#475569" }}>{formatBudget(Number(scope.budgetAllocated ?? 0), true)}</Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography sx={{ fontSize: 9, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase" }}>Weight</Typography>
                    <Typography sx={{ fontSize: 10.5, fontWeight: 900, color: "#475569" }}>{Number(scope.budgetPercent ?? 0).toFixed(2)}%</Typography>
                  </Box>
                </Box>
              </Box>
            );
          }) : (
            <Box sx={{ p: 1.25, textAlign: "center", border: "1px dashed #CBD5E1", borderRadius: 1.5, bgcolor: "#F8FAFC" }}>
              <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: "#334155" }}>No scopes available</Typography>
              <Typography sx={{ mt: 0.35, fontSize: 9.5, color: "#64748B" }}>Add a scope to the project structure before planning sprint work.</Typography>
            </Box>
          )}
        </Stack>
      </Box>

      <Box sx={{ border: "1px solid #CBD5E1", borderRadius: 1.5, bgcolor: "#FFFFFF", overflow: "hidden" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} sx={{ px: 1.5, py: 0.8, borderBottom: "1px solid #E2E8F0" }}>
          <Box>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Box sx={{ width: 21, height: 21, display: "grid", placeItems: "center", borderRadius: "50%", bgcolor: "#0D9488", color: "#FFF", fontSize: 10, fontWeight: 900 }}>2</Box>
              <Typography sx={{ fontSize: 14, fontWeight: 900, color: "#0F172A" }}>Choose a task</Typography>
            </Stack>
            <Typography sx={{ mt: 0.25, color: "#64748B", fontSize: 9.5 }}>
              {selectedScope ? `Tasks inside ${selectedScope.name || "the selected scope"}` : "Select a scope first."}
            </Typography>
          </Box>
          {selectedScope && <Chip size="small" label={`${tasks.length} task${tasks.length === 1 ? "" : "s"}`} sx={{ height: 21, fontSize: 9, fontWeight: 800 }} />}
        </Stack>
        <Stack direction="row" spacing={1} sx={{ p: 1, overflowX: "auto" }}>
          {tasks.length ? tasks.map((task) => {
            const active = task.id === selectedTask?.id;
            const taskTitle = task.title || task.name || "Untitled Task";
            const taskCardWidth = Math.min(360, Math.max(180, 180 + Math.max(0, taskTitle.length - 20) * 5));
            return (
              <Box
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedTaskId(task.id);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-pressed={active}
                aria-label={`Select task ${task.title || task.name || "Untitled Task"}`}
                sx={{
                  flex: `0 0 ${taskCardWidth}px`,
                  p: 1,
                  borderRadius: 1.5,
                  cursor: "pointer",
                  bgcolor: active ? "#ECFDF5" : "#F7FFFC",
                  border: active ? "2px solid #5EEAD4" : "1px solid #A7F3D0",
                  boxShadow: active ? "0 3px 8px rgba(13, 148, 136, 0.11)" : "0 2px 5px rgba(15, 23, 42, 0.05)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
                  "&:hover": { transform: "translateY(-1px)", borderColor: "#5EEAD4", boxShadow: "0 4px 9px rgba(13, 148, 136, 0.10)" },
                }}
              >
                <Typography noWrap title={taskTitle} sx={{ fontSize: 12.5, fontWeight: 900, color: "#115E59" }}>
                  {taskTitle}
                </Typography>

                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.6 }}>
                  <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#64748B" }}>Progress</Typography>
                  <Typography sx={{ fontSize: 10.5, fontWeight: 900, color: "#0F766E" }}>{Number(task.progress ?? 0).toFixed(2)}%</Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, Math.max(0, Number(task.progress ?? 0)))}
                  sx={{ mt: 0.35, height: 4, borderRadius: 999, bgcolor: "#D1FAE5", "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: "#2DD4BF" } }}
                />

                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.6, px: 0.8, py: 0.45, borderRadius: 1, bgcolor: "#F0FDFA", border: "1px solid #99F6E4" }}>
                  <Typography noWrap sx={{ minWidth: 0, fontSize: 10.5, fontWeight: 900, color: "#0F766E" }}>{formatBudget(Number(task.budgetAllocated ?? 0))}</Typography>
                  <Box sx={{ px: 0.75, py: 0.2, borderRadius: 999, bgcolor: "#5EEAD4", color: "#115E59", fontSize: 9, fontWeight: 900 }}>
                    {Number(task.budgetPercent ?? 0).toFixed(1)}%
                  </Box>
                </Stack>
              </Box>
            );
          }) : (
            <Box sx={{ px: 1.25, py: 1, color: "#64748B" }}>
              <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: "#334155" }}>{selectedScope ? "No tasks in this scope" : "No scope selected"}</Typography>
              <Typography sx={{ mt: 0.25, fontSize: 9.5 }}>{selectedScope ? "Add a task to this scope to begin managing subtasks." : "Choose a scope from Step 1."}</Typography>
            </Box>
          )}
        </Stack>
      </Box>

      <Box sx={{ border: "1px solid #CBD5E1", borderRadius: 1.5, bgcolor: "#FFFFFF", overflow: "auto" }}>
        {selectedTask ? (
          <>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} gap={0.75} sx={{ px: 1.5, py: 1, borderBottom: "1px solid #E2E8F0", position: "sticky", top: 0, zIndex: 2, bgcolor: "#FFFFFF" }}>
              <Box>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Box sx={{ width: 21, height: 21, display: "grid", placeItems: "center", borderRadius: "50%", bgcolor: "#7C3AED", color: "#FFF", fontSize: 10, fontWeight: 900 }}>3</Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 900 }}>Manage subtasks</Typography>
                </Stack>
                <Typography sx={{ mt: 0.25, color: "#64748B", fontSize: 9.5 }}>Review work by status and move subtasks through the workflow.</Typography>
              </Box>
              <Chip
                label={`${selectedScope?.name || "Scope"} / ${selectedTask.title || selectedTask.name || "Task"}`}
                size="small"
                sx={{ maxWidth: "100%", height: 23, fontSize: 9.5, fontWeight: 800, bgcolor: "#F3E8FF", color: "#6D28D9", "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" } }}
              />
            </Stack>
            <Box sx={{ p: 1.5 }}>
              <KanbanBoard
                parentTaskId={selectedTask.id}
                columns={kanbanColumns}
                subtasks={subtasks}
                taskBudget={selectedTask.budgetAllocated ?? 0}
                projectId={projectId}
                onProgressSuccess={refreshKanban}
                allowCreateSubtask={false}
                compact
              />
            </Box>
          </>
        ) : (
          <Box sx={{ minHeight: 230, display: "grid", placeItems: "center", p: 3, textAlign: "center" }}>
            <Box>
              <Typography sx={{ color: "#334155", fontSize: 13, fontWeight: 900 }}>Select a task to view its sprint board</Typography>
              <Typography sx={{ mt: 0.4, color: "#64748B", fontSize: 10.5 }}>Choose a scope in Step 1, then a task in Step 2.</Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
