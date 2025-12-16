// app/components/shared/kanban/KanbanBoard.tsx
"use client";
import React, { useMemo } from "react";
import { Grid } from "@mui/material";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import KanbanColumn from "./KanbanColumn";
import type { KanbanSubtask } from "@/app/redux/slices/kanbanSlice";
import { useDispatch } from "react-redux";
import { updateSubtaskStatus, reorderSubtasksForParent } from "@/app/redux/slices/kanbanSlice";
import { arrayMove } from "@dnd-kit/sortable";

export default function KanbanBoard({
  parentTaskId,
  columns,
  subtasks,
}: {
  parentTaskId: string;
  columns: { id: string; title: string }[];
  subtasks: KanbanSubtask[];
}) {
  const dispatch = useDispatch();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const parentSubtasks = useMemo(() => subtasks.filter((s) => s.parentTaskId === parentTaskId), [subtasks, parentTaskId]);

  const columnMap: Record<string, KanbanSubtask[]> = {};
  columns.forEach((c) => (columnMap[c.id] = []));
  parentSubtasks.forEach((s) => {
    if (!columnMap[s.status]) columnMap[s.status] = [];
    columnMap[s.status].push(s);
  });

  const handleDragStart = (e: DragStartEvent) => { /* optional set active */ };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const aId = String(active.id);
    const oId = String(over.id);

    const getSubId = (s: string) => (s.startsWith("subtask-") ? s.replace("subtask-", "") : null);

    // drop on column area
    if (oId.startsWith("column-")) {
      const target = oId.replace("column-", "");
      const asub = getSubId(aId);
      if (asub) dispatch(updateSubtaskStatus({ id: asub, status: target as any }));
      return;
    }

    // reorder or move between columns by landing on another subtask
    const aSubId = getSubId(aId);
    const oSubId = getSubId(oId);
    if (!aSubId || !oSubId) return;

    const activeS = parentSubtasks.find((s) => s.id === aSubId);
    const overS = parentSubtasks.find((s) => s.id === oSubId);
    if (!activeS || !overS) return;

    if (activeS.status === overS.status) {
      const list = columnMap[activeS.status].map((s) => s.id);
      const oldIndex = list.indexOf(activeS.id);
      const newIndex = list.indexOf(overS.id);
      const newOrder = arrayMove(list, oldIndex, newIndex);
      dispatch(reorderSubtasksForParent({ parentTaskId, orderedIds: newOrder }));
    } else {
      // Move across columns: build new lists
      const sourceList = columnMap[activeS.status].map((s) => s.id).filter((id) => id !== activeS.id);
      const targetList = columnMap[overS.status].map((s) => s.id);
      const insertIndex = targetList.indexOf(overS.id);
      const newTarget = [...targetList.slice(0, insertIndex), activeS.id, ...targetList.slice(insertIndex)];

      dispatch(updateSubtaskStatus({ id: activeS.id, status: overS.status as any }));
      dispatch(reorderSubtasksForParent({ parentTaskId, orderedIds: newTarget }));
      dispatch(reorderSubtasksForParent({ parentTaskId, orderedIds: sourceList })); // update source
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Grid container spacing={2}>
        {columns.map((col) => (
          <Grid key={col.id} size={{ xs: 12, sm: 6, md: 3 }}>
            <KanbanColumn id={col.id} title={col.title} items={columnMap[col.id] ?? []} />
          </Grid>
        ))}
      </Grid>
    </DndContext>
  );
}
