"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import KeyboardArrowUpOutlinedIcon from "@mui/icons-material/KeyboardArrowUpOutlined";
import {
  createMaintenanceRecord,
  bulkUpdateMaintenanceStatus,
  getMaintenanceHierarchy,
  MaintenanceKind,
  MaintenancePayload,
  MaintenanceRecord,
  MaintenanceRelation,
  reorderScopes,
  reorderSubtasksForTask,
  reorderTasksForScope,
  updateMaintenanceRecord,
} from "@/app/api-service/workBreakdownMaintenanceService";
import { usePermissions } from "@/app/lib/usePermissions";
import MaintenanceTableSelector from "./MaintenanceTableSelector";

type FormState = {
  code: string;
  name: string;
  description: string;
  isActive: boolean;
  parentIds: string[];
};

type PendingStatusChange = {
  record: MaintenanceRecord;
  kind: MaintenanceKind;
  isActive: boolean;
};

const emptyForm: FormState = {
  code: "",
  name: "",
  description: "",
  isActive: true,
  parentIds: [],
};

const statusSwitchSx = {
  "& .MuiSwitch-switchBase.Mui-checked": {
    color: "#16A34A",
  },
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
    bgcolor: "#16A34A",
    opacity: 1,
  },
  "& .MuiSwitch-switchBase:not(.Mui-checked)": {
    color: "#DC2626",
  },
  "& .MuiSwitch-switchBase:not(.Mui-checked) + .MuiSwitch-track": {
    bgcolor: "#DC2626",
    opacity: 0.45,
  },
};

const kindConfig: Record<
  MaintenanceKind,
  {
    singular: string;
    plural: string;
    parentLabel?: string;
    parentKind?: MaintenanceKind;
  }
> = {
  scope: { singular: "Scope", plural: "Scopes" },
  task: {
    singular: "Task",
    plural: "Tasks",
    parentLabel: "Allowed Scopes",
    parentKind: "scope",
  },
  subtask: {
    singular: "Subtask",
    plural: "Subtasks",
    parentLabel: "Allowed Tasks",
    parentKind: "task",
  },
};

const getRelations = (
  record: MaintenanceRecord,
  kind: MaintenanceKind,
): MaintenanceRelation[] => {
  if (kind === "task") {
    return (
      record.scopes ||
      record.scopeMaintenances ||
      record.allowedScopes ||
      []
    );
  }
  if (kind === "subtask") {
    return (
      record.tasks ||
      record.taskMaintenances ||
      record.allowedTasks ||
      []
    );
  }
  return [];
};

const getParentIds = (
  record: MaintenanceRecord,
  kind: MaintenanceKind,
): string[] => {
  if (kind === "task" && Array.isArray(record.scopeMaintenanceIds)) {
    return record.scopeMaintenanceIds;
  }
  if (kind === "subtask" && Array.isArray(record.taskMaintenanceIds)) {
    return record.taskMaintenanceIds;
  }
  return getRelations(record, kind).map((relation) => relation.id);
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "The maintenance request could not be completed.";
};

export default function ProjectMaintenance() {
  const { canCreate, canUpdate } = usePermissions();
  const canCreateRecord =
    canCreate("settings_project_maintenance") ||
    canCreate("settings_business_units");
  const canUpdateRecord =
    canUpdate("settings_project_maintenance") ||
    canUpdate("settings_business_units");
  const [activeKind, setActiveKind] = useState<MaintenanceKind>("scope");
  const [selectedTableId, setSelectedTableId] = useState("");
  const canCreateHierarchyRecord = canCreateRecord && Boolean(selectedTableId) && selectedTableId !== "__legacy__";
  const [records, setRecords] = useState<
    Record<MaintenanceKind, MaintenanceRecord[]>
  >({ scope: [], task: [], subtask: [] });
  const [tasksByScope, setTasksByScope] = useState<
    Record<string, MaintenanceRecord[]>
  >({});
  const [subtasksByTask, setSubtasksByTask] = useState<
    Record<string, MaintenanceRecord[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusUpdatingKey, setStatusUpdatingKey] = useState("");
  const [pendingStatusChange, setPendingStatusChange] =
    useState<PendingStatusChange | null>(null);
  const [reorderingKey, setReorderingKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [scopeFilterId, setScopeFilterId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] =
    useState<MaintenanceRecord | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const config = kindConfig[activeKind];
  const handleTableSelect = (tableId: string) => {
    setSelectedTableId(tableId);
    setScopeFilterId("");
    setRecords({ scope: [], task: [], subtask: [] });
    setTasksByScope({});
    setSubtasksByTask({});
  };

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const allScopes = await getMaintenanceHierarchy();
      const scopes = allScopes.filter((scope) => selectedTableId === "__legacy__" ? !scope.maintenanceTableId : scope.maintenanceTableId === selectedTableId);
      const taskMap = new Map<string, MaintenanceRecord>();
      const subtaskMap = new Map<string, MaintenanceRecord>();
      const groupedTasks: Record<string, MaintenanceRecord[]> = {};
      const groupedSubtasks: Record<string, MaintenanceRecord[]> = {};

      scopes.forEach((scope) => {
        const scopeTasks = scope.tasks || [];
        groupedTasks[scope.id] = scopeTasks;
        scopeTasks.forEach((task) => {
          taskMap.set(task.id, task);
          const taskSubtasks = task.subtasks || [];
          groupedSubtasks[task.id] = taskSubtasks;
          taskSubtasks.forEach((subtask) => subtaskMap.set(subtask.id, subtask));
        });
      });

      const tasks = Array.from(taskMap.values());
      const subtasks = Array.from(subtaskMap.values());
      setRecords({ scope: scopes, task: tasks, subtask: subtasks });
      setTasksByScope(groupedTasks);
      setSubtasksByTask(groupedSubtasks);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [selectedTableId]);

  useEffect(() => {
    if (selectedTableId) void loadRecords();
  }, [loadRecords, selectedTableId]);

  const parentOptions = useMemo(() => {
    const parentKind = config.parentKind;
    if (!parentKind) return [];
    return records[parentKind].filter((record) => record.isActive !== false);
  }, [config.parentKind, records]);

  const openCreateDialog = (
    kind: MaintenanceKind = "scope",
    parentId?: string,
  ) => {
    if (!canCreateHierarchyRecord) return;
    setActiveKind(kind);
    setEditingRecord(null);
    setForm({
      ...emptyForm,
      parentIds: parentId ? [parentId] : [],
    });
    setError("");
    setDialogOpen(true);
  };

  const openEditDialog = (
    record: MaintenanceRecord,
    kind: MaintenanceKind = activeKind,
  ) => {
    if (!canUpdateRecord) return;
    setActiveKind(kind);
    setEditingRecord(record);
    setForm({
      code: record.code || "",
      name: record.name || "",
      description: record.description || "",
      isActive: record.isActive !== false,
      parentIds: getParentIds(record, kind),
    });
    setError("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;
    setDialogOpen(false);
    setEditingRecord(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    const allowed = editingRecord ? canUpdateRecord : canCreateHierarchyRecord;
    if (!allowed) return;

    if (!form.code.trim() || !form.name.trim()) {
      setError("Code and name are required.");
      return;
    }
    if (activeKind !== "scope" && form.parentIds.length === 0) {
      setError(`Select at least one ${config.parentLabel?.toLowerCase()}.`);
      return;
    }

    const payload: MaintenancePayload = {
      code: form.code.trim(),
      name: form.name.trim(),
      description: form.description.trim(),
      ...(editingRecord ? { isActive: form.isActive } : {}),
      ...(activeKind === "task"
        ? { scopeMaintenanceIds: form.parentIds }
        : {}),
      ...(activeKind === "subtask"
        ? { taskMaintenanceIds: form.parentIds }
        : {}),
      ...(activeKind === "scope" && selectedTableId !== "__legacy__"
        ? { maintenanceTableId: selectedTableId }
        : {}),
    };

    try {
      setSaving(true);
      setError("");
      if (editingRecord) {
        await updateMaintenanceRecord(
          activeKind,
          editingRecord.id,
          payload,
        );
      } else {
        await createMaintenanceRecord(activeKind, payload);
      }
      setSuccess(
        `${config.singular} maintenance ${editingRecord ? "updated" : "created"} successfully.`,
      );
      setDialogOpen(false);
      setEditingRecord(null);
      setForm(emptyForm);
      await loadRecords();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (
    record: MaintenanceRecord,
    kind: MaintenanceKind,
    isActive: boolean,
  ) => {
    if (!canUpdateRecord) return;
    const key = `${kind}:${record.id}`;

    const updateRecordStatus = (item: MaintenanceRecord) =>
      item.id === record.id ? { ...item, isActive } : item;

    setRecords((current) => ({
      ...current,
      [kind]: current[kind].map(updateRecordStatus),
    }));
    if (kind === "task") {
      setTasksByScope((current) =>
        Object.fromEntries(
          Object.entries(current).map(([parentId, items]) => [
            parentId,
            items.map(updateRecordStatus),
          ]),
        ),
      );
    }
    if (kind === "subtask") {
      setSubtasksByTask((current) =>
        Object.fromEntries(
          Object.entries(current).map(([parentId, items]) => [
            parentId,
            items.map(updateRecordStatus),
          ]),
        ),
      );
    }

    try {
      setStatusUpdatingKey(key);
      setError("");
      await updateMaintenanceRecord(kind, record.id, {
        isActive,
      });
      setSuccess(
        `${kindConfig[kind].singular} maintenance ${isActive ? "activated" : "deactivated"} successfully.`,
      );
      return true;
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      const restoreRecordStatus = (item: MaintenanceRecord) =>
        item.id === record.id ? { ...item, isActive: record.isActive } : item;
      setRecords((current) => ({
        ...current,
        [kind]: current[kind].map(restoreRecordStatus),
      }));
      if (kind === "task") {
        setTasksByScope((current) =>
          Object.fromEntries(
            Object.entries(current).map(([parentId, items]) => [
              parentId,
              items.map(restoreRecordStatus),
            ]),
          ),
        );
      }
      if (kind === "subtask") {
        setSubtasksByTask((current) =>
          Object.fromEntries(
            Object.entries(current).map(([parentId, items]) => [
              parentId,
              items.map(restoreRecordStatus),
            ]),
          ),
        );
      }
      return false;
    } finally {
      setStatusUpdatingKey("");
    }
  };

  const getCascadeTargets = (
    record: MaintenanceRecord,
    kind: MaintenanceKind,
  ): Array<{ record: MaintenanceRecord; kind: MaintenanceKind }> => {
    if (kind === "subtask") return [{ record, kind }];

    if (kind === "task") {
      const subtasks = displaySubtasksForTask(record.id).filter((subtask) => {
        const otherActiveParent = getParentIds(subtask, "subtask").some(
          (taskId) =>
            taskId !== record.id &&
            records.task.some(
              (task) => task.id === taskId && task.isActive !== false,
            ),
        );
        return !otherActiveParent;
      });
      return [
        { record, kind },
        ...subtasks.map((subtask) => ({
          record: subtask,
          kind: "subtask" as const,
        })),
      ];
    }

    const tasks = displayTasksForScope(record.id).filter((task) => {
      const otherActiveParent = getParentIds(task, "task").some(
        (scopeId) =>
          scopeId !== record.id &&
          records.scope.some(
            (scope) => scope.id === scopeId && scope.isActive !== false,
          ),
      );
      return !otherActiveParent;
    });
    const affectedTaskIds = new Set(tasks.map((task) => task.id));
    const seenSubtasks = new Set<string>();
    const subtasks = tasks.flatMap((task) =>
      displaySubtasksForTask(task.id).filter((subtask) => {
        if (seenSubtasks.has(subtask.id)) return false;
        const otherActiveParent = getParentIds(subtask, "subtask").some(
          (taskId) =>
            !affectedTaskIds.has(taskId) &&
            records.task.some(
              (parentTask) =>
                parentTask.id === taskId && parentTask.isActive !== false,
            ),
        );
        if (otherActiveParent) return false;
        seenSubtasks.add(subtask.id);
        return true;
      }),
    );
    return [
      { record, kind },
      ...tasks.map((task) => ({
        record: task,
        kind: "task" as const,
      })),
      ...subtasks.map((subtask) => ({
            record: subtask,
            kind: "subtask" as const,
      })),
    ];
  };

  const requestStatusChange = (
    record: MaintenanceRecord,
    kind: MaintenanceKind,
    isActive: boolean,
  ) => {
    if (isActive) {
      void handleStatusChange(record, kind, true);
      return;
    }
    const targets = getCascadeTargets(record, kind).filter(
      (target) => target.record.isActive !== false,
    );
    if (targets.length === 1) {
      void handleStatusChange(record, kind, isActive);
      return;
    }
    setPendingStatusChange({ record, kind, isActive });
  };

  const confirmCascadeStatusChange = async () => {
    if (!pendingStatusChange) return;
    const { record, kind, isActive } = pendingStatusChange;
    const key = `${kind}:${record.id}`;
    try {
      setStatusUpdatingKey(key);
      setError("");
      const affected = await bulkUpdateMaintenanceStatus({
        scopeIds: kind === "scope" ? [record.id] : [],
        taskIds: kind === "task" ? [record.id] : [],
        subtaskIds: kind === "subtask" ? [record.id] : [],
        isActive,
        cascade: true,
      });
      const scopeIds = new Set(affected.scopeIds);
      const taskIds = new Set(affected.taskIds);
      const subtaskIds = new Set(affected.subtaskIds);
      setRecords((current) => ({
        scope: current.scope.map((item) =>
          scopeIds.has(item.id) ? { ...item, isActive } : item,
        ),
        task: current.task.map((item) =>
          taskIds.has(item.id) ? { ...item, isActive } : item,
        ),
        subtask: current.subtask.map((item) =>
          subtaskIds.has(item.id) ? { ...item, isActive } : item,
        ),
      }));
      setTasksByScope((current) =>
        Object.fromEntries(
          Object.entries(current).map(([parentId, items]) => [
            parentId,
            items.map((item) =>
              taskIds.has(item.id) ? { ...item, isActive } : item,
            ),
          ]),
        ),
      );
      setSubtasksByTask((current) =>
        Object.fromEntries(
          Object.entries(current).map(([parentId, items]) => [
            parentId,
            items.map((item) =>
              subtaskIds.has(item.id) ? { ...item, isActive } : item,
            ),
          ]),
        ),
      );
      setSuccess(
        `${kindConfig[kind].singular} and affected child records disabled successfully.`,
      );
      setPendingStatusChange(null);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setStatusUpdatingKey("");
    }
  };

  const sortedScopes = records.scope;
  const visibleScopes = scopeFilterId
    ? sortedScopes.filter((scope) => scope.id === scopeFilterId)
    : sortedScopes;
  const displayTasksForScope = (scopeId: string) =>
    tasksByScope[scopeId] || [];
  const displaySubtasksForTask = (taskId: string) =>
    subtasksByTask[taskId] || [];

  const moveRecord = (
    items: MaintenanceRecord[],
    index: number,
    direction: -1 | 1,
  ) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return items;
    const next = [...items];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    return next;
  };

  const handleScopeReorder = async (
    index: number,
    direction: -1 | 1,
  ) => {
    const next = moveRecord(sortedScopes, index, direction);
    if (next === sortedScopes) return;
    const key = "scopes";

    setRecords((current) => ({ ...current, scope: next }));
    try {
      setReorderingKey(key);
      setError("");
      await reorderScopes(next.map((record) => record.id));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      await loadRecords();
    } finally {
      setReorderingKey("");
    }
  };

  const handleTaskReorder = async (
    scopeId: string,
    index: number,
    direction: -1 | 1,
  ) => {
    const currentItems = displayTasksForScope(scopeId);
    const next = moveRecord(currentItems, index, direction);
    if (next === currentItems) return;
    const key = `scope:${scopeId}`;

    setTasksByScope((current) => ({ ...current, [scopeId]: next }));
    try {
      setReorderingKey(key);
      setError("");
      await reorderTasksForScope(
        scopeId,
        next.map((record) => record.id),
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      await loadRecords();
    } finally {
      setReorderingKey("");
    }
  };

  const handleSubtaskReorder = async (
    taskId: string,
    index: number,
    direction: -1 | 1,
  ) => {
    const currentItems = displaySubtasksForTask(taskId);
    const next = moveRecord(currentItems, index, direction);
    if (next === currentItems) return;
    const key = `task:${taskId}`;

    setSubtasksByTask((current) => ({ ...current, [taskId]: next }));
    try {
      setReorderingKey(key);
      setError("");
      await reorderSubtasksForTask(
        taskId,
        next.map((record) => record.id),
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      await loadRecords();
    } finally {
      setReorderingKey("");
    }
  };

  return (
    <Box sx={{ p: { xs: 0, md: 1 } }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography sx={{ color: "#0F172A", fontSize: 20, fontWeight: 600 }}>
            Project Maintenance
          </Typography>
          <Typography sx={{ mt: 0.35, color: "#64748B", fontSize: 13 }}>
            Manage reusable scope, task, and subtask catalog records and their
            allowed relationships.
          </Typography>
        </Box>
        {canCreateHierarchyRecord ? (
          <Button
            variant="contained"
            startIcon={<AddOutlinedIcon />}
            onClick={() => openCreateDialog("scope")}
            disabled={loading || saving}
            sx={{
              bgcolor: "#4B2E83",
              textTransform: "none",
              fontWeight: 500,
              boxShadow: "none",
              "&:hover": { bgcolor: "#3D236B", boxShadow: "none" },
            }}
          >
            New {config.singular}
          </Button>
        ) : null}
      </Stack>

      <MaintenanceTableSelector selectedId={selectedTableId} onSelect={handleTableSelect} canCreate={canCreateRecord} canUpdate={canUpdateRecord} />

      {error && !dialogOpen ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      ) : null}
      {success ? (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess("")}
        >
          {success}
        </Alert>
      ) : null}

      {!loading && sortedScopes.length > 0 ? (
        <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: "#FAFAFC" }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <TextField
              select
              size="small"
              label="Filter by scope"
              value={scopeFilterId}
              onChange={(event) => setScopeFilterId(event.target.value)}
              sx={{ minWidth: { xs: "100%", sm: 320 } }}
            >
              <MenuItem value="">All scopes ({sortedScopes.length})</MenuItem>
              {sortedScopes.map((scope) => (
                <MenuItem key={scope.id} value={scope.id}>
                  {scope.code} — {scope.name}
                </MenuItem>
              ))}
            </TextField>
            <Typography sx={{ color: "#64748B", fontSize: 12 }}>
              Showing {visibleScopes.length} of {sortedScopes.length} scopes
            </Typography>
          </Stack>
        </Paper>
      ) : null}

      {loading ? (
        <Paper
          variant="outlined"
          sx={{ minHeight: 300, display: "grid", placeItems: "center" }}
        >
          <CircularProgress size={30} />
        </Paper>
      ) : sortedScopes.length === 0 ? (
        <Alert severity="info">
          No scope maintenance records found. Create a scope to begin building
          the hierarchy.
        </Alert>
      ) : (
        <Stack spacing={2}>
          {visibleScopes.map((scope) => {
            const scopeIndex = sortedScopes.findIndex((item) => item.id === scope.id);
            const scopeTasks = displayTasksForScope(scope.id);
            return (
              <Paper
                key={scope.id}
                variant="outlined"
                sx={{
                  overflow: "hidden",
                  borderColor: scope.isActive ? "#D8CBEA" : "#CBD5E1",
                  opacity: scope.isActive ? 1 : 0.72,
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "stretch", sm: "center" }}
                  spacing={1}
                  sx={{
                    px: 2,
                    py: 1.5,
                    bgcolor: scope.isActive ? "#F7F3FC" : "#F8FAFC",
                    borderBottom: "1px solid #E2E8F0",
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography
                        sx={{ color: "#4B2E83", fontSize: 11, fontWeight: 600 }}
                      >
                        SCOPE {scopeIndex + 1}
                      </Typography>
                      <Chip
                        label={scope.code}
                        size="small"
                        variant="outlined"
                        sx={{ height: 20, fontSize: 10 }}
                      />
                      {!scope.isActive ? (
                        <Chip
                          label="Inactive"
                          size="small"
                          sx={{ height: 20, fontSize: 10 }}
                        />
                      ) : null}
                    </Stack>
                    <Typography
                      sx={{ mt: 0.35, color: "#0F172A", fontSize: 16, fontWeight: 500 }}
                    >
                      {scope.name}
                    </Typography>
                    {scope.description ? (
                      <Typography sx={{ mt: 0.2, color: "#64748B", fontSize: 12 }}>
                        {scope.description}
                      </Typography>
                    ) : null}
                  </Box>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Tooltip title="Move scope up">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handleScopeReorder(scopeIndex, -1)}
                          disabled={
                            !canUpdateRecord ||
                            scopeIndex === 0 ||
                            Boolean(reorderingKey)
                          }
                        >
                          <KeyboardArrowUpOutlinedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Move scope down">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handleScopeReorder(scopeIndex, 1)}
                          disabled={
                            !canUpdateRecord ||
                            scopeIndex === sortedScopes.length - 1 ||
                            Boolean(reorderingKey)
                          }
                        >
                          <KeyboardArrowDownOutlinedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    {canCreateHierarchyRecord ? (
                      <Button
                        size="small"
                        startIcon={<AddOutlinedIcon />}
                        onClick={() => openCreateDialog("task", scope.id)}
                        disabled={!scope.isActive}
                        sx={{
                          color: "#FFFFFF",
                          textTransform: "none",
                          fontWeight: 500,
                          "&.Mui-disabled": { color: "#94A3B8" },
                        }}
                      >
                        Add Task
                      </Button>
                    ) : null}
                    {canUpdateRecord ? (
                      <Tooltip title="Edit scope">
                        <IconButton
                          size="small"
                          onClick={() => openEditDialog(scope, "scope")}
                          sx={{ color: "#4B2E83" }}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : null}
                    {canUpdateRecord ? (
                      <Tooltip title={scope.isActive ? "Active — switch off" : "Inactive — switch on"}>
                        <Switch
                          size="small"
                          checked={scope.isActive !== false}
                          onChange={(event) => {
                            if (statusUpdatingKey === `scope:${scope.id}`) return;
                            requestStatusChange(
                              scope,
                              "scope",
                              event.target.checked,
                            );
                          }}
                          inputProps={{ "aria-label": `${scope.name} status` }}
                          sx={{
                            ...statusSwitchSx,
                            cursor:
                              statusUpdatingKey === `scope:${scope.id}`
                                ? "wait"
                                : "pointer",
                          }}
                        />
                      </Tooltip>
                    ) : null}
                  </Stack>
                </Stack>

                <Box sx={{ p: { xs: 1.25, md: 2 } }}>
                  {scopeTasks.length === 0 ? (
                    <Box
                      sx={{
                        p: 2,
                        border: "1px dashed #CBD5E1",
                        borderRadius: 1.5,
                        textAlign: "center",
                      }}
                    >
                      <Typography sx={{ color: "#94A3B8", fontSize: 12.5 }}>
                        No tasks mapped to this scope.
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={1}>
                      {scopeTasks.map((task, taskIndex) => {
                        const taskSubtasks = displaySubtasksForTask(task.id);
                        const sharedTask = getParentIds(task, "task").length > 1;
                        return (
                          <Box
                            key={`${scope.id}-${task.id}`}
                            sx={{
                              display: "grid",
                              gridTemplateColumns: {
                                xs: "1fr",
                                md: "minmax(220px, 0.32fr) minmax(0, 0.68fr)",
                              },
                              border: "1px solid #E2E8F0",
                              borderRadius: 1.5,
                              overflow: "hidden",
                              opacity: task.isActive ? 1 : 0.7,
                            }}
                          >
                            <Box
                              sx={{
                                p: 1.5,
                                bgcolor: "#FAFAFC",
                                borderRight: { md: "1px solid #E2E8F0" },
                                borderBottom: { xs: "1px solid #E2E8F0", md: 0 },
                              }}
                            >
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="flex-start"
                                spacing={1}
                              >
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography sx={{ color: "#64748B", fontSize: 10.5 }}>
                                    TASK {taskIndex + 1} · {task.code}
                                  </Typography>
                                  <Typography
                                    sx={{ mt: 0.3, color: "#1E293B", fontSize: 14, fontWeight: 500 }}
                                  >
                                    {task.name}
                                  </Typography>
                                  <Stack direction="row" spacing={0.5} sx={{ mt: 0.75 }}>
                                    {sharedTask ? (
                                      <Chip
                                        label={`Shared across ${getParentIds(task, "task").length} scopes`}
                                        size="small"
                                        sx={{ height: 20, fontSize: 9.5, bgcolor: "#F7F3FC", color: "#4B2E83" }}
                                      />
                                    ) : null}
                                    {!task.isActive ? (
                                      <Chip label="Inactive" size="small" sx={{ height: 20, fontSize: 9.5 }} />
                                    ) : null}
                                  </Stack>
                                </Box>
                                <Stack direction="row" spacing={0}>
                                  <Tooltip title="Move task up">
                                    <span>
                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          handleTaskReorder(
                                            scope.id,
                                            taskIndex,
                                            -1,
                                          )
                                        }
                                        disabled={
                                          !canUpdateRecord ||
                                          taskIndex === 0 ||
                                          Boolean(reorderingKey)
                                        }
                                      >
                                        <KeyboardArrowUpOutlinedIcon sx={{ fontSize: 17 }} />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                  <Tooltip title="Move task down">
                                    <span>
                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          handleTaskReorder(
                                            scope.id,
                                            taskIndex,
                                            1,
                                          )
                                        }
                                        disabled={
                                          !canUpdateRecord ||
                                          taskIndex === scopeTasks.length - 1 ||
                                          Boolean(reorderingKey)
                                        }
                                      >
                                        <KeyboardArrowDownOutlinedIcon sx={{ fontSize: 17 }} />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                  {canUpdateRecord ? (
                                    <Tooltip title="Edit task">
                                      <IconButton
                                        size="small"
                                        onClick={() => openEditDialog(task, "task")}
                                      >
                                        <EditOutlinedIcon sx={{ fontSize: 17 }} />
                                      </IconButton>
                                    </Tooltip>
                                  ) : null}
                                  {canUpdateRecord ? (
                                    <Tooltip
                                      title={
                                        !scope.isActive
                                          ? "Enable the parent scope first"
                                          : task.isActive
                                            ? "Active — switch off"
                                            : "Inactive — switch on"
                                      }
                                    >
                                      <Switch
                                        size="small"
                                        checked={task.isActive !== false}
                                        onChange={(event) => {
                                          if (
                                            !scope.isActive ||
                                            statusUpdatingKey === `task:${task.id}`
                                          ) {
                                            return;
                                          }
                                          requestStatusChange(
                                            task,
                                            "task",
                                            event.target.checked,
                                          );
                                        }}
                                        inputProps={{
                                          "aria-label": `${task.name} status`,
                                          "aria-disabled": !scope.isActive,
                                        }}
                                        sx={{
                                          ...statusSwitchSx,
                                          cursor: !scope.isActive
                                            ? "not-allowed"
                                            : statusUpdatingKey ===
                                                `task:${task.id}`
                                              ? "wait"
                                              : "pointer",
                                        }}
                                      />
                                    </Tooltip>
                                  ) : null}
                                </Stack>
                              </Stack>
                            </Box>

                            <Box sx={{ p: 1.5, minWidth: 0 }}>
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                sx={{ mb: 1 }}
                              >
                                <Typography sx={{ color: "#64748B", fontSize: 10.5, fontWeight: 500 }}>
                                  SUBTASKS ({taskSubtasks.length})
                                </Typography>
                                {canCreateHierarchyRecord ? (
                                  <Button
                                    size="small"
                                    startIcon={<AddOutlinedIcon />}
                                    onClick={() => openCreateDialog("subtask", task.id)}
                                    disabled={!scope.isActive || !task.isActive}
                                    sx={{
                                      minHeight: 26,
                                      color: "#FFFFFF",
                                      textTransform: "none",
                                      fontSize: 11,
                                      "&.Mui-disabled": { color: "#94A3B8" },
                                    }}
                                  >
                                    Add Subtask
                                  </Button>
                                ) : null}
                              </Stack>
                              {taskSubtasks.length ? (
                                <Box
                                  sx={{
                                    display: "grid",
                                    gridTemplateColumns: {
                                      xs: "1fr",
                                      lg: "repeat(2, minmax(0, 1fr))",
                                    },
                                    gap: 0.75,
                                  }}
                                >
                                  {taskSubtasks.map((subtask, subtaskIndex) => {
                                    const sharedSubtask =
                                      getParentIds(subtask, "subtask").length > 1;
                                    return (
                                      <Stack
                                        key={`${task.id}-${subtask.id}`}
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        spacing={1}
                                        sx={{
                                          px: 1.25,
                                          py: 0.85,
                                          border: "1px solid #E2E8F0",
                                          borderRadius: 1,
                                          bgcolor: "#FFFFFF",
                                          opacity: subtask.isActive ? 1 : 0.68,
                                        }}
                                      >
                                        <Box sx={{ minWidth: 0 }}>
                                          <Typography noWrap sx={{ color: "#334155", fontSize: 12.5 }}>
                                            {subtaskIndex + 1}. {subtask.name}
                                          </Typography>
                                          <Typography noWrap sx={{ color: "#94A3B8", fontSize: 10 }}>
                                            {subtask.code}
                                            {sharedSubtask
                                              ? ` · Shared across ${getParentIds(subtask, "subtask").length} tasks`
                                              : ""}
                                            {!subtask.isActive ? " · Inactive" : ""}
                                          </Typography>
                                        </Box>
                                        <Stack direction="row" spacing={0}>
                                          <Tooltip title="Move subtask up">
                                            <span>
                                              <IconButton
                                                size="small"
                                                onClick={() =>
                                                  handleSubtaskReorder(
                                                    task.id,
                                                    subtaskIndex,
                                                    -1,
                                                  )
                                                }
                                                disabled={
                                                  !canUpdateRecord ||
                                                  subtaskIndex === 0 ||
                                                  Boolean(reorderingKey)
                                                }
                                              >
                                                <KeyboardArrowUpOutlinedIcon sx={{ fontSize: 16 }} />
                                              </IconButton>
                                            </span>
                                          </Tooltip>
                                          <Tooltip title="Move subtask down">
                                            <span>
                                              <IconButton
                                                size="small"
                                                onClick={() =>
                                                  handleSubtaskReorder(
                                                    task.id,
                                                    subtaskIndex,
                                                    1,
                                                  )
                                                }
                                                disabled={
                                                  !canUpdateRecord ||
                                                  subtaskIndex === taskSubtasks.length - 1 ||
                                                  Boolean(reorderingKey)
                                                }
                                              >
                                                <KeyboardArrowDownOutlinedIcon sx={{ fontSize: 16 }} />
                                              </IconButton>
                                            </span>
                                          </Tooltip>
                                          {canUpdateRecord ? (
                                            <Tooltip title="Edit subtask">
                                              <IconButton
                                                size="small"
                                                onClick={() => openEditDialog(subtask, "subtask")}
                                              >
                                                <EditOutlinedIcon sx={{ fontSize: 16 }} />
                                              </IconButton>
                                            </Tooltip>
                                          ) : null}
                                          {canUpdateRecord ? (
                                            <Tooltip
                                              title={
                                                !scope.isActive
                                                  ? "Enable the parent scope first"
                                                  : !task.isActive
                                                    ? "Enable the parent task first"
                                                    : subtask.isActive
                                                      ? "Active — switch off"
                                                      : "Inactive — switch on"
                                              }
                                            >
                                              <Switch
                                                size="small"
                                                checked={subtask.isActive !== false}
                                                onChange={(event) => {
                                                  if (
                                                    !scope.isActive ||
                                                    !task.isActive ||
                                                    statusUpdatingKey ===
                                                      `subtask:${subtask.id}`
                                                  ) {
                                                    return;
                                                  }
                                                  requestStatusChange(
                                                    subtask,
                                                    "subtask",
                                                    event.target.checked,
                                                  );
                                                }}
                                                inputProps={{
                                                  "aria-label": `${subtask.name} status`,
                                                  "aria-disabled":
                                                    !scope.isActive ||
                                                    !task.isActive,
                                                }}
                                                sx={{
                                                  ...statusSwitchSx,
                                                  cursor:
                                                    !scope.isActive ||
                                                    !task.isActive
                                                      ? "not-allowed"
                                                      : statusUpdatingKey ===
                                                          `subtask:${subtask.id}`
                                                        ? "wait"
                                                        : "pointer",
                                                }}
                                              />
                                            </Tooltip>
                                          ) : null}
                                        </Stack>
                                      </Stack>
                                    );
                                  })}
                                </Box>
                              ) : (
                                <Typography sx={{ color: "#94A3B8", fontSize: 12 }}>
                                  No subtasks mapped to this task.
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                </Box>
              </Paper>
            );
          })}
        </Stack>
      )}

      <Dialog
        open={Boolean(pendingStatusChange)}
        onClose={() => {
          if (!statusUpdatingKey) setPendingStatusChange(null);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontSize: 18, fontWeight: 600 }}>
          Disable{" "}
          {pendingStatusChange
            ? kindConfig[pendingStatusChange.kind].singular
            : "Maintenance Record"}
          ?
        </DialogTitle>
        <DialogContent dividers>
          {pendingStatusChange ? (
            <Stack spacing={2}>
              <Alert severity="warning">
                Disabling &quot;{pendingStatusChange.record.name}&quot; will also
                disable every record under it and remove them from new project
                structure dropdowns.
              </Alert>
              <Box>
                <Typography sx={{ color: "#64748B", fontSize: 11, mb: 1 }}>
                  AFFECTED RECORDS
                </Typography>
                <Stack spacing={0.75} sx={{ maxHeight: 280, overflowY: "auto" }}>
                  {getCascadeTargets(
                    pendingStatusChange.record,
                    pendingStatusChange.kind,
                  )
                    .filter((target) => target.record.isActive !== false)
                    .map((target) => (
                    <Stack
                      key={`${target.kind}:${target.record.id}`}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{
                        px: 1.25,
                        py: 0.9,
                        border: "1px solid #E2E8F0",
                        borderRadius: 1,
                      }}
                    >
                      <Typography sx={{ fontSize: 13 }}>
                        {target.record.name}
                      </Typography>
                      <Chip
                        label={kindConfig[target.kind].singular}
                        size="small"
                        variant="outlined"
                        sx={{ height: 22, fontSize: 10 }}
                      />
                    </Stack>
                    ))}
                </Stack>
              </Box>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setPendingStatusChange(null)}
            disabled={Boolean(statusUpdatingKey)}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void confirmCascadeStatusChange()}
            disabled={Boolean(statusUpdatingKey)}
            sx={{
              bgcolor: "#DC2626",
              textTransform: "none",
              boxShadow: "none",
              "&:hover": {
                bgcolor: "#B91C1C",
                boxShadow: "none",
              },
            }}
          >
            {statusUpdatingKey ? "Updating..." : "Disable All"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontSize: 18, fontWeight: 600 }}>
          {editingRecord ? "Edit" : "Create"} {config.singular} Maintenance
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {error ? (
              <Alert severity="error" onClose={() => setError("")}>
                {error}
              </Alert>
            ) : null}
            <TextField
              label="Code"
              value={form.code}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  code: event.target.value.toUpperCase(),
                }))
              }
              placeholder={
                activeKind === "scope"
                  ? "e.g. CIVIL"
                  : activeKind === "task"
                    ? "e.g. EXCAVATION"
                    : "e.g. SITE-CLEARING"
              }
              required
              fullWidth
              disabled={saving}
            />
            <TextField
              label="Name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              required
              fullWidth
              disabled={saving}
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              multiline
              minRows={2}
              fullWidth
              disabled={saving}
            />
            {activeKind !== "scope" ? (
              <FormControl fullWidth disabled={saving}>
                <InputLabel>{config.parentLabel}</InputLabel>
                <Select
                  multiple
                  value={form.parentIds}
                  label={config.parentLabel}
                  onChange={(event) => {
                    const value = event.target.value;
                    setForm((current) => ({
                      ...current,
                      parentIds:
                        typeof value === "string" ? value.split(",") : value,
                    }));
                  }}
                  renderValue={(selected) =>
                    selected
                      .map(
                        (id) =>
                          parentOptions.find((option) => option.id === id)
                            ?.name || id,
                      )
                      .join(", ")
                  }
                >
                  {parentOptions.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      <Checkbox
                        checked={form.parentIds.includes(option.id)}
                      />
                      <ListItemText
                        primary={option.name}
                        secondary={option.code}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : null}

          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={closeDialog}
            disabled={saving}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{
              bgcolor: "#4B2E83",
              textTransform: "none",
              boxShadow: "none",
              "&:hover": { bgcolor: "#3D236B", boxShadow: "none" },
            }}
          >
            {saving ? "Saving..." : editingRecord ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
