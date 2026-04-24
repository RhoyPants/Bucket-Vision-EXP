import { Box } from "@mui/material";
import SubtaskCard from "./SubtaskCard";
import SubtaskForm from "./SubtaskForm";

interface SubtaskListProps {
  task: any;
  subtaskInputs: Record<string, any>;
  setSubtaskInputs: (inputs: any) => void;
  members: any[];
  projectId?: string;
  onUpdateSubtask: (subId: string, taskId: string) => void;
  onDeleteSubtask: (subId: string, taskId: string) => void;
  onEditSubtask: (sub: any, taskId: string) => void;
  onAddSubtask: (taskId: string) => void;
}

export default function SubtaskList({
  task,
  subtaskInputs,
  setSubtaskInputs,
  members,
  projectId,
  onUpdateSubtask,
  onDeleteSubtask,
  onEditSubtask,
  onAddSubtask,
}: SubtaskListProps) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        overflowX: "auto",
        pb: 1,
        mt: 3,
      }}
    >
      {/* SUBTASK CARDS */}
      {task.subtasks?.map((sub: any) => {
        const isEditing = subtaskInputs[task.id]?.editId === sub.id;

        return (
          <SubtaskCard
            key={sub.id}
            sub={sub}
            taskId={task.id}
            taskBudget={task.budgetAllocated || 0}
            isEditing={isEditing}
            subtaskInputs={subtaskInputs}
            setSubtaskInputs={setSubtaskInputs}
            members={members}
            projectId={projectId}
            onUpdate={onUpdateSubtask}
            onDelete={onDeleteSubtask}
            onEdit={() => onEditSubtask(sub, task.id)}
          />
        );
      })}

      {/* ADD FORM CARD */}
      <SubtaskForm
        taskId={task.id}
        taskBudget={task.budgetAllocated || 0}
        subtaskInputs={subtaskInputs}
        setSubtaskInputs={setSubtaskInputs}
        members={members}
        projectId={projectId}
        onAddSubtask={onAddSubtask}
      />
    </Box>
  );
}
