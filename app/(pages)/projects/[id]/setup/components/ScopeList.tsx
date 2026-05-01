import { Box } from "@mui/material";
import ScopeCard from "./ScopeCard";

interface ScopeListProps {
  scopes: any[];
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
}

export default function ScopeList({
  scopes,
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
}: ScopeListProps) {
  return (
    <Box mt={4}>
      {scopes?.map((scope: any) => (
        <ScopeCard
          key={scope.id}
          scope={scope}
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
        />
      ))}
    </Box>
  );
}
