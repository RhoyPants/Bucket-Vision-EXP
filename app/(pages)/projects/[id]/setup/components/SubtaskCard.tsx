import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  FormHelperText,
  FormControl,
} from "@mui/material";
import { useAppSelector } from "@/app/redux/hook";
import AssignUsersSelect from "@/app/components/shared/selectors/AssignUsersSelect";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import {
  validateSubtaskForm,
  calculateBudgetPercent,
  getFieldError,
  hasFieldError,
  getPriorityColor,
  getPriorityBgColor,
  formatDateForInput,
  ValidationError,
} from "@/app/utils/subtaskValidation";

interface SubtaskCardProps {
  sub: any;
  taskId: string;
  taskBudget: number;
  isEditing: boolean;
  subtaskInputs: Record<string, any>;
  setSubtaskInputs: (inputs: any) => void;
  members: any[];
  projectId?: string;
  onUpdate: (subId: string, taskId: string) => void;
  onDelete: (subId: string, taskId: string) => void;
  onEdit: () => void;
}

export default function SubtaskCard({
  sub,
  taskId,
  taskBudget,
  isEditing,
  subtaskInputs,
  setSubtaskInputs,
  members,
  projectId,
  onUpdate,
  onDelete,
  onEdit,
}: SubtaskCardProps) {
  const { engagedUsers } = useAppSelector((state) => state.projectMembers);
  const { fullProject } = useAppSelector((state) => state.project);
  const { users = [] } = useAppSelector((state) => state.user);
  
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const form = subtaskInputs[taskId] || {};

  // Include owner with engaged users
  const assignableUsers = useMemo(() => {
    const userIds = new Set(engagedUsers.map((u: any) => u.id || u.userId));

    if (fullProject?.ownerId && users.length > 0) {
      const ownerUser = users.find((u: any) => u.id === fullProject.ownerId);
      if (ownerUser && !userIds.has(ownerUser.id)) {
        return [ownerUser, ...engagedUsers] as any[];
      }
    }

    return engagedUsers as any[];
  }, [engagedUsers, fullProject?.ownerId, users]);

  const budgetPercent = calculateBudgetPercent(sub.budgetAllocated || 0, taskBudget);

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

  const handleSave = async () => {
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
      onUpdate(sub.id, taskId);
      setErrors([]);
      setTouched({});
    } finally {
      setSaving(false);
    }
  };

  const priorityColor = getPriorityColor(sub.priority || "");
  const priorityBg = getPriorityBgColor(sub.priority || "");

  if (!isEditing) {
    // DISPLAY MODE
    return (
      <Box
        sx={{
          minWidth: 240,
          borderRadius: 1,
          p: 2,
          backgroundColor: "#f5f3ff",
          border: "2px solid #a78bfa",
          flexShrink: 0,
          transition: "all 0.2s",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(167, 139, 250, 0.2)",
            "& .sub-actions": { opacity: 1 },
          },
        }}
      >
        {/* Title & Priority */}
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1}>
          <Typography fontWeight={600} noWrap flex={1}>
            {sub.title}
          </Typography>
          {sub.priority && (
            <Chip
              label={sub.priority}
              size="small"
              sx={{
                backgroundColor: priorityColor,
                color: "#fff",
                fontWeight: 600,
                ml: 1,
                flexShrink: 0,
              }}
            />
          )}
        </Box>

        {/* Budget & Percent */}
        <Box display="flex" gap={1} mb={1} alignItems="center">
          <Typography variant="caption" fontWeight={600} color="#6b7280">
            ₱{sub.budgetAllocated?.toLocaleString() || 0}
          </Typography>
          <Chip
            label={`${budgetPercent.toFixed(1)}%`}
            size="small"
            sx={{
              backgroundColor: "#6366f1",
              color: "#fff",
              height: 20,
              fontWeight: 600,
            }}
          />
        </Box>

        {/* Dates */}
        <Box fontSize={11} color="#6b7280" mb={1} display="flex" gap={1} flexWrap="wrap">
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              Start:
            </Typography>{" "}
            {sub.projectedStartDate
              ? new Date(sub.projectedStartDate).toLocaleDateString()
              : "-"}
          </Box>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              End:
            </Typography>{" "}
            {sub.projectedEndDate
              ? new Date(sub.projectedEndDate).toLocaleDateString()
              : "-"}
          </Box>
        </Box>

        {/* Assignees */}
        {sub.assignees && sub.assignees.length > 0 && (
          <Box mb={1}>
            <Typography variant="caption" fontWeight={600} display="block" mb={0.5}>
              Assigned to:
            </Typography>
            <Box display="flex" gap={0.5} flexWrap="wrap">
              {sub.assignees?.slice(0, 2).map((a: any) => (
                <Chip
                  key={a.user?.id}
                  label={a.user?.name || "Unknown"}
                  size="small"
                  sx={{ height: 20, fontSize: "0.75rem" }}
                />
              ))}
              {sub.assignees?.length > 2 && (
                <Chip
                  label={`+${sub.assignees.length - 2}`}
                  size="small"
                  sx={{ height: 20, fontSize: "0.75rem" }}
                />
              )}
            </Box>
          </Box>
        )}

        {/* Actions */}
        <Box
          className="sub-actions"
          display="flex"
          gap={0.5}
          sx={{ opacity: { xs: 1, sm: 0 }, transition: "opacity 0.2s" }}
        >
          <IconButton
            size="small"
            onClick={onEdit}
            sx={{ color: "#6366f1", "&:hover": { backgroundColor: "#eef2ff" } }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onDelete(sub.id, taskId)}
            sx={{ color: "#ef4444", "&:hover": { backgroundColor: "#fef2f2" } }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    );
  }

  // EDIT MODE
  return (
    <Box
      sx={{
        minWidth: 280,
        borderRadius: 1,
        p: 2,
        backgroundColor: "#f5f3ff",
        border: "2px solid #a78bfa",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }}
    >
      <Typography variant="caption" fontWeight={600} color="#6366f1">
        Edit Subtask
      </Typography>

      {/* Title */}
      <TextField
        size="small"
        label="Title"
        value={form.title || ""}
        onChange={(e) => handleChange("title", e.target.value)}
        onBlur={() => handleBlur("title")}
        error={hasFieldError("title", errors)}
        helperText={getFieldError("title", errors) || ""}
        disabled={saving}
      />

      {/* Priority & Budget */}
      <Box display="flex" gap={1}>
        <FormControl size="small" sx={{ flex: 1 }} error={hasFieldError("priority", errors)}>
          <Select
            label="Priority"
            value={form.priority || ""}
            onChange={(e) => handleChange("priority", e.target.value)}
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
          type="number"
          inputProps={{ step: "0.01" }}
          value={form.budgetAllocated || ""}
          onChange={(e) => handleChange("budgetAllocated", parseFloat(e.target.value) || 0)}
          onBlur={() => handleBlur("budgetAllocated")}
          error={hasFieldError("budgetAllocated", errors)}
          helperText={getFieldError("budgetAllocated", errors) || ""}
          sx={{ flex: "0 1 90px" }}
          disabled={saving}
        />
      </Box>

      {/* Dates */}
      <Box display="flex" gap={1}>
        <TextField
          size="small"
          label="Start"
          type="date"
          value={formatDateForInput(form.projectedStartDate)}
          onChange={(e) => handleChange("projectedStartDate", e.target.value)}
          onBlur={() => handleBlur("projectedStartDate")}
          error={hasFieldError("projectedStartDate", errors)}
          helperText={getFieldError("projectedStartDate", errors) || ""}
          InputLabelProps={{ shrink: true }}
          sx={{ flex: 1 }}
          disabled={saving}
        />

        <TextField
          size="small"
          label="End"
          type="date"
          value={formatDateForInput(form.projectedEndDate)}
          onChange={(e) => handleChange("projectedEndDate", e.target.value)}
          onBlur={() => handleBlur("projectedEndDate")}
          error={hasFieldError("projectedEndDate", errors)}
          helperText={getFieldError("projectedEndDate", errors) || ""}
          InputLabelProps={{ shrink: true }}
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
      </Box>

      {/* Remarks */}
      <TextField
        size="small"
        label="Remarks (Optional)"
        placeholder="Add remarks..."
        multiline
        rows={2}
        value={form.remarks || ""}
        onChange={(e) => handleChange("remarks", e.target.value)}
        onBlur={() => handleBlur("remarks")}
        error={hasFieldError("remarks", errors)}
        helperText={getFieldError("remarks", errors) || ""}
        disabled={saving}
      />

      {/* Actions */}
      <Box display="flex" gap={1}>
        <IconButton
          size="small"
          onClick={handleSave}
          disabled={saving}
          sx={{ color: "#10b981", flex: 1 }}
        >
          {saving ? <CircularProgress size={20} /> : <SaveIcon />}
        </IconButton>
        <IconButton
          size="small"
          onClick={() => {
            setErrors([]);
            setTouched({});
          }}
          disabled={saving}
          sx={{ color: "#6b7280", flex: 1 }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
    </Box>
  );
}
