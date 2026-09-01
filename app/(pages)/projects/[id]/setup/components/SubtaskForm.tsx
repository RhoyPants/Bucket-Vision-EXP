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
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Alert,
  Switch,
} from "@mui/material";
import { useAppSelector } from "@/app/redux/hook";
import AssignUsersSelect from "@/app/components/shared/selectors/AssignUsersSelect";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
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
  createMaintenanceRecord,
  updateMaintenanceRecord,
  MaintenanceRecord,
} from "@/app/api-service/workBreakdownMaintenanceService";

interface SubtaskFormProps {
  taskId: string;
  taskName?: string;
  taskMaintenanceId?: string;
  taskBudget: number;
  budgetRequired?: boolean;
  existingSubtasks?: any[];
  projectId?: string;
  subtaskInputs: Record<string, any>;
  setSubtaskInputs: (inputs: any) => void;
  members?: any[];
  onAddSubtask: (taskId: string) => void;
}

export default function SubtaskForm({
  taskId,
  taskName,
  taskMaintenanceId,
  taskBudget,
  budgetRequired = true,
  existingSubtasks = [],
  projectId,
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
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [maintenanceSaving, setMaintenanceSaving] = useState(false);
  const [maintenanceError, setMaintenanceError] = useState("");
  const [maintenanceSuccess, setMaintenanceSuccess] = useState("");
  const [maintenanceForm, setMaintenanceForm] = useState({ code: "", name: "", description: "" });

  const isOpen = subtaskInputs[taskId]?.open;
  const form = subtaskInputs[taskId] || {};
  const selectedSubtaskMaintenanceIds = new Set(
    existingSubtasks
      .map((subtask) => subtask.subtaskMaintenanceId)
      .filter(Boolean),
  );
  const availableMaintenanceSubtasks = maintenanceSubtasks.filter(
    (subtask) => subtask.isActive !== false && !selectedSubtaskMaintenanceIds.has(subtask.id),
  );

  const loadMaintenanceSubtasks = async () => {
    if (!taskMaintenanceId || !projectId) return [];
    const hierarchy = await getProjectMaintenanceHierarchy(projectId);
    const items = hierarchy.flatMap((scope) => scope.tasks ?? []).find((task) => task.id === taskMaintenanceId)?.subtasks ?? [];
    setMaintenanceSubtasks(items);
    return items;
  };

  useEffect(() => {
    if (!taskMaintenanceId || !projectId) {
      setMaintenanceSubtasks([]);
      return;
    }

    let active = true;
    setMaintenanceLoading(true);
    getProjectMaintenanceHierarchy(projectId)
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
  }, [taskMaintenanceId, projectId]);

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
      budgetAllocated: form.budgetAllocated,
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

  const closeMaintenanceDialog = () => {
    if (maintenanceSaving) return;
    setMaintenanceDialogOpen(false);
    setMaintenanceError("");
    setMaintenanceSuccess("");
    setMaintenanceForm({ code: "", name: "", description: "" });
  };

  const handleCreateMaintenanceSubtask = async () => {
    if (!taskMaintenanceId) return;
    if (!maintenanceForm.code.trim() || !maintenanceForm.name.trim()) {
      setMaintenanceError("Code and name are required.");
      return;
    }

    try {
      setMaintenanceSaving(true);
      setMaintenanceError("");
      setMaintenanceSuccess("");
      await createMaintenanceRecord("subtask", {
        code: maintenanceForm.code.trim(),
        name: maintenanceForm.name.trim(),
        description: maintenanceForm.description.trim(),
        taskMaintenanceIds: [taskMaintenanceId],
      });
      await loadMaintenanceSubtasks();
      setMaintenanceForm({ code: "", name: "", description: "" });
      setMaintenanceSuccess("Subtask created and added to the dropdown. You can create another one or close this window.");
    } catch (requestError: any) {
      setMaintenanceError(requestError?.response?.data?.message || requestError?.message || "Unable to create subtask maintenance.");
    } finally {
      setMaintenanceSaving(false);
    }
  };

  const handleReactivateMaintenanceSubtask = async (subtask: MaintenanceRecord) => {
    try {
      setMaintenanceSaving(true);
      setMaintenanceError("");
      setMaintenanceSuccess("");
      await updateMaintenanceRecord("subtask", subtask.id, { isActive: true });
      await loadMaintenanceSubtasks();
      setMaintenanceSuccess(`${subtask.name} is now active and available in the dropdown.`);
    } catch (requestError: any) {
      setMaintenanceError(requestError?.response?.data?.message || requestError?.message || "Unable to activate this subtask.");
    } finally {
      setMaintenanceSaving(false);
    }
  };

  if (!isOpen) {
    return (
      <Box
        sx={{
          minWidth: 200,
          minHeight: 270,
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
      {taskMaintenanceId ? (
        <TextField
          select
          size="small"
          label="Title"
          value={form.subtaskMaintenanceId || ""}
          onChange={(e) => {
            const value = e.target.value;
            const selected = maintenanceSubtasks.find(
              (item) => item.id === value,
            );
            handleChange("sourceType", "MAINTENANCE");
            handleChange("subtaskMaintenanceId", value);
            handleChange("title", selected?.name || "");
          }}
          onBlur={() => handleBlur("title")}
          error={hasFieldError("title", errors)}
          helperText={
            getFieldError("title", errors) ||
            "Select a subtask allowed under this task."
          }
          disabled={saving || maintenanceLoading}
          SelectProps={{
            MenuProps: {
              PaperProps: { sx: { maxHeight: 280 } },
            },
          }}
        >
          <MenuItem value="" disabled>
            Select subtask
          </MenuItem>
          {availableMaintenanceSubtasks.map((subtask) => (
            <MenuItem key={subtask.id} value={subtask.id}>
              {subtask.name} ({subtask.code})
            </MenuItem>
          ))}
        </TextField>
      ) : (
        <TextField
          size="small"
          label="Title"
          placeholder="Subtask name"
          value={form.title || ""}
          onChange={(e) => {
            handleChange("sourceType", "CUSTOM");
            handleChange("subtaskMaintenanceId", "");
            handleChange("title", e.target.value);
          }}
          onBlur={() => handleBlur("title")}
          error={hasFieldError("title", errors)}
          helperText={getFieldError("title", errors) || "Legacy custom task"}
          disabled={saving}
        />
      )}

      {/* Priority & Budget in row */}
      <Box display="grid" gridTemplateColumns="minmax(0, 1fr) minmax(0, 1fr)" gap={1} alignItems="start">
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

        <DecimalBudgetField
          size="small"
          label="Budget"
          placeholder="0"
          value={form.budgetAllocated}
          onValueChange={(value) => handleChange("budgetAllocated", value)}
          onBlur={() => handleBlur("budgetAllocated")}
          error={hasFieldError("budgetAllocated", errors)}
          helperText={getFieldError("budgetAllocated", errors) || " "}
          disabled={saving || !budgetRequired}
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

      <Dialog
        open={maintenanceDialogOpen}
        disableEscapeKeyDown
        maxWidth="md"
        fullWidth
        onClose={(_event, reason) => {
          if (reason !== "backdropClick") closeMaintenanceDialog();
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, borderBottom: "1px solid #e2e8f0", p: 2.5 }}>
          <Box>
            <Typography sx={{ color: "#111827", fontSize: 18, fontWeight: 800 }}>
              Manage Subtask Maintenance
            </Typography>
            <Typography sx={{ mt: 0.35, color: "#64748b", fontSize: 12.5 }}>
              Task: <Box component="span" sx={{ color: "#1e3a8a", fontWeight: 800 }}>{taskName || "Current task"}</Box>
            </Typography>
          </Box>
          <IconButton
            aria-label="Close subtask maintenance"
            onClick={closeMaintenanceDialog}
            disabled={maintenanceSaving}
            sx={{
              color: "#dc2626",
              bgcolor: "#fee2e2",
              border: "1px solid #fecaca",
              "&:hover": { bgcolor: "#fecaca" },
              "&.Mui-disabled": { color: "#fca5a5", bgcolor: "#fef2f2" },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 2.5 }}>
          {maintenanceError && <Alert severity="error" sx={{ mb: 2 }}>{maintenanceError}</Alert>}
          {maintenanceSuccess && <Alert severity="success" sx={{ mb: 2 }}>{maintenanceSuccess}</Alert>}

          <Box sx={{ mb: 2, px: 1.5, py: 1.25, border: "1px solid #bfdbfe", borderRadius: 1.25, bgcolor: "#eff6ff", textAlign: "left" }}>
            <Typography sx={{ color: "#334155", fontSize: 12, fontWeight: 400, lineHeight: 1.55 }}>
              Create or activate the subtasks needed under this task. New and activated records are automatically added to the subtask dropdown.
            </Typography>
            <Typography sx={{ mt: 0.5, color: "#475569", fontSize: 11.5, fontWeight: 400, lineHeight: 1.55 }}>
              After customizing the list, close this window using the red X, then select the needed subtask from the dropdown to continue creating the project subtask.
            </Typography>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, .9fr) minmax(0, 1.1fr)" }, border: "1px solid #e2e8f0", borderRadius: 1.5, overflow: "hidden" }}>
            <Box sx={{ p: 2, bgcolor: "#f8faff", borderRight: { md: "1px solid #e2e8f0" }, borderBottom: { xs: "1px solid #e2e8f0", md: 0 } }}>
              <Typography sx={{ color: "#312e81", fontSize: 14, fontWeight: 800 }}>Add New Subtask</Typography>
              <Typography sx={{ mt: 0.25, mb: 2, color: "#64748b", fontSize: 11.5 }}>
                Create a maintenance record related to {taskName || "the current task"}.
              </Typography>

              <Stack spacing={1.5}>
                <TextField autoFocus size="small" required label="Subtask code" placeholder="e.g. GR-GENERAL-REQ-NEW" value={maintenanceForm.code} onChange={(event) => setMaintenanceForm((current) => ({ ...current, code: event.target.value }))} disabled={maintenanceSaving} />
                <TextField size="small" required label="Subtask name" placeholder="Enter the maintenance subtask name" value={maintenanceForm.name} onChange={(event) => setMaintenanceForm((current) => ({ ...current, name: event.target.value }))} disabled={maintenanceSaving} />
                <TextField size="small" label="Description (optional)" placeholder="Describe when this subtask should be used" multiline minRows={3} value={maintenanceForm.description} onChange={(event) => setMaintenanceForm((current) => ({ ...current, description: event.target.value }))} disabled={maintenanceSaving} />
                <Button fullWidth variant="contained" startIcon={maintenanceSaving ? <CircularProgress size={14} color="inherit" /> : <AddIcon />} onClick={() => void handleCreateMaintenanceSubtask()} disabled={maintenanceSaving} sx={{ textTransform: "none", minHeight: 40 }}>
                  {maintenanceSaving ? "Creating..." : "Create Subtask"}
                </Button>
              </Stack>
            </Box>

            <Box sx={{ p: 2, bgcolor: "#fff", minWidth: 0 }}>
              <Typography sx={{ color: "#334155", fontSize: 14, fontWeight: 800 }}>
                Existing Subtasks ({maintenanceSubtasks.length})
              </Typography>
              <Typography sx={{ mt: 0.25, color: "#64748b", fontSize: 11.5 }}>
                Active records are locked. Only inactive records can be switched on.
              </Typography>

              <Stack
                spacing={0.75}
                sx={{
                  mt: 2,
                  maxHeight: 330,
                  overflowY: "auto",
                  pr: 0.75,
                  scrollbarWidth: "thin",
                  scrollbarColor: "#94a3b8 #f1f5f9",
                  "&::-webkit-scrollbar": { width: 8 },
                  "&::-webkit-scrollbar-track": { bgcolor: "#f1f5f9", borderRadius: 999 },
                  "&::-webkit-scrollbar-thumb": { bgcolor: "#94a3b8", borderRadius: 999 },
                }}
              >
                {maintenanceSubtasks.length ? maintenanceSubtasks.map((subtask) => {
                  const isActive = subtask.isActive !== false;
                  return (
                    <Stack key={subtask.id} direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ p: 1.25, border: "1px solid #e2e8f0", borderRadius: 1.25, bgcolor: isActive ? "#f0fdf4" : "#f8fafc" }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography noWrap sx={{ color: "#1e293b", fontSize: 12.5, fontWeight: 700 }}>{subtask.name}</Typography>
                        <Typography noWrap sx={{ color: "#64748b", fontSize: 10.5 }}>{subtask.code} · {isActive ? "Active" : "Inactive"}</Typography>
                      </Box>
                      <Stack direction="row" alignItems="center" spacing={0.25} sx={{ flexShrink: 0 }}>
                        <Typography sx={{ color: isActive ? "#166534" : "#475569", fontSize: 10.5, fontWeight: 800 }}>
                          {isActive ? "Active" : "Activate"}
                        </Typography>
                        <Switch
                          size="small"
                          checked={isActive}
                          disabled={isActive || maintenanceSaving}
                          onChange={(event) => {
                            if (!isActive && event.target.checked) void handleReactivateMaintenanceSubtask(subtask);
                          }}
                          inputProps={{ "aria-label": `${isActive ? "Active" : "Activate"} ${subtask.name}` }}
                          sx={{
                            "& .MuiSwitch-switchBase.Mui-checked": { color: "#16a34a" },
                            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#22c55e", opacity: 1 },
                            "& .MuiSwitch-switchBase.Mui-disabled.Mui-checked": { color: "#16a34a", opacity: 1 },
                            "& .MuiSwitch-switchBase.Mui-disabled.Mui-checked + .MuiSwitch-track": { bgcolor: "#22c55e", opacity: 1 },
                          }}
                        />
                      </Stack>
                    </Stack>
                  );
                }) : (
                  <Box sx={{ p: 2, border: "1px dashed #cbd5e1", borderRadius: 1.25, textAlign: "center" }}>
                    <Typography sx={{ color: "#64748b", fontSize: 12 }}>No subtasks are currently related to this task.</Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

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
