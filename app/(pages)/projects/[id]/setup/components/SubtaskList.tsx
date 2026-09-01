import { Box, Chip, Typography } from "@mui/material";
import { useEffect, useState, type ReactNode } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  horizontalListSortingStrategy,
  arrayMove,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import SubtaskCard from "./SubtaskCard";
import SubtaskForm from "./SubtaskForm";

interface SubtaskListProps {
  task: any;
  budgetRequired?: boolean;
  taskOrderLabel: string;
  subtaskInputs: Record<string, any>;
  setSubtaskInputs: (inputs: any) => void;
  members: any[];
  projectId?: string;
  onUpdateSubtask: (subId: string, taskId: string) => void;
  onDeleteSubtask: (subId: string, taskId: string) => void;
  onEditSubtask: (sub: any, taskId: string) => void;
  onAddSubtask: (taskId: string) => void;
  onReorderSubtasks: (taskId: string, draggedId: string, targetId: string) => Promise<void>;
  reorderOnly?: boolean;
}

function SortableCard({ id, disabled, children }: { id: string; disabled: boolean; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  return (
    <Box
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      sx={{
        width: 260,
        minWidth: 260,
        maxWidth: 260,
        flexShrink: 0,
        cursor: disabled ? "default" : isDragging ? "grabbing" : "grab",
        opacity: isDragging ? 0.3 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
        borderRadius: 1.5,
        touchAction: "pan-y",
        "&:focus-visible": { outline: "2px solid #6366f1", outlineOffset: 3 },
      }}
    >
      {children}
    </Box>
  );
}

export default function SubtaskList({
  task,
  budgetRequired = true,
  taskOrderLabel,
  subtaskInputs,
  setSubtaskInputs,
  members,
  projectId,
  onUpdateSubtask,
  onDeleteSubtask,
  onEditSubtask,
  onAddSubtask,
  onReorderSubtasks,
  reorderOnly = false,
}: SubtaskListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [orderedSubtasks, setOrderedSubtasks] = useState<any[]>(task.subtasks || []);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const subtasks = orderedSubtasks;
  const activeSubtask = subtasks.find((sub: any) => sub.id === activeId);

  useEffect(() => {
    setOrderedSubtasks(task.subtasks || []);
  }, [task.subtasks]);

  const handleDragEnd = (event: DragEndEvent) => {
    const draggedId = String(event.active.id);
    const targetId = event.over ? String(event.over.id) : null;
    setActiveId(null);
    if (targetId && draggedId !== targetId) {
      const from = subtasks.findIndex((sub: any) => sub.id === draggedId);
      const to = subtasks.findIndex((sub: any) => sub.id === targetId);
      if (from >= 0 && to >= 0) setOrderedSubtasks(arrayMove(subtasks, from, to));
      void onReorderSubtasks(task.id, draggedId, targetId);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(event) => setActiveId(String(event.active.id))}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={handleDragEnd}
    >
      <Box
        sx={{
          display: "grid",
          gridAutoFlow: "column",
          gridAutoColumns: "260px",
          gap: 2,
          overflowX: "auto",
          overflowY: "hidden",
          width: 0,
          minWidth: "100%",
          maxWidth: "100%",
          pb: 1,
          mt: 3,
          boxSizing: "border-box",
          alignItems: "stretch",
          scrollbarWidth: "thin",
          "&::-webkit-scrollbar": { height: 8 },
          "&::-webkit-scrollbar-track": { background: "#f1f5f9", borderRadius: 999 },
          "&::-webkit-scrollbar-thumb": { background: "#94a3b8", borderRadius: 999 },
        }}
      >
        <SortableContext items={subtasks.map((sub: any) => sub.id)} strategy={horizontalListSortingStrategy}>
          {subtasks.map((sub: any, subtaskIndex: number) => {
            const isEditing = subtaskInputs[task.id]?.editId === sub.id;
            return (
              <SortableCard key={sub.id} id={sub.id} disabled={isEditing}>
                <SubtaskCard
                  sub={sub}
                  orderLabel={`${taskOrderLabel}.${subtaskIndex + 1}`}
                  taskId={task.id}
                  taskBudget={task.budgetAllocated || 0}
                  budgetRequired={budgetRequired}
                  isEditing={isEditing}
                  subtaskInputs={subtaskInputs}
                  setSubtaskInputs={setSubtaskInputs}
                  members={members}
                  projectId={projectId}
                  onUpdate={onUpdateSubtask}
                  onDelete={onDeleteSubtask}
                  onEdit={() => onEditSubtask(sub, task.id)}
                  reorderOnly={reorderOnly}
                />
              </SortableCard>
            );
          })}
        </SortableContext>

        {!reorderOnly && <SubtaskForm
          taskId={task.id}
          taskName={task.title}
          taskMaintenanceId={task.taskMaintenanceId}
          taskBudget={task.budgetAllocated || 0}
          budgetRequired={budgetRequired}
          existingSubtasks={subtasks}
          subtaskInputs={subtaskInputs}
          setSubtaskInputs={setSubtaskInputs}
          members={members}
          projectId={projectId}
          onAddSubtask={onAddSubtask}
        />}
      </Box>

      <DragOverlay dropAnimation={null}>
        {activeSubtask ? (
          <Box sx={{ width: 260, minHeight: 290, p: 2, borderRadius: 1.5, bgcolor: "#f5f3ff", border: "2px solid #8b5cf6", boxShadow: "0 18px 38px rgba(76,29,149,.24)", transform: "rotate(1deg)", cursor: "grabbing" }}>
            <Chip label={`SUBTASK ${taskOrderLabel}.${subtasks.findIndex((sub: any) => sub.id === activeId) + 1}`} size="small" sx={{ height: 20, bgcolor: "#ede9fe", color: "#6b21a8", fontSize: 8.5, fontWeight: 800 }} />
            <Typography sx={{ mt: 1.25, color: "#312e81", fontSize: 14, fontWeight: 700 }}>{activeSubtask.title}</Typography>
            <Typography sx={{ mt: 1, color: "#64748b", fontSize: 12 }}>₱{Number(activeSubtask.budgetAllocated || 0).toLocaleString()}</Typography>
            <Typography sx={{ mt: 2, color: "#7c3aed", fontSize: 11.5, fontWeight: 700 }}>Move to reorder</Typography>
          </Box>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
