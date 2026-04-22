"use client";

import React, { useMemo, useState } from "react";
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
import { moveSubtask } from "@/app/redux/controllers/subTaskController";

import { Box, Button, Typography } from "@mui/material";
import AddSubTaskModal from "@/app/components/shared/modals/AddSubtaskModal";

export default function KanbanBoard({
  parentTaskId,
  columns,
  subtasks,
  onViewDetails,
}: {
  parentTaskId: string | null;
  columns: { id: number; title: string }[];
  subtasks: KanbanSubtask[];
  onViewDetails: (subtask: KanbanSubtask) => void;
}) {
  const dispatch = useAppDispatch();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [openTaskModal, setOpenTaskModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const safeSubtasks = useMemo(
    () =>
      subtasks.filter((s) => String(s.parentTaskId) === String(parentTaskId)),
    [subtasks, parentTaskId]
  );

  const activeSubtask = activeId
    ? safeSubtasks.find((s) => s.id === activeId) || null
    : null;

  const columnMap: Record<number, KanbanSubtask[]> = {
    0: [],
    1: [],
    2: [],
  };

  safeSubtasks.forEach((s) => {
    columnMap[s.status]?.push(s);
  });

  Object.keys(columnMap).forEach((key) => {
    columnMap[Number(key)].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  });

  const extractId = (id: string) =>
    id.startsWith("subtask-") ? id.replace("subtask-", "") : null;

  const handleDragStart = (event: DragStartEvent) => {
    const id = extractId(String(event.active.id));
    setActiveId(id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeIdClean = extractId(String(active.id));
    const overIdClean = extractId(String(over.id));

    if (!activeIdClean || !overIdClean) return;

    const activeSub = safeSubtasks.find((s) => s.id === activeIdClean);
    const overSub = safeSubtasks.find((s) => s.id === overIdClean);

    if (!activeSub || !overSub) return;

    if (activeSub.status === overSub.status) {
      const list = columnMap[activeSub.status].map((x) => x.id);

      const oldIndex = list.indexOf(activeIdClean);
      const newIndex = list.indexOf(overIdClean);

      const reordered = arrayMove(list, oldIndex, newIndex);

      dispatch(
        moveSubtask({
          id: activeIdClean,
          order: newIndex,
          parentTaskId: String(parentTaskId),
          orderedIds: reordered,
        })
      );
    }
  };

  return (
    <>
      {/* 🔥 HEADER (LIKE TASK SIDEBAR) */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography fontWeight={700}>SUBTASK</Typography>

        <Button
          variant="contained"
          size="small"
          onClick={() => setOpenTaskModal(true)}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            borderRadius: "6px",
          }}
        >
          + Add Subtask
        </Button>
      </Box>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Box sx={{ display: "flex", gap: 2, overflowX: "auto" }}>
          {columns.map((col) => (
            <Box key={col.id} sx={{ minWidth: 300 }}>
              <KanbanColumn
                id={String(col.id)}
                title={col.title}
                items={columnMap[col.id] || []}
                parentTaskId={parentTaskId!}
                activeId={activeId}
                onViewDetails={onViewDetails}
                loading={false}
              />
            </Box>
          ))}
        </Box>

        <DragOverlay>
          {activeSubtask ? (
            <KanbanSortableCard subtask={activeSubtask} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* MODAL */}
      <AddSubTaskModal
        open={openTaskModal}
        onClose={() => setOpenTaskModal(false)}
        taskId={parentTaskId || ""}
        statusId="0"
      />
    </>
  );
}