// app/components/shared/kanban/KanbanBoard.tsx
"use client";

import React, { useMemo, useState } from "react";
import { Grid } from "@mui/material";

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";

import KanbanColumn from "./KanbanColumn";
import KanbanSortableCard from "./KanbanSortableCard";

import type { KanbanStatus, KanbanSubtask } from "@/app/redux/slices/kanbanSlice";

import { useStore } from "react-redux";
import {
  updateSubtaskStatus,
  reorderSubtasksForParent,
} from "@/app/redux/slices/kanbanSlice";

import { updateSubtask } from "@/app/redux/controllers/subTaskController";
import { arrayMove } from "@dnd-kit/sortable";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";

export default function KanbanBoard({
  parentTaskId,
  columns,
  subtasks,
  onViewDetails,
}: {
  parentTaskId: number | null;
  columns: { id: string; title: string }[];
  subtasks: KanbanSubtask[];
  onViewDetails: (subtask: KanbanSubtask) => void;
}) {
  const dispatch = useAppDispatch();
  const store = useStore<any>();
  const loading = useAppSelector((state) => state.kanban.loading);

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // -----------------------------
  // ⭐ Helper: Convert Subtask → Backend Payload
  // -----------------------------
  const buildBackendPayload = (s: KanbanSubtask) => ({
    subtask_id: Number(s.id),
    task_name: s.title,
    description: s.description,
    start_date: s.startDate,
    end_date: s.endDate,

    assigned_to: s.assignee ? [s.assignee] : [],
    assigned_by: s.assignedBy,

    priority: s.priority,
    progress: s.progress ?? 0,

    status: s.status,
    subTaskIndex: s.order ?? 0,
  });

  // Filter subtasks under parent task
  const parentSubtasks = useMemo(
    () => subtasks.filter((s) => Number(s.parentTaskId) === Number(parentTaskId)),
    [subtasks, parentTaskId]
  );

  const safeSubtasks = Array.isArray(parentSubtasks) ? parentSubtasks : [];

  // Active card
  const activeSubtask =
    activeId ? safeSubtasks.find((s) => s.id === activeId) || null : null;

  // Bucket subtasks by column
  const columnMap: Record<string, KanbanSubtask[]> = {};
  columns.forEach((c) => (columnMap[c.id] = []));

  safeSubtasks.forEach((s) => {
    if (!columnMap[s.status]) columnMap[s.status] = [];
    columnMap[s.status].push(s);
  });

  const getId = (id: string) =>
    id.startsWith("subtask-") ? id.replace("subtask-", "") : null;

  const normalizeStatus = (raw: string): KanbanStatus => {
     const s = raw.toLowerCase().replace(/\s+/g, ""); // remove spaces

  switch (s) {
    case "todo":
      return "todo";
    case "inprogress":
      return "inprogress";
    case "review":
      return "review";
    case "completed":
      return "completed";
    default:
      return "todo";
  }
  };

  // -----------------------------
  // ⭐ DRAG START
  // -----------------------------
  const handleDragStart = (event: DragStartEvent) => {
    const id = getId(String(event.active.id));
    setActiveId(id);
  };

  // -----------------------------
  // ⭐ DRAG END
  // -----------------------------
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const aId = getId(String(active.id));
    const oId = getId(String(over.id));

    // ⭐ Drop into empty column
    if (String(over.id).startsWith("column-")) {
      const newStatus = normalizeStatus(String(over.id).replace("column-", ""));

      dispatch(updateSubtaskStatus({ id: String(aId), status: newStatus }));

      const updated = store.getState().kanban.subtasks.find((s: KanbanSubtask) => s.id === aId);
      if (updated) dispatch(updateSubtask(buildBackendPayload(updated)));

      return;
    }

    if (!aId || !oId) return;

    const activeSub = safeSubtasks.find((s) => s.id === aId);
    const overSub = safeSubtasks.find((s) => s.id === oId);
    if (!activeSub || !overSub) return;

    // ⭐ Same column → reorder
    if (activeSub.status === overSub.status) {
      const list = columnMap[activeSub.status].map((x) => x.id);
      const oldIndex = list.indexOf(aId);
      const newIndex = list.indexOf(oId);

      const reordered = arrayMove(list, oldIndex, newIndex);

      dispatch(
        reorderSubtasksForParent({
          parentTaskId: Number(parentTaskId),
          orderedIds: reordered,
        })
      );

      const updatedList: KanbanSubtask[] = store
        .getState()
        .kanban.subtasks.filter(
          (s: KanbanSubtask) => Number(s.parentTaskId) === Number(parentTaskId)
        );

      updatedList.forEach((s: KanbanSubtask, index: number) => {
        dispatch(updateSubtask(buildBackendPayload({ ...s, order: index })));
      });

      return;
    }

    // ⭐ Move to other column
    const newStatus = normalizeStatus(overSub.status);
    dispatch(updateSubtaskStatus({ id: aId, status: newStatus }));

    const updated = store.getState().kanban.subtasks.find((s: KanbanSubtask) => s.id === aId);
    if (updated) dispatch(updateSubtask(buildBackendPayload(updated)));
  };

  // -----------------------------
  // ⭐ ALWAYS RENDER KANBAN — EVEN WHEN LOADING
  // -----------------------------
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Grid container spacing={2}>
        {columns.map((col) => (
          <Grid key={col.id} size={{ xs: 12, sm: 6, md: 3 }}>
            <KanbanColumn
              id={col.id}
              title={col.title}
              items={columnMap[col.id] ?? []}
              activeId={activeId}
              onViewDetails={onViewDetails}
              loading={loading} // optional
            />
          </Grid>
        ))}
      </Grid>

      <DragOverlay>
        {activeSubtask ? (
          <KanbanSortableCard subtask={activeSubtask} isOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
