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

import { arrayMove } from "@dnd-kit/sortable";

import KanbanColumn from "./KanbanColumn";
import KanbanSortableCard from "./KanbanSortableCard";

import type { KanbanSubtask } from "@/app/redux/slices/kanbanSlice";

import { useAppDispatch } from "@/app/redux/hook";
import { useStore } from "react-redux";

import {
  updateSubtaskStatus,
  reorderSubtasksForParent,
} from "@/app/redux/slices/kanbanSlice";

import { updateSubtask } from "@/app/redux/controllers/subTaskController";

export default function KanbanBoard({
  parentTaskId,
  columns,
  subtasks,
  onViewDetails,
}: {
  parentTaskId: string | null;
  columns: { id: string; title: string }[];
  subtasks: KanbanSubtask[];
  onViewDetails: (subtask: KanbanSubtask) => void;
}) {
  const dispatch = useAppDispatch();
  const store = useStore<any>();

  const [activeId, setActiveId] = useState<string | null>(null);

  // 🔥 Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // -----------------------------
  // Filter subtasks per task
  // -----------------------------
  const safeSubtasks = useMemo(
    () =>
      subtasks.filter(
        (s) => String(s.parentTaskId) === String(parentTaskId)
      ),
    [subtasks, parentTaskId]
  );

  // -----------------------------
  // Active drag item
  // -----------------------------
  const activeSubtask = activeId
    ? safeSubtasks.find((s) => s.id === activeId) || null
    : null;

  // -----------------------------
  // Group by statusId (COLUMN)
  // -----------------------------
  const columnMap: Record<string, KanbanSubtask[]> = {};
  columns.forEach((c) => (columnMap[c.id] = []));

  safeSubtasks.forEach((s) => {
    if (!columnMap[s.statusId]) columnMap[s.statusId] = [];
    columnMap[s.statusId].push(s);
  });

  // -----------------------------
  // Helpers
  // -----------------------------
  const extractId = (id: string) =>
    id.startsWith("subtask-") ? id.replace("subtask-", "") : null;

  const buildPayload = (s: KanbanSubtask) => ({
    title: s.title,
    description: s.description,
    statusId: s.statusId,
    order: s.order ?? 0,
  });

  // -----------------------------
  // DRAG START
  // -----------------------------
  const handleDragStart = (event: DragStartEvent) => {
    const id = extractId(String(event.active.id));
    setActiveId(id);
  };

  // -----------------------------
  // DRAG END
  // -----------------------------
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeIdClean = extractId(String(active.id));
    const overIdClean = extractId(String(over.id));

    if (!activeIdClean) return;

    const activeSub = safeSubtasks.find((s) => s.id === activeIdClean);
    if (!activeSub) return;

    // -----------------------------
    // DROP TO COLUMN (EMPTY SPACE)
    // -----------------------------
    if (String(over.id).startsWith("column-")) {
      const newStatusId = String(over.id).replace("column-", "");

      dispatch(updateSubtaskStatus({ id: activeIdClean, statusId: newStatusId }));

      const updated = store
        .getState()
        .kanban.subtasks.find((s: KanbanSubtask) => s.id === activeIdClean);

      if (updated) {
        dispatch(updateSubtask(updated.id, buildPayload(updated)));
      }

      return;
    }

    if (!overIdClean) return;

    const overSub = safeSubtasks.find((s) => s.id === overIdClean);
    if (!overSub) return;

    // -----------------------------
    // SAME COLUMN → REORDER
    // -----------------------------
    if (activeSub.statusId === overSub.statusId) {
      const list = columnMap[activeSub.statusId].map((x) => x.id);

      const oldIndex = list.indexOf(activeIdClean);
      const newIndex = list.indexOf(overIdClean);

      const reordered = arrayMove(list, oldIndex, newIndex);

      dispatch(
        reorderSubtasksForParent({
          parentTaskId: String(parentTaskId),
          orderedIds: reordered,
        })
      );

      // 🔥 Persist order
      const updatedList: KanbanSubtask[] = store
        .getState()
        .kanban.subtasks.filter(
          (s: KanbanSubtask) =>
            String(s.parentTaskId) === String(parentTaskId)
        );

      updatedList.forEach((s: KanbanSubtask, index: number) => {
        dispatch(updateSubtask(s.id, { ...buildPayload(s), order: index }));
      });

      return;
    }

    // -----------------------------
    // MOVE TO OTHER COLUMN
    // -----------------------------
    const newStatusId = overSub.statusId;

    dispatch(updateSubtaskStatus({ id: activeIdClean, statusId: newStatusId }));

    const updated = store
      .getState()
      .kanban.subtasks.find((s: KanbanSubtask) => s.id === activeIdClean);

    if (updated) {
      dispatch(updateSubtask(updated.id, buildPayload(updated)));
    }
  };

  // -----------------------------
  // RENDER
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
              items={columnMap[col.id] || []}
              parentTaskId={parentTaskId!}
              activeId={activeId}
              onViewDetails={onViewDetails}
              loading={false}
            />
          </Grid>
        ))}
      </Grid>

      {/* 🔥 Drag Overlay */}
      <DragOverlay>
        {activeSubtask ? (
          <KanbanSortableCard subtask={activeSubtask} isOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}