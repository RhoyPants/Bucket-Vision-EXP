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

import type {
  KanbanStatus,
  KanbanSubtask,
} from "@/app/redux/slices/kanbanSlice";

import { useDispatch, useStore } from "react-redux";
import {
  updateSubtaskStatus,
  reorderSubtasksForParent,
} from "@/app/redux/slices/kanbanSlice";

import { updateSubtask } from "@/app/redux/controllers/subTaskController";
import { arrayMove } from "@dnd-kit/sortable";
import { useAppDispatch } from "@/app/redux/hook";

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

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Only subtasks of active parent task
  const parentSubtasks = useMemo(
    () =>
      subtasks.filter((s) => Number(s.parentTaskId) === Number(parentTaskId)),
    [subtasks, parentTaskId]
  );

  // Active card for ghost preview
  const activeSubtask = activeId
    ? parentSubtasks.find((s) => s.id === activeId) || null
    : null;

  // Bucket by column
  const columnMap: Record<string, KanbanSubtask[]> = {};
  columns.forEach((c) => (columnMap[c.id] = []));

  parentSubtasks.forEach((s) => {
    if (!columnMap[s.status]) columnMap[s.status] = [];
    columnMap[s.status].push(s);
  });

  const getId = (id: string) =>
    id.startsWith("subtask-") ? id.replace("subtask-", "") : null;

  const normalizeStatus = (s: string): KanbanStatus => {
    switch (s.toLowerCase()) {
      case "todo":
      case "to do":
        return "todo";
      case "inprogress":
      case "in progress":
        return "inprogress";
      case "review":
      case "review / qa":
        return "review";
      case "completed":
        return "completed";
      default:
        return "todo";
    }
  };

  // -----------------------
  // ⭐ ON DRAG START
  // -----------------------
  const handleDragStart = (event: DragStartEvent) => {
    const id = getId(String(event.active.id));
    setActiveId(id);
  };

  // -----------------------
  // ⭐ ON DRAG END
  // -----------------------
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const aId = getId(String(active.id));
    const oId = getId(String(over.id));

    // ⭐ Drop on empty column
    if (String(over.id).startsWith("column-")) {
      const newStatus = normalizeStatus(String(over.id).replace("column-", ""));

      // Update UI
      dispatch(updateSubtaskStatus({ id: String(aId), status: newStatus }));

      // Sync backend
      const updated = store
        .getState()
        .kanban.subtasks.find((s: KanbanSubtask) => s.id === aId);

      if (updated) dispatch(updateSubtask(updated));

      return;
    }

    if (!aId || !oId) return;

    const activeSub = parentSubtasks.find((s) => s.id === aId);
    const overSub = parentSubtasks.find((s) => s.id === oId);
    if (!activeSub || !overSub) return;

    // ⭐ SAME COLUMN → reorder
    if (activeSub.status === overSub.status) {
      const list = columnMap[activeSub.status].map((x) => x.id);
      const oldIndex = list.indexOf(aId);
      const newIndex = list.indexOf(oId);

      const reordered = arrayMove(list, oldIndex, newIndex);

      // Update UI
      dispatch(
        reorderSubtasksForParent({
          parentTaskId: Number(parentTaskId),
          orderedIds: reordered,
        })
      );

      // 🔥 Sync each subtask’s new order to backend
      const updatedList: KanbanSubtask[] = store
        .getState()
        .kanban.subtasks.filter(
          (s: KanbanSubtask) => s.parentTaskId === parentTaskId
        );

      updatedList.forEach((s: KanbanSubtask, index: number) => {
        dispatch(updateSubtask({ ...s, order: index }));
      });

      return;
    }

    // ⭐ MOVE TO ANOTHER COLUMN
    const newStatus = normalizeStatus(overSub.status);

    // Update UI
    dispatch(updateSubtaskStatus({ id: aId, status: newStatus }));

    // Sync backend
    const updated = store
      .getState()
      .kanban.subtasks.find((s: KanbanSubtask) => s.id === aId);

    if (updated) dispatch(updateSubtask(updated));
  };

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
            />
          </Grid>
        ))}
      </Grid>

      {/* ⭐ Floating Ghost Card (drag preview) */}
      <DragOverlay>
        {activeSubtask ? (
          <KanbanSortableCard subtask={activeSubtask} isOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
