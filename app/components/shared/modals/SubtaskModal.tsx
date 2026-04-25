"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  FormHelperText,
  CircularProgress,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { createSubtask, updateSubtask } from "@/app/redux/controllers/subTaskController";
import { getEngagedUsers } from "@/app/redux/controllers/projectMemberController";
import AssignUsersSelect from "@/app/components/shared/selectors/AssignUsersSelect";
import {
  validateSubtaskForm,
  calculateBudgetPercent,
  getFieldError,
  hasFieldError,
  formatDateForInput,
} from "@/app/utils/subtaskValidation";
import EditIcon from "@mui/icons-material/Edit";

export default function SubtaskModal({
  open,
  onClose,
  mode = "create",
  subtask = null,
  taskId = "",
  taskBudget = 0,
  projectId = "",
}: {
  open: boolean;
  onClose: () => void;
  mode?: "create" | "view" | "edit";
  subtask?: any | null;
  taskId?: string;
  taskBudget?: number;
  projectId?: string;
}) {
  const dispatch = useAppDispatch();
  const { engagedUsers } = useAppSelector((state) => state.projectMembers);
  const { fullProject } = useAppSelector((state) => state.project);
  const { users = [] } = useAppSelector((state) => state.user);

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    projectedStartDate: "",
    projectedEndDate: "",
    budgetAllocated: 0,
    budgetPercent: 0,
    remarks: "",
    users: [],
  });

  const [localMode, setLocalMode] = useState<"create" | "view" | "edit">(mode);
  const [errors, setErrors] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (projectId) {
      dispatch(getEngagedUsers(projectId) as any);
    }
  }, [projectId, dispatch]);

  useEffect(() => {
    if (mode === "create") {
      setForm({
        title: "",
        description: "",
        priority: "Medium",
        projectedStartDate: "",
        projectedEndDate: "",
        budgetAllocated: 0,
        budgetPercent: 0,
        remarks: "",
        users: [],
      });
      setLocalMode("create");
    } else if (mode === "view" || mode === "edit") {
      if (subtask) {
        // 🔥 Handle both assignees (backend) and userIds (Kanban card)
        let assignedUsers = [];
        if (subtask.assignees?.length > 0) {
          assignedUsers = subtask.assignees.map((a: any) => {
            // Extract the user object and ensure it has id and name
            const user = a.user || a;
            return {
              ...user,
              id: user.id, // Ensure id is present
              name: user.name || "Unknown", // Ensure name is present
            };
          }).filter((u: any) => u && u.id); // Filter out invalid users
          console.log("📌 Assigned Users from subtask:", assignedUsers);
        } else if (subtask.userIds?.length > 0) {
          // If only userIds provided, map to user objects from engagedUsers
          assignedUsers = subtask.userIds
            .map((id: string) => engagedUsers.find((u: any) => (u.id || u.userId) === id))
            .filter(Boolean);
        }

        setForm({
          title: subtask.title || "",
          description: subtask.description || "",
          priority: subtask.priority || "Medium",
          projectedStartDate: subtask.projectedStartDate || "",
          projectedEndDate: subtask.projectedEndDate || "",
          budgetAllocated: subtask.budgetAllocated || 0,
          budgetPercent: subtask.budgetPercent || 0,
          remarks: subtask.remarks || "",
          users: assignedUsers,
        });
        setLocalMode("view");
      }
    }
  }, [open, subtask, mode, engagedUsers]);

  const assignableUsers = useMemo(() => {
    // Create a map to ensure uniqueness by id
    const userMap = new Map();
    
    // Add engaged users first
    engagedUsers.forEach((u: any) => {
      const userId = u.id || u.userId;
      if (userId) {
        userMap.set(userId, u);
      }
    });
    
    // Add owner if exists
    if (fullProject?.ownerId && users.length > 0) {
      const ownerUser = users.find((u: any) => u.id === fullProject.ownerId);
      if (ownerUser && !userMap.has(ownerUser.id)) {
        userMap.set(ownerUser.id, ownerUser);
      }
    }
    
    // 🔥 IMPORTANT: Add currently assigned users to the list
    // This ensures they always appear in the dropdown even if not in engagedUsers
    if (form.users && Array.isArray(form.users)) {
      form.users.forEach((u: any) => {
        if (u && u.id && !userMap.has(u.id)) {
          userMap.set(u.id, u);
        }
      });
    }
    
    const result = Array.from(userMap.values());
    console.log("📌 Assignable Users:", result);
    return result;
  }, [engagedUsers, fullProject?.ownerId, users, form.users]);

  const budgetPercent =
    form.budgetAllocated && taskBudget > 0
      ? calculateBudgetPercent(form.budgetAllocated, taskBudget)
      : 0;

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    const userIds = form.users?.map((u: any) => u.id || u.userId) || [];

    const validation = validateSubtaskForm(
      {
        title: form.title,
        description: form.description,
        priority: form.priority,
        projectedStartDate: form.projectedStartDate,
        projectedEndDate: form.projectedEndDate,
        budgetAllocated: form.budgetAllocated,
        remarks: form.remarks,
        userIds,
      },
      taskBudget
    );

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setSaving(true);
    try {
      if (localMode === "create") {
        await dispatch(
          createSubtask(
            {
              title: form.title,
              description: form.description,
              priority: form.priority,
              projectedStartDate: form.projectedStartDate,
              projectedEndDate: form.projectedEndDate,
              budgetAllocated: form.budgetAllocated,
              budgetPercent: budgetPercent,
              remarks: form.remarks,
              userIds,
            },
            taskId
          ) as any
        );
      } else if (localMode === "edit" && subtask) {
        const updateTaskId = subtask.taskId || taskId;  // Use subtask.taskId or fallback to prop
        await dispatch(
          updateSubtask(
            subtask.id,
            {
              title: form.title,
              description: form.description,
              priority: form.priority,
              projectedStartDate: form.projectedStartDate,
              projectedEndDate: form.projectedEndDate,
              budgetAllocated: form.budgetAllocated,
              budgetPercent: budgetPercent,
              remarks: form.remarks,
              userIds,
            },
            updateTaskId  // 🔥 Pass taskId to reload kanban
          ) as any
        );
      }

      setErrors([]);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const isViewOnly = localMode === "view";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {localMode === "create" && "Create Subtask"}
        {localMode === "view" && "View Subtask"}
        {localMode === "edit" && "Edit Subtask"}
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Box display="flex" flexDirection="column" gap={2}>
          {/* Title */}
          <TextField
            label="Title"
            fullWidth
            size="small"
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            error={hasFieldError("title", errors)}
            helperText={getFieldError("title", errors) || ""}
            disabled={isViewOnly || saving}
          />

          {/* Priority & Budget */}
          <Box display="flex" gap={2}>
            <FormControl size="small" sx={{ flex: 1 }} error={hasFieldError("priority", errors)}>
              <Select
                value={form.priority}
                onChange={(e) => handleChange("priority", e.target.value)}
                disabled={isViewOnly || saving}
              >
                <MenuItem value="HIGH">HIGH</MenuItem>
                <MenuItem value="MEDIUM">MEDIUM</MenuItem>
                <MenuItem value="LOW">LOW</MenuItem>
              </Select>
              {hasFieldError("priority", errors) && (
                <FormHelperText>{getFieldError("priority", errors)}</FormHelperText>
              )}
            </FormControl>

            <TextField
              label="Budget"
              size="small"
              type="number"
              inputProps={{ step: "0.01" }}
              value={form.budgetAllocated}
              onChange={(e) =>
                handleChange("budgetAllocated", parseFloat(e.target.value) || 0)
              }
              error={hasFieldError("budgetAllocated", errors)}
              helperText={getFieldError("budgetAllocated", errors) || ""}
              sx={{ flex: 1 }}
              disabled={isViewOnly || saving}
            />
          </Box>

          {/* Budget Percent */}
          {form.budgetAllocated > 0 && (
            <Box
              sx={{
                backgroundColor: "#a78bfa",
                color: "#fff",
                px: 2,
                py: 1,
                borderRadius: 1,
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              ₱{form.budgetAllocated.toLocaleString()} ({budgetPercent.toFixed(1)}% of ₱
              {taskBudget.toLocaleString()})
            </Box>
          )}

          {/* Dates */}
          <Box display="flex" gap={2}>
            <TextField
              label="Projected Start"
              size="small"
              type="date"
              value={formatDateForInput(form.projectedStartDate)}
              onChange={(e) => handleChange("projectedStartDate", e.target.value)}
              onBlur={() => {}}
              error={hasFieldError("projectedStartDate", errors)}
              helperText={getFieldError("projectedStartDate", errors) || ""}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
              disabled={isViewOnly || saving}
            />

            <TextField
              label="Projected End"
              size="small"
              type="date"
              value={formatDateForInput(form.projectedEndDate)}
              onChange={(e) => handleChange("projectedEndDate", e.target.value)}
              onBlur={() => {}}
              error={hasFieldError("projectedEndDate", errors)}
              helperText={getFieldError("projectedEndDate", errors) || ""}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
              disabled={isViewOnly || saving}
            />
          </Box>

          {/* Assignees */}
          <Box>
            <Typography variant="caption" fontWeight={600} display="block" mb={0.5}>
              Assignees
            </Typography>
            <AssignUsersSelect
              members={assignableUsers}
              projectId={projectId}
              value={form.users}
              disabled={isViewOnly || saving}
              onChange={(users) => !isViewOnly && handleChange("users", users)}
            />
          </Box>

          {/* Description */}
          <TextField
            label="Description (Optional)"
            fullWidth
            size="small"
            multiline
            rows={3}
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            error={hasFieldError("description", errors)}
            helperText={
              getFieldError("description", errors) || `${form.description?.length || 0}/500`
            }
            disabled={isViewOnly || saving}
          />

          {/* Remarks */}
          <TextField
            label="Remarks (Optional)"
            fullWidth
            size="small"
            multiline
            rows={2}
            value={form.remarks}
            onChange={(e) => handleChange("remarks", e.target.value)}
            error={hasFieldError("remarks", errors)}
            helperText={
              getFieldError("remarks", errors) || `${form.remarks?.length || 0}/500`
            }
            disabled={isViewOnly || saving}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          {isViewOnly ? "Close" : "Cancel"}
        </Button>
        {isViewOnly && (
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => setLocalMode("edit")}
          >
            Edit
          </Button>
        )}
        {(localMode === "create" || localMode === "edit") && (
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : null}
          >
            {localMode === "create" ? "Create" : "Save"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
