// app/components/taskboard/SortableTaskCard.tsx
"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TaskCard from "./TaskCard";
import type { TaskData } from "@/app/(pages)/taskboard/taskTypes";

export default function SortableTaskCard({
  task,
  onOpenMenu,
}: {
  task: TaskData;
  onOpenMenu?: (e: React.MouseEvent, id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `task-${task.id}`,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "manipulation",
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div onClick={(e) => e.stopPropagation()}>
        <TaskCard {...task} onOpenMenu={onOpenMenu}  />
      </div>
    </div>
  );
}
