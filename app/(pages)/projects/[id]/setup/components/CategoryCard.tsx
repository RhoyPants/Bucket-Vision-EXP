import { Box, Button, TextField, Typography } from "@mui/material";
import TaskForm from "./TaskForm";
import TaskCard from "./TaskCard";

interface CategoryCardProps {
  category: any;
  categoryEdit: any;
  setCategoryEdit: (cat: any) => void;
  taskEdit: any;
  setTaskEdit: (task: any) => void;
  taskInputs: Record<string, any>;
  setTaskInputs: (inputs: any) => void;
  subtaskInputs: Record<string, any>;
  setSubtaskInputs: (inputs: any) => void;
  members: any[];
  onEditCategory: (cat: any) => void;
  onDeleteCategory: (catId: string) => void;
  onUpdateCategory: () => void;
  onAddTask: (categoryId: string) => void;
  onEditTask: (task: any) => void;
  onUpdateTask: () => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateSubtask: (subId: string, taskId: string) => void;
  onDeleteSubtask: (subId: string, taskId: string) => void;
  onEditSubtask: (sub: any, taskId: string) => void;
  onAddSubtask: (taskId: string) => void;
}

export default function CategoryCard({
  category,
  categoryEdit,
  setCategoryEdit,
  taskEdit,
  setTaskEdit,
  taskInputs,
  setTaskInputs,
  subtaskInputs,
  setSubtaskInputs,
  members,
  onEditCategory,
  onDeleteCategory,
  onUpdateCategory,
  onAddTask,
  onEditTask,
  onUpdateTask,
  onDeleteTask,
  onUpdateSubtask,
  onDeleteSubtask,
  onEditSubtask,
  onAddSubtask,
}: CategoryCardProps) {
  return (
    <Box
      sx={{
        backgroundColor: "#f5f5f5",
        p: 3,
        mb: 3,
        border: "2px solid #00b7ff",
        borderRadius: 3,
        position: "relative",
        "&:hover .cat-actions": { opacity: 1 },
      }}
    >
      {/* CATEGORY HEADER */}
      <Box position="relative">
        {categoryEdit?.id === category.id ? (
          <Box display="flex" gap={1}>
            <TextField
              size="small"
              value={categoryEdit.name}
              onChange={(e) =>
                setCategoryEdit({
                  ...categoryEdit,
                  name: e.target.value,
                })
              }
            />
            <TextField
              size="small"
              type="number"
              value={categoryEdit.budgetAllocated}
              onChange={(e) =>
                setCategoryEdit({
                  ...categoryEdit,
                  budgetAllocated: e.target.value,
                })
              }
            />
            <Button onClick={onUpdateCategory}>Save</Button>
          </Box>
        ) : (
          <Typography fontWeight={600}>
            {category.name} — ₱{category.budgetAllocated} (
            {category.budgetPercent?.toFixed(2)}%)
          </Typography>
        )}

        <Box
          className="cat-actions"
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            display: "flex",
            gap: 1,
            opacity: 0,
          }}
        >
          <Button size="small" onClick={() => onEditCategory(category)}>
            Edit
          </Button>
          <Button
            size="small"
            color="error"
            onClick={() => onDeleteCategory(category.id)}
          >
            Delete
          </Button>
        </Box>
      </Box>

      {/* TASK INPUT */}
      <TaskForm
        categoryId={category.id}
        taskInputs={taskInputs}
        setTaskInputs={setTaskInputs}
        onAddTask={onAddTask}
      />

      {/* TASK LIST */}
      <Box mt={3}>
        {category.tasks?.map((task: any) => (
          <TaskCard
            key={task.id}
            task={task}
            taskEdit={taskEdit}
            setTaskEdit={setTaskEdit}
            subtaskInputs={subtaskInputs}
            setSubtaskInputs={setSubtaskInputs}
            members={members}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onUpdateTask={onUpdateTask}
            onUpdateSubtask={onUpdateSubtask}
            onDeleteSubtask={onDeleteSubtask}
            onEditSubtask={onEditSubtask}
            onAddSubtask={onAddSubtask}
          />
        ))}
      </Box>
    </Box>
  );
}
