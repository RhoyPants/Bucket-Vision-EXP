// app/taskboard/page.tsx
"use client";

import React, { useState, useCallback } from "react";
import Layout from "@/app/components/shared/Layout";
import Grid from "@mui/material/Grid";
import { Box, Typography, Button, Menu, MenuItem } from "@mui/material";
import { DragOverlay, DragStartEvent } from "@dnd-kit/core";

import ColumnSection from "@/app/(pages)/taskboard/Components/ColumnSection";
import type { TaskData, TaskStatus } from "./taskTypes";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import TaskCard from "./Components/TaskCard";
import StatCard from "./Components/StatCard";
import TaskModal from "@/app/components/shared/modals/TaskModal";

// sample data
const initialTasks: TaskData[] = [
  {
    id: 1,
    title: "W&E Platform",
    priority: "High",
    developer: "Alice",
    dueDate: "Dec 05, 2025",
    description: "Leave request submission API.",
    status: "todo",
  },
  {
    id: 2,
    title: "Docs Page",
    priority: "Medium",
    developer: "Bob",
    dueDate: "Dec 12, 2025",
    description: "Update docs and guide.",
    status: "todo",
  },
  {
    id: 3,
    title: "Auth Fix",
    priority: "High",
    developer: "Charlie",
    dueDate: "Dec 03, 2025",
    description: "Token refresh logic.",
    progress: 60,
    status: "inprogress",
  },
  {
    id: 4,
    title: "UI Polish",
    priority: "Low",
    developer: "Dana",
    dueDate: "Dec 20, 2025",
    description: "Improve button spacing.",
    status: "review",
  },
  {
    id: 5,
    title: "Release Prep",
    priority: "Low",
    developer: "Erin",
    dueDate: "Dec 31, 2025",
    description: "Prepare changelog.",
    status: "completed",
  },
];

const columns: { id: TaskStatus; title: string }[] = [
  { id: "todo", title: "To Do" },
  { id: "inprogress", title: "In Progress" },
  { id: "review", title: "Review / QA" },
  { id: "completed", title: "Completed" },
];

export default function TaskboardPage() {
  const [tasks, setTasks] = useState<TaskData[]>(initialTasks);
  const [activeMenuTask, setActiveMenuTask] = useState<number | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [activeTask, setActiveTask] = useState<TaskData | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // helper to find task index within its column order
  const getColumnTasks = useCallback(
    (columnId: TaskStatus) => tasks.filter((t) => t.status === columnId),
    [tasks]
  );
  const [openModal, setOpenModal] = useState(false);

  const handleSubmit = (data: any) => {
    console.log("Submitted Task", data);
    setOpenModal(false);
  };

  // open menu for a task (used by TaskCard on double-click or action)
  const handleOpenCardMenu = (e: React.MouseEvent, taskId: number) => {
    e.stopPropagation();
    setActiveMenuTask(taskId);
    setAnchorEl(e.currentTarget as HTMLElement);
  };

  const handleCloseMenu = () => {
    setActiveMenuTask(null);
    setAnchorEl(null);
  };

  const handleChangeStatus = (taskId: number, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    handleCloseMenu();
  };

  const handleDragStart = (event: DragStartEvent) => {
    const idStr = String(event.active.id); // "task-3"
    const taskId = Number(idStr.replace("task-", ""));
    const found = tasks.find((t) => t.id === taskId);
    if (found) setActiveTask(found);
  };

  const handleDragCancel = () => {
    setActiveTask(null);
  };

  // drag end: move between columns or reorder within column
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id); // e.g. "task-2"
    const overId = String(over.id); // could be "task-3" or "column-todo"

    // extract task numeric id from activeId
    const getTaskId = (idStr: string) => {
      if (!idStr.startsWith("task-")) return null;
      return Number(idStr.replace("task-", ""));
    };
    const activeTaskId = getTaskId(activeId);
    if (!activeTaskId) return;

    // if dropped on a column directly (over is column-<colId>)
    if (overId.startsWith("column-")) {
      const targetColumn = overId.replace("column-", "") as TaskStatus;
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeTaskId ? { ...t, status: targetColumn } : t
        )
      );
      return;
    }

    // if over is another task: we need to reorder OR change column
    if (overId.startsWith("task-")) {
      const overTaskId = getTaskId(overId);
      if (!overTaskId) return;

      const activeTask = tasks.find((t) => t.id === activeTaskId);
      const overTask = tasks.find((t) => t.id === overTaskId);
      if (!activeTask || !overTask) return;

      // if same column -> reorder the tasks in that column
      if (activeTask.status === overTask.status) {
        const colId = activeTask.status;
        const columnTasks = getColumnTasks(colId);
        const oldIndex = columnTasks.findIndex((t) => t.id === activeTaskId);
        const newIndex = columnTasks.findIndex((t) => t.id === overTaskId);
        if (oldIndex === -1 || newIndex === -1) return;

        // produce new order for that column
        const newColumnOrder = arrayMove(
          columnTasks.map((t) => t.id),
          oldIndex,
          newIndex
        );

        // map into tasks: keep ordering for this column, keep other columns tasks as is
        setTasks((prev) => {
          // build mapping of id->task for column
          const idToTask = Object.fromEntries(prev.map((t) => [t.id, t]));
          const newTasks: TaskData[] = [];

          // for the column being reordered, push tasks in newColumnOrder
          newColumnOrder.forEach((tid) => {
            newTasks.push({ ...idToTask[tid] });
          });

          // append other columns in their existing order (preserve)
          prev.forEach((t) => {
            if (t.status !== colId) newTasks.push(t);
          });

          return newTasks;
        });
      } else {
        // different column: place active task into overTask's column, at the position of overTask
        const targetColumn = overTask.status;
        setTasks((prev) => {
          // remove active task from prev
          const withoutActive = prev.filter((t) => t.id !== activeTaskId);

          // find position to insert before the first occurrence of overTask in withoutActive
          const insertIndex = withoutActive.findIndex(
            (t) => t.id === overTaskId
          );

          const updatedActiveTask = {
            ...(prev.find((t) => t.id === activeTaskId) as TaskData),
            status: targetColumn,
          };

          // insert updatedActiveTask at insertIndex
          const newList = [
            ...withoutActive.slice(0, insertIndex),
            updatedActiveTask,
            ...withoutActive.slice(insertIndex),
          ];
          return newList;
        });
      }
    }
  };

  return (
    <Layout>
      {/* header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontFamily: "var(--font-ftsterling)",
            fontWeight: 600,
            color: "#210e64",
          }}
        >
          Task Board
        </Typography>
      </Box>

      {/* summary placeholder (you have your own stat cards above) */}
      {/* SUMMARY ROW */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* LEFT SIDE — 4 Summary Cards */}
        <Grid size={{ xs: 12, md: 9 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard label="Total Tasks" value={14} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard label="Overdue Tasks" value={2} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard label="Due This Week" value={5} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard label="Completed Tasks" value={23} />
            </Grid>
          </Grid>
        </Grid>

        {/* RIGHT SIDE — Priority Summary + Buttons */}
        <Grid
          size={{ xs: 12, md: 3 }}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            justifyContent: "space-between",
          }}
        >
          {/* PRIORITY SUMMARY BOX */}
          <Box
            sx={{
              border: "1px solid #ddd",
              borderRadius: 2,
              p: 1.5,
              backgroundColor: "#fff",
              fontFamily: "var(--font-ftsterling)",
              fontSize: "14px",
              display: "flex",
              flexDirection: "row",
              gap: 8,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Box sx={{}}>
              <Typography fontWeight={600}>High: 4</Typography>
              <Typography fontWeight={600}>Medium: 7</Typography>
              <Typography fontWeight={600}>Low: 3</Typography>
            </Box>

            {/* BUTTONS */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Button
                variant="contained"
                onClick={() => setOpenModal(true)}
                sx={{
                  backgroundColor: "#0f9d58", // green
                  "&:hover": { backgroundColor: "#0c7a45" },
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Add New Task
              </Button>

              <Button
                variant="contained"
                sx={{
                  backgroundColor: "#d1d5db", // gray
                  color: "#000",
                  "&:hover": { backgroundColor: "#bfc4ca" },
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Projects
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* DnD & Columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {columns.map((col) => (
            <Grid key={col.id} size={{ xs: 12, sm: 6, md: 3 }}>
              <ColumnSection
                columnId={col.id}
                title={col.title}
                tasks={tasks}
                onStatusChange={handleChangeStatus}
                onOpenCardMenu={handleOpenCardMenu}
              />
            </Grid>
          ))}
        </Grid>
        <DragOverlay>
          {activeTask ? (
            <Box sx={{ width: "260px" }}>
              <TaskCard {...activeTask} overlay />
            </Box>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* menu for moving tasks (fallback, triggered by double-click) */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem
          onClick={() =>
            activeMenuTask && handleChangeStatus(activeMenuTask, "todo")
          }
        >
          Move to: To Do
        </MenuItem>
        <MenuItem
          onClick={() =>
            activeMenuTask && handleChangeStatus(activeMenuTask, "inprogress")
          }
        >
          Move to: In Progress
        </MenuItem>
        <MenuItem
          onClick={() =>
            activeMenuTask && handleChangeStatus(activeMenuTask, "review")
          }
        >
          Move to: Review / QA
        </MenuItem>
        <MenuItem
          onClick={() =>
            activeMenuTask && handleChangeStatus(activeMenuTask, "completed")
          }
        >
          Move to: Completed
        </MenuItem>
      </Menu>
      <TaskModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSubmit={handleSubmit}
      />
    </Layout>
  );
}
