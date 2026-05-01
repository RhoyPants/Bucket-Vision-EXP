"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  ButtonGroup,
  Button,
  CircularProgress,
} from "@mui/material";
import ViewWeekIcon from "@mui/icons-material/ViewWeek";
import ViewAgendaIcon from "@mui/icons-material/ViewAgenda";

import Layout from "@/app/components/shared/Layout";
import ProjectSelector from "@/app/components/shared/selectors/ProjectSelector";
import CategorySelector from "@/app/components/shared/selectors/CategorySelector";
import TaskList from "@/app/(pages)/sprintManagement/Components/TaskList";
import KanbanBoard from "@/app/components/shared/kanban/KanbanBoard";
import TaskModal from "@/app/components/shared/modals/AddTaskModal";
import { useSearchParams } from "next/navigation";
import { setCurrentProject } from "@/app/redux/slices/projectSlice";

import { useAppDispatch, useAppSelector } from "@/app/redux/hook";

import { getProjects } from "@/app/redux/controllers/projectController";
import { loadKanbanByTask } from "@/app/redux/controllers/subTaskController";

import { setCurrentTask } from "@/app/redux/slices/taskSlice";
import { setCurrentCategory } from "@/app/redux/slices/categorySlice";
import { setCategories } from "@/app/redux/slices/categorySlice";
import { setTasks } from "@/app/redux/slices/taskSlice";

import SCurveChart from "@/app/components/shared/Scurved/SCurveChart";
import GridTableView from "./Components/GridTableView";
import { getProjectFull } from "@/app/redux/controllers/projectController";

type ViewMode = "grid" | "kanban";

function SprintManagementContent() {
  const dispatch = useAppDispatch();
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");

  const { currentProjectId } = useAppSelector((state) => state.project);
  const { currentCategoryId, categories } = useAppSelector(
    (state) => state.category,
  );
  const { tasks, currentTaskId } = useAppSelector((state) => state.task);
  const { subtasks } = useAppSelector((state) => state.kanban);

  const [openTaskModal, setOpenTaskModal] = useState(false);
  const [taskModalMode, setTaskModalMode] = useState<
    "create" | "view" | "edit"
  >("create");
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<any>(null);
  const [columns, setColumns] = useState<any[]>([]);
  const searchParams = useSearchParams();
  const projectIdFromUrl = searchParams.get("projectId");

  const currentCategory = categories.find((c) => c.id === currentCategoryId);
  const currentTask = tasks.find((t) => t.id === currentTaskId);

  // ========================================
  // 📌 FILTER TASKS BY CATEGORY (NO API CALL)
  // ========================================
  const filteredTasksForCategory = useMemo(() => {
    if (!currentCategoryId || !tasks) return [];
    return tasks
      .filter((task: any) => task.categoryId === currentCategoryId)
      .map((task: any) => ({
        id: task.id,
        title: task.title || task.name,
        priority: task.priority,
        progress: task.progress || 0,
        budgetAllocated: task.budgetAllocated || 0,
        budgetPercent: task.budgetPercent || 0,
      }));
  }, [currentCategoryId, tasks]);

  // ========================================
  // 📌 LOAD CASCADE: Project → Categories → Tasks → Subtasks
  // ========================================
  useEffect(() => {
    const loadInitial = async () => {
      // Step 1: Load projects
      const projects = await dispatch(getProjects());

      let projectId = projectIdFromUrl;
      if (!projectId && projects.length > 0) {
        projectId = projects[0].id;
      }
      if (!projectId) return;

      // Step 2: Set current project
      dispatch(setCurrentProject(projectId));
    };

    loadInitial();
  }, [dispatch, projectIdFromUrl]);

  // Step 3: Once project is set, load full project data (categories + tasks)
  useEffect(() => {
    if (!currentProjectId) return;

    const loadFullProject = async () => {
      const fullProjectData = await dispatch(getProjectFull(currentProjectId));

      if (!fullProjectData) return;

      // ✅ POPULATE REDUX STATE WITH FULL PROJECT DATA
      // Step 4A: Set all categories in Redux
      if (fullProjectData.categories?.length) {
        dispatch(setCategories(fullProjectData.categories));

        // Step 4B: Extract tasks from nested structure (categories.tasks)
        const allTasks: any[] = [];
        let firstCategoryId = fullProjectData.categories[0].id;
        let firstTaskId: string | null = null;

        fullProjectData.categories.forEach((category: any) => {
          if (category.tasks && Array.isArray(category.tasks)) {
            category.tasks.forEach((task: any) => {
              allTasks.push({
                ...task,
                categoryId: category.id, // 🔥 Ensure categoryId is set
              });
              // Remember first task from first category
              if (category.id === firstCategoryId && !firstTaskId) {
                firstTaskId = task.id;
              }
            });
          }
        });

        // Step 4C: Set all tasks in Redux
        if (allTasks.length > 0) {
          dispatch(setTasks(allTasks));
        }

        // Step 4D: Select first category and its first task
        dispatch(setCurrentCategory(firstCategoryId));
        if (firstTaskId) {
          dispatch(setCurrentTask(firstTaskId));
        }
      }
    };

    loadFullProject();
  }, [currentProjectId, dispatch]);

  // Step 6: Once task is set, load subtasks for Kanban
  useEffect(() => {
    if (!currentTaskId) return;

    const loadSubtasks = async () => {
      const kanban = await dispatch(loadKanbanByTask(currentTaskId));
      if (kanban) setColumns(kanban.columns);
    };

    loadSubtasks();
  }, [currentTaskId, dispatch]);

  // ========================================
  // 📌 WHEN CATEGORY CHANGES: Auto-select first task in new category
  // ========================================
  useEffect(() => {
    if (!currentCategoryId || filteredTasksForCategory.length === 0) {
      dispatch(setCurrentTask(null));
      return;
    }

    // Keep current task if it's in the new category
    const taskInCategory = filteredTasksForCategory.find(
      (t: any) => t.id === currentTaskId,
    );
    if (taskInCategory) return;

    // Otherwise, select first task in new category
    if (filteredTasksForCategory.length > 0) {
      dispatch(setCurrentTask(filteredTasksForCategory[0].id));
    }
  }, [currentCategoryId, filteredTasksForCategory, currentTaskId, dispatch]);

  const handleProgressSuccess = async () => {
    // ✅ Reload only subtasks for current task (don't reset project/category)
    if (currentTaskId) {
      const kanban = await dispatch(loadKanbanByTask(currentTaskId));
      if (kanban) setColumns(kanban.columns);
    }
  };

  const handleOpenTaskModal = (
    mode: "create" | "view" | "edit",
    task?: any,
  ) => {
    setTaskModalMode(mode);
    if (task) {
      setSelectedTaskForModal(task);
    } else {
      setSelectedTaskForModal(null);
    }
    setOpenTaskModal(true);
  };

  // 🔧 REFETCH CATEGORIES & TASKS AFTER MODAL CLOSES (to maintain order)
  const handleTaskModalClose = async () => {
    setOpenTaskModal(false);
    setSelectedTaskForModal(null);

    // Refetch full project data to ensure categories maintain sort order
    if (currentProjectId) {
      const fullProjectData = await dispatch(getProjectFull(currentProjectId));

      if (fullProjectData?.categories?.length) {
        dispatch(setCategories(fullProjectData.categories));

        // Re-extract tasks from updated nested structure
        const allTasks: any[] = [];
        fullProjectData.categories.forEach((category: any) => {
          if (category.tasks && Array.isArray(category.tasks)) {
            category.tasks.forEach((task: any) => {
              allTasks.push({
                ...task,
                categoryId: category.id,
              });
            });
          }
        });

        if (allTasks.length > 0) {
          dispatch(setTasks(allTasks));
        }
      }
    }
  };

  return (
    <Layout>
      <Box
        sx={{
          p: { xs: 1, sm: 1.5, md: 2, lg: 3 },
          maxWidth: "100%",
          mx: "auto",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <Stack
          spacing={{ xs: 2, sm: 2.5, md: 3 }}
          sx={{
            height: "100%",
            overflowY: "auto",
            overflowX: "hidden",
            scrollBehavior: "smooth",
            position: "relative",
            minWidth: 0,
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              background: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "#C8C2E8",
              borderRadius: "8px",
              transition: "all 0.3s ease",
              "&:hover": {
                background: "#b8acdb",
              },
            },
            "&:hover::-webkit-scrollbar-track": {
              background: "#EEF1F7",
              borderRadius: "2px",
            },
          }}
        >
          {/* 📌 PROJECT SELECTOR */}
          <Paper
            sx={{
              p: { xs: 1.5, sm: 2, md: 2.5 },
              borderRadius: 2,
              flexShrink: 0,
            }}
          >
            <ProjectSelector />
          </Paper>

          {/* 📌 VIEW TOGGLE */}
          <Box
            sx={{
              display: "flex",
              gap: { xs: 1, sm: 2 },
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: { xs: "12px", sm: "13px", md: "14px" },
                color: "#7D8693",
              }}
            >
              View:
            </Typography>
            <ButtonGroup variant="outlined" size="small">
              <Button
                onClick={() => setViewMode("kanban")}
                variant={viewMode === "kanban" ? "contained" : "outlined"}
                startIcon={<ViewWeekIcon />}
              >
                Kanban
              </Button>
              <Button
                onClick={() => setViewMode("grid")}
                variant={viewMode === "grid" ? "contained" : "outlined"}
                startIcon={<ViewAgendaIcon />}
              >
                Grid Table
              </Button>
            </ButtonGroup>
          </Box>

          {/* 📌 KANBAN VIEW */}
          {viewMode === "kanban" && (
            <>
              {/* 📌 S-CURVE */}
              <Paper
                sx={{
                  p: { xs: 1.5, sm: 2, md: 2.5, lg: 3 },
                  borderRadius: 2,
                  flexShrink: 0,
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight={600}
                  mb={2}
                  sx={{ fontSize: { xs: "1rem", md: "1.1rem" } }}
                >
                  Project Progress
                </Typography>
                <Box
                  sx={{
                    minHeight: {
                      xs: "250px",
                      sm: "300px",
                      md: "350px",
                      lg: "450px",
                    },
                    overflow: "auto",
                    width: "100%",
                  }}
                >
                  <SCurveChart projectId={currentProjectId} />
                </Box>
              </Paper>

              {/* 📌 TOP STACKED LAYOUT: CATEGORY + TASK HORIZONTAL SLIDER */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: { xs: 1.5, sm: 2, md: 2, lg: 2 },
                  flex: 1,
                  minHeight: 0,
                  minWidth: 0,
                }}
              >
                {/* TOP ROW: CATEGORY + TASK HORIZONTAL SCROLL */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: {
                      xs: "column",
                      md: "row",
                    },
                    gap: {
                      xs: 2,
                      md: 3,
                    },
                    alignItems: "stretch",
                    minWidth: 0,
                    mb: 3,
                  }}
                >
                  {/* CATEGORY KPI CARD */}
                  <Paper
                    elevation={0}
                    sx={{
                      flex: {
                        xs: "1 1 100%",
                        md: "0 0 auto",
                      },

                      width: {
                        xs: "100%",
                        md: 295,
                      },

                      minWidth: {
                        md: 295,
                      },

                      overflow: "visible",

                      borderRadius: 4,
                      p: 2,
                      flexShrink: 0,

                      background:
                        "linear-gradient(180deg,#ffffff 0%,#fafafe 100%)",

                      border: "1px solid #E4E7EC",

                      boxShadow: "0 4px 18px rgba(0,0,0,.06)",
                    }}
                  >
                    <CategorySelector
                      categories={categories}
                      currentCategoryId={currentCategoryId}
                      onChange={(id: string) =>
                        dispatch(setCurrentCategory(id))
                      }
                    />
                  </Paper>

                  {/* TASK HORIZONTAL STRIP */}
                  <Paper
                    elevation={0}
                    sx={{
                      flex: 1, // 🔥 simplify this (no need object)
                      width: 0, // ✅ CRITICAL FIX
                      minWidth: 0, // ✅ prevents overflow pushing
                      maxWidth: "100%",

                      borderRadius: 4,
                      p: { xs: 2, md: 2.5 },
                      border: "1px solid #E4E7EC",
                      background: "#fff",
                      boxShadow: "0 4px 18px rgba(0,0,0,.06)",
                      overflow: "hidden",
                    }}
                  >
                    {/* TASK LIST - Always-Visible Scrollbar */}
                    <TaskList
                      tasks={filteredTasksForCategory}
                      activeTaskId={currentTaskId}
                      onSelectTask={(taskId: string) => {
                        dispatch(setCurrentTask(taskId));
                      }}
                      onAddTask={() => handleOpenTaskModal("create")}
                      onViewTask={(task) => handleOpenTaskModal("view", task)}
                    />
                  </Paper>
                </Box>

                {/* BOTTOM: FULL WIDTH KANBAN BOARD */}
                <Paper
                  sx={{
                    flex: 1,
                    borderRadius: 2,
                    p: { xs: 1.5, sm: 2, md: 2.5, lg: 3 },
                    minHeight: {
                      xs: "300px",
                      sm: "400px",
                      md: "500px",
                      lg: "600px",
                    },
                    overflow: "auto",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* KANBAN BOARD COLUMNS */}
                  {currentTaskId && (
                    <Box sx={{ flex: 1, overflow: "auto" }}>
                      <KanbanBoard
                        parentTaskId={currentTaskId}
                        columns={columns}
                        subtasks={subtasks}
                        taskBudget={currentTask?.budgetAllocated || 0}
                        projectId={currentProjectId || ""}
                        onProgressSuccess={handleProgressSuccess}
                      />
                    </Box>
                  )}
                </Paper>
              </Box>
            </>
          )}

          {/* 📌 GRID VIEW */}
          {viewMode === "grid" && (
            <>
              <Paper sx={{ p: { xs: 2, md: 2.5, lg: 3 }, borderRadius: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} mb={2}>
                  Project Progress
                </Typography>

                <Box
                  sx={{
                    minHeight: { xs: "300px", md: "400px", lg: "450px" },
                    overflow: "auto",
                    mb: 3,
                  }}
                >
                  <SCurveChart projectId={currentProjectId} />
                </Box>
              </Paper>

              <Paper sx={{ p: { xs: 2, md: 2.5, lg: 3 }, borderRadius: 3 }}>
                <Box sx={{ overflow: "auto" }}>
                  <GridTableView projectId={currentProjectId} />
                </Box>
              </Paper>
            </>
          )}
        </Stack>
      </Box>

      {/* TASK MODAL */}
      {currentCategoryId && (
        <TaskModal
          open={openTaskModal}
          onClose={handleTaskModalClose}
          mode={taskModalMode}
          task={selectedTaskForModal}
          categoryId={currentCategoryId}
          categoryBudget={currentCategory?.budgetAllocated || 0}
        />
      )}
    </Layout>
  );
}

export default function SprintManagementPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <SprintManagementContent />
    </Suspense>
  );
}
