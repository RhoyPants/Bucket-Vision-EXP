import { Box, Chip, Typography } from "@mui/material";
import { useEffect, useState, type ReactNode } from "react";
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ScopeCard from "./ScopeCard";

function SortableScope({ id, children }: { id: string; children: (handleProps: Record<string, unknown>, isDragging: boolean) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <Box ref={setNodeRef} sx={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.28 : 1, borderRadius: 2 }}>
      {children({ ...attributes, ...listeners }, isDragging)}
    </Box>
  );
}

interface ScopeListProps {
  scopes: any[];
  invalidScopeIds?: string[];
  invalidTaskIds?: string[];
  scopeEdit: any;
  setScopeEdit: (scope: any) => void;
  taskInputs: Record<string, any>;
  setTaskInputs: (inputs: any) => void;
  subtaskInputs: Record<string, any>;
  setSubtaskInputs: (inputs: any) => void;
  members: any[];
  projectId?: string;
  onEditScope: (scope: any) => void;
  onDeleteScope: (scopeId: string) => void;
  onUpdateScope: () => void;
  onAddTask: (scopeId: string) => void;
  onUpdateTask: (taskId: string, updates: any) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateSubtask: (subId: string, taskId: string) => void;
  onDeleteSubtask: (subId: string, taskId: string) => void;
  onEditSubtask: (sub: any, taskId: string) => void;
  onAddSubtask: (taskId: string) => void;
  onReorderSubtasks: (taskId: string, draggedId: string, targetId: string) => Promise<void>;
  onReorderScopes: (orderedIds: string[]) => Promise<void>;
  onReorderTasks: (scopeId: string, orderedIds: string[]) => Promise<void>;
  reorderOnly?: boolean;
}

export default function ScopeList({
  scopes,
  invalidScopeIds = [],
  invalidTaskIds = [],
  scopeEdit,
  setScopeEdit,
  taskInputs,
  setTaskInputs,
  subtaskInputs,
  setSubtaskInputs,
  members,
  projectId,
  onEditScope,
  onDeleteScope,
  onUpdateScope,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onUpdateSubtask,
  onDeleteSubtask,
  onEditSubtask,
  onAddSubtask,
  onReorderSubtasks,
  onReorderScopes,
  onReorderTasks,
  reorderOnly = false,
}: ScopeListProps) {
  const [orderedScopes, setOrderedScopes] = useState(scopes);
  const [activeScopeId, setActiveScopeId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const activeScope = orderedScopes.find((scope: any) => String(scope.id) === activeScopeId);

  useEffect(() => setOrderedScopes(scopes), [scopes]);

  const reorderScopes = async (event: DragEndEvent) => {
    const draggedId = String(event.active.id);
    const targetId = event.over ? String(event.over.id) : null;
    setActiveScopeId(null);
    if (!targetId || draggedId === targetId) return;
    const from = orderedScopes.findIndex((item: any) => String(item.id) === draggedId);
    const to = orderedScopes.findIndex((item: any) => String(item.id) === targetId);
    if (from < 0 || to < 0) return;
    const previous = orderedScopes;
    const next = arrayMove(orderedScopes, from, to);
    setOrderedScopes(next);
    try { await onReorderScopes(next.map((item: any) => String(item.id))); }
    catch { setOrderedScopes(previous); }
  };

  return (
    <DndContext sensors={sensors} onDragStart={(event) => setActiveScopeId(String(event.active.id))} onDragCancel={() => setActiveScopeId(null)} onDragEnd={(event) => void reorderScopes(event)}>
      <Box mt={4}>
        <SortableContext items={orderedScopes.map((scope: any) => String(scope.id))} strategy={verticalListSortingStrategy}>
        {orderedScopes?.map((scope: any, scopeIndex: number) => (
          <SortableScope key={scope.id} id={String(scope.id)}>
            {(handleProps, isDragging) => (
        <ScopeCard
          key={scope.id}
          scope={scope}
          orderNumber={scopeIndex + 1}
          isInvalidScope={invalidScopeIds.includes(String(scope.id))}
          invalidTaskIds={invalidTaskIds}
          scopeEdit={scopeEdit}
          setScopeEdit={setScopeEdit}
          taskInputs={taskInputs}
          setTaskInputs={setTaskInputs}
          subtaskInputs={subtaskInputs}
          setSubtaskInputs={setSubtaskInputs}
          members={members}
          projectId={projectId}
          onEditScope={onEditScope}
          onDeleteScope={onDeleteScope}
          onUpdateScope={onUpdateScope}
          onAddTask={onAddTask}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onUpdateSubtask={onUpdateSubtask}
          onDeleteSubtask={onDeleteSubtask}
          onEditSubtask={onEditSubtask}
          onAddSubtask={onAddSubtask}
          onReorderSubtasks={onReorderSubtasks}
          onReorderTasks={onReorderTasks}
          reorderOnly={reorderOnly}
          scopeDragActive={Boolean(activeScopeId)}
          isDraggingScope={isDragging}
          scopeDragHandleProps={handleProps}
        />
            )}
          </SortableScope>
        ))}
        </SortableContext>
      </Box>
      <DragOverlay dropAnimation={null}>
        {activeScope ? (
          <Box sx={{ width: "min(720px, calc(100vw - 48px))", p: 2, borderRadius: 2, bgcolor: "#fff", border: "2px solid #7c3aed", boxShadow: "0 20px 45px rgba(76,29,149,.25)", transform: "rotate(.4deg)", cursor: "grabbing" }}>
            <Chip label="SCOPE" size="small" sx={{ height: 21, bgcolor: "#ede9fe", color: "#4c1d95", fontSize: 9, fontWeight: 800 }} />
            <Typography sx={{ mt: 1, color: "#312e81", fontSize: 16, fontWeight: 750 }}>{activeScope.name}</Typography>
            <Typography sx={{ mt: 0.5, color: "#7c3aed", fontSize: 11.5, fontWeight: 700 }}>Move to reorder</Typography>
          </Box>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
