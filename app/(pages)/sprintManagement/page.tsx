"use client";

import { useEffect, useState } from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";

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
import { getCategoriesByProject } from "@/app/redux/controllers/categoryController";
import { getTasksByCategory } from "@/app/redux/controllers/taskController";
import { loadKanbanByTask } from "@/app/redux/controllers/subTaskController";

import { setCurrentTask } from "@/app/redux/slices/taskSlice";
import { setCurrentCategory } from "@/app/redux/slices/categorySlice";

import SCurveChart from "@/app/components/shared/Scurved/SCurveChart";

export default function SprintManagementPage() {
  const dispatch = useAppDispatch();

  const { currentProjectId } = useAppSelector((state) => state.project);
  const { currentCategoryId, categories } = useAppSelector(
    (state) => state.category,
  );
  const { tasks, currentTaskId } = useAppSelector((state) => state.task);
  const { subtasks } = useAppSelector((state) => state.kanban);

  const [openTaskModal, setOpenTaskModal] = useState(false);
  const [taskModalMode, setTaskModalMode] = useState<"create" | "view" | "edit">("create");
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<any>(null);
  const [columns, setColumns] = useState<any[]>([]);
  const searchParams = useSearchParams();
  const projectIdFromUrl = searchParams.get("projectId");

  // Get current category for budget
  const currentCategory = categories.find((c) => c.id === currentCategoryId);
  const currentTask = tasks.find((t) => t.id === currentTaskId);

  // ========================================
  // 🔥 INITIAL LOAD
  // ========================================
  useEffect(() => {
    const init = async () => {
      const projects = await dispatch(getProjects());

      let projectId = projectIdFromUrl;

      // fallback if no URL param
      if (!projectId && projects.length > 0) {
        projectId = projects[0].id;
      }

      if (!projectId) return;

      // 🔥 SET CURRENT PROJECT
      dispatch(setCurrentProject(projectId));

      const categories = await dispatch(getCategoriesByProject(projectId));

      if (categories.length > 0) {
        const categoryId = categories[0].id;

        dispatch(setCurrentCategory(categoryId));

        const tasks = await dispatch(getTasksByCategory(categoryId));

        if (tasks.length > 0) {
          const taskId = tasks[0].id;
          dispatch(setCurrentTask(taskId));
        }
      }
    };

    init();
  }, [dispatch, projectIdFromUrl]);

  // PROJECT → CATEGORY
  useEffect(() => {
    if (!currentProjectId) return;

    const load = async () => {
      const categories = await dispatch(
        getCategoriesByProject(currentProjectId),
      );

      if (categories.length > 0) {
        dispatch(setCurrentCategory(categories[0].id));
      }
    };

    load();
  }, [currentProjectId, dispatch]);

  // CATEGORY → TASK
  useEffect(() => {
    if (!currentCategoryId) return;

    const load = async () => {
      const tasks = await dispatch(getTasksByCategory(currentCategoryId));

      if (tasks.length > 0) {
        dispatch(setCurrentTask(tasks[0].id));
      }
    };

    load();
  }, [currentCategoryId, dispatch]);

  // TASK → KANBAN
  useEffect(() => {
    if (!currentTaskId) return;

    const load = async () => {
      const kanban = await dispatch(loadKanbanByTask(currentTaskId));

      if (kanban) setColumns(kanban.columns);
    };

    load();
  }, [currentTaskId, dispatch]);

  const handleOpenTaskModal = (mode: "create" | "view" | "edit", task?: any) => {
    setTaskModalMode(mode);
    if (task) {
      setSelectedTaskForModal(task);
    } else {
      setSelectedTaskForModal(null);
    }
    setOpenTaskModal(true);
  };

  return (
    <Layout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={3}>
          {/* 🔥 PROJECT SELECTOR */}
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <ProjectSelector />
          </Paper>

          {/* 🔥 S-CURVE */}
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
              Project Progress
            </Typography>

            <SCurveChart projectId={currentProjectId} />
          </Paper>

          {/* 🔥 CATEGORY */}
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <CategorySelector
              categories={categories}
              currentCategoryId={currentCategoryId}
              onChange={(id: string) => dispatch(setCurrentCategory(id))}
            />
          </Paper>

          {/* 🔥 MAIN BOARD */}
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
                tasks={tasks}
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
                  onViewDetails={() => {}}
                  taskBudget={currentTask?.budgetAllocated || 0}
                  projectId={currentProjectId || ""}
                />
              )}
            </Paper>
          </Box>
        </Stack>
      </Box>

      {/* TASK MODAL */}
      {currentCategoryId && (
        <TaskModal
          open={openTaskModal}
          onClose={() => {
            setOpenTaskModal(false);
            setSelectedTaskForModal(null);
          }}
          mode={taskModalMode}
          task={selectedTaskForModal}
          categoryId={currentCategoryId}
          categoryBudget={currentCategory?.budgetAllocated || 0}
        />
      )}
    </Layout>
  );
}
