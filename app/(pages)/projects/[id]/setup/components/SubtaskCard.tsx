import React, { useEffect, useState, useMemo } from "react";
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
  Autocomplete,
  Stack,
} from "@mui/material";
import DecimalBudgetField from "@/app/components/shared/DecimalBudgetField";
import { useAppDispatch, useAppSelector } from "@/app/redux/hook";
import ChecklistForm from "./ChecklistForm";
import {
  addChecklist,
  deleteChecklist,
  toggleChecklist,
  updateChecklist,
  moveChecklist,
} from "@/app/redux/controllers/subTaskController";
import AssignUsersSelect from "@/app/components/shared/selectors/AssignUsersSelect";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
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
import { getProjectMaintenanceHierarchy, MaintenanceRecord } from "@/app/api-service/workBreakdownMaintenanceService";
import AnchoredDropdownPopper from "@/app/components/shared/selectors/AnchoredDropdownPopper";

const CUSTOM_SUBTASK_OPTION: MaintenanceRecord = {
  id: "__custom_subtask__",
  code: "CUSTOM",
  name: "Custom title",
  isActive: true,
};

interface SubtaskCardProps {
  sub: any;
  orderLabel: string;
  taskId: string;
  taskBudget: number;
  budgetRequired?: boolean;
  isEditing: boolean;
  subtaskInputs: Record<string, any>;
  setSubtaskInputs: (inputs: any) => void;
  members: any[];
  projectId?: string;
  taskMaintenanceId?: string;
  wbsBusinessUnitIds?: string[];
  existingSubtasks?: any[];
  onUpdate: (subId: string, taskId: string) => void;
  onDelete: (subId: string, taskId: string) => void;
  onEdit: () => void;
  reorderOnly?: boolean;
}

function SubtaskCard({
  sub,
  orderLabel,
  taskId,
  taskBudget,
  budgetRequired = true,
  isEditing,
  subtaskInputs,
  setSubtaskInputs,
  members,
  projectId,
  taskMaintenanceId,
  wbsBusinessUnitIds = [],
  existingSubtasks = [],
  onUpdate,
  onDelete,
  onEdit,
  reorderOnly = false,
}: SubtaskCardProps) {
  const dispatch = useAppDispatch();
  const { engagedUsers } = useAppSelector((state) => state.projectMembers);
  const { fullProject } = useAppSelector((state) => state.project);
  const { users = [] } = useAppSelector((state) => state.user);
  
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [checklistsLocal, setChecklistsLocal] = useState<any[]>(sub.checklists || []);
  const [maintenanceSubtasks, setMaintenanceSubtasks] = useState<MaintenanceRecord[]>([]);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);

  const form = subtaskInputs[taskId] || {};
  const isCustomTitle = form.sourceType === "CUSTOM";
  const selectedByOtherSubtasks = new Set(
    existingSubtasks
      .filter((item) => item.id !== sub.id)
      .map((item) => item.subtaskMaintenanceId)
      .filter(Boolean),
  );
  const availableMaintenanceSubtasks = maintenanceSubtasks.filter(
    (item) => item.isActive !== false && !selectedByOtherSubtasks.has(item.id),
  );

  useEffect(() => {
    if (!isEditing || !taskMaintenanceId || !projectId) {
      setMaintenanceSubtasks([]);
      return;
    }
    let active = true;
    setMaintenanceLoading(true);
    getProjectMaintenanceHierarchy(projectId, wbsBusinessUnitIds)
      .then((hierarchy) => {
        const items = hierarchy.flatMap((scope) => scope.tasks ?? []).find((task) => task.id === taskMaintenanceId)?.subtasks ?? [];
        if (active) setMaintenanceSubtasks(items);
      })
      .finally(() => {
        if (active) setMaintenanceLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isEditing, projectId, taskMaintenanceId, wbsBusinessUnitIds]);

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
      budgetAllocated: budgetRequired ? form.budgetAllocated : 0,
      userIds,
    };

    const validation = validateSubtaskForm(formData, taskBudget, undefined, undefined, budgetRequired);

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
          width: "100%",
          minWidth: 0,
          boxSizing: "border-box",
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
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={0.75} mb={1}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.35, mb: 0.5 }}>
              <DragIndicatorRoundedIcon sx={{ color: "#8b5cf6", fontSize: 16 }} />
              <Chip label={`SUBTASK ${orderLabel}`} size="small" sx={{ height: 20, bgcolor: "#f3e8ff", color: "#6b21a8", fontSize: 8.5, fontWeight: 800 }} />
            </Box>
            <Typography fontWeight={600} noWrap>{sub.title}</Typography>
          </Box>
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
        {budgetRequired && <Box display="flex" gap={1} mb={1} alignItems="center">
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
        </Box>}

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

        {/* Inline Checklist — always visible in view mode, no need to enter edit */}
        <Box mb={1}>
          <ChecklistForm
            subtaskId={sub.id}
            checklists={checklistsLocal}
            onAddChecklist={async (subtaskId: string, title: string) => {
              const result = await dispatch(addChecklist({ subtaskId, title }) as any);
              if (result) setChecklistsLocal((prev: any[]) => [...prev, result]);
            }}
            onDeleteChecklist={async (checklistId: string) => {
              await dispatch(deleteChecklist(checklistId) as any);
              setChecklistsLocal((prev: any[]) => prev.filter((c) => c.id !== checklistId));
            }}
            onToggleChecklist={async (checklistId: string) => {
              await dispatch(toggleChecklist(checklistId) as any);
              setChecklistsLocal((prev: any[]) =>
                prev.map((c) => c.id === checklistId ? { ...c, isCompleted: !c.isCompleted } : c)
              );
            }}
            onEditChecklist={async (checklistId: string, title: string) => {
              await dispatch(updateChecklist(checklistId, title) as any);
              setChecklistsLocal((prev: any[]) =>
                prev.map((c) => c.id === checklistId ? { ...c, title } : c)
              );
            }}
            onMoveChecklist={async (checklistId: string, newOrder: number) => {
              await dispatch(moveChecklist(checklistId, newOrder) as any);
              // Re-fetch order from server response by shifting local orders optimistically
              setChecklistsLocal((prev: any[]) => {
                const sorted = [...prev].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                const fromIdx = sorted.findIndex((c) => c.id === checklistId);
                const toIdx = sorted.findIndex((c) => c.order === newOrder);
                if (fromIdx < 0 || toIdx < 0) return prev;
                const reordered = [...sorted];
                const [moved] = reordered.splice(fromIdx, 1);
                reordered.splice(toIdx, 0, moved);
                return reordered.map((c, i) => ({ ...c, order: i }));
              });
            }}
          />
        </Box>

        {/* Actions */}
        <Box
          className="sub-actions"
          display="flex"
          gap={0.5}
          sx={{ opacity: { xs: 1, sm: 0 }, transition: "opacity 0.2s" }}
        >
          {!reorderOnly && <IconButton
            size="small"
            onClick={onEdit}
            sx={{ color: "#6366f1", "&:hover": { backgroundColor: "#eef2ff" } }}
          >
            <EditIcon fontSize="small" />
          </IconButton>}
          {!reorderOnly && <IconButton
            size="small"
            onClick={() => onDelete(sub.id, taskId)}
            sx={{ color: "#ef4444", "&:hover": { backgroundColor: "#fef2f2" } }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>}
        </Box>
      </Box>
    );
  }

  // EDIT MODE
  return (
    <Box
      sx={{
        width: "100%",
        minWidth: 0,
        boxSizing: "border-box",
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
      {taskMaintenanceId ? (
        <Stack spacing={1}>
          <Autocomplete
            size="small"
            options={[...availableMaintenanceSubtasks, CUSTOM_SUBTASK_OPTION]}
            value={isCustomTitle ? CUSTOM_SUBTASK_OPTION : availableMaintenanceSubtasks.find((item) => item.id === form.subtaskMaintenanceId) || null}
            getOptionLabel={(item) => item.id === CUSTOM_SUBTASK_OPTION.id ? "Custom title" : `${item.name} (${item.code})`}
            isOptionEqualToValue={(option, selected) => option.id === selected.id}
            onChange={(_, selected) => {
              if (selected?.id === CUSTOM_SUBTASK_OPTION.id) {
                handleChange("sourceType", "CUSTOM");
                handleChange("subtaskMaintenanceId", "");
                handleChange("title", "");
                return;
              }
              handleChange("sourceType", selected ? "MAINTENANCE" : "");
              handleChange("subtaskMaintenanceId", selected?.id || "");
              handleChange("title", selected?.name || "");
            }}
            disabled={saving || maintenanceLoading}
            slots={{ popper: AnchoredDropdownPopper }}
            renderOption={(props, item) => {
              const { key, ...optionProps } = props;
              const isCustom = item.id === CUSTOM_SUBTASK_OPTION.id;
              return (
                <Box
                  component="li"
                  key={key}
                  {...optionProps}
                  sx={isCustom ? { mt: 0.5, borderTop: "1px solid #C4B5FD", bgcolor: "#F5F3FF", color: "#5B21B6", fontWeight: 800 } : undefined}
                >
                  <Typography component="span" sx={{ flex: 1, fontSize: 12, fontWeight: isCustom ? 800 : 500 }}>
                    {isCustom ? "Create a custom title" : `${item.name} (${item.code})`}
                  </Typography>
                  {isCustom && (
                    <Box component="span" sx={{ ml: 1, px: 0.75, py: 0.2, borderRadius: 999, bgcolor: "#7C3AED", color: "#FFF", fontSize: 8.5, fontWeight: 900, letterSpacing: 0.5 }}>
                      CUSTOM
                    </Box>
                  )}
                </Box>
              );
            }}
            renderInput={(params) => <TextField {...params} label="Title" error={!isCustomTitle && hasFieldError("title", errors)} helperText={!isCustomTitle ? getFieldError("title", errors) : undefined} />}
          />
          {isCustomTitle && <TextField autoFocus size="small" label="Custom subtask title" placeholder="Enter the subtask title" value={form.title || ""} onChange={(event) => handleChange("title", event.target.value)} onBlur={() => handleBlur("title")} error={hasFieldError("title", errors)} helperText={getFieldError("title", errors)} disabled={saving} />}
        </Stack>
      ) : (
        <TextField size="small" label="Custom subtask title" value={form.title || ""} onChange={(event) => handleChange("title", event.target.value)} onBlur={() => handleBlur("title")} error={hasFieldError("title", errors)} helperText={getFieldError("title", errors) || ""} disabled={saving} />
      )}

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

        {budgetRequired && <DecimalBudgetField
          size="small"
          label="Budget"
          value={form.budgetAllocated}
          onValueChange={(value) => handleChange("budgetAllocated", value)}
          onBlur={() => handleBlur("budgetAllocated")}
          error={hasFieldError("budgetAllocated", errors)}
          helperText={getFieldError("budgetAllocated", errors) || ""}
          disabled={saving || !budgetRequired}
          sx={{ flex: "0 1 90px" }}
        />}
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
        error={hasFieldError("description", errors)}
        helperText={getFieldError("description", errors) || `${form.description?.length || 0}/500`}
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
            // Clear editId so isEditing becomes false in parent
            setSubtaskInputs((prev: any) => ({
              ...prev,
              [taskId]: { ...prev[taskId], editId: undefined },
            }));
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

export default React.memo(SubtaskCard);
