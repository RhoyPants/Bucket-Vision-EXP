import { Box, Button, TextField, Typography, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Chip } from "@mui/material";
import { useState } from "react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import WarningIcon from "@mui/icons-material/Warning";
import CloseIcon from "@mui/icons-material/Close";
import TaskForm from "./TaskForm";
import TaskCard from "./TaskCard";
import {
  validateCategoryForm,
  getFieldError,
  hasFieldError,
  calculateBudgetPercent,
  ValidationError,
} from "@/app/utils/categoryValidation";

interface CategoryCardProps {
  category: any;
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

export default function CategoryCard({
  category,
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
}: CategoryCardProps) {
  const [editModalOpen, setEditModalOpen] = useState(categoryEdit?.id === category.id);
  const [editErrors, setEditErrors] = useState<ValidationError[]>([]);
  const [editTouched, setEditTouched] = useState<Record<string, boolean>>({});
  const [editSaving, setEditSaving] = useState(false);

  const handleEditOpen = () => {
    onEditCategory(category);
    setEditModalOpen(true);
    setEditErrors([]);
    setEditTouched({});
  };

  const handleEditClose = () => {
    setEditModalOpen(false);
    setCategoryEdit(null);
  };

  const handleEditSubmit = async () => {
    const validation = validateCategoryForm({
      name: categoryEdit.name,
      projectId: category.projectId || "",
      budgetAllocated: Number(categoryEdit.budgetAllocated) || 0,
    });

    if (!validation.isValid) {
      setEditErrors(validation.errors);
      const allTouched: Record<string, boolean> = {};
      validation.errors.forEach((err) => {
        allTouched[err.field] = true;
      });
      setEditTouched(allTouched);
      return;
    }

    try {
      setEditSaving(true);
      setEditErrors([]);
      onUpdateCategory();
      handleEditClose();
    } catch (err: any) {
      setEditErrors([
        {
          field: "submit",
          message: err?.message || "Failed to update category",
        },
      ]);
    } finally {
      setEditSaving(false);
    }
  };

  const handleEditFieldBlur = (fieldName: string) => {
    setEditTouched((prev) => ({ ...prev, [fieldName]: true }));
  };

  const budgetPercent = calculateBudgetPercent(
    Number(category.budgetAllocated) || 0,
    Number(category.budgetAllocated) || 0
  );

  return (
    <>
      <Box
        sx={{
          backgroundColor: "white",
          p: 3,
          mb: 3,
          border: "1px solid #e5e7eb",
          borderRadius: 2,
          position: "relative",
          transition: "all 0.2s",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            "& .cat-actions": { opacity: 1 },
          },
        }}
      >
        {/* CATEGORY HEADER */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              {category.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ₱{(Number(category.budgetAllocated) || 0).toLocaleString()} ({category.budgetPercent?.toFixed(2)}%)
            </Typography>
          </Box>

          <Box
            className="cat-actions"
            sx={{
              display: "flex",
              gap: 1,
              opacity: 0,
              transition: "opacity 0.2s",
            }}
          >
            <IconButton
              size="small"
              onClick={handleEditOpen}
              sx={{ color: "primary.main" }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => onDeleteCategory(category.id)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* TASK INPUT */}
        <TaskForm
          categoryId={category.id}
          categoryBudget={Number(category.budgetAllocated) || 0}
          taskInputs={taskInputs}
          setTaskInputs={setTaskInputs}
          onAddTask={onAddTask}
          existingTasks={category.tasks || []}
        />

        {/* TASK LIST */}
        <Box mt={3}>
          {category.tasks?.map((task: any) => (
            <TaskCard
              key={task.id}
              task={task}
              categoryBudget={Number(category.budgetAllocated) || 0}
              subtaskInputs={subtaskInputs}
              setSubtaskInputs={setSubtaskInputs}
              members={members}
              projectId={projectId}
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

      {/* EDIT CATEGORY MODAL */}
      <Dialog
        open={editModalOpen}
        onClose={handleEditClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          Edit Category
          <IconButton size="small" onClick={handleEditClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {/* ERROR ALERT */}
          {editErrors.length > 0 && editErrors.some((e) => e.field === "submit") && (
            <Alert severity="error" sx={{ mb: 2 }} icon={<WarningIcon />}>
              <Typography fontWeight={600}>
                {editErrors.find((e) => e.field === "submit")?.message}
              </Typography>
            </Alert>
          )}

          {/* VALIDATION SUMMARY */}
          {editErrors.length > 0 && !editErrors.some((e) => e.field === "submit") && (
            <Alert
              severity="warning"
              sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
              icon={<WarningIcon />}
            >
              <Box>
                <Typography fontWeight={600} fontSize="0.95rem">
                  Please fix {editErrors.length} error{editErrors.length !== 1 ? "s" : ""}
                </Typography>
              </Box>
            </Alert>
          )}

          {/* CATEGORY NAME */}
          <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Category Name
              </Typography>
              <Chip label="*" size="small" variant="outlined" sx={{ height: 20 }} />
            </Box>
            <TextField
              fullWidth
              value={categoryEdit?.name || ""}
              onChange={(e) =>
                setCategoryEdit({
                  ...categoryEdit,
                  name: e.target.value,
                })
              }
              onBlur={() => handleEditFieldBlur("name")}
              error={editTouched.name && hasFieldError("name", editErrors)}
              helperText={editTouched.name && getFieldError("name", editErrors)}
              variant="outlined"
              size="small"
              placeholder="Enter category name"
              inputProps={{ maxLength: 100 }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            />
          </Box>

          {/* BUDGET ALLOCATED */}
          <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Budget Allocation
              </Typography>
              <Chip label="*" size="small" variant="outlined" sx={{ height: 20 }} />
            </Box>
            <TextField
              fullWidth
              type="number"
              value={categoryEdit?.budgetAllocated || ""}
              onChange={(e) =>
                setCategoryEdit({
                  ...categoryEdit,
                  budgetAllocated: e.target.value,
                })
              }
              onBlur={() => handleEditFieldBlur("budgetAllocated")}
              error={editTouched.budgetAllocated && hasFieldError("budgetAllocated", editErrors)}
              helperText={editTouched.budgetAllocated && getFieldError("budgetAllocated", editErrors)}
              variant="outlined"
              size="small"
              placeholder="0.00"
              InputProps={{
                startAdornment: "₱ ",
              }}
              inputProps={{ step: "0.01", min: "0" }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            />
          </Box>

          {/* DESCRIPTION */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Description
              </Typography>
              <Chip label="Optional" size="small" variant="filled" sx={{ height: 20, fontSize: "0.7rem" }} />
            </Box>
            <TextField
              fullWidth
              value={categoryEdit?.description || ""}
              onChange={(e) =>
                setCategoryEdit({
                  ...categoryEdit,
                  description: e.target.value,
                })
              }
              variant="outlined"
              size="small"
              placeholder="Describe this category..."
              multiline
              rows={2}
              inputProps={{ maxLength: 500 }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: "1px solid #e5e7eb", gap: 1 }}>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleEditSubmit}
            disabled={editSaving}
            sx={{
              borderRadius: 1,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            {editSaving ? "Updating..." : "Update Category"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
