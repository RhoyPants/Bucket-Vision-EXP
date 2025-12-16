// app/(pages)/sprint/page.tsx
"use client";

import React, { useEffect, useState } from "react";
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
} from "@/app/redux/selector";
import TaskSidebar from "./Components/TaskSidebar";
import { Box } from "@mui/material";
import { getSubtasksByTask } from "@/app/redux/controllers/subTaskController";
import KanbanBoard from "@/app/components/shared/kanban/KanbanBoard";

export default function SprintPage() {
  const dispatch = useAppDispatch();

  const tasks = useAppSelector(selectTasks); // raw tasks from backend
  const taskTabs = useAppSelector(selectTaskTabs); // mapped tabs
  const subtasks = useAppSelector(selectSubtasks);

  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);

  // 1️⃣ Load ALL projects once
  useEffect(() => {
    dispatch(getAllProjects());
  }, [dispatch]);

  // 2️⃣ Load tasks for default project
  useEffect(() => {
    dispatch(getTasksByProject("EV-PMFTCEOTHRLM-25-00446")).then(
      (tasks: any) => {
        if (tasks?.length > 0) {
          const firstId = tasks[0].task_id;
          setActiveTaskId(firstId);

          // fetch subtasks for the first task on page load
          dispatch(getSubtasksByTask(firstId));
        }
      }
    );
  }, []);
  useEffect(() => {
    console.log("RAW TASKS:", tasks);
    console.log("TASK TABS:", taskTabs);
  }, [tasks, taskTabs]);

  return (
    <Layout>
      <SummaryBar
        stats={[
          { label: "Total Tasks", value: tasks.length },
          { label: "Overdue Tasks", value: 2 },
          { label: "Due This Week", value: 5 },
          { label: "Completed Tasks", value: 23 },
        ]}
        priorityCounts={{ high: 4, medium: 7, low: 3 }}
        showProjectButton
        showAddTaskButton
      />

      <SprintHeader
        title="PMT APP"
        version="1"
        onAddSubtask={() => console.log("open add subtask modal")}
      />
      <Box sx={{ display: "flex", height: "calc(100vh - 200px)" }}>
        <TaskSidebar
          tasks={taskTabs}
          activeTaskId={activeTaskId}
          onSelectTask={(id) => {
            setActiveTaskId(id); // update selected tab
            dispatch(getSubtasksByTask(id)); // load subtasks for that task
          }}
        />

        <Box sx={{ flexGrow: 1, p: 2 }}>
          <KanbanBoard parentTaskId={""} columns={[]} subtasks={[]} />
        </Box>
      </Box>
    </Layout>
  );
}
