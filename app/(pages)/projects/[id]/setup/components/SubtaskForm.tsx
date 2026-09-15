import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  MenuItem,
  CircularProgress,
  Backdrop,
  Stack,
  Autocomplete,
} from "@mui/material";
import { useAppSelector } from "@/app/redux/hook";
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
import DecimalBudgetField from "@/app/components/shared/DecimalBudgetField";
import {
  getProjectMaintenanceHierarchy,
  MaintenanceRecord,
} from "@/app/api-service/workBreakdownMaintenanceService";
import AnchoredDropdownPopper from "@/app/components/shared/selectors/AnchoredDropdownPopper";

const CUSTOM_SUBTASK_OPTION: MaintenanceRecord = {
  id: "__custom_subtask__",
  code: "CUSTOM",
  name: "Custom title",
  isActive: true,
};

interface SubtaskFormProps {
  taskId: string;
  taskMaintenanceId?: string;
  taskBudget: number;
  budgetRequired?: boolean;
  existingSubtasks?: any[];
  projectId?: string;
  wbsBusinessUnitIds?: string[];
  subtaskInputs: Record<string, any>;
  setSubtaskInputs: (inputs: any) => void;
  members?: any[];
  onAddSubtask: (taskId: string) => void;
}

export default function SubtaskForm({
  taskId,
  taskMaintenanceId,
  taskBudget,
  budgetRequired = true,
  existingSubtasks = [],
  projectId,
  wbsBusinessUnitIds = [],
  subtaskInputs,
  setSubtaskInputs,
  members,
  onAddSubtask,
}: SubtaskFormProps) {
  const { engagedUsers } = useAppSelector((state) => state.projectMembers);
  const { fullProject } = useAppSelector((state) => state.project);
  const { users = [] } = useAppSelector((state) => state.user);

  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [maintenanceSubtasks, setMaintenanceSubtasks] = useState<
    MaintenanceRecord[]
  >([]);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);

  const isOpen = subtaskInputs[taskId]?.open;
  const form = subtaskInputs[taskId] || {};
  const isCustomTitle = form.sourceType === "CUSTOM";
  const selectedSubtaskMaintenanceIds = new Set(
    existingSubtasks
      .map((subtask) => subtask.subtaskMaintenanceId)
      .filter(Boolean),
  );
  const availableMaintenanceSubtasks = maintenanceSubtasks.filter(
    (subtask) => subtask.isActive !== false && !selectedSubtaskMaintenanceIds.has(subtask.id),
  );

  useEffect(() => {
    if (!taskMaintenanceId || !projectId) {
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
  }, [taskMaintenanceId, projectId, wbsBusinessUnitIds]);

  // Include owner with engaged users
  const assignableUsers = useMemo(() => {
    const userIds = new Set(engagedUsers.map((u: any) => u.id || u.userId));

    if (fullProject?.ownerId && users.length > 0) {
      const ownerUser = users.find((u: any) => u.id === fullProject.ownerId);
      if (ownerUser && !userIds.has(ownerUser.id)) {
        return [ownerUser, ...engagedUsers] as any;
      }
    }

    return engagedUsers as any;
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
      budgetAllocated: budgetRequired ? form.budgetAllocated : 0,
      userIds,
    };

    const validation = validateSubtaskForm(
      formData,
      taskBudget,
      fullProject?.startDate,
      fullProject?.expectedEndDate,
      budgetRequired
    );

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setSaving(true);
    try {
      await onAddSubtask(taskId);
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
          width: "100%",
          minWidth: 0,
          minHeight: 270,
          alignSelf: "start",
          boxSizing: "border-box",
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
        width: "100%",
        minWidth: 0,
        alignSelf: "start",
        boxSizing: "border-box",
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
      {taskMaintenanceId ? (
        <Stack spacing={1}>
          <Autocomplete
            size="small"
            options={[...availableMaintenanceSubtasks, CUSTOM_SUBTASK_OPTION]}
            value={isCustomTitle ? CUSTOM_SUBTASK_OPTION : availableMaintenanceSubtasks.find((subtask) => subtask.id === form.subtaskMaintenanceId) || null}
            getOptionLabel={(subtask) => subtask.id === CUSTOM_SUBTASK_OPTION.id ? "Custom title" : `${subtask.name} (${subtask.code})`}
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
            onBlur={() => {
              if (!isCustomTitle) handleBlur("title");
            }}
            disabled={saving || maintenanceLoading}
            slots={{ popper: AnchoredDropdownPopper }}
            slotProps={{ listbox: { sx: { maxHeight: 280, "& .MuiAutocomplete-option": { fontSize: 12, "&:hover": { bgcolor: "#E8E1F8" }, "&.Mui-focused": { bgcolor: "#DED3F5" }, '&[aria-selected="true"]': { bgcolor: "#D4C6F0", color: "#24106F", fontWeight: 700 } } } } }}
            renderOption={(props, subtask) => {
              const { key, ...optionProps } = props;
              const isCustom = subtask.id === CUSTOM_SUBTASK_OPTION.id;
              return (
                <Box
                  component="li"
                  key={key}
                  {...optionProps}
                  sx={isCustom ? { mt: 0.5, borderTop: "1px solid #C4B5FD", bgcolor: "#F5F3FF", color: "#5B21B6", fontWeight: 800 } : undefined}
                >
                  <Typography component="span" sx={{ flex: 1, fontSize: 12, fontWeight: isCustom ? 800 : 500 }}>
                    {isCustom ? "Create a custom title" : `${subtask.name} (${subtask.code})`}
                  </Typography>
                  {isCustom && (
                    <Box component="span" sx={{ ml: 1, px: 0.75, py: 0.2, borderRadius: 999, bgcolor: "#7C3AED", color: "#FFF", fontSize: 8.5, fontWeight: 900, letterSpacing: 0.5 }}>
                      CUSTOM
                    </Box>
                  )}
                </Box>
              );
            }}
            renderInput={(params) => <TextField {...params} label="Title" error={!isCustomTitle && hasFieldError("title", errors)} helperText={!isCustomTitle ? getFieldError("title", errors) || "Select a standard subtask or choose Custom title." : "Custom title selected."} />}
          />
          {isCustomTitle && (
            <TextField
              autoFocus
              size="small"
              label="Custom subtask title"
              placeholder="Enter the subtask title"
              value={form.title || ""}
              onChange={(event) => handleChange("title", event.target.value)}
              onBlur={() => handleBlur("title")}
              error={hasFieldError("title", errors)}
              helperText={getFieldError("title", errors) || "This title applies only to this project."}
              disabled={saving}
            />
          )}
        </Stack>
      ) : (
        <TextField
          size="small"
          label="Custom subtask title"
          placeholder="Enter the subtask title"
          value={form.title || ""}
          onChange={(event) => {
            handleChange("sourceType", "CUSTOM");
            handleChange("subtaskMaintenanceId", "");
            handleChange("title", event.target.value);
          }}
          onBlur={() => handleBlur("title")}
          error={hasFieldError("title", errors)}
          helperText={getFieldError("title", errors) || "Enter a title for this project subtask."}
          disabled={saving}
        />
      )}

      {/* Priority & Budget in row */}
      <Box display="grid" gridTemplateColumns={budgetRequired ? "minmax(0, 1fr) minmax(0, 1fr)" : "minmax(0, 1fr)"} gap={1} alignItems="start">
        <TextField
          select
          size="small"
          label="Priority"
          value={form.priority || ""}
          onChange={(e) => handleChange("priority", e.target.value)}
          onBlur={() => handleBlur("priority")}
          error={hasFieldError("priority", errors)}
          helperText={getFieldError("priority", errors) || " "}
          disabled={saving}
        >
          <MenuItem value="">Select Priority</MenuItem>
          <MenuItem value="HIGH">HIGH</MenuItem>
          <MenuItem value="MEDIUM">MEDIUM</MenuItem>
          <MenuItem value="LOW">LOW</MenuItem>
        </TextField>

        {budgetRequired && <DecimalBudgetField
          size="small"
          label="Budget"
          placeholder="0"
          value={form.budgetAllocated}
          onValueChange={(value) => handleChange("budgetAllocated", value)}
          onBlur={() => handleBlur("budgetAllocated")}
          error={hasFieldError("budgetAllocated", errors)}
          helperText={getFieldError("budgetAllocated", errors) || " "}
          disabled={saving || !budgetRequired}
        />}
      </Box>

      {/* Budget Percent Display */}
      {budgetRequired && form.budgetAllocated && (
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
          helperText={getFieldError("projectedStartDate", errors) || (fullProject?.startDate ? `Min: ${new Date(fullProject.startDate).toLocaleDateString()}` : "")}
          InputLabelProps={{ shrink: true }}
          inputProps={{ 
            "aria-label": "start date",
            min: fullProject?.startDate ? fullProject.startDate.split("T")[0] : undefined,
            max: form.projectedEndDate ? form.projectedEndDate : (fullProject?.expectedEndDate ? fullProject.expectedEndDate.split("T")[0] : undefined),
          }}
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
          helperText={getFieldError("projectedEndDate", errors) || (fullProject?.expectedEndDate ? `Max: ${new Date(fullProject.expectedEndDate).toLocaleDateString()}` : "")}
          InputLabelProps={{ shrink: true }}
          inputProps={{ 
            "aria-label": "end date",
            min: form.projectedStartDate ? form.projectedStartDate : (fullProject?.startDate ? fullProject.startDate.split("T")[0] : undefined),
            max: fullProject?.expectedEndDate ? fullProject.expectedEndDate.split("T")[0] : undefined,
          }}
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

      {/* LOADING MODAL */}
      <Backdrop
        open={saving}
        sx={{
          color: "#fff",
          zIndex: 1300,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
      >
        <Stack alignItems="center" gap={2}>
          <CircularProgress color="inherit" size={50} />
          <Typography fontWeight={600} fontSize={16}>
            Adding Subtask...
          </Typography>
        </Stack>
      </Backdrop>
    </Box>
  );
}
