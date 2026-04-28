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
import GridTableView from "./Components/GridTableView";
import KanbanBoard from "@/app/components/shared/kanban/KanbanBoard";
import ProgressCalendarModal from "@/app/components/shared/modals/ProgressCalendarModal";

import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import {
  loadMyBoard,
  loadBoardFilterData,
  loadCategoriesForProject,
  loadTasksForCategory,
} from "@/app/redux/controllers/subTaskController";
import type { SubtaskCardData } from "@/app/api-service/myBoardService";

interface FilterState {
  searchQuery: string;
  projectId: string | null;
  categoryId: string | null;
  taskId: string | null;
}

export default function TaskBoardPage() {
  // ========================================
  // 🔥 REDUX HOOKS
  // ========================================
  const dispatch = useAppDispatch();
  const subtasks = useAppSelector((state) => {
    const kanbanSubtasks = state.kanban.subtasks || [];
    // Map KanbanSubtask to SubtaskCardData if needed
    return kanbanSubtasks as any as SubtaskCardData[];
  });
  const boardFilters = useAppSelector((state) => state.kanban.boardFilters);
  
  // ✅ Ensure arrays are always defined
  const projects = (boardFilters?.projects || []) as any[];
  const categories = (boardFilters?.categories || []) as any[];
  const tasks = (boardFilters?.tasks || []) as any[];

  // ========================================
  // 🔥 LOCAL STATE
  // ========================================
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "kanban">("grid");
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: "",
    projectId: null,
    categoryId: null,
    taskId: null,
  });

  // Progress Modal State
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [selectedSubtask, setSelectedSubtask] = useState<SubtaskCardData | null>(null);

  // ========================================
  // 🔥 INITIAL LOAD - Fetch filters dropdown data
  // ========================================
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError("");

      try {
        // ✅ Load filter dropdown data (projects, categories, tasks)
        await dispatch(loadBoardFilterData());
        // ✅ Load initial subtasks (no filters yet)
        await dispatch(loadMyBoard());
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
  }, [dispatch]);

  // ========================================
  // 🔥 WHEN FILTERS CHANGE - RELOAD SUBTASKS FROM BACKEND
  // ========================================
  useEffect(() => {
    if (loading) return; // Skip if still loading initial data

    // Only reload if filters changed (after initial load)
    const reloadBoard = async () => {
      try {
        await dispatch(
          loadMyBoard({
            projectId: filters.projectId || undefined,
            categoryId: filters.categoryId || undefined,
            taskId: filters.taskId || undefined,
            search: filters.searchQuery || undefined,
          })
        );
      } catch (err: any) {
        console.error("Error reloading board with filters:", err);
      }
    };

    reloadBoard();
  }, [filters.projectId, filters.categoryId, filters.taskId, filters.searchQuery, dispatch, loading]);

  // ========================================
  // 🔥 LOAD CATEGORIES WHEN PROJECT CHANGES
  // ========================================
  useEffect(() => {
    if (!filters.projectId) {
      return;
    }

    const loadCategories = async () => {
      try {
        await dispatch(loadCategoriesForProject(filters.projectId!));
        setFilters((prev) => ({
          ...prev,
          categoryId: null,
          taskId: null,
        }));
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || "Failed to load categories";
        console.error("Error loading categories:", errorMessage);
      }
    };

    loadCategories();
  }, [filters.projectId, dispatch]);

  // ========================================
  // 🔥 LOAD TASKS WHEN CATEGORY CHANGES
  // ========================================
  useEffect(() => {
    if (!filters.categoryId) {
      return;
    }

    const loadTasks = async () => {
      try {
        await dispatch(loadTasksForCategory(filters.categoryId!));
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
  }, [filters.categoryId, dispatch]);

  // ========================================
  // 🔥 HANDLE PROJECT CHANGE - Clear subcategories
  // ========================================
  const handleFilterChange = useCallback((newFilters: FilterState) => {
    // If project changed, clear category and task
    if (newFilters.projectId !== filters.projectId) {
      newFilters.categoryId = null;
      newFilters.taskId = null;
    }
    // If category changed, clear task
    else if (newFilters.categoryId !== filters.categoryId) {
      newFilters.taskId = null;
    }
    
    setFilters(newFilters);
  }, [filters]);

  // ========================================
  // 🔥 FILTERED SUBTASKS (Backend filtered already)
  // ========================================
  const filteredSubtasks = useMemo(
    () => {
      // ✅ Subtasks are already filtered by backend
      // Just ensure they're in the correct format
      return subtasks && Array.isArray(subtasks) ? subtasks : [];
    },
    [subtasks]
  );

  // ========================================
  // 🔥 KANBAN COLUMNS COMPUTATION
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
  // 🔥 TYPE GUARD FOR FILTERED SUBTASKS
  // ========================================
  const safeFilteredSubtasks = useMemo(
    () =>
      filteredSubtasks.filter((sub) => sub && typeof sub === 'object'),
    [filteredSubtasks]
  );

  // ========================================
  // 🔥 HANDLERS
  // ========================================
  const handleUpdateProgress = useCallback((subtask: SubtaskCardData) => {
    setSelectedSubtask(subtask);
    setProgressModalOpen(true);
  }, []);

  const handleProgressModalClose = () => {
    setProgressModalOpen(false);
    setSelectedSubtask(null);
  };

  const handleProgressSuccess = useCallback(() => {
    // ✅ Reload the board WITHOUT filters to get a fresh complete list
    // AND refresh filter dropdowns to ensure consistency
    const reloadBoard = async () => {
      try {
        // 🔥 CRITICAL: Reload subtasks AND filter data for consistency
        await Promise.all([
          dispatch(loadMyBoard()), // No filters - get ALL assigned from backend
          dispatch(loadBoardFilterData()), // Refresh projects/categories/tasks dropdowns
        ]);
      } catch (err) {
        console.error("Error reloading board:", err);
      }
    };

    reloadBoard();
  }, [dispatch]);

  // ========================================
  // 🔥 RENDER
  // ========================================
  return (
    <Layout>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Page Header */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            sx={{
              fontSize: "28px",
              fontWeight: 700,
              color: "#1D1F26",
              mb: 0.5,
            }}
          >
            📋 My Task Board
          </Typography>
          <Typography
            sx={{
              fontSize: "14px",
              color: "#7D8693",
              fontWeight: 500,
            }}
          >
            Manage and track your assigned subtasks
          </Typography>
        </Box>

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
          categories={
            (filters.projectId
              ? categories
              : categories.filter(
                  (cat) =>
                    subtasks.some(
                      (sub) => sub?.category?.id === cat.id
                    )
                )
            )
              .filter((c: any) => c) // Remove nulls
              .map((c: any) => ({
                id: c.id || c.ID || "",
                name: c.name || c.categoryName || "Unknown Category",
              }))
          }
          tasks={
            (filters.categoryId
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
              {filteredSubtasks.length} of {subtasks.length} tasks
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
          <GridTableView
            subtasks={safeFilteredSubtasks}
            onUpdateProgress={handleUpdateProgress}
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
