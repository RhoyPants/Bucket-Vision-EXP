import { Box } from "@mui/material";
import CategoryCard from "./CategoryCard";

interface CategoryListProps {
  categories: any[];
  categoryEdit: any;
  setCategoryEdit: (cat: any) => void;
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
  onUpdateTask: (taskId: string, updates: any) => void;
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
