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

        "&::-webkit-scrollbar": {
          height: 8,
        },

        "&::-webkit-scrollbar-track": {
          background: "#f1f5f9",
          borderRadius: 999,
        },

        "&::-webkit-scrollbar-thumb": {
          background: "#94a3b8",
          borderRadius: 999,
        },
      }}
    >
      {/* SUBTASK CARDS */}
      {task.subtasks?.map((sub: any) => {
        const isEditing = subtaskInputs[task.id]?.editId === sub.id;

        return (
          <Box
            key={sub.id}
            sx={{
              width: 260,
              minWidth: 260,
              maxWidth: 260,

              flexShrink: 0,
            }}
          >
            <SubtaskCard
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
          </Box>
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
