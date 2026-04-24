"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box,
  Container,
  Grid,
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
import SubtaskCard from "./components/SubtaskCard";
import TaskBoardFilters from "./components/TaskBoardFilters";
import ProgressUpdateModal from "./components/ProgressUpdateModal";
import KanbanBoard from "@/app/components/shared/kanban/KanbanBoard";

import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import {
  loadMyBoard,
  loadBoardFilterData,
  loadCategoriesForProject,
  loadTasksForCategory,
} from "@/app/redux/controllers/subTaskController";
import { filterSubtasks, type SubtaskCardData } from "@/app/api-service/myBoardService";

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
  const subtasks = useAppSelector((state) => state.kanban.subtasks) as SubtaskCardData[];
  const { projects, categories, tasks } = useAppSelector(
    (state) => state.kanban.boardFilters,
  );

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

  // Modal State
  const [progressModal, setProgressModal] = useState<{
    open: boolean;
    subtaskId?: string;
    subtaskTitle?: string;
    currentProgress?: number;
  }>({
    open: false,
  });

  // ========================================
  // 🔥 INITIAL LOAD - Fetch board and filters
  // ========================================
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError("");

      try {
        // ✅ Load user's subtasks and filter data in parallel
        await Promise.all([
          dispatch(loadMyBoard()),
          dispatch(loadBoardFilterData()),
        ]);
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
  // 🔥 LOAD CATEGORIES WHEN PROJECT CHANGES
  // ========================================
  useEffect(() => {
    if (!filters.projectId) {
      return;
    }

    const loadCategories = async () => {
      try {
        await dispatch(loadCategoriesForProject(filters.projectId));
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
        await dispatch(loadTasksForCategory(filters.categoryId));
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
    setFilters(newFilters);
  }, []);

  // ========================================
  // 🔥 FILTER SUBTASKS
  // ========================================
  const filteredSubtasks = filterSubtasks(subtasks, {
    search: filters.searchQuery,
    projectId: filters.projectId || undefined,
    categoryId: filters.categoryId || undefined,
    taskId: filters.taskId || undefined,
  });

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
  // 🔥 HANDLERS
  // ========================================
  const handleUpdateProgress = useCallback(
    (subtask: SubtaskCardData) => {
      setProgressModal({
        open: true,
        subtaskId: subtask.id,
        subtaskTitle: subtask.title,
        currentProgress: subtask.progress,
      });
    },
    [],
  );

  const handleViewDetails = useCallback((subtaskId: string) => {
    // TODO: Implement view details page/modal in next iteration
  }, []);

  const handleProgressModalClose = () => {
    setProgressModal({ open: false });
  };

  const handleProgressSuccess = useCallback(() => {
    // ✅ Reload the board WITHOUT filters to get all assigned subtasks
    // (filtering happens on client side)
    const reloadBoard = async () => {
      try {
        await dispatch(loadMyBoard()); // No filters - get ALL assigned
        // 🔥 CLEAR ALL FILTERS to show all assigned subtasks fresh
        setFilters({
          searchQuery: "",
          projectId: null,
          categoryId: null,
          taskId: null,
        });
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
          projects={projects}
          categories={categories.filter(
            (cat) =>
              !filters.projectId ||
              subtasks.some(
                (sub) =>
                  sub.category.id === cat.id &&
                  sub.project.id === filters.projectId,
              ),
          )}
          tasks={tasks}
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
        {!loading && filteredSubtasks.length === 0 && (
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

        {/* Grid View */}
        {!loading && filteredSubtasks.length > 0 && viewMode === "grid" && (
          <Grid container spacing={2.5}>
            {filteredSubtasks.map((subtask) => (
              <Grid item xs={12} sm={6} lg={4} key={subtask.id}>
                <SubtaskCard
                  id={subtask.id}
                  title={subtask.title}
                  status={subtask.status}
                  progress={subtask.progress}
                  priority={subtask.priority}
                  task={subtask.task}
                  category={subtask.category}
                  project={subtask.project}
                  onUpdateProgress={() => handleUpdateProgress(subtask)}
                  onViewDetails={handleViewDetails}
                />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Kanban View */}
        {!loading && filteredSubtasks.length > 0 && viewMode === "kanban" && (
          <Box sx={{ background: "#F7F8FA", borderRadius: "12px", p: 2 }}>
            <KanbanBoard
              parentTaskId={null}
              columns={kanbanColumns}
              subtasks={filteredSubtasks as any[]}
              onViewDetails={handleViewDetails}
              onProgressSuccess={handleProgressSuccess}
              showHierarchy={true}
            />
          </Box>
        )}
      </Container>

      {/* Progress Update Modal */}
      <ProgressUpdateModal
        open={progressModal.open}
        onClose={handleProgressModalClose}
        subtaskId={progressModal.subtaskId || ""}
        subtaskTitle={progressModal.subtaskTitle || ""}
        currentProgress={progressModal.currentProgress || 0}
        onSuccess={handleProgressSuccess}
      />
    </Layout>
  );
}
