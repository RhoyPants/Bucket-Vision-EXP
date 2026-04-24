import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Select,
  MenuItem,
  CircularProgress,
  FormHelperText,
  FormControl,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import { getEngagedUsers } from "@/app/redux/controllers/projectMemberController";
import AssignUsersSelect from "@/app/components/shared/selectors/AssignUsersSelect";
import AddIcon from "@mui/icons-material/Add";
import {
  validateSubtaskForm,
  calculateBudgetPercent,
  getFieldError,
  hasFieldError,
  getPriorityColor,
  formatDateForInput,
  ValidationError,
} from "@/app/utils/subtaskValidation";

interface SubtaskFormProps {
  taskId: string;
  taskBudget: number;
  projectId?: string;
  subtaskInputs: Record<string, any>;
  setSubtaskInputs: (inputs: any) => void;
  members?: any[];
  onAddSubtask: (taskId: string) => void;
}

export default function SubtaskForm({
  taskId,
  taskBudget,
  projectId,
  subtaskInputs,
  setSubtaskInputs,
  members,
  onAddSubtask,
}: SubtaskFormProps) {
  const dispatch = useAppDispatch();
  const { engagedUsers } = useAppSelector((state) => state.projectMembers);
  const { fullProject } = useAppSelector((state) => state.project);
  const { users = [] } = useAppSelector((state) => state.user);

  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  // Load engaged users if projectId is provided
  useEffect(() => {
    if (projectId) {
      dispatch(getEngagedUsers(projectId) as any);
    }
  }, [projectId, dispatch]);

  const isOpen = subtaskInputs[taskId]?.open;
  const form = subtaskInputs[taskId] || {};

  // Include owner with engaged users
  const assignableUsers = useMemo(() => {
    const userIds = new Set(engagedUsers.map((u: any) => u.id || u.userId));

    if (fullProject?.ownerId && users.length > 0) {
      const ownerUser = users.find((u: any) => u.id === fullProject.ownerId);
      if (ownerUser && !userIds.has(ownerUser.id)) {
        return [ownerUser, ...engagedUsers];
      }
    }

    return engagedUsers;
  }, [engagedUsers, fullProject?.ownerId, users]);

  const budgetPercent =
    form.budgetAllocated && taskBudget > 0
      ? calculateBudgetPercent(form.budgetAllocated, taskBudget)
      : 0;

  const handleChange = (field: string, value: any) => {
    setSubtaskInputs((prev: any) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        [field]: value,
      },
    }));
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  const handleSubmit = async () => {
    // Convert user objects to IDs
    const userIds = form.users?.map((u: any) => u.id || u.userId) || [];

    const formData = {
      title: form.title,
      description: form.description,
      priority: form.priority,
      projectedStartDate: form.projectedStartDate,
      projectedEndDate: form.projectedEndDate,
      budgetAllocated: form.budgetAllocated,
      remarks: form.remarks,
      userIds,
    };

    const validation = validateSubtaskForm(formData, taskBudget);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setSaving(true);
    try {
      onAddSubtask(taskId);
      setSubtaskInputs((prev: any) => ({
        ...prev,
        [taskId]: {},
      }));
      setErrors([]);
      setTouched({});
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) {
    return (
      <Box
        sx={{
          minWidth: 200,
          borderRadius: 1,
          border: "2px dashed #6366f1",
          p: 2,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f0f4ff",
          cursor: "pointer",
          transition: "all 0.2s",
          "&:hover": {
            backgroundColor: "#e0e7ff",
            borderColor: "#4f46e5",
          },
        }}
        onClick={() =>
          setSubtaskInputs((prev: any) => ({
            ...prev,
            [taskId]: { open: true },
          }))
        }
      >
        <Box textAlign="center">
          <AddIcon sx={{ fontSize: 28, color: "#4f46e5", mb: 0.5 }} />
          <Typography fontSize={12} fontWeight={600} color="#4f46e5">
            Add Subtask
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minWidth: 280,
        borderRadius: 1,
        border: "2px solid #6366f1",
        p: 2,
        flexShrink: 0,
        backgroundColor: "#f0f4ff",
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      }}
    >
      <Typography variant="caption" fontWeight={600} color="#4f46e5">
        New Subtask
      </Typography>

      {/* Title */}
      <TextField
        size="small"
        label="Title"
        placeholder="Subtask name"
        value={form.title || ""}
        onChange={(e) => handleChange("title", e.target.value)}
        onBlur={() => handleBlur("title")}
        error={hasFieldError("title", errors)}
        helperText={getFieldError("title", errors) || ""}
        disabled={saving}
      />

      {/* Priority & Budget in row */}
      <Box display="flex" gap={1}>
        <FormControl size="small" sx={{ flex: 1 }} error={hasFieldError("priority", errors)}>
          <Select
            label="Priority"
            value={form.priority || ""}
            onChange={(e) => handleChange("priority", e.target.value)}
            onBlur={() => handleBlur("priority")}
            disabled={saving}
          >
            <MenuItem value="">Select Priority</MenuItem>
            <MenuItem value="HIGH">HIGH</MenuItem>
            <MenuItem value="MEDIUM">MEDIUM</MenuItem>
            <MenuItem value="LOW">LOW</MenuItem>
          </Select>
          {hasFieldError("priority", errors) && (
            <FormHelperText>{getFieldError("priority", errors)}</FormHelperText>
          )}
        </FormControl>

        <TextField
          size="small"
          label="Budget"
          placeholder="0.00"
          type="number"
          inputProps={{ step: "0.01" }}
          value={form.budgetAllocated || ""}
          onChange={(e) => handleChange("budgetAllocated", parseFloat(e.target.value) || 0)}
          onBlur={() => handleBlur("budgetAllocated")}
          error={hasFieldError("budgetAllocated", errors)}
          helperText={getFieldError("budgetAllocated", errors) || ""}
          sx={{ flex: "0 1 100px" }}
          disabled={saving}
        />
      </Box>

      {/* Budget Percent Display */}
      {form.budgetAllocated && (
        <Typography
          variant="caption"
          sx={{
            backgroundColor: "#6366f1",
            color: "#fff",
            px: 1,
            py: 0.5,
            borderRadius: 0.5,
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          {budgetPercent.toFixed(1)}% of ₱{taskBudget.toLocaleString()}
        </Typography>
      )}

      {/* Dates */}
      <Box display="flex" gap={1}>
        <TextField
          size="small"
          label="Start Date"
          type="date"
          value={formatDateForInput(form.projectedStartDate)}
          onChange={(e) => handleChange("projectedStartDate", e.target.value)}
          onBlur={() => handleBlur("projectedStartDate")}
          error={hasFieldError("projectedStartDate", errors)}
          helperText={getFieldError("projectedStartDate", errors) || ""}
          InputLabelProps={{ shrink: true }}
          inputProps={{ "aria-label": "start date" }}
          sx={{ flex: 1 }}
          disabled={saving}
        />

        <TextField
          size="small"
          label="End Date"
          type="date"
          value={formatDateForInput(form.projectedEndDate)}
          onChange={(e) => handleChange("projectedEndDate", e.target.value)}
          onBlur={() => handleBlur("projectedEndDate")}
          error={hasFieldError("projectedEndDate", errors)}
          helperText={getFieldError("projectedEndDate", errors) || ""}
          InputLabelProps={{ shrink: true }}
          inputProps={{ "aria-label": "end date" }}
          sx={{ flex: 1 }}
          disabled={saving}
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
          value={form.users || []}
          onChange={(users) => handleChange("users", users)}
        />
        {touched.userIds && hasFieldError("userIds", errors) && (
          <Typography variant="caption" color="error" display="block" mt={0.5}>
            {getFieldError("userIds", errors)}
          </Typography>
        )}
      </Box>

      {/* Description */}
      <TextField
        size="small"
        label="Description (Optional)"
        placeholder="Add details..."
        multiline
        rows={2}
        value={form.description || ""}
        onChange={(e) => handleChange("description", e.target.value)}
        onBlur={() => handleBlur("description")}
        error={touched.description && hasFieldError("description", errors)}
        helperText={
          touched.description
            ? getFieldError("description", errors)
            : `${form.description?.length || 0}/500`
        }
        disabled={saving}
      />

      {/* Remarks */}
      {/* <TextField
        size="small"
        label="Remarks (Optional)"
        placeholder="Add remarks..."
        multiline
        rows={2}
        value={form.remarks || ""}
        onChange={(e) => handleChange("remarks", e.target.value)}
        onBlur={() => handleBlur("remarks")}
        error={touched.remarks && hasFieldError("remarks", errors)}
        helperText={
          touched.remarks
            ? getFieldError("remarks", errors)
            : `${form.remarks?.length || 0}/500`
        }
        disabled={saving}
      /> */}

      {/* Actions */}
      <Box display="flex" gap={1}>
        <Button
          size="small"
          variant="contained"
          startIcon={saving ? <CircularProgress size={14} /> : <AddIcon />}
          onClick={handleSubmit}
          disabled={saving}
          sx={{
            backgroundColor: "#4f46e5",
            color: "#fff",
            "&:hover": { backgroundColor: "#4338ca" },
            fontWeight: 600,
            flex: 1,
          }}
        >
          {saving ? "Adding..." : "Add"}
        </Button>

        <Button
          size="small"
          onClick={() =>
            setSubtaskInputs((prev: any) => ({
              ...prev,
              [taskId]: {},
            }))
          }
          disabled={saving}
          sx={{
            flex: 1,
            textTransform: "none",
          }}
        >
          Cancel
        </Button>
      </Box>
    </Box>
  );
}
