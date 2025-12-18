// app/(pages)/sprint/page.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import Layout from "@/app/components/shared/Layout";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";

import SummaryBar from "@/app/components/shared/SummaryBar";
import SprintHeader from "./Components/SprintHeader";

import { getAllProjects } from "@/app/redux/controllers/projectController";
import { getTasksByProject } from "@/app/redux/controllers/taskController";
import {
  selectTasks,
  selectTaskTabs,
  selectSubtasks,
  selectProjects,
  selectCurrentProject,
} from "@/app/redux/selector";

import TaskSidebar from "./Components/TaskSidebar";
import { Box } from "@mui/material";
import {
  createSubtask,
  getSubtasksByTask,
  updateSubtask,
} from "@/app/redux/controllers/subTaskController";
import KanbanBoard from "@/app/components/shared/kanban/KanbanBoard";
import TaskModal from "@/app/components/shared/modals/TaskModal";
import { KanbanSubtask, setSubtasks } from "@/app/redux/slices/kanbanSlice";
import { setCurrentProject } from "@/app/redux/slices/projectSlice";

export default function SprintPage() {
  const dispatch = useAppDispatch();

  const tasks = useAppSelector(selectTasks);
  const taskTabs = useAppSelector(selectTaskTabs);
  const subtasks = useAppSelector(selectSubtasks);
  const projects = useAppSelector(selectProjects);
  const currentProject = useAppSelector(selectCurrentProject);

  const [openViewModal, setOpenViewModal] = useState(false);
  const [selectedSubtask, setSelectedSubtask] = useState<KanbanSubtask | null>(
    null
  );

  const [openModal, setOpenModal] = useState(false); // task modal
  const [openSubtaskModal, setOpenSubtaskModal] = useState(false); // NEW

  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const activeTask = tasks.find((t) => t.task_id === activeTaskId) || null;

  const hasLoaded = useRef(false);

  const normalizeForUpdate = (st: KanbanSubtask) => ({
    subtask_id: Number(st.id),
    task_name: st.title,
    description: st.description,
    start_date: st.startDate,
    end_date: st.endDate,
    assigned_to: st.assignee ? [st.assignee] : [],
    assigned_by: st.assignedBy,
    priority: st.priority,
    progress: st.progress,
    status: st.status,
    subTaskIndex: st.order,
  });

  // Load all projects once
  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    dispatch(getAllProjects()).then((proj: any) => {
      if (proj?.length > 0) {
        dispatch(setCurrentProject(proj[0])); // auto-select first project
      }
    });
  }, [dispatch]);

  // When selected project changes → load tasks
  useEffect(() => {
    if (!currentProject) return;

    dispatch(getTasksByProject(currentProject.ref_no)).then((tasks: any) => {
      if (tasks?.length > 0) {
        const firstTask = tasks[0];
        setActiveTaskId(firstTask.task_id);
        dispatch(getSubtasksByTask(firstTask.task_id));
      } else {
        setActiveTaskId(null);
        dispatch(setSubtasks([]));
      }
    });
  }, [currentProject, dispatch]);

  // TASK creation submit
  const handleSubmit = (data: any) => {
    console.log("Submitted Task", data);
    setOpenModal(false);
  };

  // SUBTASK creation submit
  const handleSubmitSubtask = (payload: any) => {
    dispatch(createSubtask(payload)).then(() => {
      if (activeTaskId) {
        dispatch(getSubtasksByTask(activeTaskId));
      }
    });
    setOpenSubtaskModal(false);
  };
  const handleViewSubtask = (subtask: KanbanSubtask) => {
    setSelectedSubtask(subtask);
    setOpenViewModal(true);
  };

  return (
    <Layout>
      <SummaryBar
        stats={[
          { label: "Total Tasks", value: tasks?.length ?? 0 },
          { label: "Overdue Tasks", value: 0 },
          { label: "Due This Week", value: 0 },
          { label: "Completed Tasks", value: 0 },
        ]}
        priorityCounts={{
          high: 0,
          medium: 0,
          low: 0,
        }}
        projectList={projects ?? []}
        selectedProjectId={currentProject?.project_id ?? null}
        onSelectProject={(pid) => {
          const selected = projects.find((p) => p.project_id === pid) || null;

          dispatch(setCurrentProject(selected));

          if (!selected) {
            setActiveTaskId(null);
            dispatch(setSubtasks([]));
            return;
          }

          dispatch(getTasksByProject(selected.ref_no)).then((tasks: any) => {
            if (tasks?.length > 0) {
              const first = tasks[0];
              setActiveTaskId(first.task_id);
              dispatch(getSubtasksByTask(first.task_id));
            } else {
              setActiveTaskId(null);
              dispatch(setSubtasks([]));
            }
          });
        }}
      />

      <SprintHeader
        title="PMT APP"
        version="1"
        onAddSubtask={() => {
          if (!activeTaskId) return;
          setOpenSubtaskModal(true);
        }}
      />

      <Box sx={{ display: "flex", height: "calc(100vh - 200px)" }}>
        <TaskSidebar
          tasks={taskTabs}
          activeTaskId={activeTaskId}
          onSelectTask={(id) => {
            if (id === activeTaskId) return;
            setActiveTaskId(id);
            dispatch(getSubtasksByTask(id));
          }}
        />

        <Box sx={{ flexGrow: 1, p: 2 }}>
          {activeTaskId !== null && (
            <KanbanBoard
              parentTaskId={activeTaskId}
              columns={[
                { id: "todo", title: "To Do" },
                { id: "inprogress", title: "In Progress" },
                { id: "review", title: "Review / QA" },
                { id: "completed", title: "Completed" },
              ]}
              subtasks={subtasks}
              onViewDetails={handleViewSubtask}
            />
          )}
        </Box>
      </Box>

      {/* TASK modal */}
      <TaskModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSubmit={handleSubmit}
        mode="task"
      />

      {/* SUBTASK modal */}
      {activeTask && (
        <TaskModal
          open={openSubtaskModal}
          onClose={() => setOpenSubtaskModal(false)}
          mode="subtask"
          parentTask={activeTask}
          onSubmit={handleSubmitSubtask}
        />
      )}
      {/* VIEW SUBTASK MODAL (EDIT MODE ENABLED ON CLICK) */}
      {selectedSubtask && (
        <TaskModal
          open={openViewModal}
          onClose={() => setOpenViewModal(false)}
          defaultValues={normalizeForUpdate(selectedSubtask)}
          mode="subtask"
          isViewOnly
          parentTask={activeTask}
          onSubmit={(payload) => {
            dispatch(updateSubtask(payload)).then(() => {
              dispatch(getSubtasksByTask(activeTaskId!));
            });
            setOpenViewModal(false);
          }}
        />
      )}
    </Layout>
  );
}
