"use client";

import { useEffect, useState } from "react";
import { Box, Button } from "@mui/material";

import Layout from "@/app/components/shared/Layout";
import ProjectSelector from "@/app/components/shared/selectors/ProjectSelector";
import TaskSidebar from "@/app/(pages)/sprintManagement/Components/TaskSidebar";
import KanbanBoard from "@/app/components/shared/kanban/KanbanBoard";
import AddTaskModal from "@/app/components/shared/modals/ViewDetails";

import { useAppDispatch, useAppSelector } from "@/app/redux/hook";

import { getProjects } from "@/app/redux/controllers/projectController";
import { getTasksByProject } from "@/app/redux/controllers/taskController";
import { loadKanbanByTask } from "@/app/redux/controllers/subTaskController";

import { setCurrentTask } from "@/app/redux/slices/taskSlice";

export default function SprintManagementPage() {
  const dispatch = useAppDispatch();

  const { currentProjectId } = useAppSelector((state) => state.project);
  const { tasks, currentTaskId } = useAppSelector((state) => state.task);
  const { subtasks } = useAppSelector((state) => state.kanban);
  const [openTaskModal, setOpenTaskModal] = useState(false);

  const [columns, setColumns] = useState<any[]>([]);

  // 🔥 INITIAL LOAD
  useEffect(() => {
    const init = async () => {
      const projects = await dispatch(getProjects());

      if (projects.length > 0) {
        const firstProjectId = projects[0].id;

        const tasks = await dispatch(getTasksByProject(firstProjectId));

        if (tasks.length > 0) {
          const firstTaskId = tasks[0].id;

          dispatch(setCurrentTask(firstTaskId));

          const kanban = await dispatch(loadKanbanByTask(firstTaskId));
          if (kanban) setColumns(kanban.columns);
        }
      }
    };

    init();
  }, [dispatch]);

  // 🔥 WHEN PROJECT CHANGES
  useEffect(() => {
    if (!currentProjectId) return;

    const load = async () => {
      const tasks = await dispatch(getTasksByProject(currentProjectId));

      if (tasks.length > 0) {
        const firstTaskId = tasks[0].id;

        dispatch(setCurrentTask(firstTaskId));

        const kanban = await dispatch(loadKanbanByTask(firstTaskId));
        if (kanban) setColumns(kanban.columns);
      }
    };

    load();
  }, [currentProjectId, dispatch]);

  // 🔥 WHEN TASK CHANGES
  useEffect(() => {
    if (!currentTaskId) return;

    const load = async () => {
      const kanban = await dispatch(loadKanbanByTask(currentTaskId));
      if (kanban) setColumns(kanban.columns);
    };

    load();
  }, [currentTaskId, dispatch]);

  return (
    <Layout>
      <Box sx={{ p: 2 }}>
        {/* PROJECT SELECTOR */}
        <ProjectSelector />

        <Box sx={{ display: "flex", mt: 2 }}>
          {/* TASK LIST */}
          <TaskSidebar
            tasks={tasks}
            activeTaskId={currentTaskId}
            onSelectTask={(taskId: string) => {
              dispatch(setCurrentTask(taskId));
            }}
            onAddTask={() => setOpenTaskModal(true)}
          />

          {/* KANBAN */}
          <Box sx={{ flexGrow: 1, p: 2 }}>
            {currentTaskId && (
              <KanbanBoard
                parentTaskId={currentTaskId}
                columns={columns} // 🔥 FIXED
                subtasks={subtasks}
                onViewDetails={() => {}}
              />
            )}
          </Box>
        </Box>
      </Box>
      {currentProjectId && (
        <AddTaskModal
          open={openTaskModal}
          onClose={() => setOpenTaskModal(false)}
        />
      )}
    </Layout>
  );
}
