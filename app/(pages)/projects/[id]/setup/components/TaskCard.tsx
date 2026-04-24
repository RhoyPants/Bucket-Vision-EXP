import { Box, Button, TextField, Typography } from "@mui/material";
import SubtaskList from "./SubtaskList";

interface TaskCardProps {
  task: any;
  taskEdit: any;
  setTaskEdit: (task: any) => void;
  subtaskInputs: Record<string, any>;
  setSubtaskInputs: (inputs: any) => void;
  members: any[];
  projectId?: string;
  onEditTask: (task: any) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: () => void;
  onUpdateSubtask: (subId: string, taskId: string) => void;
  onDeleteSubtask: (subId: string, taskId: string) => void;
  onEditSubtask: (sub: any, taskId: string) => void;
  onAddSubtask: (taskId: string) => void;
}

export default function TaskCard({
  task,
  taskEdit,
  setTaskEdit,
  subtaskInputs,
  setSubtaskInputs,
  members,
  projectId,
  onEditTask,
  onDeleteTask,
  onUpdateTask,
  onUpdateSubtask,
  onDeleteSubtask,
  onEditSubtask,
  onAddSubtask,
}: TaskCardProps) {
  return (
    <Box
      sx={{
        backgroundColor: "#ffffff",
        p: 3,
        mt: 2,
        borderRadius: 3,
        position: "relative",
        "&:hover .task-actions": { opacity: 1 },
      }}
    >
      <Box position="relative">
        {taskEdit?.id === task.id ? (
          <Box display="flex" gap={1}>
            <TextField
              size="small"
              value={taskEdit.title}
              onChange={(e) =>
                setTaskEdit({
                  ...taskEdit,
                  title: e.target.value,
                })
              }
            />
            <TextField
              size="small"
              type="number"
              value={taskEdit.budgetAllocated}
              onChange={(e) =>
                setTaskEdit({
                  ...taskEdit,
                  budgetAllocated: e.target.value,
                })
              }
            />
            <Button onClick={onUpdateTask}>Save</Button>
          </Box>
        ) : (
          <Typography fontWeight={500}>
            {task.title} — ₱{task.budgetAllocated} (
            {task.budgetPercent?.toFixed(2)}%)
          </Typography>
        )}

        <Box
          className="task-actions"
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            display: "flex",
            gap: 1,
            opacity: 0,
          }}
        >
          <Button size="small" onClick={() => onEditTask(task)}>
            Edit
          </Button>
          <Button
            size="small"
            color="error"
            onClick={() => onDeleteTask(task.id)}
          >
            Delete
          </Button>
        </Box>
      </Box>

      {/* SUBTASK SECTION */}
      <SubtaskList
        task={task}
        subtaskInputs={subtaskInputs}
        setSubtaskInputs={setSubtaskInputs}
        members={members}
        projectId={projectId}
        onUpdateSubtask={onUpdateSubtask}
        onDeleteSubtask={onDeleteSubtask}
        onEditSubtask={onEditSubtask}
        onAddSubtask={onAddSubtask}
      />
    </Box>
  );
}
