import { Box, Button, TextField, Typography, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Chip } from "@mui/material";
import { useState } from "react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import WarningIcon from "@mui/icons-material/Warning";
import CloseIcon from "@mui/icons-material/Close";
import TaskForm from "./TaskForm";
import TaskCard from "./TaskCard";
import {
  validateScopeForm,
  getFieldError,
  hasFieldError,
  calculateBudgetPercent,
  ValidationError,
} from "@/app/utils/scopeValidation";

interface ScopeCardProps {
  scope: any;
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

export default function ScopeCard({
  scope,
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
}: ScopeCardProps) {
  const [editModalOpen, setEditModalOpen] = useState(scopeEdit?.id === scope.id);
  const [editErrors, setEditErrors] = useState<ValidationError[]>([]);
  const [editTouched, setEditTouched] = useState<Record<string, boolean>>({});
  const [editSaving, setEditSaving] = useState(false);

  const handleEditOpen = () => {
    onEditScope(scope);
    setEditModalOpen(true);
    setEditErrors([]);
    setEditTouched({});
  };

  const handleEditClose = () => {
    setEditModalOpen(false);
    setScopeEdit(null);
  };

  const handleEditSubmit = async () => {
    const validation = validateScopeForm({
      name: scopeEdit.name,
      projectId: scope.projectId || "",
      budgetAllocated: Number(scopeEdit.budgetAllocated) || 0,
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
      onUpdateScope();
      handleEditClose();
    } catch (err: any) {
      setEditErrors([
        {
          field: "submit",
          message: err?.message || "Failed to update scope",
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
    Number(scope.budgetAllocated) || 0,
    Number(scope.budgetAllocated) || 0
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
            "& .scope-actions": { opacity: 1 },
          },
        }}
      >
        {/* SCOPE HEADER */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              {scope.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ₱{(Number(scope.budgetAllocated) || 0).toLocaleString()} ({scope.budgetPercent?.toFixed(2)}%)
            </Typography>
          </Box>

          <Box
            className="scope-actions"
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
              onClick={() => onDeleteScope(scope.id)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* TASK INPUT */}
        <TaskForm
          scopeId={scope.id}
          scopeBudget={Number(scope.budgetAllocated) || 0}
          taskInputs={taskInputs}
          setTaskInputs={setTaskInputs}
          onAddTask={onAddTask}
          existingTasks={scope.tasks || []}
        />

        {/* TASK LIST */}
        <Box mt={3}>
          {scope.tasks?.map((task: any) => (
            <TaskCard
              key={task.id}
              task={task}
              scopeBudget={Number(scope.budgetAllocated) || 0}
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

      {/* EDIT SCOPE MODAL */}
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
          Edit Scope
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

          {/* SCOPE NAME */}
          <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Scope Name
              </Typography>
              <Chip label="*" size="small" variant="outlined" sx={{ height: 20 }} />
            </Box>
            <TextField
              fullWidth
              value={scopeEdit?.name || ""}
              onChange={(e) =>
                setScopeEdit({
                  ...scopeEdit,
                  name: e.target.value,
                })
              }
              onBlur={() => handleEditFieldBlur("name")}
              error={editTouched.name && hasFieldError("name", editErrors)}
              helperText={editTouched.name && getFieldError("name", editErrors)}
              variant="outlined"
              size="small"
              placeholder="Enter scope name"
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
              value={scopeEdit?.budgetAllocated || ""}
              onChange={(e) =>
                setScopeEdit({
                  ...scopeEdit,
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
              value={scopeEdit?.description || ""}
              onChange={(e) =>
                setScopeEdit({
                  ...scopeEdit,
                  description: e.target.value,
                })
              }
              variant="outlined"
              size="small"
              placeholder="Describe this scope..."
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
            {editSaving ? "Updating..." : "Update Scope"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
