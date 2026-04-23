import { Box, Button, TextField } from "@mui/material";

interface TaskFormProps {
  categoryId: string;
  taskInputs: Record<string, any>;
  setTaskInputs: (inputs: any) => void;
  onAddTask: (categoryId: string) => void;
}

export default function TaskForm({
  categoryId,
  taskInputs,
  setTaskInputs,
  onAddTask,
}: TaskFormProps) {
  return (
    <Box mt={2} display="flex" gap={2}>
      <TextField
        size="small"
        label="Task"
        value={taskInputs[categoryId]?.title || ""}
        onChange={(e) =>
          setTaskInputs((prev: any) => ({
            ...prev,
            [categoryId]: {
              ...prev[categoryId],
              title: e.target.value,
            },
          }))
        }
      />

      <TextField
        size="small"
        label="Budget"
        type="number"
        value={taskInputs[categoryId]?.budgetAllocated || ""}
        onChange={(e) =>
          setTaskInputs((prev: any) => ({
            ...prev,
            [categoryId]: {
              ...prev[categoryId],
              budgetAllocated: e.target.value,
            },
          }))
        }
      />

      <Button onClick={() => onAddTask(categoryId)}>+ Task</Button>
    </Box>
  );
}
