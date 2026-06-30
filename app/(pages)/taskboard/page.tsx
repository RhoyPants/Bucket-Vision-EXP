"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box,
  Container,
  CircularProgress,
  Typography,
  Alert,
  Paper,
  ButtonGroup,
  Button,
} from "@mui/material";
import ViewWeekIcon from "@mui/icons-material/ViewWeek";
import ViewAgendaIcon from "@mui/icons-material/ViewAgenda";

import Layout from "@/app/components/shared/Layout";
import TaskBoardFilters from "./Components/TaskBoardFilters";
import BoardCardGrid from "./Components/BoardCardGrid";
import KanbanBoard from "@/app/components/shared/kanban/KanbanBoard";
import ProgressCalendarModal from "@/app/components/shared/modals/ProgressCalendarModal";

import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import {
  loadMyBoard,
  loadMyBoardItem,
  loadBoardFilterData,
  loadScopesForProject,
  loadTasksForScope,
} from "@/app/redux/controllers/subTaskController";
import type { SubtaskCardData } from "@/app/api-service/myBoardService";

interface FilterState {
  searchQuery: string;
  projectId: string | null;
  scopeId: string | null;
  taskId: string | null;
}

export default function TaskBoardPage() {
  // ========================================
  // Ã°Å¸â€Â¥ REDUX HOOKS
  // ========================================
  const dispatch = useAppDispatch();
  const subtasks = useAppSelector((state) => {
    const kanbanSubtasks = state.kanban.subtasks || [];
    // Map KanbanSubtask to SubtaskCardData if needed
    return kanbanSubtasks as any as SubtaskCardData[];
  });
  const boardFilters = useAppSelector((state) => state.kanban.boardFilters);
  
  // Ã¢Å“â€¦ Ensure arrays are always defined
  const projects = (boardFilters?.projects || []) as any[];
  const scopes = (boardFilters?.scopes || []) as any[];
  const tasks = (boardFilters?.tasks || []) as any[];

  // ========================================
  // Ã°Å¸â€Â¥ LOCAL STATE
  // ========================================
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "kanban">("grid");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: "",
    projectId: null,
    scopeId: null,
    taskId: null,
  });

  // Progress Modal State
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [selectedSubtask, setSelectedSubtask] = useState<SubtaskCardData | null>(null);

  // ========================================
  // Ã°Å¸â€Â¥ INITIAL LOAD - Fetch filters dropdown data
  // ========================================
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError("");

      try {
        // Ã¢Å“â€¦ Load filter dropdown data (projects, scopes, tasks)
        await dispatch(loadBoardFilterData());
        // Ã¢Å“â€¦ Load initial subtasks (no filters yet)
        const boardResponse = await dispatch(
          loadMyBoard({
            page: 1,
            limit: pagination.limit,
          }) as any
        );
        setPagination((prev) => ({
          ...prev,
          total: boardResponse?.total ?? 0,
          totalPages: boardResponse?.totalPages ?? 1,
          page: boardResponse?.page ?? 1,
        }));
      } catch (err: any) {
        console.error("Error loading board:", err);
        setError(
          err?.response?.data?.message || "Failed to load your task board",
        );
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [dispatch, pagination.limit]);

  // ========================================
  // Ã°Å¸â€Â¥ WHEN FILTERS CHANGE - RELOAD SUBTASKS FROM BACKEND
  // ========================================
  useEffect(() => {
    if (loading) return; // Skip if still loading initial data

    // Only reload if filters changed (after initial load)
    const reloadBoard = async () => {
      try {
        const boardResponse = await dispatch(
          loadMyBoard({
            projectId: filters.projectId || undefined,
            scopeId: filters.scopeId || undefined,
            taskId: filters.taskId || undefined,
            search: filters.searchQuery || undefined,
            page: pagination.page,
            limit: pagination.limit,
          }) as any
        );
        setPagination((prev) => ({
          ...prev,
          total: boardResponse?.total ?? 0,
          totalPages: boardResponse?.totalPages ?? 1,
          page: boardResponse?.page ?? prev.page,
        }));
      } catch (err: any) {
        console.error("Error reloading board with filters:", err);
      }
    };

    reloadBoard();
  }, [filters.projectId, filters.scopeId, filters.taskId, filters.searchQuery, pagination.page, pagination.limit, dispatch, loading]);

  // ========================================
  // Ã°Å¸â€Â¥ LOAD scopes WHEN PROJECT CHANGES
  // ========================================
  useEffect(() => {
    if (!filters.projectId) {
      return;
    }

    const loadCategories = async () => {
      try {
        await dispatch(loadScopesForProject(filters.projectId!));
        setFilters((prev) => ({
          ...prev,
          scopeId: null,
          taskId: null,
        }));
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || "Failed to load scopes";
        console.error("Error loading scopes:", errorMessage);
      }
    };

    loadCategories();
  }, [filters.projectId, dispatch]);

  // ========================================
  // Ã°Å¸â€Â¥ LOAD TASKS WHEN Scope CHANGES
  // ========================================
  useEffect(() => {
    if (!filters.scopeId) {
      return;
    }

    const loadTasks = async () => {
      try {
        await dispatch(loadTasksForScope(filters.scopeId!));
        setFilters((prev) => ({
          ...prev,
          taskId: null,
        }));
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || "Failed to load tasks";
        console.error("Error loading tasks:", errorMessage);
      }
    };

    loadTasks();
  }, [filters.scopeId, dispatch]);

  // ========================================
  // Ã°Å¸â€Â¥ HANDLE PROJECT CHANGE - Clear subcategories
  // ========================================
  const handleFilterChange = useCallback((newFilters: FilterState) => {
    // If project changed, clear Scope and task
    if (newFilters.projectId !== filters.projectId) {
      newFilters.scopeId = null;
      newFilters.taskId = null;
    }
    // If Scope changed, clear task
    else if (newFilters.scopeId !== filters.scopeId) {
      newFilters.taskId = null;
    }
    
    setPagination((prev) => ({ ...prev, page: 1 }));
    setFilters(newFilters);
  }, [filters]);

  // ========================================
  // Ã°Å¸â€Â¥ FILTERED SUBTASKS (Backend filtered already)
  // ========================================
  const filteredSubtasks = useMemo(
    () => {
      // Ã¢Å“â€¦ Subtasks are already filtered by backend
      // Just ensure they're in the correct format
      return subtasks && Array.isArray(subtasks) ? subtasks : [];
    },
    [subtasks]
  );

  // ========================================
  // Ã°Å¸â€Â¥ KANBAN COLUMNS COMPUTATION
  // ========================================
  const kanbanColumns = useMemo(
    () => [
      { id: 0, title: "Not Started" },
      { id: 1, title: "In Progress" },
      { id: 2, title: "Completed" },
    ],
    []
  );

  // ========================================
  // Ã°Å¸â€Â¥ TYPE GUARD FOR FILTERED SUBTASKS
  // ========================================
  const safeFilteredSubtasks = useMemo(
    () =>
      filteredSubtasks.filter((sub) => sub && typeof sub === 'object'),
    [filteredSubtasks]
  );

  // ========================================
  // Ã°Å¸â€Â¥ HANDLERS
  // ========================================
  const handleUpdateProgress = useCallback(async (subtask: SubtaskCardData) => {
    setActionLoadingId(subtask.id);
    setError("");

    try {
      const detailedSubtask = await dispatch(loadMyBoardItem(subtask.id) as any);
      setSelectedSubtask(detailedSubtask || subtask);
      setProgressModalOpen(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load task details");
    } finally {
      setActionLoadingId(null);
    }
  }, [dispatch]);

  const handleProgressModalClose = () => {
    setProgressModalOpen(false);
    setSelectedSubtask(null);
  };

  const handleProgressSuccess = useCallback(() => {
    // Ã¢Å“â€¦ Reload the board WITHOUT filters to get a fresh complete list
    // AND refresh filter dropdowns to ensure consistency
    const reloadBoard = async () => {
      try {
        // Ã°Å¸â€Â¥ CRITICAL: Reload subtasks AND filter data for consistency
        const boardResponse = await dispatch(
          loadMyBoard({
            projectId: filters.projectId || undefined,
            scopeId: filters.scopeId || undefined,
            taskId: filters.taskId || undefined,
            search: filters.searchQuery || undefined,
            page: pagination.page,
            limit: pagination.limit,
          }) as any
        );
        await dispatch(loadBoardFilterData() as any);
        setPagination((prev) => ({
          ...prev,
          total: boardResponse?.total ?? 0,
          totalPages: boardResponse?.totalPages ?? 1,
          page: boardResponse?.page ?? prev.page,
        }));
      } catch (err) {
        console.error("Error reloading board:", err);
      }
    };

    reloadBoard();
  }, [dispatch, filters.projectId, filters.scopeId, filters.taskId, filters.searchQuery, pagination.page, pagination.limit]);

  const handlePageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  // ========================================
  // Ã°Å¸â€Â¥ RENDER
  // ========================================
  return (
    <Layout>
      <Container maxWidth="xl" sx={{ py: 3 }}>
      

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <TaskBoardFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          projects={
            projects && Array.isArray(projects) && projects.length > 0
              ? projects.map((p: any) => ({
                  id: p.id || p.ID || "",
                  name: p.name || p.projectName || p.title || "Unknown Project",
                }))
              : []
          }
          scopes={
            (filters.projectId
              ? scopes
              : scopes.filter(
                  (cat) =>
                    subtasks.some(
                      (sub) => sub?.scope?.id === cat.id
                    )
                )
            )
              .filter((c: any) => c) // Remove nulls
              .map((c: any) => ({
                id: c.id || c.ID || "",
                name: c.name || c.scopeName || "Unknown Scope",
              }))
          }
          tasks={
            (filters.scopeId
              ? tasks
              : []
            )
              .filter((t: any) => t) // Remove nulls
              .map((t: any) => ({
                id: t.id || t.ID || "",
                name: t.name || t.taskName || t.title || "Unknown Task",
              }))
          }
          isLoading={loading}
        />

        {/* View Toggle */}
        <Box sx={{ mb: 2.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography
              sx={{
                fontSize: "12px",
                color: "#7D8693",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              {safeFilteredSubtasks.length} shown of {pagination.total || subtasks.length} tasks
            </Typography>
          </Box>

          <ButtonGroup size="small" variant="outlined">
            <Button
              onClick={() => setViewMode("grid")}
              startIcon={<ViewWeekIcon />}
              variant={viewMode === "grid" ? "contained" : "outlined"}
              sx={{
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Grid
            </Button>
            <Button
              onClick={() => setViewMode("kanban")}
              startIcon={<ViewAgendaIcon />}
              variant={viewMode === "kanban" ? "contained" : "outlined"}
              sx={{
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Kanban
            </Button>
          </ButtonGroup>
        </Box>

        {/* Loading State */}
        {loading && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "400px",
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography color="textSecondary">
                Loading your task board...
              </Typography>
            </Box>
          </Box>
        )}

        {/* Empty State */}
        {!loading && safeFilteredSubtasks.length === 0 && (
          <Paper
            sx={{
              p: 4,
              textAlign: "center",
              background: "#F7F8FA",
              border: "2px dashed #DDE1E8",
              borderRadius: "12px",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: "#7D8693",
                fontWeight: 600,
                mb: 1,
              }}
            >
              {subtasks.length === 0
                ? "No tasks assigned yet"
                : "No tasks match your filters"}
            </Typography>
            <Typography
              sx={{
                color: "#A5ADB8",
                fontSize: "14px",
              }}
            >
              {subtasks.length === 0
                ? "Check back soon for new assignments"
                : "Try adjusting your filters to find more tasks"}
            </Typography>
          </Paper>
        )}

        {/* Grid View - Table */}
        {!loading && safeFilteredSubtasks.length > 0 && viewMode === "grid" && (
          <BoardCardGrid
            subtasks={safeFilteredSubtasks}
            onUpdateProgress={handleUpdateProgress}
            actionLoadingId={actionLoadingId}
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            onPageChange={handlePageChange}
          />
        )}

        {/* Kanban View */}
        {!loading && safeFilteredSubtasks.length > 0 && viewMode === "kanban" && (
          <Box sx={{ background: "#F7F8FA", borderRadius: "12px", p: 2 }}>
            <KanbanBoard
              parentTaskId={null}
              columns={kanbanColumns}
              subtasks={safeFilteredSubtasks as any[]}
              onProgressSuccess={handleProgressSuccess}
              showHierarchy={true}
            />
          </Box>
        )}
      </Container>

      {/* Progress Calendar Modal */}
      {selectedSubtask && (
        <ProgressCalendarModal
          open={progressModalOpen}
          onClose={handleProgressModalClose}
          subtaskId={selectedSubtask.id}
          onSuccess={handleProgressSuccess}
          isTaskBoard={true}
          expectedStart={selectedSubtask.projectedStartDate}
          expectedEnd={selectedSubtask.projectedEndDate}
        />
      )}
    </Layout>
  );
}
