"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  ButtonGroup,
  Button,
} from "@mui/material";
import ViewWeekIcon from "@mui/icons-material/ViewWeek";
import ViewAgendaIcon from "@mui/icons-material/ViewAgenda";

import Layout from "@/app/components/shared/Layout";
import ProjectSelector from "@/app/components/shared/selectors/ProjectSelector";
import CategorySelector from "@/app/components/shared/selectors/CategorySelector";
import TaskSidebar from "@/app/(pages)/sprintManagement/Components/TaskSidebar";
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

export default function SprintManagementPage() {
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
      const fullProjectData = await dispatch(
        getProjectFull(currentProjectId)
      );

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
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={3}>
          {/* 📌 PROJECT SELECTOR */}
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <ProjectSelector />
          </Paper>

          {/* 📌 VIEW TOGGLE */}
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Typography
              sx={{ fontWeight: 600, fontSize: "14px", color: "#7D8693" }}
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
              <Paper sx={{ p: 2, borderRadius: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} mb={1}>
                  Project Progress
                </Typography>

                <SCurveChart projectId={currentProjectId} />
              </Paper>

              {/* 📌 CATEGORY */}
              <Paper sx={{ p: 2, borderRadius: 3 }}>
                <CategorySelector
                  categories={categories}
                  currentCategoryId={currentCategoryId}
                  onChange={(id: string) => dispatch(setCurrentCategory(id))}
                />
              </Paper>

              {/* 📌 MAIN BOARD */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  gap: 2,
                }}
              >
                {/* TASK SIDEBAR */}
                <Paper
                  sx={{
                    width: { xs: "100%", md: 280 },
                    borderRadius: 3,
                    p: 1,
                  }}
                >
                  <TaskSidebar
                    tasks={filteredTasksForCategory}
                    activeTaskId={currentTaskId}
                    onSelectTask={(taskId: string) => {
                      dispatch(setCurrentTask(taskId));
                    }}
                    onAddTask={() => handleOpenTaskModal("create")}
                    onViewTask={(task) => handleOpenTaskModal("view", task)}
                  />
                </Paper>

                {/* KANBAN BOARD */}
                <Paper
                  sx={{
                    flexGrow: 1,
                    borderRadius: 3,
                    p: 2,
                    minHeight: 400,
                  }}
                >
                  {currentTaskId && (
                    <KanbanBoard
                      parentTaskId={currentTaskId}
                      columns={columns}
                      subtasks={subtasks}
                      taskBudget={currentTask?.budgetAllocated || 0}
                      projectId={currentProjectId || ""}
                    />
                  )}
                </Paper>
              </Box>
            </>
          )}

          {/* 📌 GRID VIEW */}
          {viewMode === "grid" && (
            <Paper sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>
                Project Progress
              </Typography>

              <SCurveChart projectId={currentProjectId} />
              <GridTableView projectId={currentProjectId} />
            </Paper>
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
