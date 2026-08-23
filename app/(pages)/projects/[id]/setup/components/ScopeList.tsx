import { Box } from "@mui/material";
import { useEffect, useState } from "react";
import ScopeCard from "./ScopeCard";

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
}: ScopeListProps) {
  const [orderedScopes, setOrderedScopes] = useState(scopes);
  const [draggingScopeId, setDraggingScopeId] = useState<string | null>(null);
  const [scopeDropTargetId, setScopeDropTargetId] = useState<string | null>(null);
  const [scopeOrderBeforeDrag, setScopeOrderBeforeDrag] = useState<any[] | null>(null);

  useEffect(() => setOrderedScopes(scopes), [scopes]);

  useEffect(() => {
    if (!draggingScopeId) return;
    const handleEdgeScroll = (event: DragEvent) => {
      const topEdge = 220;
      const bottomEdge = window.innerHeight - 140;
      if (event.clientY < topEdge) {
        const speed = Math.min(30, Math.max(8, (topEdge - event.clientY) / 5));
        window.scrollBy({ top: -speed, behavior: "auto" });
      } else if (event.clientY > bottomEdge) {
        const speed = Math.min(30, Math.max(8, (event.clientY - bottomEdge) / 5));
        window.scrollBy({ top: speed, behavior: "auto" });
      }
    };
    window.addEventListener("dragover", handleEdgeScroll);
    return () => window.removeEventListener("dragover", handleEdgeScroll);
  }, [draggingScopeId]);

  const previewScopePosition = (targetId: string) => {
    if (!draggingScopeId || draggingScopeId === targetId) return;
    setScopeDropTargetId(targetId);
    setOrderedScopes((current) => {
      const next = [...current];
      const from = next.findIndex((item: any) => item.id === draggingScopeId);
      const to = next.findIndex((item: any) => item.id === targetId);
      if (from < 0 || to < 0 || from === to) return current;
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const dropScope = async () => {
    const draggedId = draggingScopeId;
    const finalOrder = orderedScopes;
    setDraggingScopeId(null);
    setScopeDropTargetId(null);
    setScopeOrderBeforeDrag(null);
    if (!draggedId) return;
    try { await onReorderScopes(finalOrder.map((item: any) => String(item.id))); }
    catch { if (scopeOrderBeforeDrag) setOrderedScopes(scopeOrderBeforeDrag); }
  };

  return (
    <Box mt={4}>
      {orderedScopes?.map((scope: any, scopeIndex: number) => (
        <Box key={scope.id} onDragEnter={() => previewScopePosition(scope.id)} onDragOver={(event) => { if (draggingScopeId) event.preventDefault(); }} onDrop={(event) => { event.preventDefault(); void dropScope(); }} sx={{ position: "relative", transform: scopeDropTargetId === scope.id ? "scale(.997)" : "none", transition: "transform .15s" }}>
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
          scopeDragActive={Boolean(draggingScopeId)}
          isDraggingScope={draggingScopeId === scope.id}
          scopeDragHandleProps={{
            draggable: true,
            onDragStart: (event) => {
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", scope.id);
              setScopeOrderBeforeDrag(orderedScopes);
              requestAnimationFrame(() => setDraggingScopeId(scope.id));
            },
            onDragEnd: () => { setDraggingScopeId(null); setScopeDropTargetId(null); },
          }}
        />
        </Box>
      ))}
    </Box>
  );
}
