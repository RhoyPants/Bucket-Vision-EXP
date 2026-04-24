import { Box } from "@mui/material";
import CategoryCard from "./CategoryCard";

interface CategoryListProps {
  categories: any[];
  categoryEdit: any;
  setCategoryEdit: (cat: any) => void;
  taskEdit: any;
  setTaskEdit: (task: any) => void;
  taskInputs: Record<string, any>;
  setTaskInputs: (inputs: any) => void;
  subtaskInputs: Record<string, any>;
  setSubtaskInputs: (inputs: any) => void;
  members: any[];
  projectId?: string;
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

export default function CategoryList({
  categories,
  categoryEdit,
  setCategoryEdit,
  taskEdit,
  setTaskEdit,
  taskInputs,
  setTaskInputs,
  subtaskInputs,
  setSubtaskInputs,
  members,
  projectId,
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
}: CategoryListProps) {
  return (
    <Box mt={4}>
      {categories?.map((category: any) => (
        <CategoryCard
          key={category.id}
          category={category}
          categoryEdit={categoryEdit}
          setCategoryEdit={setCategoryEdit}
          taskEdit={taskEdit}
          setTaskEdit={setTaskEdit}
          taskInputs={taskInputs}
          setTaskInputs={setTaskInputs}
          subtaskInputs={subtaskInputs}
          setSubtaskInputs={setSubtaskInputs}
          members={members}
          projectId={projectId}
          onEditCategory={onEditCategory}
          onDeleteCategory={onDeleteCategory}
          onUpdateCategory={onUpdateCategory}
          onAddTask={onAddTask}
          onEditTask={onEditTask}
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
